import type { ProviderChallan, ProviderInfo } from '@chukta/shared';

/**
 * A challan-data provider. Simulated vendors return demo data; a real provider
 * calls a licensed aggregator API. The rest of the app talks only to this
 * interface, so a real vendor drops in with no changes upstream.
 */
export interface ChallanProvider {
  readonly info: ProviderInfo;
  /** Look up challans for a plate. May return an empty list (no records found). */
  fetchByPlate(plate: string): Promise<ProviderChallan[]>;
}

export type { ProviderChallan, ProviderInfo };
