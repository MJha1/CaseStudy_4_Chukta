import { prisma } from '@chukta/db';
import { ownerWhere, ownerData, type Actor } from './actor.js';

/**
 * Opt-in demo dataset. Loaded into a device on request (POST /api/demo/load)
 * instead of being merged into every user's view. Dates are relative to the
 * real "now", and rows are marked isSample so the UI badges them as demo. Flags
 * are NOT stored — the F4 engine computes them live (goods-on-LMV, sold, and a
 * duplicate pair are all present here to exercise it).
 */
function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

interface DemoVehicle {
  plate: string;
  model: string;
  vehicleClass: string;
  soldDate?: string;
  challans: {
    offence: string;
    section?: string;
    amount: number;
    date: string;
    location?: string;
    city?: string;
    evidenceNote?: string;
  }[];
}

function demoVehicles(): DemoVehicle[] {
  return [
    {
      plate: 'DL3CAB1234',
      model: 'Maruti Swift',
      vehicleClass: 'LMV',
      challans: [
        { offence: 'Jumping red light', section: 'MVA 119/177', amount: 1000, date: isoDaysAgo(72), location: 'ITO Junction, Delhi', city: 'Delhi', evidenceNote: 'ANPR camera capture' },
        { offence: 'Goods vehicle overloading', section: 'MVA 194', amount: 20000, date: isoDaysAgo(20), location: 'NH-48, Gurugram', city: 'Gurugram', evidenceNote: 'Weighbridge — goods carrier' },
      ],
    },
    {
      plate: 'HR26DK8337',
      model: 'Honda Activa',
      vehicleClass: '2W',
      soldDate: isoDaysAgo(120),
      challans: [
        { offence: 'No parking', section: 'MVA 177', amount: 500, date: isoDaysAgo(40), location: 'Sector 29, Gurugram', city: 'Gurugram' },
      ],
    },
    {
      plate: 'MH12AB0001',
      model: 'Hyundai Verna',
      vehicleClass: 'LMV',
      challans: [
        { offence: 'Overspeeding', section: 'MVA 183', amount: 2000, date: isoDaysAgo(15), location: 'Mumbai-Pune Expressway', city: 'Pune' },
        { offence: 'Overspeeding', section: 'MVA 183', amount: 2000, date: isoDaysAgo(15), location: 'Mumbai-Pune Expressway', city: 'Pune' },
      ],
    },
  ];
}

/** Load the demo dataset for an actor (idempotent: clears any prior demo rows first). */
export async function loadDemoData(actor: Actor): Promise<{ vehicles: number; challans: number }> {
  const owner = ownerData(actor);
  // Remove previously loaded demo rows for this actor so reloads don't stack.
  await prisma.challan.deleteMany({ where: { ...ownerWhere(actor), isSample: true } });
  await prisma.vehicle.deleteMany({ where: { ...ownerWhere(actor), isSample: true } });

  let vehicleCount = 0;
  let challanCount = 0;
  for (const v of demoVehicles()) {
    const vehicle = await prisma.vehicle.create({
      data: {
        ...owner,
        plate: v.plate,
        model: v.model,
        vehicleClass: v.vehicleClass,
        soldDate: v.soldDate,
        isSample: true,
      },
    });
    vehicleCount++;
    if (v.challans.length) {
      await prisma.challan.createMany({
        data: v.challans.map((c) => ({ ...c, ...owner, vehicleId: vehicle.id, isSample: true })),
      });
      challanCount += v.challans.length;
    }
  }
  return { vehicles: vehicleCount, challans: challanCount };
}
