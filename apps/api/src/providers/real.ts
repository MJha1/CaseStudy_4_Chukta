import { providerChallanSchema, type ProviderChallan } from '@chukta/shared';
import type { ChallanProvider } from './types.js';

/**
 * Real challan-data provider, wired for the eChallan.app developer API
 * (https://echallan.app/developer-api) — a free-signup key, no wallet/KYC.
 * It activates only when CHALLAN_PROVIDER_KEY is set; until then it is simply
 * absent from the registry and the app uses the labelled simulated demo vendors.
 *
 * Contract: Bearer-key auth, GET {base}/challans/{registration}. Read-only —
 * Chukta never pays or processes fines. The route still requires the customer's
 * consent before this runs (see routes/vehicles.ts), so a live lookup is always
 * consented even though eChallan's own API does not demand it.
 *
 * The response mapping is intentionally forgiving (the app derives status from
 * the date and never trusts provider input blindly), so a single malformed row
 * is skipped rather than failing the whole lookup.
 */

const DEFAULT_BASE = 'https://production.echallan.app/v1';

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

/** Coerce a money value (number, "₹2,000", "2000") to a non-negative integer. */
function coerceAmount(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

/** Normalise a date to YYYY-MM-DD; fall back to today if missing/unparseable. */
function coerceDate(v: unknown): string {
  const s = typeof v === 'string' ? v.trim() : '';
  const iso = s.match(/^\d{4}-\d{2}-\d{2}/);
  if (iso) return iso[0];
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

/** Find the array of challans wherever the vendor nests it. */
function extractChallanArray(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    for (const key of ['challans', 'pending_challans', 'data', 'results']) {
      if (Array.isArray(o[key])) return o[key] as unknown[];
    }
  }
  return [];
}

function mapOne(raw: unknown): ProviderChallan | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  // Offence is required (min length 1) — tolerate US/UK spelling and synonyms.
  const offence = str(r.offence) ?? str(r.offense) ?? str(r.violation) ?? str(r.description);
  if (!offence) return null;
  const id = str(r.challan_id) ?? str(r.challanId) ?? str(r.id);
  const candidate: ProviderChallan = {
    offence,
    amount: coerceAmount(r.amount ?? r.fine ?? r.penalty),
    date: coerceDate(r.date ?? r.challan_date ?? r.offense_date ?? r.offence_date),
    section: str(r.section) ?? str(r.act),
    location: str(r.location) ?? str(r.place),
    city: str(r.city) ?? str(r.state),
    evidenceNote: `eChallan.app (live)${id ? ` · ${id}` : ''}`,
  };
  const parsed = providerChallanSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/**
 * Map an eChallan.app response body to ProviderChallan[]. Pure and network-free
 * so it can be unit-tested directly against sample payloads.
 */
export function mapEchallanResponse(body: unknown): ProviderChallan[] {
  return extractChallanArray(body)
    .map(mapOne)
    .filter((c): c is ProviderChallan => c !== null);
}

export function buildEchallanProvider(): ChallanProvider | null {
  const key = process.env.CHALLAN_PROVIDER_KEY;
  if (!key) return null;

  const base = (process.env.CHALLAN_PROVIDER_URL ?? DEFAULT_BASE).replace(/\/+$/, '');
  const name = process.env.CHALLAN_PROVIDER_NAME ?? 'eChallan.app';

  return {
    info: { id: 'echallan', name, simulated: false, note: 'Live — VAHAN/mParivahan data partner' },
    async fetchByPlate(plate: string): Promise<ProviderChallan[]> {
      const registration = plate.replace(/\s+/g, '').toUpperCase();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      try {
        const res = await fetch(`${base}/challans/${encodeURIComponent(registration)}`, {
          headers: { authorization: `Bearer ${key}`, accept: 'application/json' },
          signal: controller.signal,
        });
        // A vehicle with no records is a normal, empty result — not an error.
        if (res.status === 404) return [];
        if (!res.ok) throw new Error(`eChallan.app responded ${res.status}`);
        return mapEchallanResponse(await res.json());
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
