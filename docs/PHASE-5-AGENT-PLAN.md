# Phase 5 — Seat Map and Holds: Agent Build Plan

**Repository:** `EMB-revenge/journey-for-all-jfa`  
**Branch for implementation:** `feature/phase-5-seat-map-holds` (create from the latest `main`)  
**Scope:** Implement Phase 5 only. Do not start booking confirmation, passenger data forms, tickets, My Bookings, or admin CRUD.

## 1. Read first

Before changing code, read these files in order:

1. `docs/SPEC.md` — source of truth, especially §§8.4–8.6, 12, 14, 16–18.
2. `docs/IMPLEMENTATION-PLAN.md` — Phase 5 steps and acceptance criteria.
3. `src/server/api/routers/schedule.ts`, `src/server/api/trpc.ts`, `src/lib/errors.ts`, and `src/lib/schemas.ts` — preserve the existing tRPC, Zod, and conflict conventions.
4. `src/app/_components/trip-card.tsx`, `src/app/search/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/_components/auth/login-form.tsx`, `src/app/layout.tsx`, and `src/context/AuthContext.tsx` — integrate with the current search and authentication flow rather than rebuilding it.

The app is Next.js 15 App Router, React 19, TypeScript, tRPC v11, Prisma 6, Better Auth, PostgreSQL, and Tailwind CSS v4. Keep that stack. No new package should be needed.

## 2. Phase 5 outcome

A passenger can open a result's seat map, select exactly the number of seats requested in the search, sign in if necessary without losing the selection, and reserve the entire selection atomically for five minutes. Seats that are booked or actively held appear occupied. Concurrent attempts to hold the same seat must fail with a typed `CONFLICT` containing the IDs of the seats that could not be acquired. The passenger sees a live countdown; expiry releases their hold and sends them back to the same seat map.

## 3. Scope and boundaries

### Build now

- Public `schedule.seats` query.
- Protected `hold.create` and `hold.release` mutations.
- Shared booking-flow reducer and provider, mounted in the root layout.
- `/booking/seat-map` page and reusable seat grid/countdown UI.
- Link from each available TripCard to the seat map with the schedule and search context.
- A minimal `/booking/passengers` continuation page if needed so successful holds do not navigate to a 404. It may show trip/seat summary and countdown, but **must not** implement passenger forms or booking confirmation; those are Phase 6.
- Focused tests and the verification steps below.
- Update the implementation notes/README only if the code changes make an existing statement inaccurate.

### Explicitly do not build

- Passenger detail forms, booking summary/confirmation, booking reference generation, tickets, or `/my-bookings` (Phase 6).
- Admin CRUD (Phase 7).
- Payment, cancellation, database schema changes, migrations, cron jobs, or a new global state library.
- A third persisted seat status. The API must return only `AVAILABLE` or `OCCUPIED`; selecting an available seat is client-side state, not a database status.

## 4. Recommended implementation order

### Step A — Add shared input schemas

In `src/lib/schemas.ts`, add and export schemas for:

- Seat-map lookup: `scheduleId`.
- Hold creation: `scheduleId` plus `seatIds` containing 1–6 unique, non-empty IDs.
- Hold release: `scheduleId` plus optional `seatIds`; omitted IDs mean release all holds owned by the current user for that schedule.

Use Zod validation, including a uniqueness check for `seatIds`. Reuse these schemas at the tRPC boundary; do not duplicate looser client-only validation.

### Step B — Implement `schedule.seats`

Add a query to `src/server/api/routers/schedule.ts` and keep it public.

1. Resolve the schedule and its bus. Return `NOT_FOUND` for a missing schedule or unusable bus/schedule; do not trust IDs provided by the browser.
2. Load the bus's seats ordered by `seatNumber`.
3. Determine occupied IDs from:
   - `BookingSeat` rows for that schedule whose booking status occupies inventory (`CONFIRMED` and, defensively, `PENDING_PAYMENT`).
   - `SeatHold` rows for that schedule with `expiresAt > now`.
4. Opportunistically delete expired holds for the requested schedule, as `schedule.search` already does. Availability must still be correct if cleanup runs later or fails.
5. Return enough information for the page to render the trip and grid: schedule ID, schedule/bus/route display details, capacity/seat count as applicable, and sorted seats with `id`, `seatNumber`, and `status: "AVAILABLE" | "OCCUPIED"`.
6. A seat is occupied if it is booked **or** has an active hold by any user. Do not reveal who owns a hold or whether it belongs to the current user.

Reuse `isDeparted` from `src/lib/dates.ts` for the departure-time guard where appropriate. The hold mutation must independently reject cancelled or departed schedules even if a user bypasses the UI.

### Step C — Implement the hold router

Create `src/server/api/routers/hold.ts`, use `protectedProcedure`, and register it in `src/server/api/root.ts`.

#### `hold.create({ scheduleId, seatIds })`

- TTL is exactly **five minutes**. Return `{ expiresAt }`.
- Verify the schedule exists, is not cancelled or departed, and each requested seat belongs to that schedule's bus.
- Reject duplicate IDs, invalid count, and IDs from another bus before writing.
- Before creating, remove expired holds for the relevant schedule/seats and check for seats already present in `booking_seats` or actively held by another user.
- Acquire the whole requested batch atomically. Do not silently skip duplicates or partially hold a batch. Preserve the existing `UNIQUE(schedule_id, seat_id)` constraint as the concurrency backstop.
- Handle Prisma unique conflicts (`P2002`) by returning `conflict({ takenSeats: [...] })`, using the existing helper in `src/server/api/trpc.ts`. The IDs in `takenSeats` are seat IDs; the UI maps them to seat numbers for a human-readable message.
- Ensure an active hold owned by the caller does not create a misleading “taken by someone else” error on a retry. Avoid extending/replacing another user's hold.
- When detecting conflicts, include booked seats and active holds, not just rows in `seat_holds`. Keep all writes for one request transactional.

Do not change the Prisma schema. If the current constraint/transaction flow exposes a race that the unique constraints do not safely resolve, document it in the PR and implement the narrowest safe correction without broad redesign.

#### `hold.release({ scheduleId, seatIds? })`

- Always scope deletion by `scheduleId` **and** authenticated `userId`; a passenger must never release another user's hold.
- If `seatIds` is supplied, release only those IDs owned by this user. Otherwise release all holds owned by the user for this schedule.
- Return `{ released: count }`; release should be safe to call more than once.

### Step D — Add the booking-flow reducer/provider

Create `src/reducers/bookingFlowReducer.ts` and `src/context/BookingFlowProvider.tsx` (or match nearby existing naming conventions).

State should be limited to the current booking journey:

- selected `scheduleId`;
- required passenger/seat count from search (1–6);
- selected seat IDs;
- hold expiry timestamp, if a hold exists;
- only the minimal search context needed to return to the same results/seat-map state.

Define typed reducer actions for setting the trip/count, toggling a seat, storing a successful hold, clearing a hold, and resetting the journey. Keep reducer transitions deterministic and unit-testable.

Mount the provider in `src/app/layout.tsx` inside the existing `TRPCReactProvider`; keep it mounted across `/booking/seat-map` and `/login` client-side navigations. Do not store passenger personal data or introduce localStorage in Phase 5. On first entry/direct reload, initialize from validated URL search parameters; the URL must contain enough context to reconstruct the schedule and requested seat count.

### Step E — Connect search results to the seat map

Update `src/app/_components/trip-card.tsx` and `src/app/search/page.tsx`:

- Replace the disabled **Select seat** button with a real Next.js link to `/booking/seat-map`.
- Include `scheduleId` and requested passenger count in the target URL. Preserve the search parameters (`from`, `to`, `date`, `passengers`) so the user can return to the same results.
- Do not add a seat link to sold-out trips.
- Keep the existing `/search` query contract unchanged.

### Step F — Build `/booking/seat-map`

Create `src/app/booking/seat-map/page.tsx` and small reusable components under `src/app/_components/` where that reduces page complexity.

- Read/validate `scheduleId`, `passengers`, and search context from URL parameters. If required parameters are invalid, show a safe error state and a link back to search rather than crashing.
- Load the grid through `api.schedule.seats.useQuery`; do not import Prisma or query the database in UI code.
- Display route, travel date, departure/arrival, bus/type, fare and seat count using the query result.
- Render seats sorted by number in a responsive, accessible grid. Make `AVAILABLE` seats selectable and `OCCUPIED` seats disabled. Use a distinct visual treatment for **selected** available seats, while keeping the server/domain status binary.
- Show a legend and a counter such as “2 of 3 seats selected”. Do not allow selecting more than the requested count. Deselecting a selected seat must always work.
- Keep **Continue** disabled until exactly N unique seats are selected, while a hold mutation is pending, or while auth/session state is still loading.
- Guest users may inspect and select seats. When a guest presses Continue, redirect to `/login?redirectTo=<encoded current seat-map URL>` **before** creating any hold. Reuse the existing login redirect validation; never build a new redirect handler or accept an external URL.
- After authentication, restore the same seat-map URL and selected seats, then let Continue call `hold.create`. Store `expiresAt` only after the mutation succeeds, then navigate to `/booking/passengers`.
- On `CONFLICT`, refetch `schedule.seats`, remove the affected IDs from local selection, keep the user on the map, and show which seat numbers became unavailable. Use `error.data.conflict` and the existing error convention; do not branch on HTTP status codes.
- Handle loading, unavailable schedule, query failure, expired/departed schedule, and no-selectable-seats states with clear recovery links.

### Step G — Countdown and hold expiry

Create a reusable client-side `HoldCountdown` component and use it on the Phase 5 passenger continuation page. Phase 6 should reuse it on `/booking/summary`; do not build the Phase 6 summary page here just to host the component.

- Calculate remaining time from the server-returned `expiresAt`, not from a fresh five-minute local timer.
- Display a clear `MM:SS` countdown and update it once per second. Clean up timers on unmount.
- At zero, call `hold.release` for the current user's selected seats, clear the hold and selected-seat state, invalidate/refetch `schedule.seats`, and route to the same seat map with its original search context. Guard against firing the expiry path multiple times.
- Server-side expiry remains authoritative. An inactive tab, closed browser, or client timer delay must never make an expired hold valid.
- Provide a back/change-seat action that releases this user's active hold before clearing the hold state. Do not automatically release a valid hold solely because a component unmounts during a route change.

If `/booking/passengers` must be added now to make the Phase 5 success path usable, keep it deliberately minimal: trip/selected-seat recap, countdown, and an explicit note that passenger details are the next phase. No passenger inputs or confirm action.

### Step H — Wire and test

- Register `holdRouter` in `src/server/api/root.ts`.
- Follow current import aliases and code style; run Prettier on changed files.
- Add tests for reducer invariants and input schemas. Add focused procedure/availability tests using the repository's existing test tooling; if necessary, minimally update the test script so the new tests actually run on Windows PowerShell as well as Unix shells.
- Keep tests deterministic: use fixed dates or an injectable clock/helper where practical. Never rely on sleeping five real minutes in automated tests.

## 5. Required verification

Run and report the result of each command; do not claim success for a command that was not run:

```powershell
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
```

Then manually verify:

1. Search a future Panay route with 2 passengers; Select seat opens the correct seat map.
2. Selecting fewer than 2 seats keeps Continue disabled; selecting exactly 2 enables it; selecting a third is impossible.
3. A guest can select seats, press Continue, sign in, and return to the same map with the selection intact.
4. The first browser holds the chosen seats and sees a five-minute countdown.
5. In a second browser/session, attempting to hold one of those seats fails, identifies the taken seat, refreshes availability, and does not create a partial hold for other selected seats.
6. When the hold expires, it is released, the user returns to the matching seat map, and the seat becomes available to another session.
7. One user cannot release another user's holds by calling `hold.release` with guessed IDs.
8. A direct attempt to hold a departed or cancelled schedule is rejected server-side.

## 6. Completion checklist

- [ ] `schedule.seats` returns accurate binary seat status and no hold-owner information.
- [ ] `hold.create` atomically acquires 1–6 unique valid seats for five minutes.
- [ ] `hold.release` only deletes the authenticated user's holds.
- [ ] The reducer/provider survives in-app route changes and reinitializes safely from URL parameters.
- [ ] The results link, seat selection, login gate, conflict recovery, and countdown are functional.
- [ ] No Phase 6 or 7 features were pulled into scope.
- [ ] All verification commands and manual checks are recorded honestly in the PR description.
- [ ] The implementation PR targets the team's agreed integration branch and includes screenshots or a short recording of the seat map and countdown.

## 7. Out-of-scope reminder

Payments, cancellation, no-show, check-in, waitlists, round trips, discounts, per-seat pricing, live tracking, SMS, social login, and an end-to-end test suite remain out of scope for this phase.
