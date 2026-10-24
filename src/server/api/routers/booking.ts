import { TRPCError } from "@trpc/server";

import type { Prisma } from "../../../../generated/prisma";
import { isDeparted, todayInManila } from "~/lib/dates";
import { isUniqueViolation } from "~/lib/errors";
import { bookingIdSchema, confirmBookingSchema } from "~/lib/schemas";
import {
  conflict,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

const bookingInclude = {
  seats: { include: { seat: { select: { seatNumber: true } } } },
  schedule: {
    include: {
      bus: { include: { busType: true } },
      route: { include: { originCity: true, destCity: true } },
    },
  },
} satisfies Prisma.BookingInclude;

type BookingRow = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

/** The shape the ticket, summary, and My Bookings pages read. */
function shapeBooking(b: BookingRow) {
  return {
    id: b.id,
    bookingReference: b.bookingReference,
    status: b.status,
    createdAt: b.createdAt,
    unitFare: Number(b.unitFare),
    totalAmount: Number(b.totalAmount),
    scheduleId: b.scheduleId,
    originCity: b.schedule.route.originCity.name,
    destCity: b.schedule.route.destCity.name,
    travelDate: b.schedule.travelDate,
    departureTime: b.schedule.departureTime,
    arrivalTime: b.schedule.arrivalTime,
    durationMinutes: b.schedule.route.durationMinutes,
    busName: b.schedule.bus.name,
    busType: b.schedule.bus.busType.name,
    seats: b.seats
      .map((s) => ({
        id: s.id,
        seatNumber: s.seat.seatNumber,
        passengerName: s.passengerName,
        passengerEmail: s.passengerEmail,
        passengerPhone: s.passengerPhone,
      }))
      .sort((a, c) => a.seatNumber - c.seatNumber),
  };
}

const ACTIVE_STATUSES = ["CONFIRMED", "PENDING_PAYMENT"] as const;

export const bookingRouter = createTRPCRouter({
  confirm: protectedProcedure
    .input(confirmBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const now = new Date();
      const seatIds = input.passengers.map((p) => p.seatId);

      const schedule = await ctx.db.schedule.findUnique({
        where: { id: input.scheduleId },
        include: { route: true, bus: { select: { isActive: true } } },
      });

      if (!schedule?.bus.isActive || !schedule.route.isActive) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (
        schedule.isCancelled ||
        isDeparted(schedule.travelDate, schedule.departureTime)
      ) {
        throw new TRPCError({ code: "PRECONDITION_FAILED" });
      }

      // Seat ids come from the browser: every one must sit on this bus.
      const seatCount = await ctx.db.seat.count({
        where: { id: { in: seatIds }, busId: schedule.busId },
      });
      if (seatCount !== seatIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Those seats do not belong to this trip.",
        });
      }

      const day = todayInManila();
      const counterDate = new Date(`${day}T00:00:00.000Z`);

      let bookingId: string | undefined;

      try {
        const created = await ctx.db.$transaction(async (tx) => {
          const booked = await tx.bookingSeat.findMany({
            where: {
              scheduleId: schedule.id,
              seatId: { in: seatIds },
              booking: { status: { in: [...ACTIVE_STATUSES] } },
            },
            select: { seatId: true },
          });
          if (booked.length > 0) {
            conflict({ takenSeats: booked.map((row) => row.seatId) });
          }

          // The passenger must still hold every seat (SPEC 12).
          const holds = await tx.seatHold.count({
            where: {
              scheduleId: schedule.id,
              userId,
              seatId: { in: seatIds },
              expiresAt: { gt: now },
            },
          });
          if (holds !== seatIds.length) {
            conflict({ reason: "HOLD_EXPIRED" });
          }

          // SPEC 10: one counter row per day, bumped inside the transaction.
          const counter = await tx.bookingCounter.upsert({
            where: { date: counterDate },
            create: { date: counterDate, lastNumber: 1 },
            update: { lastNumber: { increment: 1 } },
          });
          const reference = `BK-${day.replace(/-/g, "")}-${String(
            counter.lastNumber,
          ).padStart(6, "0")}`;

          // SPEC 9: snapshot the fare so later route edits leave this alone.
          const booking = await tx.booking.create({
            data: {
              userId,
              scheduleId: schedule.id,
              bookingReference: reference,
              unitFare: schedule.route.baseFare,
              totalAmount: schedule.route.baseFare.mul(seatIds.length),
              seats: {
                create: input.passengers.map((p) => ({
                  scheduleId: schedule.id,
                  seatId: p.seatId,
                  passengerName: p.name,
                  passengerEmail: p.email,
                  passengerPhone: p.phone,
                })),
              },
            },
            select: { id: true },
          });

          await tx.seatHold.deleteMany({
            where: { scheduleId: schedule.id, userId },
          });

          return booking;
        });

        bookingId = created.id;
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;

        // UNIQUE(schedule_id, seat_id) is the backstop (SPEC 8.6).
        const taken = await ctx.db.bookingSeat.findMany({
          where: {
            scheduleId: schedule.id,
            seatId: { in: seatIds },
            booking: { status: { in: [...ACTIVE_STATUSES] } },
          },
          select: { seatId: true },
        });
        conflict({
          takenSeats:
            taken.length > 0 ? taken.map((row) => row.seatId) : seatIds,
        });
      }

      if (!bookingId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return { id: bookingId };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const bookings = await ctx.db.booking.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      include: bookingInclude,
    });
    return bookings.map(shapeBooking);
  }),

  get: protectedProcedure
    .input(bookingIdSchema)
    .query(async ({ ctx, input }) => {
      // Scoped by user: someone else's booking reads as not found.
      const booking = await ctx.db.booking.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: bookingInclude,
      });
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      return shapeBooking(booking);
    }),
});