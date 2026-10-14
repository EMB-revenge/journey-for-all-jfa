import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const busTypeRouter = createTRPCRouter({
  list: publicProcedure.query(({ ctx }) => {
    return ctx.db.busType.findMany({ orderBy: { name: "asc" } });
  }),
});
