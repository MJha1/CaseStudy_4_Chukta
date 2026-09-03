import { describe, it, expect } from 'vitest';
import { generateLetter, HOW_TO_FILE_STEPS } from './letter.js';
import type { LetterInput } from './letter.js';

const TODAY = new Date('2026-09-03T10:00:00Z');

const base: LetterInput = {
  plate: 'DL3CAB1234',
  challanNo: 'CH-99',
  offence: 'Overspeeding',
  amount: 2000,
  date: '2026-07-15',
  city: 'Delhi',
  location: 'Ring Road, near AIIMS',
  ground: 'wrongvehicle',
  name: 'Asha Rao',
  mobile: '9876543210',
};

describe('generateLetter', () => {
  it('personalises the address, subject, plate, offence and amount', () => {
    const l = generateLetter(base, TODAY);
    expect(l).toContain('The Grievance / Notice Branch Officer,\nDelhi Traffic Police');
    expect(l).toContain('e-challan no. CH-99 issued to vehicle DL3CAB1234');
    expect(l).toContain('"Overspeeding"');
    expect(l).toContain('₹2,000'); // Indian grouping
    expect(l).toContain('dated 15 July 2026');
    expect(l).toContain('Asha Rao');
    expect(l).toContain('Mobile: 9876543210');
    expect(l).toContain('Date: 3 September 2026');
  });

  it('uses the wrongvehicle ground title and paragraph', () => {
    const l = generateLetter(base, TODAY);
    expect(l).toContain('Not my vehicle / wrong vehicle class');
    expect(l).toContain('cloned/duplicate plate');
  });

  it('inserts the sale date for the sold ground', () => {
    const l = generateLetter(
      { ...base, ground: 'sold', saleDate: '2026-06-01' },
      TODAY,
    );
    expect(l).toContain('handed over possession of this vehicle on 1 June 2026');
    expect(l).toContain('Forms 29 & 30');
  });

  it('inserts the receipt id for the paid ground', () => {
    const l = generateLetter(
      { ...base, ground: 'paid', receipt: 'UPI-ABC-123' },
      TODAY,
    );
    expect(l).toContain('receipt/transaction ID UPI-ABC-123');
  });

  it('adds the screenshot enclosure only when attached', () => {
    expect(generateLetter(base, TODAY)).not.toContain('Screenshot of the e-challan');
    expect(
      generateLetter({ ...base, hasScreenshot: true }, TODAY),
    ).toContain('Screenshot of the e-challan');
  });

  it('includes the optional note when provided', () => {
    const l = generateLetter({ ...base, note: 'I was abroad that week.' }, TODAY);
    expect(l).toContain('Additional details: I was abroad that week.');
  });

  it('omits the challan number cleanly when absent', () => {
    const l = generateLetter({ ...base, challanNo: undefined }, TODAY);
    expect(l).toContain('e-challan issued to vehicle DL3CAB1234');
    expect(l).not.toContain('(No.');
  });

  it('falls back to placeholders for missing name/mobile', () => {
    const l = generateLetter(
      { ...base, name: undefined, mobile: undefined },
      TODAY,
    );
    expect(l).toContain('{your name}');
    expect(l).toContain('Mobile: {your mobile}');
  });
});

describe('HOW_TO_FILE_STEPS', () => {
  it('has 5 steps', () => {
    expect(HOW_TO_FILE_STEPS).toHaveLength(5);
  });
});
