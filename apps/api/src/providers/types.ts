import type { ProviderChallan, ProviderInfo } from '@chukta/shared';

/** Per-request context passed to a provider (live providers may require it). */
export interface FetchContext {
  /** The requesting customer's IP address (some providers require it for audit). */
  ip?: string;
  /** True when the customer has explicitly consented to this lookup. */
  consent?: boolean;
}

/**
 * A challan-data provider. Simulated vendors return demo data; a real provider
 * calls a licensed aggregator API. The rest of the app talks only to this
 * interface, so a real vendor drops in with no changes upstream.
 */
export interface ChallanProvider {
  readonly info: ProviderInfo;
  /** Look up challans for a plate. May return an empty list (no records found). */
  fetchByPlate(plate: string, ctx?: FetchContext): Promise<ProviderChallan[]>;
}

export type { ProviderChallan, ProviderInfo };
