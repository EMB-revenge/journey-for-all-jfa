/**
 * Assert-style checks for src/lib/dates.ts, the timezone logic that gates
 * every search. Run with: npm run test
 * No real clock math here: departure times are compared as +08:00 instants,
 * so the tests pin behavior against Asia/Manila wall clock.
 */
import assert from "node:assert/strict";

import { isDeparted, todayInManila } from "~/lib/dates";

// todayInManila is always the current PH calendar day, YYYY-MM-DD.
assert.match(todayInManila(), /^\d{4}-\d{2}-\d{2}$/);
assert.equal(todayInManila().length, 10);

// a helper: PH wall clock now, as "YYYY-MM-DDTHH:mm+08:00"
function manilaNow() {
  return todayInManila(); // day part only; times below are fixed strings
}

const day = manilaNow();

// A trip that departed 5 minutes ago on today's PH calendar day is departed.
const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000);

// Wall clock of fiveMinutesAgo in Manila, derived the same way the app does:
// take the instant, render it in +08:00, reuse only the time-of-day part.
const phTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
}).format(fiveMinutesAgo);
const hhmmAgo = phTime.replace(/^24:/, "00:");

// Build the travelDate that pairs with that time: if the +08:00 instant lands
// on the previous PH day, isDeparted must still see it as departed, so use the
// PH calendar day of fiveMinutesAgo (not necessarily todayInManila()).
const phDayAgo = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(fiveMinutesAgo);
const dateAgo = `${phDayAgo.slice(6, 10)}-${phDayAgo.slice(0, 2)}-${phDayAgo.slice(
  3,
  5,
)}`;
const departed = new Date(`${dateAgo}T00:00:00.000Z`);
const departedTime = new Date(`1970-01-01T${hhmmAgo}:00.000Z`);

assert.equal(
  isDeparted(departed, departedTime),
  true,
  `a trip at PH ${dateAgo} ${hhmmAgo} (~5 min ago) should count as departed`,
);

// A trip departing 5 minutes from now is not departed.
const fiveMinutesAhead = new Date(Date.now() + 5 * 60_000);
const hhmmAhead = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})
  .format(fiveMinutesAhead)
  .replace(/^24:/, "00:");
const phDayAhead = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(fiveMinutesAhead);
const dateAhead = `${phDayAhead.slice(6, 10)}-${phDayAhead.slice(0, 2)}-${phDayAhead.slice(
  3,
  5,
)}`;

assert.equal(
  isDeparted(
    new Date(`${dateAhead}T00:00:00.000Z`),
    new Date(`1970-01-01T${hhmmAhead}:00.000Z`),
  ),
  false,
  `a trip at PH ${dateAhead} ${hhmmAhead} (~5 min ahead) should not count as departed`,
);

// Tomorrow's PH calendar day is never departed, whatever the clock says.
const tomorrow = new Date(`${day}T00:00:00.000Z`);
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
assert.equal(
  isDeparted(tomorrow, new Date("1970-01-01T23:59:00.000Z")),
  false,
  "tomorrow's PH day is not departed",
);

console.log("dates.test: all assertions passed");
