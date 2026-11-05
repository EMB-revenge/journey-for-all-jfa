import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const cityRouter = createTRPCRouter({
  list: publicProcedure.query(({ ctx }) => {
    return ctx.db.city.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }),
});
