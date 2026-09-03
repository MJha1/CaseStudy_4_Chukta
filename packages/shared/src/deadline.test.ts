import { describe, it, expect } from 'vitest';
import {
  daysSince,
  daysLeft,
  deriveStatus,
  deadlineTone,
  escalationTimeline,
  calendarUrl,
} from './deadline.js';

// Fixed "now" so tests are deterministic.
const NOW = new Date('2026-09-03T10:00:00Z');

function isoDaysAgo(n: number): string {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

describe('daysSince', () => {
  it('is 0 for today', () => {
    expect(daysSince(isoDaysAgo(0), NOW)).toBe(0);
  });
  it('counts whole days regardless of time of day', () => {
    expect(daysSince('2026-08-04', NOW)).toBe(30);
  });
  it('is negative for a future date', () => {
    expect(daysSince(isoDaysAgo(-5), NOW)).toBe(-5);
  });
});

describe('daysLeft', () => {
  it('is 60 on the issue day', () => {
    expect(daysLeft(isoDaysAgo(0), NOW)).toBe(60);
  });
  it('goes negative past the window', () => {
    expect(daysLeft(isoDaysAgo(70), NOW)).toBe(-10);
  });
});

describe('deriveStatus', () => {
  it('is pending within 35 days', () => {
    expect(deriveStatus(isoDaysAgo(10), NOW)).toBe('pending');
    expect(deriveStatus(isoDaysAgo(35), NOW)).toBe('pending');
  });
  it('is due after 35 days', () => {
    expect(deriveStatus(isoDaysAgo(36), NOW)).toBe('due');
    expect(deriveStatus(isoDaysAgo(60), NOW)).toBe('due');
  });
  it('is overdue after 60 days', () => {
    expect(deriveStatus(isoDaysAgo(61), NOW)).toBe('overdue');
  });
});

describe('deadlineTone', () => {
  it('is ok with plenty of time', () => {
    expect(deadlineTone(isoDaysAgo(10), NOW)).toBe('ok');
  });
  it('warns under 15 days left', () => {
    expect(deadlineTone(isoDaysAgo(50), NOW)).toBe('warn'); // 10 left
  });
  it('is danger once overdue', () => {
    expect(deadlineTone(isoDaysAgo(61), NOW)).toBe('danger');
  });
});

describe('escalationTimeline', () => {
  it('marks only Issued as passed on day 0 and Pay by 60 as imminent', () => {
    const t = escalationTimeline(isoDaysAgo(0), NOW);
    expect(t.find((m) => m.key === 'issued')?.passed).toBe(true);
    expect(t.find((m) => m.key === 'payBy60')?.passed).toBe(false);
    expect(t.find((m) => m.key === 'payBy60')?.imminent).toBe(true);
  });
  it('marks exactly one imminent milestone', () => {
    const t = escalationTimeline(isoDaysAgo(70), NOW);
    expect(t.filter((m) => m.imminent)).toHaveLength(1);
    expect(t.find((m) => m.imminent)?.key).toBe('fineIncreases');
  });
  it('has no imminent milestone once all are passed', () => {
    const t = escalationTimeline(isoDaysAgo(200), NOW);
    expect(t.every((m) => m.passed)).toBe(true);
    expect(t.filter((m) => m.imminent)).toHaveLength(0);
  });
});

describe('calendarUrl', () => {
  it('builds a prefilled all-day event 5 days before day 60', () => {
    const url = calendarUrl('DL3CAB1234', isoDaysAgo(0), NOW);
    expect(url).toContain('calendar.google.com/calendar/render');
    expect(url).toContain('action=TEMPLATE');
    // issued 2026-09-03, +55 days => 2026-10-28
    expect(url).toContain('dates=20261028');
    expect(decodeURIComponent(url.replace(/\+/g, ' '))).toContain(
      'Challan deadline — DL3CAB1234 (Chukta)',
    );
  });
  it('clamps a past reminder to tomorrow', () => {
    const url = calendarUrl('DL3CAB1234', isoDaysAgo(90), NOW);
    // tomorrow = 2026-09-04
    expect(url).toContain('dates=20260904');
  });
});
