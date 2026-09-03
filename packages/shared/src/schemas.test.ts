import { describe, it, expect } from 'vitest';
import { plateSchema, createChallanSchema, createDisputeSchema } from './schemas.js';

describe('plateSchema', () => {
  it('uppercases and strips spaces', () => {
    expect(plateSchema.parse('  dl3c ab 1234 ')).toBe('DL3CAB1234');
  });
  it('rejects plates shorter than 6 chars', () => {
    expect(plateSchema.safeParse('AB12').success).toBe(false);
  });
});

describe('createChallanSchema', () => {
  it('accepts a valid challan without status/flag', () => {
    const r = createChallanSchema.safeParse({
      vehicleId: 'v1',
      offence: 'Overspeeding',
      amount: 1000,
      date: '2026-07-15',
    });
    expect(r.success).toBe(true);
  });
  it('rejects a negative amount', () => {
    const r = createChallanSchema.safeParse({
      vehicleId: 'v1',
      offence: 'x',
      amount: -1,
      date: '2026-07-15',
    });
    expect(r.success).toBe(false);
  });
});

describe('createDisputeSchema', () => {
  it('requires a valid ground and a letter', () => {
    const r = createDisputeSchema.safeParse({
      plate: 'DL3CAB1234',
      offence: 'Overspeeding',
      amount: 1000,
      date: '2026-07-15',
      ground: 'wrongvehicle',
      letter: 'Dear sir...',
    });
    expect(r.success).toBe(true);
  });
  it('rejects an unknown ground', () => {
    const r = createDisputeSchema.safeParse({
      plate: 'DL3CAB1234',
      offence: 'x',
      amount: 1,
      date: '2026-07-15',
      ground: 'nonsense',
      letter: 'x',
    });
    expect(r.success).toBe(false);
  });
});
