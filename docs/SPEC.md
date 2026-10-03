# Journey For All (JFA) — Intercity Bus Booking / Ticketing System

## Design Spec

**Date:** 2026-10-03
**Team:** Fletcher, Joe, Amiel
**Status:** Approved for implementation
**Stack:** one T3 app — Next.js 15 (App Router) + tRPC + Prisma + Better Auth + Tailwind, on PostgreSQL
**Build order:** `docs/IMPLEMENTATION-PLAN.md`

This document is the source of truth for the MVP. It replaces `initial-plan.md` (Vite + Express), the Supabase design spec, and the React + Supabase PRD, all of which are deleted. Where anything disagrees with this file, this file wins.

---

## 1. Purpose

A web app for booking one-way intercity bus trips: search, pick seats, enter passenger details, get a digital ticket. Admins manage cities, buses, routes, schedules, and view bookings.

---

## 2. Goals and non-goals

### MVP goals

- Passenger register/login, search, seat selection, multi-seat booking (1–6), digital ticket, booking history
- Admin CRUD for cities, buses, routes, schedules; view all bookings
- Accurate seat availability (no double-booking)
- Unique sequential booking references
- Hybrid fares with a snapshot on each booking

### Explicitly out of MVP

- Real payment gateway (bookings auto-confirm)
- Passenger or admin cancellation UI
- Check-in, no-show, waitlist, overbooking, GPS, SMS
- Round-trip bookings
- Student/senior/PWD discounts
- Per-seat VIP pricing
- Live bus tracking
- Social login (GitHub OAuth came with the scaffold and gets removed)

### Future, schema-friendly, not built

- Simulated payment status (`PENDING_PAYMENT` → `CONFIRMED`)
- Cancellation / no-show / check-in / waitlist, as new `BookingStatus` values. Bookings are never deleted; cancelling releases seats
- Per-seat fare snapshot on `booking_seats` for discounts
- Round-trip, as a second schedule on a booking

---

## 3. Users

| Role | How created | What they do |
| --- | --- | --- |
| Passenger | Self sign-up, `role` defaults to `PASSENGER` | Search, book, view own tickets, change password |
| Admin | Seeded from env (Fletcher, Joe, Amiel), `role = ADMIN` | Same as passenger plus the admin dashboard |

One app. `user.role` gates admin pages (`src/middleware.ts`) and admin procedures (`adminProcedure`).

---

## 4. Stack decisions

### 4.1 Choices and reasoning

| Concern | Choice | Reasoning |
| --- | --- | --- |
| Deployables | One Next.js app at the repo root | The old `frontend/` + `backend/` split existed because Vite and Express were separate runtimes. Next runs both halves in one process, so the split would only add CORS, two deploys, two env files, and duplicated types |
| API | tRPC | No external consumer needs a public REST contract, which is the main reason to maintain one. Procedures give end-to-end types, so a seat conflict payload like `takenSeats` is typed on both sides |
| Validation | Zod, as tRPC input schemas | Validation stays exactly where it was, server-side and typed. The same schemas get imported by client forms |
| ORM | Prisma | `$transaction` for booking confirm with a unique-violation catch, `migrate` + `seed` for repeatable setup, first-class adapter in Better Auth, and the team already knows it |
| Auth | Better Auth | Email/password is a first-class feature with Argon2id hashing and database sessions. Its NextAuth competitor is in maintenance mode and its credentials provider is the weakest path (JWT-only sessions, manual type augmentation) |
| Session | httpOnly cookie, database-backed | Removes the XSS exposure of the earlier JWT-in-localStorage plan and allows instant revocation on password change |
| Styling | Tailwind CSS v4 | Ships configured with the scaffold. Lesson coverage on styling is not graded |
| Database | PostgreSQL | Prisma migrations and constraints do the work. Local dev in Docker, production on Railway |

### 4.2 How the class lessons land in this stack

| Lesson | Where it applies now |
| --- | --- |
| Components, props, state | React components; interactive pages are `"use client"` |
| Context, Provider | `AuthProvider` (session), `BookingFlowProvider` (booking steps) |
| Reducers | `src/reducers/bookingFlowReducer.ts` holds selected schedule, passenger count, selected seats, hold expiry, passenger forms |
| Services | The tRPC client hooks (`api.schedule.search.useQuery(...)`) replace hand-written fetch wrappers. Same boundary: UI never touches Prisma |
| CRUD | Admin routers are Prisma CRUD, one router per table |
| Authentication | Better Auth: sign-up, sign-in, sign-out, change password, seeded admins |
| Authorization | `protectedProcedure` and `adminProcedure` replace JWT middleware and role checks. Same idea, enforced at the procedure boundary instead of per route |
| Zod | tRPC input schemas, imported by client forms |
| JWT | No hand-rolled tokens. Sessions are opaque cookies backed by the `session` table. The token/session semantics still apply, the library owns them |
| Bcrypt | Better Auth hashes with Argon2id. The rule (never store or log plaintext, hash on write, compare on read) is unchanged |
| PostgreSQL | Prisma schema plus the same unique constraints and transactions |
| create-t3-app | The scaffold |
| Next.js routing | New lesson. App Router, layouts, server vs client components, route handlers for the two API entry points |

---

## 5. Architecture

| Piece | Choice |
| --- | --- |
| Framework | Next.js 15 App Router, TypeScript |
| API | tRPC v11 over `src/app/api/trpc/[trpc]/route.ts` |
| Auth endpoints | Better Auth over `src/app/api/auth/[...all]/route.ts` |
| Server logic | `src/server/api/routers/*` (procedures), `src/server/better-auth/*` (auth), `src/server/db.ts` (Prisma client) |
| Database | PostgreSQL, accessed only through Prisma |
| Styling | Tailwind CSS v4, `src/styles/globals.css` |
| Deploy | Vercel (whole repo) + Railway PostgreSQL |

**Request path:** client component → tRPC React hook → HTTP to `/api/trpc` → procedure (Zod input, auth middleware) → Prisma → PostgreSQL. Auth calls go to `/api/auth/*` instead.

**Layering rule:** UI calls procedures. Only procedures call Prisma. Nothing in `src/app` or `src/components` imports the Prisma client.

---

## 6. Repo layout

```
bus_ticketing/
  prisma/
    schema.prisma          # domain tables + Better Auth tables
    migrations/            # generated by prisma migrate
    seed.ts                # bus types, cities, 3 admins
  generated/prisma/        # Prisma client output, gitignored
  src/
    app/
      layout.tsx
      page.tsx                    # search, the passenger home page
      (auth)/login/page.tsx
      (auth)/register/page.tsx
      (auth)/change-password/page.tsx
      booking/seat-map/page.tsx
      booking/passengers/page.tsx
      booking/summary/page.tsx
      booking/ticket/[id]/page.tsx
      my-bookings/page.tsx
      admin/layout.tsx
      admin/page.tsx
      admin/cities/page.tsx
      admin/buses/page.tsx
      admin/routes/page.tsx
      admin/schedules/page.tsx
      admin/bookings/page.tsx
      api/auth/[...all]/route.ts  # Better Auth handler
      api/trpc/[trpc]/route.ts    # tRPC handler
    components/            # shared UI, including the seat grid
    context/               # AuthProvider, BookingFlowProvider
    reducers/              # bookingFlowReducer
    lib/                   # Zod schemas, fare and availability helpers
    server/
      db.ts
      better-auth/         # config.ts, server.ts, client.ts, index.ts
      api/
        trpc.ts            # context, publicProcedure, protectedProcedure, adminProcedure
        root.ts
        routers/           # city, busType, schedule, hold, booking, admin
    trpc/                  # tRPC React client (from the scaffold)
    styles/globals.css
    middleware.ts          # route guard for /admin
  docs/
  .env                     # gitignored
  .env.example
  start-database.sh        # local Postgres in Docker or Podman
```

---

## 7. Current state of the repo

Scaffolded 2026-09-30 with `create-t3-app` 7.40.0: tRPC v11, Prisma 6 with client output in `generated/prisma`, Tailwind v4, ESLint, Prettier, and Better Auth 1.3 wired with the Prisma adapter and email/password enabled. The tRPC context already resolves the session, and `protectedProcedure` already exists.

Delete before building features:

- `Post` model in `prisma/schema.prisma` and its relation on `User`
- `src/server/api/routers/post.ts` and its entry in `src/server/api/root.ts`
- `src/app/_components/post.tsx`
- `socialProviders.github` from `src/server/better-auth/config.ts`
- `BETTER_AUTH_GITHUB_CLIENT_ID` and `BETTER_AUTH_GITHUB_CLIENT_SECRET` from `src/env.js` and `.env.example`
- `@auth/prisma-adapter` from `package.json`, unused since Better Auth replaced NextAuth

Not yet done: no migration has run (`prisma/migrations/` does not exist), and no seed script exists.

---

## 8. Data model

Prisma models use camelCase fields and map to snake_case tables, so the SQL stays readable.

### 8.1 Auth tables (Better Auth owns the shape)

| Model | Table | Fields |
| --- | --- | --- |
| User | `user` | `id`, `name`, `email` unique, `emailVerified`, `image?`, `role`, `isActive` (default true), `phone?`, timestamps |
| Session | `session` | `id`, `token` unique, `userId`, `expiresAt`, `ipAddress?`, `userAgent?`, timestamps |
| Account | `account` | `id`, `accountId`, `providerId`, `userId`, `password?`, token fields, timestamps. The password hash lives here, never on `user` |
| Verification | `verification` | `id`, `identifier`, `value`, `expiresAt`, timestamps |

Sign-up inserts `role = PASSENGER` by default. Better Auth generates these four models with its CLI; the extra three fields on `User` are ours.

### 8.2 Domain tables

| Model | Table | Fields | Constraints |
| --- | --- | --- | --- |
| City | `cities` | `id`, `name` | `name` unique |
| BusType | `bus_types` | `id`, `name` | seeded `ORDINARY`, `AIRCON` |
| Bus | `buses` | `id`, `name`, `plateNumber`, `capacity`, `busTypeId`, `isActive` | `plateNumber` unique, `capacity > 0` |
| Seat | `seats` | `id`, `busId`, `seatNumber` | unique `(busId, seatNumber)`, `seatNumber` 1..N |
| Route | `routes` | `id`, `originCityId`, `destCityId`, `durationMinutes`, `baseFare`, `isActive` | unique `(originCityId, destCityId)` |
| Schedule | `schedules` | `id`, `busId`, `routeId`, `travelDate`, `departureTime`, `arrivalTime`, `fareOverride?`, `isCancelled` | unique `(busId, travelDate, departureTime)` |
| Booking | `bookings` | `id`, `userId`, `scheduleId`, `bookingReference`, `unitFare`, `totalAmount`, `status`, timestamps | `bookingReference` unique |
| BookingSeat | `booking_seats` | `id`, `bookingId`, `scheduleId`, `seatId`, `passengerName`, `passengerEmail`, `passengerPhone` | unique `(scheduleId, seatId)` |
| SeatHold | `seat_holds` | `id`, `scheduleId`, `seatId`, `userId`, `expiresAt` | unique `(scheduleId, seatId)` |
| BookingCounter | `booking_counters` | `date` (PK), `lastNumber` | one row per day |

Money is `Decimal(10,2)`. `Seat` has no status column: occupancy belongs to a schedule, not to a bus.

Bookings are never deleted. Schedules with bookings are cancelled with `isCancelled`, never removed.

### 8.3 Enums

`Role` = `PASSENGER` | `ADMIN`
`BookingStatus` = `CONFIRMED`, with `PENDING_PAYMENT`, `CANCELLED`, `NO_SHOW` reserved for later

### 8.4 Availability

A seat on a schedule is **available** if:

- no `BookingSeat` for that `(scheduleId, seatId)`, and
- no `SeatHold` with `expiresAt > now()` for that pair

Seat status is derived at query time, never stored: `OCCUPIED` (booked), `RESERVED` (active hold), `AVAILABLE`. Holds carry a `reservedByMe` flag when the caller is signed in.

### 8.5 Seat creation

When an admin creates a bus, the bus procedure creates seats `1..capacity` inside the same Prisma transaction. No database trigger, so the frontend cannot forget and the write stays atomic. Capacity edits stay out of scope.

### 8.6 What prevents double-booking

- `UNIQUE(schedule_id, seat_id)` on `booking_seats`
- `UNIQUE(schedule_id, seat_id)` on `seat_holds`
- `booking.confirm` runs in one transaction: insert booking plus booking seats, delete that user's holds. A unique violation becomes a `CONFLICT` error carrying `takenSeats`

First to confirm still wins after a hold expires, because the constraint does not care who held what.

---

## 9. Fare model (hybrid)

1. Route has `baseFare`, the default.
2. Schedule has optional `fareOverride`. `null` means use `baseFare`.
3. Resolved fare at search, hold, and book: `fareOverride ?? baseFare`.
4. On confirm, snapshot `unitFare` = resolved fare and `totalAmount` = `unitFare * seatCount`.
5. Later admin fare edits never change existing bookings.

Hybrid over route-only because promos and peak pricing need a per-trip override. Hybrid over schedule-only because re-entering the fare on 50 schedules is error-prone.

---

## 10. Booking reference

Format `BK-YYYYMMDD-NNNNNN`, generated in the backend during the confirm transaction.

`BookingCounter` holds one row per day. Inside the transaction, `upsert` with `lastNumber: { increment: 1 }` and read the result. The unique constraint on `bookings.bookingReference` is the backstop: on a collision, retry the increment. This works without a long-running process, which matters because the app runs on serverless.

---

## 11. Passenger flow

```
Login → Search (origin, dest, date >= today, passengers 1-6)
     → Results (enough free seats, resolved fare, bus type)
     → Seat map (pick exactly N locally)
     → Continue → hold.create (batch, 5 min) → countdown
     → Passenger form per seat → summary
     → Confirm → booking.confirm transaction → digital ticket → My Bookings
```

See `docs/passenger_flow.mermaid` for the diagram, including the expiry and conflict paths.

- One-way only, auto-confirmed, no payment step
- Search hides past dates, departed trips, and cancelled schedules
- Holds start on Continue, not on each seat click. Unclicking before Continue is local only
- Hold expiry or a confirm conflict sends the passenger back to the seat map with a refetch. Never a silent partial booking

---

## 12. Seat holds and expiry

- 5-minute TTL, created in one batch on Continue
- Expiry is enforced by comparison (`expiresAt > now()`), not by deletion, so correctness never depends on a cleanup job
- Opportunistic cleanup: `schedule.seats` and `schedule.search` each run `deleteMany` for `expiresAt < now()` on the schedules they touch. Serverless has no `setInterval`, and this keeps the table small without a cron job
- `booking.confirm` rejects expired holds with `CONFLICT` and `reason: "HOLD_EXPIRED"`
- If the table ever needs sweeping, add a Vercel cron route later

---

## 13. Auth

Better Auth with email and password. No social login.

| Action | Call |
| --- | --- |
| Register | `authClient.signUp.email({ name, email, password })` |
| Log in | `authClient.signIn.email({ email, password })` |
| Log out | `authClient.signOut()` |
| Change password | `authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true })` |
| Read session (server) | `getSession()` from `src/server/better-auth/server.ts`, or `ctx.session` inside a procedure |
| Read session (client) | `authClient.useSession()` |

Configuration notes:

- `emailAndPassword: { enabled: true, minPasswordLength: 8 }`
- `nextCookies()` goes last in the plugin list if any auth call runs from a server action
- Session is an httpOnly cookie. Nothing auth-related goes in localStorage
- Password hashes live in `account` and never leave the server

Authorization, two layers:

- `src/middleware.ts` checks the session cookie on `/admin/*` and redirects to `/login`. Cheap first line, UX only
- `adminProcedure` re-checks `session.user.role === "ADMIN"` and throws `FORBIDDEN`. This is the real gate, because middleware alone guards nothing

Seeding admins: `prisma/seed.ts` calls `auth.api.signUpEmail` for each of the three admin emails from env, then sets `role = "ADMIN"`. Going through the auth API means the password hash is created correctly. Admin passwords come from env and are never committed.

---

## 14. tRPC surface

Auth lives in Better Auth's own routes. Everything below is a procedure. All inputs are Zod schemas, shared with client forms from `src/lib/schemas.ts`.

| Procedure | Auth | Input | Output | Errors |
| --- | --- | --- | --- | --- |
| `city.list` | public | none | cities | |
| `busType.list` | public | none | bus types | |
| `schedule.search` | public | `{ originCityId, destCityId, date, passengers }` | schedules with `resolvedFare` and `availableSeats`, filtered to `availableSeats >= passengers` | `INPUT_PARSE_ERROR` |
| `schedule.seats` | public | `{ scheduleId }` | seats with `status` and `reservedByMe`, plus `holdExpiresAt` when the caller holds them | `NOT_FOUND` |
| `hold.create` | protected | `{ scheduleId, seatIds: 1..6 }` | `{ expiresAt }` | `CONFLICT` + `takenSeats` |
| `hold.release` | protected | `{ scheduleId, seatIds? }` | `{ released }` | |
| `booking.confirm` | protected | `{ scheduleId, passengers: [{ seatId, name, email, phone }] }` | booking, seats, ticket payload | `CONFLICT` + `takenSeats` or `reason: "HOLD_EXPIRED"`, `PRECONDITION_FAILED` for a departed or cancelled schedule |
| `booking.list` | protected | none | own bookings, newest first | |
| `booking.get` | protected | `{ id }` | own booking with seats | `NOT_FOUND` |
| `admin.city.*` | admin | CRUD | | `CONFLICT` on duplicate name |
| `admin.bus.*` | admin | CRUD, creates seats on create | | `CONFLICT` on duplicate plate |
| `admin.route.*` | admin | CRUD | | `CONFLICT` on duplicate origin/dest |
| `admin.schedule.*` | admin | CRUD, `fareOverride` nullable | | `CONFLICT` on duplicate bus/date/time |
| `admin.booking.list` | admin | optional date and route filters | all bookings | |

Bookings are read-only for admins. Cancelling a schedule sets `isCancelled`.

---

## 15. Admin flow

Login → dashboard → manage cities, buses, routes, schedules → view all bookings.

Creating a bus creates its seats in the same transaction. Deleting is limited to records with no dependencies; anything referenced by a schedule or booking gets `isActive = false` or `isCancelled = true` instead.

---

## 16. Pages and state

**Passenger:** `/` search, `/login`, `/register`, `/change-password`, `/booking/seat-map`, `/booking/passengers`, `/booking/summary`, `/booking/ticket/[id]`, `/my-bookings`

**Admin:** `/admin` dashboard, `/admin/cities`, `/admin/buses`, `/admin/routes`, `/admin/schedules`, `/admin/bookings`

- `src/app/layout.tsx` holds the shared shell and `AuthProvider`. Admin links render only when `session.user.role === "ADMIN"`
- Pages that read the session or run mutations are client components. Search and results can be server components that call procedures through the server caller
- Booking flow state lives in `BookingFlowProvider` + `bookingFlowReducer`: selected schedule, passenger count, selected seats, hold expiry, per-seat passenger forms. It survives the route changes between seat map, passengers, and summary
- The hold countdown is a client timer seeded from `expiresAt`
- Styling is Tailwind, functional. The seat map is a numbered grid, color-coded by `status`

---

## 17. Error handling

| Case | tRPC code | Client behavior |
| --- | --- | --- |
| Invalid input | `INPUT_PARSE_ERROR` (Zod, flattened by the scaffold's error formatter) | show field messages |
| Not signed in | `UNAUTHORIZED` | redirect to `/login` |
| Passenger hits an admin procedure | `FORBIDDEN` | redirect home, hide admin nav |
| Duplicate email, plate, city, route, schedule | `CONFLICT` | form-level error |
| Seat taken at hold or confirm | `CONFLICT` + `takenSeats` | back to seat map, refetch, highlight taken seats |
| Hold expired | `CONFLICT` + `reason: "HOLD_EXPIRED"` | back to seat map, refetch |
| Schedule departed or cancelled | `PRECONDITION_FAILED` | back to search |
| Wrong user asking for a booking | `NOT_FOUND` | back to `/my-bookings` |

tRPC returns HTTP 200 with a typed error body, so the UI branches on `error.data.code`, never on status codes.

---

## 18. Testing

Manual, in this order:

1. Register → verify email → log in → log out → change password
2. Search a route with 2 passengers → results show resolved fare and enough free seats
3. Hold 2 seats → countdown runs → confirm → ticket shows the snapshot fare
4. Two browsers, same seat: the second Continue fails with `takenSeats`
5. Let a hold expire → the seat becomes bookable again
6. Admin creates a city, bus, route, schedule → a passenger can search and book that trip
7. Passenger cannot reach `/admin` by URL, and admin procedures reject a passenger session

Worth unit testing when time allows: fare resolution, availability count, and departure filtering. No E2E suite for the MVP.

---

## 19. Deployment and environment

| Piece | Choice |
| --- | --- |
| App | Vercel, root directory is the repo root, framework preset Next.js |
| Database | Railway PostgreSQL |
| Migrations | `npm run db:migrate` (`prisma migrate deploy`) as a release step, then `npm run db:seed` |
| CORS | None to configure. UI and API share an origin |

Environment variables:

| Variable | Where | Notes |
| --- | --- | --- |
| `DATABASE_URL` | local + Vercel | local points at the Docker container, production at Railway |
| `BETTER_AUTH_SECRET` | local + Vercel | generate with `openssl rand -base64 32` |
| `ADMIN_1_EMAIL`, `ADMIN_1_PASSWORD` | local + Vercel | seed only, one set per admin |
| `ADMIN_2_EMAIL`, `ADMIN_2_PASSWORD` | | |
| `ADMIN_3_EMAIL`, `ADMIN_3_PASSWORD` | | |

Local setup:

```bash
cp .env.example .env      # then fill in BETTER_AUTH_SECRET
./start-database.sh       # Docker or Podman, Windows needs WSL
npm run db:generate       # prisma migrate dev, creates the first migration
npm run db:seed           # bus types, cities, 3 admins
npm run dev
```

Branches: `main` is production, `dev` is integration, features branch off `dev`.

---

## 20. Locked decisions

1. Double-booking prevented by unique `(scheduleId, seatId)` plus a Prisma transaction
2. 5-minute seat hold with a UI countdown, created in one batch on Continue
3. Sessions are httpOnly cookies from Better Auth. The old JWT-in-localStorage decision is dead, and the XSS caveat went with it
4. Change password for every signed-in user, revoking other sessions
5. Search and book today and future only, no departed trips
6. Availability mismatch returns a conflict; the seat map refreshes. Never a silent partial booking
7. Fare snapshot on the booking (`unitFare` + `totalAmount`)
8. Multi-seat with details per seat, maximum 6
9. One-way only
10. No cancellation in the MVP
11. Auto-confirm, no payment step
12. Bus types are Ordinary and Aircon
13. Cities are their own table
14. Sequential seat numbers, booking reference `BK-YYYYMMDD-NNNNNN`
15. One deployable, not a monorepo with a separate API service
16. tRPC over REST for the internal API
17. Better Auth over NextAuth
18. Tailwind over styled-components
19. Prisma over Drizzle

---

## 21. Success criteria

- A passenger goes from search to ticket without errors
- The same seat cannot be booked twice on one schedule
- Booking references are unique
- Admins manage fleet, routes, and schedules without orphan data
- Register and log in work for valid input
- A hold expires and the seat becomes bookable again

---

## 22. What changed from the 2026-09-10 plan

| Was | Now | Why |
| --- | --- | --- |
| `frontend/` (Vite + React) + `backend/` (Express) on Railway and Vercel | one Next.js app on Vercel | fewer moving parts, no CORS, shared types |
| REST endpoints in Express | tRPC procedures | end-to-end types on conflict payloads |
| Hand-rolled JWT in localStorage, Bcrypt | Better Auth sessions, Argon2id | removes the XSS caveat, adds revocation |
| `setInterval` hold cleanup | opportunistic delete on read | serverless has no interval |
| styled-components | Tailwind | ships with the scaffold, styling is not graded |
| Supabase Auth, RLS, and RPC (earlier draft) | Better Auth plus tRPC middleware plus Prisma transactions | one place for every write, one language |
