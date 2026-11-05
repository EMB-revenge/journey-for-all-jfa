import assert from "node:assert/strict";
import { scheduleStatusWhere } from "./admin-schedule-filter";

const today = new Date("2026-11-06T00:00:00.000Z");
assert.deepEqual(scheduleStatusWhere("upcoming", today), {
  travelDate: { gte: today },
  isCancelled: false,
});
