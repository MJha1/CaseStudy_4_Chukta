import type { ProviderChallan } from '@chukta/shared';
import type { ChallanProvider } from './types.js';

/**
 * Chukta Live (demo) — a simulated real-time lookup used for the case-study
 * walkthrough. It is presented through the full live flow (consent + latency +
 * detailed records with e-challan refs and camera IDs), but the data is
 * hand-authored, NOT a genuine VAHAN/mParivahan pull. It is badged
 * "Live · demo" everywhere so it can never be mistaken for a real source.
 *
 * A small set of flagship plates return a curated case (an overdue red-light,
 * a class-mismatch goods offence, a duplicate pair) so every heuristic and the
 * dispute flow are demonstrable in one lookup. Any other plate gets a
 * deterministic realistic set so the "live" experience always returns records.
 */

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Small stable hash of a string → non-negative int (for the fallback set). */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function normalise(plate: string): string {
  return plate.toUpperCase().replace(/\s+/g, '');
}

/**
 * Curated case for the flagship plates. Dates are relative to "today" so the
 * derived statuses stay correct over time:
 *   - Red light 72d ago  → overdue (licence-at-risk banner)
 *   - Goods overloading   → class mismatch on an LMV (disputable)
 *   - Overspeeding x2, same place & date → duplicate pair (disputable)
 */
function flagshipCase(): ProviderChallan[] {
  const dupDate = isoDaysAgo(15);
  return [
    {
      offence: 'Jumping red light',
      section: 'MVA 119/177',
      amount: 1000,
      date: isoDaysAgo(72),
      location: 'ITO Junction',
      city: 'Delhi',
      evidenceNote: 'RLVD camera DL-ITO-07 · e-challan DL012607200418 · captured 09:14',
    },
    {
      offence: 'Goods vehicle overloading',
      section: 'MVA 194(1)',
      amount: 20000,
      date: isoDaysAgo(20),
      location: 'NH-8, Rajokri border',
      city: 'Delhi',
      evidenceNote: 'Weigh-bridge WB-DL-03 · e-challan DL012608160921 · gross 3.1t over limit',
    },
    {
      offence: 'Overspeeding',
      section: 'MVA 183',
      amount: 2000,
      date: dupDate,
      location: 'Ring Road, AIIMS flyover',
      city: 'Delhi',
      evidenceNote: 'Speed camera SC-DL-142 · e-challan DL012608211427 · 78 in a 50 zone',
    },
    {
      offence: 'Overspeeding',
      section: 'MVA 183',
      amount: 2000,
      date: dupDate,
      location: 'Ring Road, AIIMS flyover',
      city: 'Delhi',
      evidenceNote: 'Speed camera SC-DL-142 · e-challan DL012608211508 · 78 in a 50 zone',
    },
  ];
}

/** Flagship plates that resolve to the curated case above. */
const FLAGSHIP_PLATES = new Set(['DL01CAB4321', 'DL01CAB0001']);

/** A realistic deterministic set for any non-flagship plate. */
const FALLBACK_CATALOG: Omit<ProviderChallan, 'date' | 'evidenceNote'>[] = [
  { offence: 'Overspeeding', section: 'MVA 183', amount: 2000, location: 'NH-48', city: 'Gurugram' },
  { offence: 'No parking', section: 'MVA 177', amount: 500, location: 'Sector 29', city: 'Gurugram' },
  { offence: 'Using mobile while driving', section: 'MVA 184', amount: 1000, location: 'MG Road', city: 'Bengaluru' },
  { offence: 'Jumping red light', section: 'MVA 119/177', amount: 1000, location: 'Silk Board', city: 'Bengaluru' },
];

function fallbackCase(plate: string): ProviderChallan[] {
  const h = hash(plate);
  const count = 1 + (h % 3); // 1–3 records
  const out: ProviderChallan[] = [];
  for (let i = 0; i < count; i++) {
    const base = FALLBACK_CATALOG[(h + i * 3) % FALLBACK_CATALOG.length];
    const days = 12 + ((h >> (i + 1)) % 70);
    out.push({
      ...base,
      date: isoDaysAgo(days),
      evidenceNote: `Live lookup (demo) · e-challan ${plate.slice(0, 4)}${(h + i).toString().slice(0, 8)}`,
    });
  }
  return out;
}

export function buildShowcaseProvider(): ChallanProvider {
  return {
    info: {
      id: 'chukta-live',
      name: 'Chukta Live',
      simulated: true,
      mode: 'live-demo',
      note: 'Simulated real-time lookup — demo data, not a live government source',
    },
    async fetchByPlate(plate: string): Promise<ProviderChallan[]> {
      await delay(1200); // feel of a real network round-trip
      const p = normalise(plate);
      return FLAGSHIP_PLATES.has(p) ? flagshipCase() : fallbackCase(p);
    },
  };
}
