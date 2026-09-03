import { describe, it, expect } from 'vitest';
import { flagChallan, flagChallans, offenceImpliesHeavyVehicle, flagToGround } from './heuristics.js';
import type { Challan, Vehicle } from './schemas.js';

const vehicle = (over: Partial<Vehicle> = {}): Vehicle => ({
  id: 'v1',
  plate: 'DL3CAB1234',
  vehicleClass: 'LMV',
  ...over,
});

const challan = (over: Partial<Challan> = {}): Challan => ({
  id: 'c1',
  vehicleId: 'v1',
  offence: 'Overspeeding',
  amount: 1000,
  date: '2026-07-01',
  status: 'pending',
  flag: null,
  ...over,
});

describe('offenceImpliesHeavyVehicle', () => {
  it('detects goods/overloading/transport wording', () => {
    expect(offenceImpliesHeavyVehicle('Goods vehicle overloading')).toBe(true);
    expect(offenceImpliesHeavyVehicle('Overloaded truck')).toBe(true);
    expect(offenceImpliesHeavyVehicle('Commercial permit violation')).toBe(true);
  });
  it('does not fire on ordinary offences', () => {
    expect(offenceImpliesHeavyVehicle('Overspeeding')).toBe(false);
    expect(offenceImpliesHeavyVehicle('Jumping red light')).toBe(false);
  });
});

describe('flagChallan', () => {
  it('flags class mismatch: heavy-vehicle offence on a light vehicle', () => {
    const c = challan({ offence: 'Goods vehicle overloading' });
    expect(flagChallan(c, vehicle({ vehicleClass: 'LMV' }), [c])).toBe('classMismatch');
  });

  it('does not flag class mismatch when the vehicle really is GOODS', () => {
    const c = challan({ offence: 'Goods vehicle overloading' });
    expect(flagChallan(c, vehicle({ vehicleClass: 'GOODS' }), [c])).toBeNull();
  });

  it('flags sold: challan dated after the sale date', () => {
    const c = challan({ date: '2026-06-01' });
    expect(flagChallan(c, vehicle({ soldDate: '2026-05-01' }), [c])).toBe('sold');
  });

  it('does not flag sold for a challan before the sale date', () => {
    const c = challan({ date: '2026-04-01' });
    expect(flagChallan(c, vehicle({ soldDate: '2026-05-01' }), [c])).toBeNull();
  });

  it('flags duplicate: same offence, location and date on the same vehicle', () => {
    const a = challan({ id: 'a', location: 'MG Road' });
    const b = challan({ id: 'b', location: 'MG Road' });
    expect(flagChallan(a, vehicle(), [a, b])).toBe('duplicate');
  });

  it('does not flag duplicate when location differs', () => {
    const a = challan({ id: 'a', location: 'MG Road' });
    const b = challan({ id: 'b', location: 'Ring Road' });
    expect(flagChallan(a, vehicle(), [a, b])).toBeNull();
  });

  it('prioritizes sold over other flags', () => {
    const c = challan({ offence: 'Goods overloading', date: '2026-06-01' });
    expect(flagChallan(c, vehicle({ vehicleClass: 'LMV', soldDate: '2026-05-01' }), [c])).toBe(
      'sold',
    );
  });
});

describe('flagChallans', () => {
  it('computes flags across a mixed set', () => {
    const vehicles = [
      vehicle({ id: 'v1', vehicleClass: 'LMV' }),
      vehicle({ id: 'v2', vehicleClass: '2W', soldDate: '2026-01-01' }),
    ];
    const challans = [
      challan({ id: 'c1', vehicleId: 'v1', offence: 'Goods overloading' }),
      challan({ id: 'c2', vehicleId: 'v2', date: '2026-03-01' }),
      challan({ id: 'c3', vehicleId: 'v1', offence: 'Clean', location: 'X' }),
    ];
    const flagged = flagChallans(vehicles, challans);
    expect(flagged.find((c) => c.id === 'c1')?.flag).toBe('classMismatch');
    expect(flagged.find((c) => c.id === 'c2')?.flag).toBe('sold');
    expect(flagged.find((c) => c.id === 'c3')?.flag).toBeNull();
  });
});

describe('flagToGround', () => {
  it('maps each flag to its dispute ground', () => {
    expect(flagToGround.classMismatch).toBe('wrongvehicle');
    expect(flagToGround.sold).toBe('sold');
    expect(flagToGround.duplicate).toBe('duplicate');
  });
});
