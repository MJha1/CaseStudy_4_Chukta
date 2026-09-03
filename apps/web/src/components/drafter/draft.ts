import type { GroundKey, LetterInput } from '@chukta/shared';

/** Form state for the 3-step drafter. Numeric/screenshot kept as strings. */
export interface DraftState {
  plate: string;
  challanNo: string;
  amount: string;
  date: string;
  city: string;
  location: string;
  offence: string;
  screenshot?: string; // data URL, on-device only
  ground?: GroundKey;
  saleDate: string;
  receipt: string;
  name: string;
  mobile: string;
  note: string;
}

export const emptyDraft: DraftState = {
  plate: '',
  challanNo: '',
  amount: '',
  date: '',
  city: '',
  location: '',
  offence: '',
  screenshot: undefined,
  ground: undefined,
  saleDate: '',
  receipt: '',
  name: '',
  mobile: '',
  note: '',
};

export interface Step1Errors {
  plate?: string;
  amount?: string;
  date?: string;
  offence?: string;
}

/** Validate the required (*) Step-1 fields (spec §F1). */
export function validateStep1(d: DraftState): Step1Errors {
  const errors: Step1Errors = {};
  if (d.plate.replace(/\s+/g, '').length < 6) {
    errors.plate = 'Enter a valid registration number (min 6 characters).';
  }
  const amount = Number(d.amount);
  if (!d.amount || Number.isNaN(amount) || amount < 0) {
    errors.amount = 'Enter the fine amount in rupees.';
  }
  if (!d.date) {
    errors.date = 'Enter the challan date.';
  }
  if (!d.offence.trim()) {
    errors.offence = 'Enter the offence as written on the challan.';
  }
  return errors;
}

export function hasErrors(e: Step1Errors): boolean {
  return Object.keys(e).length > 0;
}

/** Build the LetterInput consumed by generateLetter() from the draft. */
export function toLetterInput(d: DraftState): LetterInput {
  return {
    plate: d.plate.trim().toUpperCase().replace(/\s+/g, ''),
    challanNo: d.challanNo.trim() || undefined,
    offence: d.offence.trim(),
    amount: Number(d.amount) || 0,
    date: d.date,
    city: d.city.trim() || undefined,
    location: d.location.trim() || undefined,
    ground: d.ground!,
    note: d.note.trim() || undefined,
    saleDate: d.saleDate || undefined,
    receipt: d.receipt.trim() || undefined,
    name: d.name.trim() || undefined,
    mobile: d.mobile.trim() || undefined,
    hasScreenshot: Boolean(d.screenshot),
  };
}
