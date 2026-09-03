import type { GroundKey } from './schemas.js';

export type ExtraFieldKey = 'saleDate' | 'receipt';

export interface Ground {
  key: GroundKey;
  title: string;
  /** Short one-liner shown on the ground picker. */
  blurb: string;
  /** Evidence checklist shown for this ground and listed as enclosures. */
  evidence: string[];
  /** Optional conditional field this ground needs. */
  extraField?: { key: ExtraFieldKey; label: string; placeholder: string };
  /** The paragraph inserted into the grievance letter. */
  paragraph: (ctx: { saleDate?: string; receipt?: string }) => string;
}

export const GROUNDS: Record<GroundKey, Ground> = {
  wrongvehicle: {
    key: 'wrongvehicle',
    title: 'Not my vehicle / wrong vehicle class',
    blurb: 'The offence describes a different kind of vehicle than mine.',
    evidence: [
      'RC copy (shows vehicle class & model)',
      'Photos of your actual vehicle',
      'A past challan showing the correct vehicle',
    ],
    paragraph: () =>
      'The offence described pertains to a vehicle of a different class or description than my registered vehicle. My vehicle could not have committed the stated offence, which indicates a number-plate misread by the ANPR camera or a cloned/duplicate plate in circulation under my registration number.',
  },
  sold: {
    key: 'sold',
    title: 'Vehicle already sold',
    blurb: 'The challan was issued after I sold the vehicle.',
    evidence: [
      'Sale agreement / delivery note',
      'Forms 29 & 30 (transfer of ownership)',
      'Buyer / transfer acknowledgement',
    ],
    extraField: {
      key: 'saleDate',
      label: 'Date the vehicle was sold',
      placeholder: 'When did you hand over the vehicle?',
    },
    paragraph: ({ saleDate }) =>
      `I sold and handed over possession of this vehicle on ${
        saleDate ? prettyDate(saleDate) : '{sale date}'
      } and applied for ownership transfer (Forms 29/30). The alleged offence occurred after this date, and liability therefore rests with the purchaser, not with me.`,
  },
  duplicate: {
    key: 'duplicate',
    title: 'Duplicate challan',
    blurb: 'The same offence was already challaned once.',
    evidence: [
      'Screenshot of the original challan',
      'Payment receipt (if the original was paid)',
    ],
    paragraph: () =>
      'This challan duplicates an existing challan issued for the same offence, at the same location, on the same date and time. Two challans have been generated for a single alleged violation.',
  },
  paid: {
    key: 'paid',
    title: 'Already paid',
    blurb: 'I already paid this fine but it still shows pending.',
    evidence: ['Payment receipt / transaction id', 'Bank / UPI statement entry'],
    extraField: {
      key: 'receipt',
      label: 'Receipt / transaction id',
      placeholder: 'e.g. UPI ref or portal receipt no.',
    },
    paragraph: ({ receipt }) =>
      `The fine for this challan was already paid vide receipt/transaction ID ${
        receipt ? receipt : '{receipt}'
      }, yet the challan continues to reflect as pending. I request reconciliation of the payment and closure of the challan.`,
  },
  notthere: {
    key: 'notthere',
    title: "My vehicle wasn't there",
    blurb: 'My vehicle was somewhere else at that time.',
    evidence: [
      'Google Maps timeline export',
      'FASTag / toll logs',
      'Parking / office / society CCTV',
    ],
    paragraph: () =>
      'My vehicle was not present at the stated location at the stated date and time. Location evidence for the vehicle’s actual whereabouts on the day is enclosed.',
  },
};

export const GROUND_LIST: Ground[] = Object.values(GROUNDS);

/** Format an ISO/parseable date as e.g. "3 September 2026". */
export function prettyDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
