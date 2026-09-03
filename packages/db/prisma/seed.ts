import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Sample data lives under the reserved device id `SAMPLE`. The API merges these
 * rows (always flagged isSample) into every device's view so the app demos
 * instantly, while a real user's own data stays under their own device id.
 */
export const SAMPLE_DEVICE_ID = 'SAMPLE';

/** ISO date `n` days before a fixed reference "today" (2026-09-03). */
const TODAY = new Date('2026-09-03T00:00:00Z');
function daysAgo(n: number): string {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

async function main() {
  // Idempotent: clear existing sample rows first.
  await prisma.challan.deleteMany({ where: { deviceId: SAMPLE_DEVICE_ID } });
  await prisma.vehicle.deleteMany({ where: { deviceId: SAMPLE_DEVICE_ID } });

  // 1. A hatchback with an overdue fine + a class-mismatch (disputable) challan.
  const hatch = await prisma.vehicle.create({
    data: {
      deviceId: SAMPLE_DEVICE_ID,
      plate: 'DL3CAB1234',
      model: 'Maruti Swift',
      vehicleClass: 'LMV',
      isSample: true,
    },
  });
  await prisma.challan.createMany({
    data: [
      {
        deviceId: SAMPLE_DEVICE_ID,
        vehicleId: hatch.id,
        offence: 'Jumping red light',
        section: 'MVA 119/177',
        amount: 1000,
        date: daysAgo(72), // overdue (>60)
        location: 'ITO Junction, Delhi',
        city: 'Delhi',
        evidenceNote: 'ANPR camera capture',
        isSample: true,
      },
      {
        deviceId: SAMPLE_DEVICE_ID,
        vehicleId: hatch.id,
        offence: 'Goods vehicle overloading',
        section: 'MVA 194',
        amount: 20000,
        date: daysAgo(20),
        location: 'NH-48, Gurugram',
        city: 'Gurugram',
        evidenceNote: 'Weighbridge — goods carrier',
        isSample: true,
      },
    ],
  });

  // 2. A two-wheeler sold before a challan was issued.
  const bike = await prisma.vehicle.create({
    data: {
      deviceId: SAMPLE_DEVICE_ID,
      plate: 'HR26DK8337',
      model: 'Honda Activa',
      vehicleClass: '2W',
      soldDate: daysAgo(120),
      isSample: true,
    },
  });
  await prisma.challan.create({
    data: {
      deviceId: SAMPLE_DEVICE_ID,
      vehicleId: bike.id,
      offence: 'No parking',
      section: 'MVA 177',
      amount: 500,
      date: daysAgo(40), // after the sale date
      location: 'Sector 29, Gurugram',
      city: 'Gurugram',
      isSample: true,
    },
  });

  // 3. A sedan with a duplicate challan (same offence, place, date).
  const sedan = await prisma.vehicle.create({
    data: {
      deviceId: SAMPLE_DEVICE_ID,
      plate: 'MH12AB0001',
      model: 'Hyundai Verna',
      vehicleClass: 'LMV',
      isSample: true,
    },
  });
  await prisma.challan.createMany({
    data: [
      {
        deviceId: SAMPLE_DEVICE_ID,
        vehicleId: sedan.id,
        offence: 'Overspeeding',
        section: 'MVA 183',
        amount: 2000,
        date: daysAgo(15),
        location: 'Mumbai-Pune Expressway',
        city: 'Pune',
        isSample: true,
      },
      {
        deviceId: SAMPLE_DEVICE_ID,
        vehicleId: sedan.id,
        offence: 'Overspeeding',
        section: 'MVA 183',
        amount: 2000,
        date: daysAgo(15), // duplicate of the above
        location: 'Mumbai-Pune Expressway',
        city: 'Pune',
        isSample: true,
      },
    ],
  });

  const vehicles = await prisma.vehicle.count({ where: { deviceId: SAMPLE_DEVICE_ID } });
  const challans = await prisma.challan.count({ where: { deviceId: SAMPLE_DEVICE_ID } });
  console.log(`Seeded ${vehicles} sample vehicles and ${challans} sample challans.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
