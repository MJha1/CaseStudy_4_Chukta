import { providerChallanSchema, type ProviderChallan } from '@chukta/shared';
import { z } from 'zod';
import type { ChallanProvider } from './types.js';

/**
 * Real challan-data provider, active only when CHALLAN_PROVIDER_URL and
 * CHALLAN_PROVIDER_KEY are configured. This is the seam a licensed aggregator
 * plugs into — swap the request/response mapping for your vendor's contract.
 * Until then it is simply absent from the registry, and the app uses the
 * clearly-labelled simulated vendors.
 */
export function buildRealProvider(): ChallanProvider | null {
  const url = process.env.CHALLAN_PROVIDER_URL;
  const key = process.env.CHALLAN_PROVIDER_KEY;
  const name = process.env.CHALLAN_PROVIDER_NAME ?? 'Licensed provider';
  if (!url || !key) return null;

  return {
    info: { id: 'real', name, simulated: false, note: 'Licensed data partner' },
    async fetchByPlate(plate: string): Promise<ProviderChallan[]> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      try {
        const res = await fetch(`${url}?plate=${encodeURIComponent(plate)}`, {
          headers: { authorization: `Bearer ${key}`, accept: 'application/json' },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`provider responded ${res.status}`);
        const body = (await res.json()) as { challans?: unknown };
        // Map the vendor's payload to ProviderChallan[]; adjust for your vendor.
        const raw = Array.isArray(body.challans) ? body.challans : [];
        return z.array(providerChallanSchema).parse(raw);
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
