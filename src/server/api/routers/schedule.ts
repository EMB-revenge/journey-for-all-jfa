import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const scheduleRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        fromCityId: z.string().min(1),
        toCityId: z.string().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
            originCityId: input.fromCityId,
            destCityId: input.toCityId,
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

      return schedules.map((s) => ({
        id: s.id,
        busName: s.bus.name,
        busType: s.bus.busType.name,
        departureTime: s.departureTime,
        arrivalTime: s.arrivalTime,
        durationMinutes: s.route.durationMinutes,
        fare: Number(s.route.baseFare),
        seatsLeft: Math.max(
          0,
          s.bus.capacity - s.bookingSeats.length - s.holds.length,
        ),
      }));
    }),
});