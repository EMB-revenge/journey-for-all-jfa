/**
 * Reducer invariants for the booking flow. Run with: npm run test
 */
import assert from "node:assert/strict";

import {
  bookingFlowReducer,
  initialBookingFlowState,
  type BookingFlowState,
} from "~/reducers/bookingFlowReducer";

const started = bookingFlowReducer(initialBookingFlowState, {
  type: "startTrip",
  scheduleId: "schedule-1",
  passengers: 2,
  from: "city-a",
  to: "city-b",
  date: "2026-11-01",
});

assert.equal(started.scheduleId, "schedule-1");
assert.equal(started.passengers, 2);
assert.deepEqual(started.selectedSeatIds, []);
assert.equal(started.from, "city-a");

// Selecting and deselecting.
const oneSeat = bookingFlowReducer(started, {
  type: "toggleSeat",
  seatId: "seat-1",
});
const twoSeats = bookingFlowReducer(oneSeat, {
  type: "toggleSeat",
  seatId: "seat-2",
});
assert.deepEqual(twoSeats.selectedSeatIds, ["seat-1", "seat-2"]);

const deselect = bookingFlowReducer(twoSeats, {
  type: "toggleSeat",
  seatId: "seat-1",
});
assert.deepEqual(deselect.selectedSeatIds, ["seat-2"]);

// Never more than the passenger count.
const third = bookingFlowReducer(twoSeats, {
  type: "toggleSeat",
  seatId: "seat-3",
});
assert.equal(third, twoSeats, "a third seat must be ignored when 2 are asked");

// Re-entering the same trip keeps the selection (login return, remount).
const sameTrip = bookingFlowReducer(twoSeats, {
  type: "startTrip",
  scheduleId: "schedule-1",
  passengers: 2,
});
assert.equal(sameTrip, twoSeats);

// A different trip starts clean.
const otherTrip = bookingFlowReducer(twoSeats, {
  type: "startTrip",
  scheduleId: "schedule-2",
  passengers: 3,
});
assert.deepEqual(otherTrip.selectedSeatIds, []);
assert.equal(otherTrip.passengers, 3);
assert.equal(otherTrip.expiresAt, null);

// Conflict recovery drops only the seats that were taken.
const afterConflict = bookingFlowReducer(twoSeats, {
  type: "removeSeats",
  seatIds: ["seat-2", "seat-9"],
});
assert.deepEqual(afterConflict.selectedSeatIds, ["seat-1"]);

const expiresAt = new Date("2026-11-01T10:05:00.000Z");
const held: BookingFlowState = bookingFlowReducer(afterConflict, {
  type: "holdStarted",
  expiresAt,
});
assert.equal(held.expiresAt, expiresAt);
assert.deepEqual(held.selectedSeatIds, ["seat-1"]);

const cleared = bookingFlowReducer(held, { type: "holdCleared" });
assert.equal(cleared.expiresAt, null);
assert.deepEqual(cleared.selectedSeatIds, []);

assert.equal(
  bookingFlowReducer(cleared, { type: "reset" }),
  initialBookingFlowState,
);

console.log("bookingFlowReducer.test: all assertions passed");
