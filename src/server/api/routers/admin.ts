import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { isUniqueViolation } from "~/lib/errors";
import { isDeparted, todayInManila } from "~/lib/dates";
import { formatDuration } from "~/app/_lib/format";
import { pageOf } from "~/lib/pagination";
import { scheduleStatusWhere } from "~/lib/admin-schedule-filter";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";

const PAGE_SIZE = 20;

// Prisma returns @db.Date / @db.Time as UTC Dates; slice out the wall-clock parts.
const dateStr = (d: Date) => d.toISOString().slice(0, 10);
const timeStr = (d: Date) => d.toISOString().slice(11, 16);

// @db.Date is read as UTC midnight, so start from Manila's calendar day.
const startOfToday = () => new Date(todayInManila());

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
          where: { travelDate: { gte: startOfToday() }, isCancelled: false },
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
        // shortcut: fixed seat sizes until bus models carry their own capacity.
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
      try {
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
      } catch (error) {
        // The pre-check can lose a race; the unique constraint is the real gate.
        if (isUniqueViolation(error)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A bus with that plate number already exists.",
          });
        }
        throw error;
      }
    }),

  updateBus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().trim().min(1).max(80).optional(),
        plateNumber: z
          .string()
          .trim()
          .min(1)
          .max(20)
          .transform((s) => s.toUpperCase())
          .optional(),
        busTypeId: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      try {
        return await ctx.db.bus.update({ where: { id }, data });
      } catch (error) {
        if (isUniqueViolation(error))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A bus with that plate number already exists.",
          });
        throw error;
      }
    }),

  // ---------------------------------------------------------------------
  // Cities
  // ---------------------------------------------------------------------
  listCities: adminProcedure.query(async ({ ctx }) => {
    const cities = await ctx.db.city.findMany({
      orderBy: { name: "asc" },
    });
    return cities.map((c) => ({
      id: c.id,
      name: c.name,
      isActive: c.isActive,
    }));
  }),

  createCity: adminProcedure
    .input(z.object({ name: z.string().trim().min(1).max(60) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const city = await ctx.db.city.create({
          data: { name: input.name },
        });
        return city;
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A city with that name already exists.",
          });
        }
        throw error;
      }
    }),

  updateCity: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().trim().min(1).max(60).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      try {
        return await ctx.db.city.update({ where: { id }, data });
      } catch (error) {
        if (isUniqueViolation(error))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A city with that name already exists.",
          });
        throw error;
      }
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
      duration: formatDuration(r.durationMinutes),
      fare: r.baseFare.toFixed(2),
      isActive: r.isActive,
    }));
  }),

  routeOptions: adminProcedure.query(({ ctx }) =>
    ctx.db.city.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ),

  createRoute: adminProcedure
    .input(
      z.object({
        originCityId: z.string(),
        destCityId: z.string(),
        durationMinutes: z.number().int().positive(),
        baseFare: z.number().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.originCityId === input.destCityId)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Origin and destination must be different.",
        });
      try {
        return await ctx.db.route.create({ data: input });
      } catch (error) {
        if (isUniqueViolation(error))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "That route already exists.",
          });
        throw error;
      }
    }),

  updateRoute: adminProcedure
    .input(
      z.object({
        id: z.string(),
        originCityId: z.string().optional(),
        destCityId: z.string().optional(),
        durationMinutes: z.number().int().positive().optional(),
        baseFare: z.number().positive().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (
        input.originCityId &&
        input.destCityId &&
        input.originCityId === input.destCityId
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Origin and destination must be different.",
        });
      const { id, ...data } = input;
      try {
        return await ctx.db.route.update({ where: { id }, data });
      } catch (error) {
        if (isUniqueViolation(error))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "That route already exists.",
          });
        throw error;
      }
    }),

  // ---------------------------------------------------------------------
  // Schedules
  // ---------------------------------------------------------------------
  scheduleOptions: adminProcedure.query(async ({ ctx }) => {
    const [routes, buses] = await Promise.all([
      ctx.db.route.findMany({
        orderBy: { id: "asc" },
        include: {
          originCity: { select: { name: true } },
          destCity: { select: { name: true } },
        },
      }),
      ctx.db.bus.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, plateNumber: true },
      }),
    ]);
    return {
      routes: routes.map((r) => ({
        id: r.id,
        label: `${r.originCity.name} → ${r.destCity.name}`,
      })),
      buses,
    };
  }),

  listSchedules: adminProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        status: z
          .enum(["upcoming", "past", "cancelled", "all"])
          .default("upcoming"),
        routeId: z.string().optional(),
        busId: z.string().optional(),
        date: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.schedule.findMany({
        where: {
          AND: [
            scheduleStatusWhere(input.status, startOfToday()),
            ...(input.date
              ? [{ travelDate: new Date(`${input.date}T00:00:00.000Z`) }]
              : []),
          ],
          ...(input.routeId ? { routeId: input.routeId } : {}),
          ...(input.busId ? { busId: input.busId } : {}),
        },
        orderBy: [
          { travelDate: "asc" },
          { departureTime: "asc" },
          { id: "asc" },
        ],
        take: PAGE_SIZE + 1,
        ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
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
      const page = pageOf(rows, PAGE_SIZE);
      return {
        nextCursor: page.nextCursor,
        items: page.items.map((s) => ({
          id: s.id,
          busName: s.bus.name,
          plateNumber: s.bus.plateNumber,
          route: `${s.route.originCity.name} → ${s.route.destCity.name}`,
          date: dateStr(s.travelDate),
          departure: timeStr(s.departureTime),
          arrival: timeStr(s.arrivalTime),
          isCancelled: s.isCancelled,
        })),
      };
    }),

  createSchedule: adminProcedure
    .input(
      z.object({
        busId: z.string(),
        routeId: z.string(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        departure: z.string().regex(/^\d{2}:\d{2}$/),
        arrival: z.string().regex(/^\d{2}:\d{2}$/),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.schedule.create({
          data: {
            busId: input.busId,
            routeId: input.routeId,
            travelDate: new Date(`${input.date}T00:00:00.000Z`),
            departureTime: new Date(`1970-01-01T${input.departure}:00.000Z`),
            arrivalTime: new Date(`1970-01-01T${input.arrival}:00.000Z`),
          },
        });
      } catch (error) {
        if (isUniqueViolation(error))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "A schedule already exists for this bus, date, and departure time.",
          });
        throw error;
      }
    }),

  updateSchedule: adminProcedure
    .input(
      z.object({
        id: z.string(),
        busId: z.string(),
        routeId: z.string(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        departure: z.string().regex(/^\d{2}:\d{2}$/),
        arrival: z.string().regex(/^\d{2}:\d{2}$/),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const current = await ctx.db.schedule.findUnique({
        where: { id },
        select: { busId: true, _count: { select: { bookings: true } } },
      });
      if (!current) throw new TRPCError({ code: "NOT_FOUND" });
      if (current.busId !== input.busId && current._count.bookings > 0)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "The bus cannot be changed after bookings exist.",
        });
      try {
        return await ctx.db.schedule.update({
          where: { id },
          data: {
            busId: data.busId,
            routeId: data.routeId,
            travelDate: new Date(`${data.date}T00:00:00.000Z`),
            departureTime: new Date(`1970-01-01T${data.departure}:00.000Z`),
            arrivalTime: new Date(`1970-01-01T${data.arrival}:00.000Z`),
          },
        });
      } catch (error) {
        if (isUniqueViolation(error))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "A schedule already exists for this bus, date, and departure time.",
          });
        throw error;
      }
    }),

  setScheduleCancelled: adminProcedure
    .input(z.object({ id: z.string(), isCancelled: z.boolean() }))
    .mutation(({ ctx, input }) =>
      ctx.db.schedule.update({
        where: { id: input.id },
        data: { isCancelled: input.isCancelled },
      }),
    ),

  // ---------------------------------------------------------------------
  // Bookings
  // ---------------------------------------------------------------------
  listBookings: adminProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        search: z.string().trim().optional(),
        status: z.enum(["CONFIRMED", "CANCELLED"]).optional(),
        date: z.string().optional(),
        routeId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.booking.findMany({
        where: {
          status: input.status,
          ...(input.date
            ? {
                schedule: {
                  travelDate: new Date(`${input.date}T00:00:00.000Z`),
                },
              }
            : {}),
          ...(input.routeId
            ? {
                schedule: {
                  routeId: input.routeId,
                  ...(input.date
                    ? { travelDate: new Date(`${input.date}T00:00:00.000Z`) }
                    : {}),
                },
              }
            : {}),
          ...(input.search && {
            OR: [
              {
                bookingReference: {
                  contains: input.search,
                  mode: "insensitive",
                },
              },
              {
                user: {
                  email: { contains: input.search, mode: "insensitive" },
                },
              },
              {
                user: { name: { contains: input.search, mode: "insensitive" } },
              },
            ],
          }),
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: PAGE_SIZE + 1,
        ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
        include: {
          user: { select: { name: true, email: true } },
          seats: { select: { seat: { select: { seatNumber: true } } } },
          schedule: {
            select: {
              travelDate: true,
              departureTime: true,
              isCancelled: true,
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

      const page = pageOf(rows, PAGE_SIZE);

      return {
        nextCursor: page.nextCursor,
        items: page.items.map((b) => ({
          id: b.id,
          reference: b.bookingReference,
          accountName: b.user.name,
          accountEmail: b.user.email,
          route: `${b.schedule.route.originCity.name} → ${b.schedule.route.destCity.name}`,
          date: dateStr(b.schedule.travelDate),
          // Cancelled bookings have no seat rows left, so this is empty for them.
          seats: b.seats.map((s) => s.seat.seatNumber).sort((a, c) => a - c),
          status: b.status,
          checkedInAt: b.checkedInAt,
          verificationCode: b.verificationCode,
          canCheckIn:
            b.status === "CONFIRMED" &&
            !b.checkedInAt &&
            !b.schedule.isCancelled &&
            dateStr(b.schedule.travelDate) === todayInManila(),
          // The table hides Cancel where the server would refuse anyway.
          canCancel:
            b.status === "CONFIRMED" &&
            !b.checkedInAt &&
            !isDeparted(b.schedule.travelDate, b.schedule.departureTime),
        })),
      };
    }),

  cancelBooking: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.id },
        select: {
          status: true,
          checkedInAt: true,
          schedule: { select: { travelDate: true, departureTime: true } },
        },
      });
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.status !== "CONFIRMED") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "This booking can no longer be cancelled.",
        });
      }
      if (booking.checkedInAt) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "This ticket was already used to board.",
        });
      }
      if (
        isDeparted(booking.schedule.travelDate, booking.schedule.departureTime)
      ) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "This trip has already departed.",
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
      if (input.id === ctx.session.user.id && !input.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't deactivate your own account.",
        });
      }

      const target = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: { role: true },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });
      if (target.role === "ADMIN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Admin accounts can't be deactivated.",
        });
      }

      await ctx.db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: input.id },
          data: { isActive: input.isActive },
        });
        // Kick them out right away instead of waiting for the session to expire.
        if (!input.isActive) {
          await tx.session.deleteMany({ where: { userId: input.id } });
        }
      });
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
      const { count } = await ctx.db.feedback.updateMany({
        where: { id: input.id },
        data: { resolvedAt: input.resolved ? new Date() : null },
      });
      if (count === 0) throw new TRPCError({ code: "NOT_FOUND" });
    }),
});
