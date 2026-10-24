import { TRPCError } from "@trpc/server";

import { isDeparted } from "~/lib/dates";
import { isUniqueViolation } from "~/lib/errors";
import { createHoldSchema, releaseHoldsSchema } from "~/lib/schemas";
import {
  conflict,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import type { db } from "~/server/db";

/** SPEC 12: five minutes, taken in one batch when the passenger continues. */
const HOLD_TTL_MS = 5 * 60 * 1000;

type SeatReader = Pick<typeof db, "bookingSeat" | "seatHold">;

/**
 * Seat ids on this schedule that are booked or actively held by someone else
 * (SPEC 8.4). Works inside a transaction or on the plain client.
 */
async function takenSeatIds(
  reader: SeatReader,
  {
    scheduleId,
    seatIds,
    userId,
    now,
  }: { scheduleId: string; seatIds: string[]; userId: string; now: Date },
): Promise<string[]> {
  const [booked, held] = await Promise.all([
    reader.bookingSeat.findMany({
      where: {
        scheduleId,
        seatId: { in: seatIds },
        booking: { status: { in: ["CONFIRMED", "PENDING_PAYMENT"] } },
      },
      select: { seatId: true },
    }),
    reader.seatHold.findMany({
      where: {
        scheduleId,
        seatId: { in: seatIds },
        userId: { not: userId },
        expiresAt: { gt: now },
      },
      select: { seatId: true },
    }),
  ]);

  return [...new Set([...booked, ...held].map((row) => row.seatId))];
}

export const holdRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createHoldSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + HOLD_TTL_MS);
      const userId = ctx.session.user.id;

      const schedule = await ctx.db.schedule.findUnique({
        where: { id: input.scheduleId },
        select: {
          id: true,
          busId: true,
          travelDate: true,
          departureTime: true,
          isCancelled: true,
          bus: { select: { isActive: true } },
          route: { select: { isActive: true } },
        },
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
        where: { id: { in: input.seatIds }, busId: schedule.busId },
      });
      if (seatCount !== input.seatIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Those seats do not belong to this trip.",
        });
      }

      try {
        await ctx.db.$transaction(async (tx) => {
          // One active batch per user per schedule: a retry or a changed
          // selection replaces it instead of leaving orphan holds behind.
          await tx.seatHold.deleteMany({
            where: { scheduleId: schedule.id, userId },
          });

          const taken = await takenSeatIds(tx, {
            scheduleId: schedule.id,
            seatIds: input.seatIds,
            userId,
            now,
          });
          if (taken.length > 0) conflict({ takenSeats: taken });

          await tx.seatHold.createMany({
            data: input.seatIds.map((seatId) => ({
              scheduleId: schedule.id,
              seatId,
              userId,
              expiresAt,
            })),
          });
        });
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;

        // Another request slipped in between the check and the write.
        // UNIQUE(schedule_id, seat_id) is the backstop (SPEC 8.6).
        const taken = await takenSeatIds(ctx.db, {
          scheduleId: schedule.id,
          seatIds: input.seatIds,
          userId,
          now,
        });
        conflict({ takenSeats: taken.length > 0 ? taken : input.seatIds });
      }

      return { expiresAt };
    }),

  release: protectedProcedure
    .input(releaseHoldsSchema)
    .mutation(async ({ ctx, input }) => {
      // Scoped by user as well as schedule: never release someone else's hold.
      const { count } = await ctx.db.seatHold.deleteMany({
        where: {
          scheduleId: input.scheduleId,
          userId: ctx.session.user.id,
          ...(input.seatIds ? { seatId: { in: input.seatIds } } : {}),
        },
      });

      return { released: count };
    }),
});
