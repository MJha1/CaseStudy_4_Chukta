import mixpanel from 'mixpanel-browser';
import type { AnalyticsEventName } from '@chukta/shared';
import { postAnalytics } from './api';

type Props = Record<string, string | number | boolean>;

const TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN as string | undefined;
const COUNTS_KEY = 'chukta.eventCounts';

let ready = false;

function init(): void {
  if (ready) return;
  ready = true;
  if (TOKEN) {
    mixpanel.init(TOKEN, { track_pageview: false, persistence: 'localStorage' });
  }
}

function bumpLocalCount(name: string): void {
  try {
    const raw = localStorage.getItem(COUNTS_KEY);
    const counts: Record<string, number> = raw ? JSON.parse(raw) : {};
    counts[name] = (counts[name] ?? 0) + 1;
    localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
  } catch {
    /* ignore */
  }
}

/** Local per-event counters for the offline demo (spec §F7). */
export function getEventCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(COUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Fire an analytics event. Uses Mixpanel when a token is configured, otherwise
 * logs to the console. Always keeps a local counter so the app works offline
 * and with no token.
 */
export function track(name: AnalyticsEventName, props?: Props): void {
  init();
  bumpLocalCount(name);
  if (TOKEN) {
    mixpanel.track(name, props);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${name}`, props ?? {});
  }
  // Also send to the server sink so capture is real end-to-end without Mixpanel.
  postAnalytics({ name, props });
}
