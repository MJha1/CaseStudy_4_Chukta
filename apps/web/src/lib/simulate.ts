import type { CreateChallanInput } from '@chukta/shared';

/**
 * F6 — Auto-fetch preview (SIMULATED). Generates plausible demo challans for a
 * plate entirely on-device. This NEVER calls any government endpoint; a live
 * version would fetch from VAHAN/mParivahan with the user's consent.
 */

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Deterministic-ish demo set: an overdue fine plus a duplicate pair (so the
 *  F4 heuristics visibly light up on the fetched results). */
export function simulateFetchedChallans(vehicleId: string): CreateChallanInput[] {
  return [
    {
      vehicleId,
      offence: 'Jumping red light',
      section: 'MVA 119/177',
      amount: 1000,
      date: isoDaysAgo(72), // overdue
      location: 'ITO Junction',
      city: 'Delhi',
      evidenceNote: 'ANPR camera capture (demo)',
    },
    {
      vehicleId,
      offence: 'Overspeeding',
      section: 'MVA 183',
      amount: 2000,
      date: isoDaysAgo(18),
      location: 'NH-48',
      city: 'Gurugram',
      evidenceNote: 'Speed camera (demo)',
    },
    {
      vehicleId,
      offence: 'Overspeeding',
      section: 'MVA 183',
      amount: 2000,
      date: isoDaysAgo(18), // duplicate of the previous -> triggers the duplicate flag
      location: 'NH-48',
      city: 'Gurugram',
      evidenceNote: 'Speed camera (demo)',
    },
  ];
}
