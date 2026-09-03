import { z } from 'zod';
import {
  vehicleSchema,
  challanSchema,
  disputeSchema,
  type CreateVehicleInput,
  type CreateChallanInput,
  type CreateDisputeInput,
  type Vehicle,
  type Challan,
  type Dispute,
} from '@chukta/shared';
import { getDeviceId } from './device';

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
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
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

export { ApiError };
