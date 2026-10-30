import { adminRouter } from "~/server/api/routers/admin";
import { bookingRouter } from "~/server/api/routers/booking";
import { busTypeRouter } from "~/server/api/routers/busType";
import { cityRouter } from "~/server/api/routers/city";
import { feedbackRouter } from "~/server/api/routers/feedback";
import { holdRouter } from "~/server/api/routers/hold";
import { scheduleRouter } from "~/server/api/routers/schedule";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { cancellationRouter } from "~/server/api/routers/cancellation";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  admin: adminRouter,
  booking: bookingRouter,
  busType: busTypeRouter,
  city: cityRouter,
  feedback: feedbackRouter,
  hold: holdRouter,
  schedule: scheduleRouter,
  cancellation: cancellationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
