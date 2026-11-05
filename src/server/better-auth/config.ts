import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { db } from "~/server/db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql", // or "sqlite" or "mysql"
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  /**
   * Our three fields on `user`. `input: false` keeps them out of every
   * sign-up and update payload, so nobody can promote themselves to ADMIN
   * through the auth API. The seed sets role with Prisma directly.
   */
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "PASSENGER",
        input: false,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
      phone: {
        type: "string",
        required: false,
      },
    },
  },
  /**
   * Block deactivated users from getting a session. This runs on every
   * sign-in, however it happens.
   */
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { isActive: true },
          });

          if (!user?.isActive) {
            throw new APIError("FORBIDDEN", {
              message: "This account has been deactivated.",
            });
          }

          return { data: session };
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
