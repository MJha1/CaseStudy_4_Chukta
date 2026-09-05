import { z } from 'zod';

/**
 * Zod contracts for Chukta. These are the single source of truth for the
 * shapes shared between the web app and the API. Derived TypeScript types are
 * exported alongside each schema.
 *
 * Data model mirrors CHUKTA_BUILD_SPEC.md §4.
 */

export const vehicleClassSchema = z.enum(['LMV', '2W', 'GOODS', 'TRANSPORT']);
export type VehicleClass = z.infer<typeof vehicleClassSchema>;

export const groundKeySchema = z.enum([
  'wrongvehicle',
  'sold',
  'duplicate',
  'paid',
  'notthere',
]);
export type GroundKey = z.infer<typeof groundKeySchema>;

export const challanStatusSchema = z.enum(['pending', 'due', 'overdue', 'paid']);
export type ChallanStatus = z.infer<typeof challanStatusSchema>;

export const challanFlagSchema = z.enum(['classMismatch', 'sold', 'duplicate']);
export type ChallanFlag = z.infer<typeof challanFlagSchema>;

/** A vehicle plate: uppercased, at least 6 alphanumeric chars. */
export const plateSchema = z
  .string()
  .trim()
  .transform((s) => s.toUpperCase().replace(/\s+/g, ''))
  .pipe(z.string().min(6, 'Enter a valid registration number (min 6 characters)'));

// ---------------------------------------------------------------------------
// Vehicle
// ---------------------------------------------------------------------------

export const vehicleSchema = z.object({
  id: z.string(),
  plate: plateSchema,
  model: z.string().optional(),
  vehicleClass: vehicleClassSchema.optional(),
  soldDate: z.string().optional(), // ISO date; presence => "sold" checks apply
  isSample: z.boolean().optional(),
});
export type Vehicle = z.infer<typeof vehicleSchema>;

export const createVehicleSchema = vehicleSchema.omit({ id: true, isSample: true });
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

// ---------------------------------------------------------------------------
// Challan
// ---------------------------------------------------------------------------

export const challanSchema = z.object({
  id: z.string(),
  vehicleId: z.string(),
  offence: z.string().min(1),
  section: z.string().optional(),
  amount: z.number().nonnegative(),
  date: z.string(), // ISO
  location: z.string().optional(),
  city: z.string().optional(),
  evidenceNote: z.string().optional(),
  status: challanStatusSchema,
  flag: challanFlagSchema.nullish(),
  isSample: z.boolean().optional(),
});
export type Challan = z.infer<typeof challanSchema>;

export const createChallanSchema = challanSchema
  .omit({ id: true, status: true, flag: true, isSample: true })
  .extend({
    // status/flag are derived server-side; callers may not set them.
    amount: z.number().nonnegative(),
  });
export type CreateChallanInput = z.infer<typeof createChallanSchema>;

// ---------------------------------------------------------------------------
// Dispute (a real, user-created dispute)
// ---------------------------------------------------------------------------

export const disputeSchema = z.object({
  id: z.string(),
  plate: plateSchema,
  challanNo: z.string().optional(),
  offence: z.string().min(1),
  amount: z.number().nonnegative(),
  date: z.string(), // ISO date of the challan
  city: z.string().optional(),
  location: z.string().optional(),
  ground: groundKeySchema,
  note: z.string().optional(),
  saleDate: z.string().optional(),
  receipt: z.string().optional(),
  name: z.string().optional(),
  mobile: z.string().optional(),
  hasScreenshot: z.boolean().optional(),
  letter: z.string(),
  filed: z.boolean(),
  createdAt: z.number(),
});
export type Dispute = z.infer<typeof disputeSchema>;

/** Payload the client sends to create a dispute. The server assigns id/createdAt. */
export const createDisputeSchema = disputeSchema.omit({
  id: true,
  createdAt: true,
  filed: true,
});
export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;

export const updateDisputeSchema = z
  .object({
    filed: z.boolean(),
  })
  .partial();
export type UpdateDisputeInput = z.infer<typeof updateDisputeSchema>;

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export const analyticsEventNameSchema = z.enum([
  'vehicle_added',
  'drafter_opened',
  'dispute_drafted',
  'reminder_clicked',
  'dispute_saved',
  'dispute_filed',
  'challan_viewed',
]);
export type AnalyticsEventName = z.infer<typeof analyticsEventNameSchema>;

export const analyticsEventSchema = z.object({
  name: analyticsEventNameSchema,
  props: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

// ---------------------------------------------------------------------------
// Challan-data providers (the "fetch challans" seam)
// ---------------------------------------------------------------------------

/**
 * Provider mode drives the UI badge and the consent step:
 *   - 'demo'      — plain simulated vendor ("Demo" badge, no consent needed)
 *   - 'live-demo' — simulated data presented through the real-time lookup flow
 *                   (consent + latency + detailed records), badged "Live · demo"
 *                   so it is never mistaken for a genuine government source
 *   - 'live'      — a real licensed data source ("Live" badge)
 */
export const providerModeSchema = z.enum(['demo', 'live-demo', 'live']);
export type ProviderMode = z.infer<typeof providerModeSchema>;

/** Metadata for a challan-data provider the app can fetch from. */
export const providerInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** True for a simulated/demo provider; false for a real licensed data source. */
  simulated: z.boolean(),
  /** Presentation/consent mode; defaults to 'demo'/'live' derived from `simulated`. */
  mode: providerModeSchema.optional(),
  note: z.string().optional(),
});
export type ProviderInfo = z.infer<typeof providerInfoSchema>;

/** A challan as returned by a provider (before it is persisted to a vehicle). */
export const providerChallanSchema = z.object({
  offence: z.string().min(1),
  section: z.string().optional(),
  amount: z.number().nonnegative(),
  date: z.string(),
  location: z.string().optional(),
  city: z.string().optional(),
  evidenceNote: z.string().optional(),
});
export type ProviderChallan = z.infer<typeof providerChallanSchema>;

/** Response of a fetch-challans call: which provider ran and what it returned. */
export const fetchChallansResponseSchema = z.object({
  provider: providerInfoSchema,
  challans: z.array(providerChallanSchema),
});
export type FetchChallansResponse = z.infer<typeof fetchChallansResponseSchema>;

export const fetchChallansRequestSchema = z.object({
  providerId: z.string().min(1),
  /** Explicit customer consent — required by live providers (e.g. InstantPay). */
  consent: z.boolean().optional(),
});
export type FetchChallansRequest = z.infer<typeof fetchChallansRequestSchema>;

// ---------------------------------------------------------------------------
// Auth (Google sign-in)
// ---------------------------------------------------------------------------

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().optional(),
  picture: z.string().optional(),
});
export type User = z.infer<typeof userSchema>;

export const authResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const googleAuthRequestSchema = z.object({
  idToken: z.string().min(10),
  /** The current guest device id, so its data can be claimed into the account. */
  deviceId: z.string().optional(),
});
export type GoogleAuthRequest = z.infer<typeof googleAuthRequestSchema>;
