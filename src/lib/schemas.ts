import { z } from "zod";

import { todayInManila } from "~/lib/dates";

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

const personName = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters");

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20, "Enter a valid phone number")
  .regex(/^[0-9+\-\s()]+$/, "Phone can only contain digits, +, -, and spaces");

export const registerSchema = z
  .object({
    name: personName,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/** Profile edits on `/account`. Email is not editable here. */
export const profileSchema = z.object({
  name: personName,
  phone: phoneSchema,
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

export const searchTripsSchema = z.object({
  originCityId: z.string().min(1, "Pick a departure city"),
  destCityId: z.string().min(1, "Pick a destination city"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a travel date")
    .refine((v) => v >= todayInManila(), "Travel date cannot be in the past"),
  passengers: z.coerce
    .number()
    .int()
    .min(1, "At least 1 passenger")
    .max(6, "At most 6 passengers"),
});

export const scheduleSeatsSchema = z.object({
  scheduleId: z.string().min(1),
});

/** 1-6 unique seats, the same ceiling as `passengers` in a search. */
const seatIdList = z
  .array(z.string().min(1))
  .min(1, "Select at least one seat")
  .max(6, "At most 6 seats")
  .refine((ids) => new Set(ids).size === ids.length, "Seat IDs must be unique");

export const createHoldSchema = z.object({
  scheduleId: z.string().min(1),
  seatIds: seatIdList,
});

export const releaseHoldsSchema = z.object({
  scheduleId: z.string().min(1),
  seatIds: seatIdList.optional(),
});

export const passengerSchema = z.object({
  seatId: z.string().min(1),
  name: personName,
});

export const confirmBookingSchema = z.object({
  scheduleId: z.string().min(1),
  passengers: z
    .array(passengerSchema)
    .min(1, "At least 1 passenger")
    .max(6, "At most 6 passengers")
    .refine(
      (list) => new Set(list.map((p) => p.seatId)).size === list.length,
      "Each seat can only be used once",
    ),
});

export const bookingIdSchema = z.object({ id: z.string().min(1) });

export const feedbackSchema = z.object({
  name: personName,
  email: emailSchema,
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be under 2000 characters"),
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
