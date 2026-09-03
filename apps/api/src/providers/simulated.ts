import type { ProviderChallan } from '@chukta/shared';
import type { ChallanProvider } from './types.js';

/**
 * Simulated challan-data vendors. Output is deterministic per plate (so repeat
 * lookups are stable) with a small artificial latency, and coverage varies by
 * vendor — one even returns "no records" for some plates — so the provider seam
 * behaves like a real multi-vendor integration. These NEVER contact any
 * government or third-party endpoint.
 */

/** Small stable hash of a string → non-negative int. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface SimSpec {
  id: string;
  name: string;
  note: string;
  latencyMs: number;
  build: (plate: string, h: number) => ProviderChallan[];
}

/** A challan template without the per-lookup date/evidence, filled in below. */
type ChallanTemplate = Omit<ProviderChallan, 'date' | 'evidenceNote'>;

const CATALOG: ChallanTemplate[] = [
  { offence: 'Jumping red light', section: 'MVA 119/177', amount: 1000, location: 'ITO Junction', city: 'Delhi' },
  { offence: 'Overspeeding', section: 'MVA 183', amount: 2000, location: 'NH-48', city: 'Gurugram' },
  { offence: 'No parking', section: 'MVA 177', amount: 500, location: 'Sector 29', city: 'Gurugram' },
  { offence: 'Goods vehicle overloading', section: 'MVA 194', amount: 20000, location: 'NH-8', city: 'Jaipur' },
  { offence: 'Using mobile while driving', section: 'MVA 184', amount: 1000, location: 'MG Road', city: 'Bengaluru' },
];

function pick(h: number, count: number, vendor: string): ProviderChallan[] {
  const out: ProviderChallan[] = [];
  for (let i = 0; i < count; i++) {
    const base = CATALOG[(h + i * 7) % CATALOG.length];
    const days = 8 + ((h >> (i + 1)) % 80); // spread across the ~60-day window and beyond
    out.push({
      ...base,
      date: isoDaysAgo(days),
      evidenceNote: `${vendor} lookup (demo)`,
    });
  }
  return out;
}

const SPECS: SimSpec[] = [
  {
    id: 'challanbridge',
    name: 'ChallanBridge',
    note: 'Demo aggregator — broad national coverage',
    latencyMs: 700,
    build: (_plate, h) => pick(h, 2 + (h % 2), 'ChallanBridge'), // 2–3 results
  },
  {
    id: 'rtoconnect',
    name: 'RTOConnect',
    note: 'Demo aggregator — includes commercial-vehicle records',
    latencyMs: 950,
    build: (_plate, h) => {
      // Always includes a goods offence so class-mismatch flagging is visible.
      const goods = CATALOG.find((c) => c.offence.includes('Goods'))!;
      return [
        { ...goods, date: isoDaysAgo(14 + (h % 20)), evidenceNote: 'RTOConnect lookup (demo)' },
        ...pick(h, 1, 'RTOConnect'),
      ];
    },
  },
  {
    id: 'setuverify',
    name: 'SetuVerify',
    note: 'Demo aggregator — lighter coverage',
    latencyMs: 500,
    build: (_plate, h) => (h % 3 === 0 ? [] : pick(h, 1, 'SetuVerify')), // sometimes no records
  },
];

export function buildSimulatedProviders(): ChallanProvider[] {
  return SPECS.map((spec) => ({
    info: { id: spec.id, name: spec.name, simulated: true, note: spec.note },
    async fetchByPlate(plate: string): Promise<ProviderChallan[]> {
      await delay(spec.latencyMs);
      return spec.build(plate, hash(plate + spec.id));
    },
  }));
}
