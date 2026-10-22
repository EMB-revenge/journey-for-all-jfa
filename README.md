# Journey For All (JFA)

One-way intercity bus booking and ticketing. Passengers search a route, pick seats, and get a digital ticket. Admins manage cities, buses, routes, schedules, and read every booking.

Class project for the web development module: React with Next.js App Router, tRPC, Prisma, PostgreSQL, Better Auth, Zod.

## Stack

| Layer | Tool |
| --- | --- |
| App | Next.js 15 (App Router), React 19, TypeScript |
| API | tRPC v11 with Zod inputs |
| Data | PostgreSQL through Prisma 6 |
| Auth | Better Auth, email and password, httpOnly cookie sessions |
| Styling | Tailwind CSS v4 |
| Hosting | Vercel (app), Railway (database) |

## Prerequisites

- Node.js 20 or newer
- PostgreSQL 15 or newer, installed locally and running on port 5432
- A Railway PostgreSQL connection string for production, optional for local work

## Local setup

Everyone runs their own local database, so each clone needs its own `.env`.

```powershell
npm install
Copy-Item .env.example .env
```

Three values in `.env` are per developer:

| Variable | Set it to |
| --- | --- |
| `DATABASE_URL` | your local Postgres password instead of `password` |
| `BETTER_AUTH_SECRET` | any random string, generate with `openssl rand -base64 32` |
| `ADMIN_1_EMAIL`, `ADMIN_1_PASSWORD` | your own email, and a password of 8 characters or more |

Use your own email in `ADMIN_1_EMAIL` so you sign in as yourself. The rest of `DATABASE_URL` is the same on every machine: user `postgres`, port `5432`, database `bus_ticketing`.

Then create the schema, load the reference data, and run:

```powershell
npm run db:generate        # prisma migrate dev, creates the database, then its migrations
npm run db:seed            # bus types, cities, three admins
npm run dev
```

`db:generate` creates the `bus_ticketing` database when it is missing, so there is no separate `CREATE DATABASE` step. `.env` is gitignored, which is why it does not come down with `git clone`. Local data differs from machine to machine; `prisma/migrations/` is what keeps every schema identical.

App runs at http://localhost:3000. Seeded admins can sign in at `/login`.

Note: `npm run db:generate` runs `prisma migrate dev` despite the name. `npm run db:migrate` runs `prisma migrate deploy`, which is what production uses.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run db:generate` | Create and apply a migration (development) |
| `npm run db:migrate` | Apply migrations (production) |
| `npm run db:seed` | Seed bus types, cities, admins |
| `npm run db:studio` | Prisma Studio |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format:write` | Prettier |

## Project layout

```
prisma/           schema, migrations, seed
src/app/          routes: passenger pages, admin pages, two API handlers
src/app/_components/  shared UI (search form, trip cards, navbar, navbar auth)
src/context/      AuthContext (client session)
src/lib/          Zod schemas, date helpers, error payloads
src/server/       Prisma client, Better Auth, tRPC context and routers
src/middleware.ts admin route guard
docs/             spec, PRD, brief, implementation plan
```

Not built yet (Phases 5–7 of the implementation plan): the seat map, holds, booking confirm and ticket, `/my-bookings`, admin CRUD screens, `BookingFlowProvider`, and `src/reducers/`. Components and pages linked from earlier phases stay hidden until then.

## Docs

| File | What it covers |
| --- | --- |
| [docs/SPEC.md](docs/SPEC.md) | Source of truth: data model, fares, holds, procedures, auth, deployment, locked decisions |
| [docs/PRD.md](docs/PRD.md) | Product scope, requirements, success metrics |
| [docs/TEAM-BRIEF.md](docs/TEAM-BRIEF.md) | One-page shared picture and working agreements |
| [docs/IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md) | Build phases in order |
| [docs/passenger_flow.mermaid](docs/passenger_flow.mermaid) | Booking flow diagram |
| [docs/ticket_sample.txt](docs/ticket_sample.txt) | Digital ticket layout reference |

## Deployment

1. Create a PostgreSQL database on Railway. Railway shows two URLs: `DATABASE_URL` on the internal network, and `DATABASE_PUBLIC_URL` through its proxy. Vercel runs outside Railway, so copy the public one
2. Run the release step from a laptop with the production values in the shell, against the still-empty database:

```powershell
$env:DATABASE_URL="postgresql://postgres:<password>@<host>.proxy.rlwy.net:<port>/railway"
$env:ADMIN_1_EMAIL="<admin 1 email>"
$env:ADMIN_1_PASSWORD="<admin 1 real password>"
$env:ADMIN_2_EMAIL="<admin 2 email>"
$env:ADMIN_2_PASSWORD="<admin 2 real password>"
$env:ADMIN_3_EMAIL="<admin 3 email>"
$env:ADMIN_3_PASSWORD="<admin 3 real password>"
npm run db:migrate
npm run db:seed
```

   Use real admin passwords here. Bus types and cities upsert on a re-run, but an admin that already exists keeps its password, so whichever password reaches production first is permanent. To change it later, sign in as that admin and use `/change-password`. To pick up a new password from `.env` locally, run `npx prisma migrate reset`, which drops the local database and re-seeds it.

3. Import the repo into Vercel only after the seed, and keep the app unreachable until then: any passenger who registers with an admin's email before the seed runs would be promoted to admin by the `seedAdmins` step. Set these variables before the first deploy. `src/env.js` validates them during `next build`, and a missing `BETTER_AUTH_SECRET` fails the build

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | the Railway public URL |
| `BETTER_AUTH_SECRET` | generate a separate secret for production |
| `BETTER_AUTH_URL` | optional, the deployed origin such as `https://your-app.vercel.app` |
| `ADMIN_1_EMAIL`, `ADMIN_1_PASSWORD` and the other two sets | real admin accounts, read by the seed step |

Shell variables take precedence over `.env`, so your local `.env` stays untouched. Never run `npm run db:generate` against production: it runs `prisma migrate dev`, which can decide the database has drifted and offer to reset it, dropping data. `npm run db:migrate` runs `prisma migrate deploy` and only applies pending migrations.

If Vercel reports `too many connections`, append `?connection_limit=1` to the production `DATABASE_URL`. Each function instance opens its own Prisma pool, and a small Railway instance caps connections low.

UI and API share a domain, so there is no CORS configuration.

## Team

Fletcher, Joe, Amiel.
