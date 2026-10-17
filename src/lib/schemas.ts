import { z } from "zod";

/**
 * Zod schemas shared between tRPC procedures and client forms. Forms parse with
 * these before calling the API, so the same messages show up in both places.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/** First message per field, for rendering under inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors = error.flatten().fieldErrors;
  const result: Record<string, string> = {};

  for (const [field, messages] of Object.entries(errors)) {
    if (messages?.[0]) result[field] = messages[0];
  }

  return result;
}
