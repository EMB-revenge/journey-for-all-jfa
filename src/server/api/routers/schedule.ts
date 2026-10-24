import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const scheduleRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        originCityId: z.string().min(1),
        destCityId: z.string().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        passengers: z.number().int().min(1).default(1),
      }),
    )
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

      return schedules
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
        .filter((trip) => trip.availableSeats >= input.passengers);
    }),

  seatMap: publicProcedure
    .input(z.object({ scheduleId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const schedule = await ctx.db.schedule.findUnique({
        where: { id: input.scheduleId },
        include: {
          bus: {
            include: {
              busType: true,
              seats: { orderBy: { seatNumber: "asc" } },
            },
          },
          route: { include: { originCity: true, destCity: true } },
          bookingSeats: {
            where: {
              booking: { status: { in: ["CONFIRMED", "PENDING_PAYMENT"] } },
            },
            select: { seatId: true },
          },
          holds: {
            where: { expiresAt: { gt: new Date() } },
            select: { seatId: true, userId: true },
          },
        },
      });

      if (!schedule || schedule.isCancelled) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const bookedIds = new Set(schedule.bookingSeats.map((b) => b.seatId));
      // A seat held by someone else is unavailable. Your own hold is not.
      const heldByOthers = new Set(
        schedule.holds
          .filter((h) => h.userId !== ctx.session?.user.id)
          .map((h) => h.seatId),
      );

      return {
        id: schedule.id,
        travelDate: schedule.travelDate.toISOString().slice(0, 10),
        departureTime: schedule.departureTime,
        arrivalTime: schedule.arrivalTime,
        busName: schedule.bus.name,
        busType: schedule.bus.busType.name,
        fromName: schedule.route.originCity.name,
        toName: schedule.route.destCity.name,
        fare: Number(schedule.route.baseFare),
        seats: schedule.bus.seats.map((seat) => ({
          id: seat.id,
          seatNumber: seat.seatNumber,
          available: !bookedIds.has(seat.id) && !heldByOthers.has(seat.id),
        })),
      };
    }),
});