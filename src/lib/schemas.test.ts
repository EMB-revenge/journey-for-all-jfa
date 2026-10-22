/**
 * Booking input schemas and the seat-map URL contract. Run with: npm run test
 */
import assert from "node:assert/strict";

import {
  createHoldSchema,
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

console.log("schemas.test: all assertions passed");
