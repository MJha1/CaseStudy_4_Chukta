import type { Challan, Vehicle, ChallanFlag, GroundKey } from './schemas.js';

/**
 * Wrong-challan heuristics (spec §F4). Flags are computed from the vehicle +
 * challan data (not stored), so manually-added and auto-fetched challans get
 * flagged on the same rules as the seeded samples.
 */

/** Which dispute ground a flag pre-selects in the drafter (F4 -> F1). */
export const flagToGround: Record<ChallanFlag, GroundKey> = {
  classMismatch: 'wrongvehicle',
  sold: 'sold',
  duplicate: 'duplicate',
};

/** Human-readable explanation for each flag. */
export const flagLabel: Record<ChallanFlag, string> = {
  classMismatch: 'Likely wrong — the offence implies a different vehicle class',
  sold: 'Issued after you sold this vehicle',
  duplicate: 'Duplicate of another challan (same offence, place and date)',
};

const HEAVY_VEHICLE_OFFENCE =
  /\b(goods|overload(?:ing|ed)?|carrier|truck|lorry|freight|transport|commercial|permit|axle|tonnage)\b/i;

/** Vehicle classes that are light/private — a heavy-vehicle offence on these is suspicious. */
const LIGHT_CLASSES: ReadonlySet<string> = new Set(['2W', 'LMV']);

/** True when the offence text implies a goods/commercial vehicle. */
export function offenceImpliesHeavyVehicle(offence: string): boolean {
  return HEAVY_VEHICLE_OFFENCE.test(offence);
}

function isDuplicate(challan: Challan, siblings: Challan[]): boolean {
  return siblings.some(
    (other) =>
      other.id !== challan.id &&
      other.offence.trim().toLowerCase() === challan.offence.trim().toLowerCase() &&
      (other.location ?? '').trim().toLowerCase() ===
        (challan.location ?? '').trim().toLowerCase() &&
      other.date === challan.date,
  );
}

/**
 * Compute the flag for one challan given its vehicle and the vehicle's other
 * challans. Priority: sold (strongest) → class mismatch → duplicate.
 */
export function flagChallan(
  challan: Challan,
  vehicle: Vehicle | undefined,
  siblings: Challan[],
): ChallanFlag | null {
  if (vehicle?.soldDate && challan.date > vehicle.soldDate) {
    return 'sold';
  }
  if (
    offenceImpliesHeavyVehicle(challan.offence) &&
    vehicle?.vehicleClass &&
    LIGHT_CLASSES.has(vehicle.vehicleClass)
  ) {
    return 'classMismatch';
  }
  if (isDuplicate(challan, siblings)) {
    return 'duplicate';
  }
  return null;
}

/**
 * Return a copy of every challan with its `flag` computed from the given
 * vehicles and the other challans on the same vehicle.
 */
export function flagChallans(vehicles: Vehicle[], challans: Challan[]): Challan[] {
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const byVehicle = new Map<string, Challan[]>();
  for (const c of challans) {
    const list = byVehicle.get(c.vehicleId) ?? [];
    list.push(c);
    byVehicle.set(c.vehicleId, list);
  }
  return challans.map((c) => ({
    ...c,
    flag: flagChallan(c, vehicleById.get(c.vehicleId), byVehicle.get(c.vehicleId) ?? []),
  }));
}
