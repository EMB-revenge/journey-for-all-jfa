import { feedbackSchema } from "~/lib/schemas";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

/**
 * The /contact form. Public on purpose: a guest with a booking problem may not
 * have an account yet. Admins read the rows at /admin/feedback.
 */
export const feedbackRouter = createTRPCRouter({
  send: publicProcedure
    .input(feedbackSchema)
    .mutation(({ ctx, input }) =>
      ctx.db.feedback.create({ data: input, select: { id: true } }),
    ),
});
