import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildRealProvider, mapEchallanResponse } from './real.js';
import { listProviderInfo, resetProviderCache } from './registry.js';

const ENV_KEYS = ['CHALLAN_PROVIDER_KEY', 'CHALLAN_PROVIDER_URL', 'CHALLAN_PROVIDER_NAME'] as const;

afterEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
  resetProviderCache();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('mapEchallanResponse', () => {
  it('maps the documented eChallan.app challan shape (offense → offence)', () => {
    const out = mapEchallanResponse({
      vehicle_number: 'DL01AA1234',
      pending_challans: [
        { challan_id: 'CH-1', amount: 2000, offense: 'Overspeeding', date: '2026-07-15' },
      ],
    });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ offence: 'Overspeeding', amount: 2000, date: '2026-07-15' });
    expect(out[0].evidenceNote).toContain('CH-1');
  });

  it('accepts a bare array, coerces string amounts and datetime dates', () => {
    const out = mapEchallanResponse([
      { offence: 'No parking', amount: '₹500', date: '2026-06-20T10:30:00Z', location: 'Sector 29' },
    ]);
    expect(out[0]).toMatchObject({
      offence: 'No parking',
      amount: 500,
      date: '2026-06-20',
      location: 'Sector 29',
    });
  });

  it('skips malformed rows instead of failing the whole batch', () => {
    const out = mapEchallanResponse({
      challans: [
        { amount: 1000, date: '2026-01-01' }, // no offence → dropped
        { offense: 'Red light', amount: 1000, date: '2026-01-02' }, // kept
        'garbage', // dropped
      ],
    });
    expect(out.map((c) => c.offence)).toEqual(['Red light']);
  });

  it('returns [] for an empty or shapeless body', () => {
    expect(mapEchallanResponse({})).toEqual([]);
    expect(mapEchallanResponse(null)).toEqual([]);
  });
});

describe('buildRealProvider activation', () => {
  it('is absent without an API key', () => {
    expect(buildRealProvider()).toBeNull();
  });

  it('activates on the key as a non-simulated "Live" provider', () => {
    process.env.CHALLAN_PROVIDER_KEY = 'test-key';
    const provider = buildRealProvider();
    expect(provider?.info).toMatchObject({ id: 'echallan', simulated: false });
  });

  it('sorts first in the registry ahead of the demo vendors', () => {
    process.env.CHALLAN_PROVIDER_KEY = 'test-key';
    resetProviderCache();
    const ids = listProviderInfo().map((p) => p.id);
    expect(ids[0]).toBe('echallan');
    expect(ids).toContain('challanbridge'); // demo vendors still available
  });
});

describe('fetchByPlate (mocked network)', () => {
  it('calls the challans endpoint with the Bearer key and maps the response', async () => {
    process.env.CHALLAN_PROVIDER_KEY = 'secret-123';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ challans: [{ offense: 'Overspeeding', amount: 2000, date: '2026-07-15' }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = buildRealProvider()!;
    const challans = await provider.fetchByPlate('dl 3c ab 1234');

    const [calledUrl, init] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe('https://production.echallan.app/v1/challans/DL3CAB1234');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer secret-123');
    expect(challans[0].offence).toBe('Overspeeding');
  });

  it('treats 404 as an empty result, not an error', async () => {
    process.env.CHALLAN_PROVIDER_KEY = 'k';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(buildRealProvider()!.fetchByPlate('XX00XX0000')).resolves.toEqual([]);
  });

  it('throws on other non-2xx responses', async () => {
    process.env.CHALLAN_PROVIDER_KEY = 'k';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(buildRealProvider()!.fetchByPlate('XX00XX0000')).rejects.toThrow(/500/);
  });
});
