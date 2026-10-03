# Journey For All (JFA) — Team Brief

**Product:** Journey For All, JFA for short (Joe, Fletcher, Amiel)
**For:** Fletcher, Joe, Amiel
**Read this first.** Full detail: `docs/SPEC.md`. Build order: `docs/IMPLEMENTATION-PLAN.md`.

---

## What we are building

A one-way intercity bus booking site.

Passenger: register → search (from, to, date, 1–6 people) → pick a trip → pick seats → 5-minute hold with countdown → one name, email, and phone per seat → confirm → digital ticket → My Bookings.

Admin: manage cities, buses, routes, schedules; read all bookings.

**Not in MVP:** payments, cancellation, no-show, round trips, discounts, GPS, SMS, social login.

---

## Stack

| Layer | Tool |
| --- | --- |
| App | Next.js 15 App Router + TypeScript, one deployable at the repo root |
| API | tRPC v11, Zod schemas on every input |
| Data | PostgreSQL through Prisma 6 |
| Auth | Better Auth, email and password, httpOnly cookie sessions |
| Styling | Tailwind CSS v4 |
| Local DB | Postgres in Docker via `start-database.sh` |
| Hosting | Vercel for the app, Railway for the database |

Scaffolded with `create-t3-app` on 2026-09-30. No second service, no CORS setup, no separate API to deploy.

---

## Rules that matter (do not "simplify" these away)

1. **A seat is free** only if nobody booked it and nobody holds it unexpired on that trip
2. **Never double-book.** Unique constraint on `(scheduleId, seatId)`, and confirm runs in one Prisma transaction. Two people confirming at the same instant still produce one booking
3. **Hold on Continue**, not on each seat click. Five minutes, countdown in the UI, expiry enforced by comparing `expiresAt` to now
4. **Fare:** route has a base, schedule can override, and the **booking stores a snapshot** (`unitFare` + `totalAmount`). Old tickets never change price
5. **Search:** today and future only, hide departed and cancelled trips, only show trips with enough free seats
6. **Admins** are the three of us, seeded from env. Passengers self-register. The role lives on `user` and is checked in `adminProcedure`, not just in the UI
7. **Never delete a booking.** Use statuses and soft flags. `BETTER_AUTH_SECRET` and the database URL stay server-side

---

## How the pieces split (anyone can take any slice)

| Chunk | What it is |
| --- | --- |
| Schema | Ten domain tables plus the four auth tables, uniques, `BookingCounter`, first migration |
| Seed | Bus types, cities, three admins created through the auth API |
| Auth | Sign-in and register pages, change password, admin route guard, role on the session |
| tRPC foundation | Delete the demo router, add `adminProcedure`, shared Zod schemas in `src/lib` |
| Search + results | City dropdowns, date and passenger inputs, schedule cards |
| Seat map + holds | Numbered grid, Continue creates the hold, countdown, expiry handling |
| Checkout + ticket | Per-seat forms, summary, confirm transaction, ticket, My Bookings |
| Admin screens | Cities, buses with auto-created seats, routes, schedules, bookings list |

Suggested order: **schema → auth → tRPC foundation → search → seats and holds → confirm and ticket → admin → deploy**.

---

## How to build on this later (without a rewrite)

Leave columns and enum values unused rather than inventing a second system:

| Later | Hook already in the design |
| --- | --- |
| Payments | `BookingStatus.PENDING_PAYMENT` before confirm |
| Cancel, no-show, check-in | new `BookingStatus` values, release seats, never delete the row |
| Discounts | fare amount on `booking_seats` |
| Round trip | second schedule on a booking |

---

## Working agreements

- Branch off `dev`, merge into `dev`, `main` only when a phase is done
- One person per chunk at a time, swap freely
- Schema changes go through a migration, never `db push`, so all three databases match
- Nobody edits `docs/SPEC.md` decisions without saying so in the group chat

---

## Docs map

| File | Use |
| --- | --- |
| `docs/SPEC.md` | Source of truth: data model, fares, holds, procedures, auth, deploy, locked decisions |
| `docs/PRD.md` | What the product is and why, scope, success metrics |
| `docs/IMPLEMENTATION-PLAN.md` | Phases in order, each with a "done when" line |
| `docs/passenger_flow.mermaid` | Booking flow diagram, including expiry and conflict paths |
| `docs/ticket_sample.txt` | Layout reference for the digital ticket page |

Earlier drafts (Vite + Express, Vite + Supabase, React + Supabase) are deleted. If you find a copy in chat history, the spec wins.
