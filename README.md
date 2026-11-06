<p align="center">
  <img src="public/Logo.png" width="120" alt="Journey For All logo" />
</p>

<h1 align="center">Journey For All</h1>

<p align="center">One-way intercity bus booking for Panay Island.</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-000?logo=nextdotjs&logoColor=white" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/tRPC-11-2596BE" alt="tRPC 11" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white" alt="Prisma 6" />
  <img src="https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

Passengers search a route, pick seats, and get a digital ticket. Admins manage cities, buses, routes, schedules, and bookings.

## Features

- Search trips by origin, destination, date, and passenger count across the seeded Panay routes.
- Pick seats on a live map with a five-minute hold and a database constraint that blocks double booking.
- Confirm per-seat passenger details and get a digital ticket with a QR code, image download, and one-time check-in.
- View and cancel bookings before departure from My Bookings. Each booking keeps the fare it was sold at.
- Admin console for cities, buses, routes, schedules, bookings, users, and feedback, with filters, paging, check-in from the bookings table, and user deactivation.

## Quick start

You need Node.js 20 or newer and a local PostgreSQL server on port 5432.

```bash
npm install
cp .env.example .env
```

On PowerShell, use `Copy-Item .env.example .env`. `.env` is gitignored, so every clone creates its own.

Open `.env` and set these:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `postgresql://postgres:YOUR_PASSWORD@localhost:5432/bus_ticketing` |
| `BETTER_AUTH_SECRET` | A random string of 32 or more characters |
| `ADMIN_1_EMAIL`, `ADMIN_1_PASSWORD` | Sign-in for the first seeded admin |

`YOUR_PASSWORD` is the password for your local `postgres` user. If your Postgres user is not `postgres`, change the user and password in the URL. Prisma creates the `bus_ticketing` database on the next step, so you do not need to create it yourself. If your Postgres user has no password yet:

```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'YOUR_PASSWORD';"
```

Then create the schema, load the demo data, and run:

```bash
npm run db:generate
npm run db:seed
npm run dev
```

`db:generate` runs `prisma migrate dev` and creates the database if it is missing.

The app runs at http://localhost:3000. Sign in at `/login` with the admin values from your `.env`. The seed adds 5 cities, 10 routes, 4 buses, two trips per route for the next three days, and three admins, so a search has results on a fresh database.

`BETTER_AUTH_SECRET` can stay empty for `npm run dev`, but `npm run build` fails without it.

## Try it

1. Register a passenger at `/register`.
2. Search any route for tomorrow, pick a trip, and select two seats.
3. Confirm and open the ticket. The QR code points at `/verify/<code>`.
4. Sign in as an admin and open `/admin/bookings` to see the booking.

Check-in only works on the travel day. The seed starts trips tomorrow, so to test it, create a schedule for today in `/admin/schedules` with a later departure, book it as a passenger, then check it in.

## How it works

Pages live in `src/app` using the App Router. The client calls tRPC routers in `src/server/api/routers`, and every input is validated with Zod. Prisma owns the schema and migrations in `prisma/`. Better Auth stores httpOnly cookie sessions, and the admin role is checked in `adminProcedure`, not only in the UI. A seat hold lasts five minutes, and confirm runs in a single transaction so two people cannot book the same seat.

The full design is in [docs/SPEC.md](docs/SPEC.md).

## Docs

- [docs/SPEC.md](docs/SPEC.md): data model, fares, holds, procedures, auth, locked decisions
- [docs/PRD.md](docs/PRD.md): product scope, requirements, success metrics
- [docs/TEAM-BRIEF.md](docs/TEAM-BRIEF.md): one-page project summary and working agreements
- [docs/IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md): build order and milestones
- [docs/passenger_flow.mermaid](docs/passenger_flow.mermaid): booking flow diagram
- [docs/ticket_sample.txt](docs/ticket_sample.txt): digital ticket layout reference
- [public/IMAGE-CREDITS.md](public/IMAGE-CREDITS.md): photo sources and licenses

## Team

  - Fletcher [@EMB-revenge](https://github.com/EMB-revenge), 
  - Joe [@JoeStevenBandong](https://github.com/JoeStevenBandong),
  - Amiel [@amiel-dotcom](https://github.com/amiel-dotcom)
