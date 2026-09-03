import type { Challan as DbChallan, Vehicle as DbVehicle, Dispute as DbDispute } from '@chukta/db';
import {
  deriveStatus,
  type Challan,
  type Vehicle,
  type Dispute,
  type ChallanFlag,
  type VehicleClass,
  type GroundKey,
} from '@chukta/shared';

/** Map a DB vehicle row to the shared Vehicle shape. */
export function toVehicle(v: DbVehicle): Vehicle {
  return {
    id: v.id,
    plate: v.plate,
    model: v.model ?? undefined,
    vehicleClass: (v.vehicleClass as VehicleClass | null) ?? undefined,
    soldDate: v.soldDate ?? undefined,
    isSample: v.isSample,
  };
}

/** Map a DB challan row to the shared Challan shape, deriving status from date. */
export function toChallan(c: DbChallan): Challan {
  return {
    id: c.id,
    vehicleId: c.vehicleId,
    offence: c.offence,
    section: c.section ?? undefined,
    amount: c.amount,
    date: c.date,
    location: c.location ?? undefined,
    city: c.city ?? undefined,
    evidenceNote: c.evidenceNote ?? undefined,
    status: c.isPaid ? 'paid' : deriveStatus(c.date),
    flag: (c.flag as ChallanFlag | null) ?? null,
    isSample: c.isSample,
  };
}

/** Map a DB dispute row to the shared Dispute shape. */
export function toDispute(d: DbDispute): Dispute {
  return {
    id: d.id,
    plate: d.plate,
    challanNo: d.challanNo ?? undefined,
    offence: d.offence,
    amount: d.amount,
    date: d.date,
    city: d.city ?? undefined,
    location: d.location ?? undefined,
    ground: d.ground as GroundKey,
    note: d.note ?? undefined,
    saleDate: d.saleDate ?? undefined,
    receipt: d.receipt ?? undefined,
    name: d.name ?? undefined,
    mobile: d.mobile ?? undefined,
    hasScreenshot: d.hasScreenshot,
    letter: d.letter,
    filed: d.filed,
    createdAt: d.createdAt.getTime(),
  };
}
