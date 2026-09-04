import { z } from 'zod';
import {
  vehicleSchema,
  challanSchema,
  disputeSchema,
  providerInfoSchema,
  fetchChallansResponseSchema,
  authResponseSchema,
  userSchema,
  type CreateVehicleInput,
  type CreateChallanInput,
  type CreateDisputeInput,
  type Vehicle,
  type Challan,
  type Dispute,
  type FetchChallansResponse,
  type AnalyticsEvent,
  type AuthResponse,
  type User,
} from '@chukta/shared';
import { getDeviceId } from './device';
import { getSessionToken } from './session';

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  schema: z.ZodType<T> | null,
  init?: RequestInit,
): Promise<T> {
  const token = getSessionToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      // A valid Bearer session takes precedence server-side; the device id is
      // the guest fallback.
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      'x-device-id': getDeviceId(),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* keep default */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  const json = await res.json();
  return schema ? schema.parse(json) : (json as T);
}

// --- Vehicles ---
export const listVehicles = () => request('/vehicles', z.array(vehicleSchema));
export const createVehicle = (input: CreateVehicleInput): Promise<Vehicle> =>
  request('/vehicles', vehicleSchema, { method: 'POST', body: JSON.stringify(input) });
export const deleteVehicle = (id: string) =>
  request(`/vehicles/${id}`, null, { method: 'DELETE' });

// --- Challans ---
export const listChallans = () => request('/challans', z.array(challanSchema));
export const createChallan = (input: CreateChallanInput): Promise<Challan> =>
  request('/challans', challanSchema, { method: 'POST', body: JSON.stringify(input) });
export const deleteChallan = (id: string) =>
  request(`/challans/${id}`, null, { method: 'DELETE' });

// --- Disputes ---
export const listDisputes = () => request('/disputes', z.array(disputeSchema));
export const createDispute = (input: CreateDisputeInput): Promise<Dispute> =>
  request('/disputes', disputeSchema, { method: 'POST', body: JSON.stringify(input) });
export const setDisputeFiled = (id: string, filed: boolean): Promise<Dispute> =>
  request(`/disputes/${id}`, disputeSchema, {
    method: 'PATCH',
    body: JSON.stringify({ filed }),
  });
export const deleteDispute = (id: string) =>
  request(`/disputes/${id}`, null, { method: 'DELETE' });

// --- Providers (challan-data fetch) ---
export const listProviders = () => request('/providers', z.array(providerInfoSchema));
export const fetchVehicleChallans = (
  vehicleId: string,
  providerId: string,
  consent?: boolean,
): Promise<FetchChallansResponse> =>
  request(`/vehicles/${vehicleId}/fetch-challans`, fetchChallansResponseSchema, {
    method: 'POST',
    body: JSON.stringify({ providerId, ...(consent !== undefined ? { consent } : {}) }),
  });

// --- Demo data (opt-in) ---
export const loadDemo = () =>
  request('/demo/load', z.object({ vehicles: z.number(), challans: z.number() }), {
    method: 'POST',
  });

// --- Analytics sink (fire-and-forget; never throws to callers) ---
export const postAnalytics = (event: AnalyticsEvent): void => {
  void request('/analytics', null, { method: 'POST', body: JSON.stringify(event) }).catch(
    () => {},
  );
};

// --- Auth ---
export const googleSignIn = (idToken: string, deviceId: string): Promise<AuthResponse> =>
  request('/auth/google', authResponseSchema, {
    method: 'POST',
    body: JSON.stringify({ idToken, deviceId }),
  });
export const fetchMe = (): Promise<User> => request('/auth/me', userSchema);

export { ApiError };
