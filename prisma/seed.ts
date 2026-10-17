/**
 * Seeds the reference data the app needs to be usable, then the three admins.
 *
 *   npm run db:seed
 *
 * The Prisma CLI loads `.env` before running this file, so `env` picks the
 * admin emails and passwords up from there.
 *
 * Safe to run more than once. Bus types and cities upsert on their unique
 * columns, and an admin that already exists keeps its password instead of
 * being recreated.
 *
 * Admins go through `auth.api.signUpEmail` so Better Auth writes the password
 * hash the way it expects, then get promoted with a direct update. Never set
 * the hash by hand.
 */
import { env } from "~/env";
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

const MIN_PASSWORD_LENGTH = 8;

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
