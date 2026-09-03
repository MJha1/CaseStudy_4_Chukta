import type { ProviderInfo } from '@chukta/shared';
import type { ChallanProvider } from './types.js';
import { buildSimulatedProviders } from './simulated.js';
import { buildRealProvider } from './real.js';

/**
 * The provider registry. A real licensed provider (when configured via env)
 * is listed first; the simulated demo vendors are always available.
 */
let cache: ChallanProvider[] | null = null;

export function getProviders(): ChallanProvider[] {
  if (!cache) {
    const real = buildRealProvider();
    cache = [...(real ? [real] : []), ...buildSimulatedProviders()];
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
