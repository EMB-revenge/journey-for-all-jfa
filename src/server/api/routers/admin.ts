import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";

/**
 * Admin surface (SPEC 14). Bookings are read-only for admins: no edit, no
 * delete, status transitions stay automatic. City, bus, route, and schedule
 * CRUD join this router with the admin pages.
 */
export const adminRouter = createTRPCRouter({
  booking: createTRPCRouter({
    list: adminProcedure.query(({ ctx }) => {
      return ctx.db.booking.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          seats: {
            orderBy: { seat: { seatNumber: "asc" } },
            select: {
              passengerName: true,
              passengerEmail: true,
              passengerPhone: true,
              seat: { select: { seatNumber: true } },
            },
          },
          schedule: {
            select: {
              travelDate: true,
              departureTime: true,
              arrivalTime: true,
              bus: { select: { name: true } },
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
    }),
  }),

  /** Contact messages, open ones first. */
  feedback: createTRPCRouter({
    list: adminProcedure.query(({ ctx }) =>
      ctx.db.feedback.findMany({
        orderBy: [
          { resolvedAt: { sort: "asc", nulls: "first" } },
          { createdAt: "desc" },
        ],
      }),
    ),

    resolve: adminProcedure
      .input(z.object({ id: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const { count } = await ctx.db.feedback.updateMany({
          where: { id: input.id, resolvedAt: null },
          data: { resolvedAt: new Date() },
        });
        if (count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      }),
  }),
});
