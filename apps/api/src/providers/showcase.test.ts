import { describe, it, expect, beforeEach } from 'vitest';
import { flagChallan, type Challan, type Vehicle } from '@chukta/shared';
import { buildShowcaseProvider } from './showcase.js';
import { listProviderInfo, resetProviderCache } from './registry.js';

const FLAGSHIP = 'DL01CAB4321';

/** Turn provider output into a persisted-shape Challan for heuristic checks. */
function asChallan(c: Awaited<ReturnType<ReturnType<typeof buildShowcaseProvider>['fetchByPlate']>>[number], i: number): Challan {
  return { id: `c${i}`, vehicleId: 'v1', status: 'pending', ...c };
}

describe('buildShowcaseProvider', () => {
  it('advertises itself as a simulated "live-demo" provider', () => {
    expect(buildShowcaseProvider().info).toMatchObject({
      id: 'chukta-live',
      simulated: true,
      mode: 'live-demo',
    });
  });

  it('returns the curated case for a flagship plate (spacing/casing tolerant)', async () => {
    const provider = buildShowcaseProvider();
    const challans = await provider.fetchByPlate('dl 01 ca b4321');
    expect(challans).toHaveLength(4);
    // Every record carries real detail: section + location + an e-challan ref.
    for (const c of challans) {
      expect(c.section).toBeTruthy();
      expect(c.location).toBeTruthy();
      expect(c.evidenceNote).toMatch(/e-challan/i);
    }
  });

  it('curated case exercises class-mismatch and duplicate heuristics on an LMV', async () => {
    const raw = await buildShowcaseProvider().fetchByPlate(FLAGSHIP);
    const vehicle: Vehicle = { id: 'v1', plate: FLAGSHIP, vehicleClass: 'LMV' };
    const challans = raw.map(asChallan);
    const flags = challans.map((c) => flagChallan(c, vehicle, challans));

    expect(flags).toContain('classMismatch'); // goods offence on a car
    expect(flags.filter((f) => f === 'duplicate').length).toBeGreaterThanOrEqual(2); // the pair
  });

  it('returns a deterministic, non-empty set for a non-flagship plate', async () => {
    const provider = buildShowcaseProvider();
    const a = await provider.fetchByPlate('KA05MK4321');
    const b = await provider.fetchByPlate('KA05MK4321');
    expect(a.length).toBeGreaterThan(0);
    expect(a).toEqual(b); // stable across lookups
  });
});

describe('registry ordering', () => {
  beforeEach(() => {
    delete process.env.CHALLAN_PROVIDER_KEY;
    resetProviderCache();
  });

  it('lists Chukta Live first when no real live provider is configured', () => {
    const infos = listProviderInfo();
    expect(infos[0].id).toBe('chukta-live');
    expect(infos.map((p) => p.id)).toEqual(
      expect.arrayContaining(['challanbridge', 'rtoconnect', 'setuverify']),
    );
  });
});
