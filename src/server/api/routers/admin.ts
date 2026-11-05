import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";

const PAGE_SIZE = 20;

// Prisma returns @db.Date / @db.Time as UTC Dates; slice out the wall-clock parts.
const dateStr = (d: Date) => d.toISOString().slice(0, 10);
const timeStr = (d: Date) => d.toISOString().slice(11, 16);

// Today's date in the Philippines, as UTC midnight (matches how @db.Date is read).
const todayPH = () =>
  new Date(
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }),
  );

export const adminRouter = createTRPCRouter({
  // ---------------------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------------------
    stats: adminProcedure.query(async ({ ctx }) => {
    const [users, bookings, upcomingTrips, revenue, openFeedback] =
      await Promise.all([
        ctx.db.user.count(),
        ctx.db.booking.count({ where: { status: "CONFIRMED" } }),
        ctx.db.schedule.count({
          where: { travelDate: { gte: todayPH() }, isCancelled: false },
        }),
        ctx.db.booking.aggregate({
          _sum: { totalAmount: true },
          where: { status: "CONFIRMED" },
        }),
        ctx.db.feedback.count({ where: { resolvedAt: null } }),
      ]);

    return {
      users,
      bookings,
      upcomingTrips,
      openFeedback,
      // Decimal doesn't survive superjson, so send it as a string.
      revenue: revenue._sum.totalAmount?.toString() ?? "0",
    };
  }),

  // ---------------------------------------------------------------------
  // Buses
  // ---------------------------------------------------------------------
  listBuses: adminProcedure.query(async ({ ctx }) => {
    const buses = await ctx.db.bus.findMany({
      orderBy: { name: "asc" },
      include: { busType: { select: { name: true } } },
    });
    return buses.map((b) => ({
      id: b.id,
      name: b.name,
      plateNumber: b.plateNumber,
      capacity: b.capacity,
      busType: b.busType.name,
      isActive: b.isActive,
    }));
  }),

  listBusTypes: adminProcedure.query(({ ctx }) =>
    ctx.db.busType.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ),

  createBus: adminProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(80),
        plateNumber: z
          .string()
          .trim()
          .min(1)
          .max(20)
          .transform((s) => s.toUpperCase()),
        capacity: z.union([z.literal(40), z.literal(50)]),
        busTypeId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [plateTaken, type] = await Promise.all([
        ctx.db.bus.findUnique({ where: { plateNumber: input.plateNumber } }),
        ctx.db.busType.findUnique({ where: { id: input.busTypeId } }),
      ]);
      if (plateTaken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A bus with that plate number already exists.",
        });
      }
      if (!type) throw new TRPCError({ code: "NOT_FOUND" });

      // Seats 1..capacity are created with the bus, in one atomic write.
      await ctx.db.bus.create({
        data: {
          name: input.name,
          plateNumber: input.plateNumber,
          capacity: input.capacity,
          busTypeId: input.busTypeId,
          seats: {
            createMany: {
              data: Array.from({ length: input.capacity }, (_, i) => ({
                seatNumber: i + 1,
              })),
            },
          },
        },
      });
    }),

  // ---------------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------------
  listRoutes: adminProcedure.query(async ({ ctx }) => {
    const routes = await ctx.db.route.findMany({
      orderBy: { originCity: { name: "asc" } },
      include: {
        originCity: { select: { name: true } },
        destCity: { select: { name: true } },
      },
    });
    return routes.map((r) => ({
      id: r.id,
      origin: r.originCity.name,
      destination: r.destCity.name,
      duration: `${Math.floor(r.durationMinutes / 60)}h ${r.durationMinutes % 60}m`,
      fare: r.baseFare.toFixed(2),
      isActive: r.isActive,
    }));
  }),

  // ---------------------------------------------------------------------
  // Schedules
  // ---------------------------------------------------------------------
  listSchedules: adminProcedure
    .input(z.object({ includePast: z.boolean().default(false) }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.schedule.findMany({
        where: input.includePast ? {} : { travelDate: { gte: todayPH() } },
        orderBy: [{ travelDate: "asc" }, { departureTime: "asc" }],
        take: 200,
        include: {
          bus: { select: { name: true, plateNumber: true } },
          route: {
            select: {
              originCity: { select: { name: true } },
              destCity: { select: { name: true } },
            },
          },
        },
      });
      return rows.map((s) => ({
        id: s.id,
        busName: s.bus.name,
        plateNumber: s.bus.plateNumber,
        route: `${s.route.originCity.name} → ${s.route.destCity.name}`,
        date: dateStr(s.travelDate),
        departure: timeStr(s.departureTime),
        arrival: timeStr(s.arrivalTime),
        isCancelled: s.isCancelled,
      }));
    }),

  // ---------------------------------------------------------------------
  // Bookings
  // ---------------------------------------------------------------------
  listBookings: adminProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        search: z.string().trim().optional(),
        status: z.enum(["CONFIRMED", "CANCELLED"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.booking.findMany({
        where: {
          status: input.status,
          ...(input.search && {
            OR: [
              {
                bookingReference: {
                  contains: input.search,
                  mode: "insensitive",
                },
              },
              {
                user: { email: { contains: input.search, mode: "insensitive" } },
              },
              {
                user: { name: { contains: input.search, mode: "insensitive" } },
              },
            ],
          }),
        },
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE + 1,
        ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
        include: {
          user: { select: { name: true, email: true } },
          seats: { select: { seat: { select: { seatNumber: true } } } },
          schedule: {
            select: {
              travelDate: true,
              route: {
                select: {
                  originCity: { select: { name: true } },
                  destCity: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      const nextCursor = rows.length > PAGE_SIZE ? rows.pop()!.id : undefined;

      return {
        nextCursor,
        items: rows.map((b) => ({
          id: b.id,
          reference: b.bookingReference,
          accountName: b.user.name,
          accountEmail: b.user.email,
          route: `${b.schedule.route.originCity.name} → ${b.schedule.route.destCity.name}`,
          date: dateStr(b.schedule.travelDate),
          // Cancelled bookings have no seat rows left, so this is empty for them.
          seats: b.seats
            .map((s) => s.seat.seatNumber)
            .sort((a, c) => a - c),
          status: b.status,
        })),
      };
    }),

  cancelBooking: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.id },
      });
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.status === "CANCELLED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Booking is already cancelled.",
        });
      }

      // Deleting the seat rows frees the seats (UNIQUE on scheduleId + seatId).
      await ctx.db.$transaction([
        ctx.db.bookingSeat.deleteMany({ where: { bookingId: input.id } }),
        ctx.db.booking.update({
          where: { id: input.id },
          data: { status: "CANCELLED" },
        }),
      ]);
    }),

  // ---------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------
  listUsers: adminProcedure
    .input(z.object({ search: z.string().trim().optional() }))
    .query(({ ctx, input }) =>
      ctx.db.user.findMany({
        where: input.search
          ? {
              OR: [
                { name: { contains: input.search, mode: "insensitive" } },
                { email: { contains: input.search, mode: "insensitive" } },
              ],
            }
          : undefined,
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { bookings: true } },
        },
      }),
    ),

  setUserActive: adminProcedure
  .input(z.object({ id: z.string(), isActive: z.boolean() }))
  .mutation(async ({ ctx, input }) => {
    // Don't let an admin lock themselves out
    if (!input.isActive && input.id === ctx.session.user.id) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You can't deactivate your own account.",
      });
    }

    const [user] = await ctx.db.$transaction([
      ctx.db.user.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      }),
      // Only wipe sessions when deactivating
      ...(!input.isActive
        ? [ctx.db.session.deleteMany({ where: { userId: input.id } })]
        : []),
    ]);

    return user;
  }),
    // ---------------------------------------------------------------------
  // Feedback
  // ---------------------------------------------------------------------
  listFeedback: adminProcedure
    .input(
      z.object({
        filter: z.enum(["open", "resolved", "all"]).default("open"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.feedback.findMany({
        where:
          input.filter === "open"
            ? { resolvedAt: null }
            : input.filter === "resolved"
              ? { resolvedAt: { not: null } }
              : undefined,
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return rows.map((f) => ({
        id: f.id,
        name: f.name,
        email: f.email,
        message: f.message,
        createdAt: f.createdAt,
        isResolved: f.resolvedAt !== null,
      }));
    }),

  setFeedbackResolved: adminProcedure
    .input(z.object({ id: z.string(), resolved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.feedback.update({
        where: { id: input.id },
        data: { resolvedAt: input.resolved ? new Date() : null },
      });
    }),
});