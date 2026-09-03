import { GROUNDS, prettyDate } from './grounds.js';
import type { GroundKey } from './schemas.js';

export interface LetterInput {
  plate: string;
  challanNo?: string;
  offence: string;
  amount: number;
  date: string; // ISO date of the challan
  city?: string;
  location?: string;
  ground: GroundKey;
  note?: string;
  saleDate?: string;
  receipt?: string;
  name?: string;
  mobile?: string;
  hasScreenshot?: boolean;
}

function inr(amount: number): string {
  return amount.toLocaleString('en-IN');
}

/**
 * Generate the grievance letter (spec §5). Pure and deterministic given its
 * input plus `today` (defaulted), so it can run identically on client and API.
 */
export function generateLetter(input: LetterInput, today: Date = new Date()): string {
  const ground = GROUNDS[input.ground];
  const city = input.city?.trim() || 'City';
  const location = input.location?.trim() || 'the stated location';
  const challanNoLine = input.challanNo ? ` (No. ${input.challanNo})` : '';
  const subjectChallanNo = input.challanNo ? `no. ${input.challanNo} ` : '';

  const enclosures = [...ground.evidence];
  if (input.hasScreenshot) enclosures.push('Screenshot of the e-challan');
  const enclosuresBlock = enclosures
    .map((e, i) => `  ${i + 1}. ${e}`)
    .join('\n');

  const noteLine = input.note?.trim()
    ? `Additional details: ${input.note.trim()}`
    : '';

  const todayStr = prettyDate(today.toISOString());

  return `To,
The Grievance / Notice Branch Officer,
${city} Traffic Police

Subject: Request for cancellation of e-challan ${subjectChallanNo}issued to vehicle ${input.plate}

Respected Sir/Madam,

I am the registered owner of vehicle ${input.plate}. I have received an e-challan${challanNoLine}
dated ${prettyDate(input.date)} for "${input.offence}" with a fine of ₹${inr(input.amount)}, stated to have occurred
at ${location}.

I wish to contest this challan on the following ground: ${ground.title}.

${ground.paragraph({ saleDate: input.saleDate, receipt: input.receipt })}${
    noteLine ? `\n${noteLine}` : ''
  }

I request you to kindly review the enclosed evidence and cancel the above challan.
I am willing to provide any further information or appear as required.

Enclosures:
${enclosuresBlock}

Thanking you,
${input.name?.trim() || '{your name}'}
Mobile: ${input.mobile?.trim() || '{your mobile}'}
Date: ${todayStr}`;
}

/** The 5-step "how to file it" checklist (spec §5). */
export const HOW_TO_FILE_STEPS: string[] = [
  'Open echallan.parivahan.gov.in → "Complaint"',
  'Select your state, enter the challan / vehicle number',
  'Paste this letter in the description box',
  'Upload your evidence & screenshot',
  'Save the ticket ID — track it under Disputes',
];

export const COURT_NOTE =
  'If your challan is already in court, contest it at vcourts.gov.in instead.';
