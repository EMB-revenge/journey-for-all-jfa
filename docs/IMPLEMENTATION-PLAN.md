# Implementation Plan — Journey For All (JFA) MVP

**Stack:** one T3 app at the repo root (Next.js 15 + tRPC + Prisma + Better Auth + Tailwind)
**Spec:** `docs/SPEC.md`
**Team brief:** `docs/TEAM-BRIEF.md`

Phases run in order. Anyone can pick a task inside a phase. Do not start phase N+1 until phase N's "Done when" is true.

---

## Phase 0 — Scaffold (done 2026-09-30)

`create-t3-app` with tRPC, Prisma, Tailwind, ESLint, Prettier, then Better Auth swapped in for NextAuth. Prisma client generates to `generated/prisma`. Better Auth config, session-aware tRPC context, and `protectedProcedure` already exist. Local Postgres script included.

Cleanup belongs to the first two phases: demo `Post` model and router, GitHub OAuth provider, unused `@auth/prisma-adapter`.

---

## Phase 1 — Schema and seed

**Goal:** every table and constraint exists, with three admins who can sign in.

1. Rewrite `prisma/schema.prisma`:
   - extend `User` with `role Role @default(PASSENGER)`, `isActive Boolean @default(true)`, `phone String?`
   - add `City`, `BusType`, `Bus`, `Seat`, `Route`, `Schedule`, `Booking`, `BookingSeat`, `SeatHold`, `BookingCounter`
   - enums `Role` and `BookingStatus`; money as `Decimal @db.Decimal(10, 2)`
   - every unique from spec §8.2, mapped to snake_case tables
   - delete the `Post` model
2. Add admin seed vars to `src/env.js` (`ADMIN_1_EMAIL`, `ADMIN_1_PASSWORD`, and the 2 and 3 sets) and to `.env.example`. The T3 env module validates at build time, so an undeclared variable breaks `npm run build`
3. Write `prisma/seed.ts`: bus types `ORDINARY` and `AIRCON`, a first batch of cities, then the three admins through `auth.api.signUpEmail` followed by `role = "ADMIN"`. Add `tsx` as a dev dependency and register `"prisma": { "seed": "tsx prisma/seed.ts" }` in `package.json`
4. `npm run db:generate` (a confusing name for `prisma migrate dev`) to create the first migration
5. `npm run db:seed`

**Done when:** `prisma studio` shows all tables with the uniques on `(schedule_id, seat_id)`, and all three admins can sign in at `/login` and have `role = ADMIN`.

---

## Phase 2 — Auth completion (done 2026-10-17)

**Goal:** the whole account story works, and `/admin` is closed to passengers.

1. Remove `socialProviders.github` from `src/server/better-auth/config.ts`, drop the two `BETTER_AUTH_*_GITHUB_*` vars from `src/env.js` and `.env.example`, and uninstall `@auth/prisma-adapter`
2. Set `emailAndPassword: { enabled: true, minPasswordLength: 8 }`
3. Build `/register`, `/login`, `/change-password` with Zod schemas from `src/lib/schemas.ts`, using `authClient`
4. `AuthProvider` in `src/app/layout.tsx` exposing the session via `authClient.useSession()`. Signed-out visitors get one neutral `Sign in`, since yellow is reserved for the booking path; signed-in visitors get an account menu with My bookings, Change password, and Sign out; admin links render only for `role = ADMIN`
5. Change password passes `revokeOtherSessions: true`, then signs out
6. `src/middleware.ts`: redirect to `/login` when `/admin/*` is hit without a session cookie
7. Delete `src/app/page.tsx`'s demo content and `_components/post.tsx`

**Done when:** a passenger can register, log in, change password, and be signed out everywhere else; hitting `/admin` as a passenger redirects; the admin nav appears for an admin.

---

## Phase 3 — tRPC foundation (done 2026-10-19)

**Goal:** procedures that know who is calling and what is valid input.

1. Add `adminProcedure` in `src/server/api/trpc.ts`: `protectedProcedure` plus a `role === "ADMIN"` check throwing `FORBIDDEN`
2. `city.list` and `busType.list` public procedures
3. `src/lib/schemas.ts` holds the Zod schemas shared by procedures and forms. The auth schemas landed with Phase 2; booking schemas join them as the flow is built
4. Error conventions: `ConflictPayload` in `src/lib/errors.ts` and the `conflict()` helper in `trpc.ts`, with the scaffold's error formatter copying the payload to `error.data.conflict` so the client can read it typed. `PRECONDITION_FAILED` covers departed or cancelled schedules, and `NOT_FOUND` stands in for another user's record
5. `admin.booking.list`, read-only and unfiltered, as the first `adminProcedure` consumer. The rest of the admin surface joins it in Phase 7

The demo cleanup this phase used to own (`post.ts`, the `Post` model, `_components/post.tsx`) landed with Phases 1 and 2.

**Done when:** `api.city.list.useQuery()` renders cities on a page, and calling an admin procedure with a passenger session returns `FORBIDDEN`.

---

## Phase 4 — Search and results (done 2026-10-19)

**Pages:** `/search`.

Finished: `/search`, `SearchForm`, `TripCard`, and `schedule.search` are complete. Input reconciled to SPEC 14 `{ originCityId, destCityId, date, passengers }`; departed and cancelled trips excluded; `availableSeats >= passengers` filter applied; expired holds pruned opportunistically; past dates rejected at the API (Asia/Manila).

1. Search form: origin and destination selects from `city.list`, date input with `min` set to today, passenger count 1–6, Zod validated
2. `schedule.search`: match route and date, exclude cancelled and departed trips, use the route's `baseFare`, count free seats as capacity minus booking seats minus active holds, keep only trips with `availableSeats >= passengers`
3. Opportunistic hold cleanup inside this procedure: delete expired `SeatHold` rows for the schedules it read
4. Results cards: bus name, type (Aircon or Ordinary / non-aircon), departure and arrival, fare, seats remaining, link to the seat map

**Done when** (2026-10-19): Iloilo City to Roxas City on a future date for 2 passengers lists only trips with at least 2 free seats and shows the resolved fare; yesterday's date is rejected.

---

## Phase 5 — Seat map and holds (done 2026-10-23) (done 2026-10-23)

**Page:** `/booking/seat-map`. **State:** `BookingFlowProvider` + `bookingFlowReducer`, mounted in the root layout so the selection survives a detour to `/login`.

1. `schedule.seats`: derive two-state `AVAILABLE` / `OCCUPIED` (booked or actively held both read as occupied), opportunistic expired-hold delete
2. Grid of numbered seats, two-state styling, `OCCUPIED` not clickable
3. Local selection of exactly N seats, N from search; Continue disabled until the count matches
4. Continue is the auth gate. A signed-out passenger goes to `/login?redirectTo=` with their seats still selected and comes back to the same map. Then Continue calls `hold.create` with all seat ids in one batch, stores `expiresAt` in the reducer, and routes to `/booking/passengers`
5. Countdown timer from `expiresAt`, visible on the passenger and summary pages; on zero, release and return to the seat map
6. `CONFLICT` with `takenSeats`: refetch the map, drop the taken seats from the selection, show which ones went

`TripCard`'s disabled "Select seat" button is now a link to `/booking/seat-map` that carries the schedule and the search context.

**Done when:** two browsers on the same seat, the second Continue fails and names the seat; the first browser's countdown runs; an expired hold frees the seat.

Landed: the seat map, atomic holds, and the booking state machine are in. The two-browser check was not run by hand; the unique constraint on the active hold is what blocks a second hold on the same seat.

---

## Phase 6 — Confirm, ticket, My Bookings

**Pages:** `/booking/passengers`, `/booking/summary`, `/booking/ticket/[id]`, `/my-bookings`.

1. One name per held seat, Zod validated. Contact name, email, and phone come from the account (collected at sign-up and editable on `/account`), so the form never asks for them again
2. Summary: trip, seat numbers, unit fare, total
3. `booking.confirm` in one `prisma.$transaction`: verify each seat has an unexpired hold owned by the caller, bump `BookingCounter` and build `BK-YYYYMMDD-NNNNNN`, snapshot `unitFare` and `totalAmount`, insert booking and booking seats, delete those holds. Catch `P2002` and return `CONFLICT` with `takenSeats`; catch a missing or expired hold and return `CONFLICT` with `reason: "HOLD_EXPIRED"`
4. Ticket page follows `docs/ticket_sample.txt`: reference, status, passenger, contact, route, date and times, bus, seat, fare, booked-on timestamp
5. `booking.list` and `booking.get`, own records only
6. Delete the demo home page content and point `/` at search

**Done when:** a 2-seat booking creates one booking plus two booking seats, the ticket shows the snapshot fare, an admin fare change leaves it alone, and My Bookings lists it.

Landed: passenger details, summary, the confirm transaction, the ticket, and My Bookings are in. The navbar's "My bookings" links are back. A `P2002` from the daily `BookingCounter` upsert retries once instead of reading as a seat conflict; the seat unique constraint stays the backstop. The two-browser confirm race was not run by hand. On 2026-10-26 the passenger form dropped to one name per seat: sign-up now requires a phone, `/account` edits name and phone, and the ticket reads contact details from the booking's account.

---

## Phase 7 — Admin

**Pages:** `/admin` redirects to `/admin/cities`; `/admin/cities`, `/admin/buses`, `/admin/routes`, `/admin/schedules`, `/admin/bookings` in a shared sidebar layout, no dashboard home.

1. `admin.city.*`, `admin.route.*`: full CRUD, duplicates return `CONFLICT`
2. `admin.bus.create` creates seats `1..capacity` in the same transaction as the bus
3. `admin.schedule.*`: create, edit, cancel with `isCancelled`, no fare field, no hard delete once bookings exist
4. Buses, routes, and cities deactivate with `isActive = false` instead of disappearing
5. `admin.booking.list`: read-only, filter by date and route, no edit, no delete

The navbar's "Admin" link was removed until `/admin` exists; restore it when this phase lands.

**Done when:** an admin adds a city, bus, route, and schedule, and a passenger can search and book that trip.

---

## Phase 7.2 - When done with MVP (Phase 1 - 8)

Polish each phase/feature and add aditional features where applicable.

### Ticket validation

Landed: every booking gets a random `verificationCode`, the ticket QR opens `/verify/[code]`, the page is public and read-only, and `booking.checkIn` (admin) sets `checkedInAt` once. In dev the QR uses the machine's LAN address so a phone can scan it. Rules live in `docs/SPEC.md` §10.1.

## Phase 8 — Polish and deploy

1. Empty states, Zod messages, and the conflict paths from spec §17
2. Demo trips already come from `prisma/seed.ts` (three days from tomorrow); keep the seed in the release step so the demo is never empty
3. Railway PostgreSQL, then Vercel pointed at the repo root with `DATABASE_URL`, `BETTER_AUTH_SECRET`, and the six admin seed vars
4. Release step runs `npm run db:migrate`, then `npm run db:seed`
5. Run the manual pass from spec §18 against the live URL

**Done when:** a teammate opens the Vercel URL, registers, and completes a booking on the live database.

---

## Suggested split

| Person | First pass |
| --- | --- |
| A | Phase 1 (schema + seed) |
| B | Phase 2 (auth) then Phase 4 (search) |
| C | Phase 3 (tRPC foundation) then Phase 5 (seats and holds) |
| Anyone | Phase 6, Phase 7, Phase 8 |

Swap freely. Merge into `dev` often.

---

## Out of this plan(possible features, but not MVP, can be done after if the team wants)

Payments, cancellation, no-show, check-in, waitlists, round trips, discounts, per-seat pricing, live tracking, SMS, social login, and an end-to-end test suite.
