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
});
