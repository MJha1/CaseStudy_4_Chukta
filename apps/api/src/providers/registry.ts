import type { ProviderInfo } from '@chukta/shared';
import type { ChallanProvider } from './types.js';
import { buildSimulatedProviders } from './simulated.js';
import { buildShowcaseProvider } from './showcase.js';
import { buildEchallanProvider } from './real.js';

/**
 * The provider registry. Order: a real live provider (only when configured via
 * env), then "Chukta Live" — a simulated real-time lookup for the case-study
 * walkthrough — then the plain demo vendors. Everything but a configured real
 * provider is simulated, so the app works end-to-end without credentials.
 */
let cache: ChallanProvider[] | null = null;

export function getProviders(): ChallanProvider[] {
  if (!cache) {
    const live = buildEchallanProvider();
    cache = [...(live ? [live] : []), buildShowcaseProvider(), ...buildSimulatedProviders()];
  }
  return cache;
}

export function getProvider(id: string): ChallanProvider | undefined {
  return getProviders().find((p) => p.info.id === id);
}

export function listProviderInfo(): ProviderInfo[] {
  return getProviders().map((p) => p.info);
}

/** Test helper: clear the memoised registry so env changes take effect. */
export function resetProviderCache(): void {
  cache = null;
}
