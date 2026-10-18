import { isDeparted } from "~/lib/dates";
import { searchTripsSchema } from "~/lib/schemas";
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
});
