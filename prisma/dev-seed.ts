import { db } from "~/server/db";

async function main() {
  const busType = await db.busType.findFirstOrThrow({
    where: { name: "AIRCON" },
  });
  const iloilo = await db.city.findUniqueOrThrow({
    where: { name: "Iloilo City, Iloilo" },
  });
  const roxas = await db.city.findUniqueOrThrow({
    where: { name: "Roxas City, Capiz" },
  });

  const bus = await db.bus.upsert({
    where: { plateNumber: "DEV-1001" },
    update: {},
    create: {
      name: "Dev Liner 1",
      plateNumber: "DEV-1001",
      capacity: 40,
      busTypeId: busType.id,
    },
  });

  await db.seat.createMany({
    data: Array.from({ length: bus.capacity }, (_, i) => ({
      busId: bus.id,
      seatNumber: i + 1,
    })),
    skipDuplicates: true,
  });

  const route = await db.route.upsert({
    where: {
      originCityId_destCityId: {
        originCityId: iloilo.id,
        destCityId: roxas.id,
      },
    },
    update: {},
    create: {
      originCityId: iloilo.id,
      destCityId: roxas.id,
      durationMinutes: 180,
      baseFare: 250,
    },
  });

  const times = [
    ["06:00", "09:00"],
    ["13:00", "16:00"],
  ] as const;

  for (let d = 0; d < 8; d++) {
    const day = new Date();
    day.setUTCDate(day.getUTCDate() + d);
    const travelDate = new Date(
      `${day.toISOString().slice(0, 10)}T00:00:00.000Z`,
    );

    for (const [dep, arr] of times) {
      const departureTime = new Date(`1970-01-01T${dep}:00.000Z`);
      const arrivalTime = new Date(`1970-01-01T${arr}:00.000Z`);
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
    }
  }

  console.log("Dev data ready: DEV-1001, Iloilo City -> Roxas City");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
