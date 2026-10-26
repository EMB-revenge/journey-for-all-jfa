/**
 * Booking input schemas and the seat-map URL contract. Run with: npm run test
 */
import assert from "node:assert/strict";

import {
  confirmBookingSchema,
  createHoldSchema,
  passengerSchema,
  phoneSchema,
  registerSchema,
  releaseHoldsSchema,
  scheduleSeatsSchema,
} from "~/lib/schemas";
import { seatMapParamsSchema } from "~/lib/seat-map";

const seats = (count: number) =>
  Array.from({ length: count }, (_, index) => `seat-${index + 1}`);

assert.equal(
  createHoldSchema.safeParse({ scheduleId: "s1", seatIds: seats(1) }).success,
  true,
);
assert.equal(
  createHoldSchema.safeParse({ scheduleId: "s1", seatIds: seats(6) }).success,
  true,
);
assert.equal(
  createHoldSchema.safeParse({ scheduleId: "s1", seatIds: [] }).success,
  false,
  "no seats is invalid",
);
assert.equal(
  createHoldSchema.safeParse({ scheduleId: "s1", seatIds: seats(7) }).success,
  false,
  "seven seats exceeds the passenger ceiling",
);
assert.equal(
  createHoldSchema.safeParse({
    scheduleId: "s1",
    seatIds: ["seat-1", "seat-1"],
  }).success,
  false,
  "duplicate seat ids are invalid",
);

// Release may omit seatIds (release every hold I own for the schedule).
assert.equal(releaseHoldsSchema.safeParse({ scheduleId: "s1" }).success, true);
assert.equal(
  releaseHoldsSchema.safeParse({ scheduleId: "s1", seatIds: seats(2) }).success,
  true,
);
assert.equal(scheduleSeatsSchema.safeParse({ scheduleId: "" }).success, false);

// URL params: passengers defaults to 1 and stays within 1-6.
const defaulted = seatMapParamsSchema.parse({ scheduleId: "s1" });
assert.equal(defaulted.passengers, 1);
assert.equal(
  seatMapParamsSchema.parse({ scheduleId: "s1", passengers: "3" }).passengers,
  3,
);
assert.equal(
  seatMapParamsSchema.safeParse({ scheduleId: "s1", passengers: "7" }).success,
  false,
);
assert.equal(
  seatMapParamsSchema.safeParse({ scheduleId: "s1", passengers: "x" }).success,
  false,
);
assert.equal(
  seatMapParamsSchema.safeParse({ scheduleId: "s1", date: "11-01-2026" })
    .success,
  false,
  "dates stay YYYY-MM-DD",
);

// Passenger details: one name per seat, trimmed. Contact lives on the account.
const passenger = (seatId: string, overrides = {}) => ({
  seatId,
  name: "  Juan Dela Cruz  ",
  ...overrides,
});

const trimmed = passengerSchema.parse(passenger("seat-1"));
assert.equal(trimmed.name, "Juan Dela Cruz", "names are trimmed");

assert.equal(
  passengerSchema.safeParse(passenger("seat-1", { name: "J" })).success,
  false,
  "a one-letter name is invalid",
);

// The account's phone, loose but PH-friendly.
assert.equal(phoneSchema.safeParse("+63 912 345 6789").success, true);
assert.equal(
  phoneSchema.safeParse("call me").success,
  false,
  "phone rejects letters",
);
assert.equal(
  phoneSchema.safeParse("123").success,
  false,
  "phone needs at least 7 characters",
);

// Signup carries the phone, so booking never has to ask for it.
const signup = (overrides = {}) => ({
  name: "Juan Dela Cruz",
  email: "juan@email.com",
  phone: "+63 912 345 6789",
  password: "correct-horse",
  confirmPassword: "correct-horse",
  ...overrides,
});

assert.equal(registerSchema.safeParse(signup()).success, true);
assert.equal(
  registerSchema.safeParse(signup({ phone: "" })).success,
  false,
  "signup needs a phone number",
);
assert.equal(
  registerSchema.safeParse(signup({ phone: "call me" })).success,
  false,
  "signup rejects a phone with letters",
);
assert.equal(
  registerSchema.safeParse(
    signup({ password: "short", confirmPassword: "short" }),
  ).success,
  false,
  "passwords stay at least 8 characters",
);

const confirm = (passengers: unknown[]) =>
  confirmBookingSchema.safeParse({ scheduleId: "s1", passengers });

assert.equal(confirm([passenger("seat-1")]).success, true);
assert.equal(confirm([]).success, false, "at least one passenger");
assert.equal(
  confirm(seats(7).map((seatId) => passenger(seatId))).success,
  false,
  "six passengers is the ceiling",
);
assert.equal(
  confirm([passenger("seat-1"), passenger("seat-1")]).success,
  false,
  "one passenger per seat",
);

console.log("schemas.test: all assertions passed");
