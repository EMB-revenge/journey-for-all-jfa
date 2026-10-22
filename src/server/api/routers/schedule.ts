import { TRPCError } from "@trpc/server";

import { isDeparted } from "~/lib/dates";
import { scheduleSeatsSchema, searchTripsSchema } from "~/lib/schemas";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const scheduleRouter = createTRPCRouter({
  search: publicProcedure
    .input(searchTripsSchema)
    .query(async ({ ctx, input }) => {
      const schedules = await ctx.db.schedule.findMany({
        where: {
          travelDate: new Date(`${input.date}T00:00:00.000Z`),
          isCancelled: false,
          bus: { isActive: true },
          route: {
            isActive: true,
            originCityId: input.originCityId,
            destCityId: input.destCityId,
          },
        },
        orderBy: { departureTime: "asc" },
        include: {
          bus: { include: { busType: true } },
          route: true,
          bookingSeats: {
            where: {
              booking: { status: { in: ["CONFIRMED", "PENDING_PAYMENT"] } },
            },
            select: { id: true },
          },
          holds: {
            where: { expiresAt: { gt: new Date() } },
            select: { id: true },
          },
        },
      });

      // SPEC 12 cleanup: the expiresAt filter above already excludes expired
      // holds, so availability does not depend on this delete landing first.
      if (schedules.length > 0) {
        await ctx.db.seatHold.deleteMany({
          where: {
            scheduleId: { in: schedules.map((s) => s.id) },
            expiresAt: { lt: new Date() },
          },
        });
      }

      return schedules
        .filter((s) => !isDeparted(s.travelDate, s.departureTime))
        .map((s) => ({
          id: s.id,
          busName: s.bus.name,
          busType: s.bus.busType.name,
          departureTime: s.departureTime,
          arrivalTime: s.arrivalTime,
          durationMinutes: s.route.durationMinutes,
          fare: Number(s.route.baseFare),
          availableSeats: Math.max(
            0,
            s.bus.capacity - s.bookingSeats.length - s.holds.length,
          ),
        }))
        .filter((t) => t.availableSeats >= input.passengers);
    }),

  /**
   * Seat map data (SPEC 8.4). Booked and actively held seats both read as
   * OCCUPIED, and nothing here says who holds what.
   */
  seats: publicProcedure
    .input(scheduleSeatsSchema)
    .query(async ({ ctx, input }) => {
      const schedule = await ctx.db.schedule.findUnique({
        where: { id: input.scheduleId },
        include: {
          bus: { include: { busType: true } },
          route: { include: { originCity: true, destCity: true } },
          bookingSeats: {
            where: {
              booking: { status: { in: ["CONFIRMED", "PENDING_PAYMENT"] } },
            },
            select: { seatId: true },
          },
          holds: {
            where: { expiresAt: { gt: new Date() } },
            select: { seatId: true },
          },
        },
      });

      if (!schedule || !schedule.bus.isActive || !schedule.route.isActive) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (
        schedule.isCancelled ||
        isDeparted(schedule.travelDate, schedule.departureTime)
      ) {
        throw new TRPCError({ code: "PRECONDITION_FAILED" });
      }

      // SPEC 12 cleanup. Availability above already ignores expired holds, so
      // a failed delete cannot make the map wrong.
      await ctx.db.seatHold.deleteMany({
        where: { scheduleId: schedule.id, expiresAt: { lt: new Date() } },
      });

      const seats = await ctx.db.seat.findMany({
        where: { busId: schedule.busId },
        orderBy: { seatNumber: "asc" },
        select: { id: true, seatNumber: true },
      });

      const occupied = new Set([
        ...schedule.bookingSeats.map((row) => row.seatId),
        ...schedule.holds.map((row) => row.seatId),
      ]);

      return {
        scheduleId: schedule.id,
        originCity: schedule.route.originCity.name,
        destCity: schedule.route.destCity.name,
        travelDate: schedule.travelDate,
        departureTime: schedule.departureTime,
        arrivalTime: schedule.arrivalTime,
        durationMinutes: schedule.route.durationMinutes,
        busName: schedule.bus.name,
        busType: schedule.bus.busType.name,
        fare: Number(schedule.route.baseFare),
        capacity: schedule.bus.capacity,
        seats: seats.map((seat) => ({
          id: seat.id,
          seatNumber: seat.seatNumber,
          status: occupied.has(seat.id)
            ? ("OCCUPIED" as const)
            : ("AVAILABLE" as const),
        })),
      };
    }),
});
