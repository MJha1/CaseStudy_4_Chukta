import type { ChallanStatus } from './schemas.js';

/** The statutory pay window before escalation, in days. */
export const PAY_WINDOW_DAYS = 60;

/** Days-left threshold below which the deadline is "due soon" (warn styling). */
export const WARN_THRESHOLD_DAYS = 15;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parse an ISO date string to a UTC-midnight timestamp (date-only, tz-safe). */
function toUtcMidnight(iso: string): number {
  const d = new Date(iso);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Whole days elapsed since `challanDate` relative to `now` (default: today).
 * Both are normalised to UTC midnight so the result is not affected by the
 * time of day. Never negative for past dates; can be negative for future dates.
 */
export function daysSince(challanDate: string, now: Date = new Date()): number {
  const start = toUtcMidnight(challanDate);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - start) / MS_PER_DAY);
}

/**
 * Days remaining in the 60-day pay window. Negative once the window has passed.
 */
export function daysLeft(challanDate: string, now: Date = new Date()): number {
  return PAY_WINDOW_DAYS - daysSince(challanDate, now);
}

/**
 * Derive a challan's status from its date (spec §4):
 *   days > 60 → overdue, days > 35 → due, else pending.
 * An explicitly-paid challan keeps its 'paid' status and is not re-derived.
 */
export function deriveStatus(challanDate: string, now: Date = new Date()): ChallanStatus {
  const days = daysSince(challanDate, now);
  if (days > 60) return 'overdue';
  if (days > 35) return 'due';
  return 'pending';
}

export type DeadlineTone = 'ok' | 'warn' | 'danger';

/** Tone for the days-left chip: danger once overdue, warn under 15 days, else ok. */
export function deadlineTone(challanDate: string, now: Date = new Date()): DeadlineTone {
  const left = daysLeft(challanDate, now);
  if (left < 0) return 'danger';
  if (left < WARN_THRESHOLD_DAYS) return 'warn';
  return 'ok';
}

export type MilestoneKey =
  | 'issued'
  | 'payBy60'
  | 'fineIncreases'
  | 'virtualCourt'
  | 'dlSuspended';

export interface Milestone {
  key: MilestoneKey;
  label: string;
  /** Days from issue at which this milestone is reached. */
  atDay: number;
  passed: boolean;
  /** The next upcoming (not-yet-passed) milestone. */
  imminent: boolean;
}

const MILESTONE_DEFS: { key: MilestoneKey; label: string; atDay: number }[] = [
  { key: 'issued', label: 'Issued', atDay: 0 },
  { key: 'payBy60', label: 'Pay by 60', atDay: 60 },
  { key: 'fineIncreases', label: 'Fine ↑', atDay: 75 },
  { key: 'virtualCourt', label: 'Virtual Court', atDay: 90 },
  { key: 'dlSuspended', label: 'DL suspended', atDay: 120 },
];

/**
 * The escalation timeline (spec §F2):
 * Issued → Pay by 60 → Fine ↑ → Virtual Court → DL suspended.
 * Marks each passed milestone and the single imminent (next upcoming) one.
 */
export function escalationTimeline(
  challanDate: string,
  now: Date = new Date(),
): Milestone[] {
  const days = daysSince(challanDate, now);
  let imminentAssigned = false;
  return MILESTONE_DEFS.map((def) => {
    const passed = days >= def.atDay;
    let imminent = false;
    if (!passed && !imminentAssigned) {
      imminent = true;
      imminentAssigned = true;
    }
    return { ...def, passed, imminent };
  });
}

function formatCalDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

/**
 * Build a Google Calendar "add event" URL for an all-day reminder ~5 days
 * before day 60 of the pay window. If that date is already in the past, the
 * reminder is clamped to tomorrow so the link is always actionable.
 */
export function calendarUrl(
  plate: string,
  challanDate: string,
  now: Date = new Date(),
): string {
  const issued = toUtcMidnight(challanDate);
  let reminder = new Date(issued + (PAY_WINDOW_DAYS - 5) * MS_PER_DAY);

  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + MS_PER_DAY,
  );
  if (reminder.getTime() < tomorrow.getTime()) {
    reminder = tomorrow;
  }

  // All-day events use [start, end) with end = start + 1 day.
  const start = formatCalDate(reminder);
  const end = formatCalDate(new Date(reminder.getTime() + MS_PER_DAY));

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Challan deadline — ${plate} (Chukta)`,
    dates: `${start}/${end}`,
    details:
      'Reminder to pay or dispute this traffic challan before the 60-day window closes. Opened from Chukta.',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
