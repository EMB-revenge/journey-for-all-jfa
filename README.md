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
- Docker Desktop or Podman Desktop for the local database. On Windows, run the script from WSL
- A Railway PostgreSQL connection string for production, optional for local work

## Local setup

```bash
npm install
cp .env.example .env
```

Generate a session secret and paste it into `.env`:

```bash
openssl rand -base64 32
```

Then fill in the admin seed variables (`ADMIN_1_EMAIL` and friends, one set per admin).

Start the database, migrate, seed, and run:

```bash
./start-database.sh        # Postgres container on 5432, Windows needs WSL
npm run db:generate        # prisma migrate dev, creates and applies migrations
npm run db:seed            # bus types, cities, three admins
npm run dev
```

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
src/components/   shared UI, including the seat grid
src/context/      AuthProvider, BookingFlowProvider
src/reducers/     booking flow reducer
src/lib/          Zod schemas and helpers
src/server/       Prisma client, Better Auth, tRPC context and routers
src/middleware.ts admin route guard
docs/             spec, PRD, brief, implementation plan
```

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

1. Create a PostgreSQL database on Railway and copy its connection string
2. Import the repo into Vercel, keep the root directory at the repo root, framework preset Next.js
3. Add `DATABASE_URL`, `BETTER_AUTH_SECRET`, and the six admin seed variables
4. Release step: `npm run db:migrate`, then `npm run db:seed`

UI and API share a domain, so there is no CORS configuration.

## Team

Fletcher, Joe, Amiel.
