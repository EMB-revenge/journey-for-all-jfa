/**
 * Seeds the reference data the app needs to be usable, then the three admins.
 *
 *   npm run db:seed
 *
 * The Prisma CLI loads `.env` before running this file, so `env` picks the
 * admin emails and passwords up from there.
 *
 * Safe to run more than once. Every row upserts on a unique column, and an
 * admin that already exists keeps its password instead of being recreated.
 *
 * Demo trips are dated from tomorrow, so a fresh database has something to
 * search. Re-running later adds the new days and leaves existing rows alone.
 *
 * Admins go through `auth.api.signUpEmail` so Better Auth writes the password
 * hash the way it expects, then get promoted with a direct update. Never set
 * the hash by hand.
 */
import { env } from "~/env";
import { todayInManila } from "~/lib/dates";
import { auth } from "~/server/better-auth";
import { db } from "~/server/db";

const BUS_TYPES = ["ORDINARY", "AIRCON"];

const CITIES = [
  "Passi City, Iloilo",
  "Roxas City, Capiz",
  "Iloilo City, Iloilo",
  "Kalibo, Aklan",
  "San Jose de Buenavista, Antique",
];

/** Demo fleet. Plates are the upsert key, so re-running never duplicates. */
const BUSES = [
  {
    name: "JFA Aircon 1",
    plateNumber: "JFA-1001",
    capacity: 45,
    busType: "AIRCON",
  },
  {
    name: "JFA Aircon 2",
    plateNumber: "JFA-1002",
    capacity: 45,
    busType: "AIRCON",
  },
  {
    name: "JFA Ordinary 1",
    plateNumber: "JFA-2001",
    capacity: 49,
    busType: "ORDINARY",
  },
  {
    name: "JFA Ordinary 2",
    plateNumber: "JFA-2002",
    capacity: 49,
    busType: "ORDINARY",
  },
];

/** Both directions of each Panay pair, so return trips are searchable too. */
const ROUTES = [
  {
    from: "Iloilo City, Iloilo",
    to: "Roxas City, Capiz",
    durationMinutes: 150,
    baseFare: 260,
  },
  {
    from: "Roxas City, Capiz",
    to: "Iloilo City, Iloilo",
    durationMinutes: 150,
    baseFare: 260,
  },
  {
    from: "Iloilo City, Iloilo",
    to: "Kalibo, Aklan",
    durationMinutes: 240,
    baseFare: 380,
  },
  {
    from: "Kalibo, Aklan",
    to: "Iloilo City, Iloilo",
    durationMinutes: 240,
    baseFare: 380,
  },
  {
    from: "Iloilo City, Iloilo",
    to: "San Jose de Buenavista, Antique",
    durationMinutes: 240,
    baseFare: 350,
  },
  {
    from: "San Jose de Buenavista, Antique",
    to: "Iloilo City, Iloilo",
    durationMinutes: 240,
    baseFare: 350,
  },
  {
    from: "Iloilo City, Iloilo",
    to: "Passi City, Iloilo",
    durationMinutes: 90,
    baseFare: 120,
  },
  {
    from: "Passi City, Iloilo",
    to: "Iloilo City, Iloilo",
    durationMinutes: 90,
    baseFare: 120,
  },
  {
    from: "Roxas City, Capiz",
    to: "Kalibo, Aklan",
    durationMinutes: 120,
    baseFare: 180,
  },
  {
    from: "Kalibo, Aklan",
    to: "Roxas City, Capiz",
    durationMinutes: 120,
    baseFare: 180,
  },
];

/**
 * Two trips per route per day. Trip n runs on bus n % 4 at slot n / 4, which
 * keeps every (bus, departure time) unique inside a day.
 */
const DEPARTURE_SLOTS = ["06:00", "08:30", "11:00", "13:30", "16:00"];
const DEMO_DAYS = 3;

const MIN_PASSWORD_LENGTH = 8;

function timeOfDay(totalMinutes: number) {
  const minutes = totalMinutes % (24 * 60);
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return new Date(`1970-01-01T${hh}:${mm}:00.000Z`);
}

function slotMinutes(slot: string) {
  const [hours, minutes] = slot.split(":").map(Number);
  return hours! * 60 + minutes!;
}

/** Manila's calendar day, so demo trips start tomorrow for a PH user. */
function dayFromNow(days: number) {
  const date = new Date(`${todayInManila()}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function nameFromEmail(email: string) {
  return email
    .split("@")[0]!
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ");
}

function adminAccounts() {
  return [
    { email: env.ADMIN_1_EMAIL, password: env.ADMIN_1_PASSWORD },
    { email: env.ADMIN_2_EMAIL, password: env.ADMIN_2_PASSWORD },
    { email: env.ADMIN_3_EMAIL, password: env.ADMIN_3_PASSWORD },
  ];
}

/** A missing pair is a .env mistake, a short password a real error. */
function validateAdmins(
  accounts: { email?: string; password?: string }[],
): { email: string; password: string }[] {
  return accounts.map((account, index) => {
    const n = index + 1;
    if (!account.email || !account.password) {
      throw new Error(
        `ADMIN_${n}_EMAIL and ADMIN_${n}_PASSWORD must both be set in .env. See .env.example.`,
      );
    }
    if (account.password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(
        `The password for ${account.email} is shorter than ${MIN_PASSWORD_LENGTH} characters.`,
      );
    }
    return { email: account.email, password: account.password };
  });
}

async function seedBusTypes() {
  for (const name of BUS_TYPES) {
    await db.busType.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`Bus types: ${BUS_TYPES.join(", ")}`);
}

async function seedCities() {
  for (const name of CITIES) {
    await db.city.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`Cities: ${CITIES.length}`);
}

async function seedBuses() {
  for (const bus of BUSES) {
    const busType = await db.busType.findUniqueOrThrow({
      where: { name: bus.busType },
    });
    const record = await db.bus.upsert({
      where: { plateNumber: bus.plateNumber },
      update: {},
      create: {
        name: bus.name,
        plateNumber: bus.plateNumber,
        capacity: bus.capacity,
        busTypeId: busType.id,
      },
    });

    // Seats 1..capacity, created once per bus (SPEC 8.5).
    await db.seat.createMany({
      data: Array.from({ length: bus.capacity }, (_, index) => ({
        busId: record.id,
        seatNumber: index + 1,
      })),
      skipDuplicates: true,
    });
  }
  console.log(`Buses: ${BUSES.length}, with seats`);
}

async function seedRoutes() {
  const cities = await db.city.findMany();
  const cityId = new Map(cities.map((city) => [city.name, city.id]));

  for (const route of ROUTES) {
    const originCityId = cityId.get(route.from);
    const destCityId = cityId.get(route.to);
    if (!originCityId || !destCityId) {
      throw new Error(`Missing city for route ${route.from} -> ${route.to}`);
    }

    await db.route.upsert({
      where: { originCityId_destCityId: { originCityId, destCityId } },
      update: {},
      create: {
        originCityId,
        destCityId,
        durationMinutes: route.durationMinutes,
        baseFare: route.baseFare,
      },
    });
  }
  console.log(`Routes: ${ROUTES.length}`);
}

async function seedSchedules() {
  const routes = await db.route.findMany({
    include: { originCity: true, destCity: true },
  });
  const routeByPair = new Map(
    routes.map((route) => [
      `${route.originCity.name}|${route.destCity.name}`,
      route,
    ]),
  );
  const buses = await db.bus.findMany({
    where: { plateNumber: { in: BUSES.map((bus) => bus.plateNumber) } },
    orderBy: { plateNumber: "asc" },
  });

  const tripsPerDay = ROUTES.length * 2;
  if (
    buses.length === 0 ||
    tripsPerDay > DEPARTURE_SLOTS.length * buses.length
  ) {
    throw new Error(
      "Demo schedules need more departure slots or buses for this many routes.",
    );
  }

  let count = 0;
  for (let day = 1; day <= DEMO_DAYS; day++) {
    const travelDate = dayFromNow(day);
    let trip = 0;

    for (const demo of ROUTES) {
      const route = routeByPair.get(`${demo.from}|${demo.to}`);
      if (!route) throw new Error(`Missing route ${demo.from} -> ${demo.to}`);

      // Two trips per route, on different buses and different times of day.
      for (let copy = 0; copy < 2; copy++, trip++) {
        const bus = buses[trip % buses.length]!;
        const slot =
          (Math.floor(trip / buses.length) + copy * 2) % DEPARTURE_SLOTS.length;
        const start = slotMinutes(DEPARTURE_SLOTS[slot]!);
        const departureTime = timeOfDay(start);
        const arrivalTime = timeOfDay(start + route.durationMinutes);

        await db.schedule.upsert({
          where: {
            busId_travelDate_departureTime: {
              busId: bus.id,
              travelDate,
              departureTime,
            },
          },
          update: {},
          create: {
            busId: bus.id,
            routeId: route.id,
            travelDate,
            departureTime,
            arrivalTime,
          },
        });
        count++;
      }
    }
  }
  console.log(`Schedules: ${count} (${DEMO_DAYS} days from tomorrow)`);
}

async function seedAdmins(accounts: { email: string; password: string }[]) {
  for (const { email, password } of accounts) {
    const existing = await db.user.findUnique({ where: { email } });

    if (existing) {
      await db.user.update({
        where: { id: existing.id },
        data: { role: "ADMIN", isActive: true },
      });
      console.log(`Admin ${email}: exists already, role set to ADMIN`);
      continue;
    }

    await auth.api.signUpEmail({
      body: { email, password, name: nameFromEmail(email) },
    });
    const created = await db.user.findUniqueOrThrow({ where: { email } });
    await db.user.update({
      where: { id: created.id },
      data: { role: "ADMIN" },
    });
    console.log(`Admin ${email}: created`);
  }
}

async function main() {
  const admins = validateAdmins(adminAccounts());

  await seedBusTypes();
  await seedCities();
  await seedBuses();
  await seedRoutes();
  await seedSchedules();
  await seedAdmins(admins);

  console.log("Seed done.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
