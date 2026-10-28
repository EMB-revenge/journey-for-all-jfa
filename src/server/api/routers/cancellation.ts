import { TRPCError } from "@trpc/server";

import { isDeparted } from "~/lib/dates";
import { bookingIdSchema } from "~/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const cancellationRouter = createTRPCRouter({
  /**
   * Cancels a whole booking before departure. The booking stays (bookings are
   * never deleted, SPEC 8.2) and its seat rows are deleted so the seats can be
   * booked again: UNIQUE(schedule_id, seat_id) would otherwise keep blocking them.
   */
  cancel: protectedProcedure
    .input(bookingIdSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Scoped by user: someone else's booking reads as not found.
      const booking = await ctx.db.booking.findFirst({
        where: { id: input.id, userId },
        select: {
          id: true,
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

      await ctx.db.$transaction(async (tx) => {
        // Only the first click wins: a second one finds no CONFIRMED row.
        const { count } = await tx.booking.updateMany({
          where: { id: booking.id, userId, status: "CONFIRMED" },
          data: { status: "CANCELLED" },
        });
        if (count === 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "This booking was already cancelled.",
          });
        }

        await tx.bookingSeat.deleteMany({ where: { bookingId: booking.id } });
      });

      return { id: booking.id };
    }),
});