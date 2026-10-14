import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    BETTER_AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    BETTER_AUTH_GITHUB_CLIENT_ID: z.string(),
    BETTER_AUTH_GITHUB_CLIENT_SECRET: z.string(),
    DATABASE_URL: z.string().url(),
    /**
     * Seed admins, read by prisma/seed.ts only. Optional here so a fresh
     * clone can run `npm run build` before filling them in; seed.ts fails
     * with a clear message when any pair is missing.
     */
    ADMIN_1_EMAIL: z.string().email().optional(),
    ADMIN_1_PASSWORD: z.string().optional(),
    ADMIN_2_EMAIL: z.string().email().optional(),
    ADMIN_2_PASSWORD: z.string().optional(),
    ADMIN_3_EMAIL: z.string().email().optional(),
    ADMIN_3_PASSWORD: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_GITHUB_CLIENT_ID: process.env.BETTER_AUTH_GITHUB_CLIENT_ID,
    BETTER_AUTH_GITHUB_CLIENT_SECRET:
      process.env.BETTER_AUTH_GITHUB_CLIENT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    ADMIN_1_EMAIL: process.env.ADMIN_1_EMAIL,
    ADMIN_1_PASSWORD: process.env.ADMIN_1_PASSWORD,
    ADMIN_2_EMAIL: process.env.ADMIN_2_EMAIL,
    ADMIN_2_PASSWORD: process.env.ADMIN_2_PASSWORD,
    ADMIN_3_EMAIL: process.env.ADMIN_3_EMAIL,
    ADMIN_3_PASSWORD: process.env.ADMIN_3_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
