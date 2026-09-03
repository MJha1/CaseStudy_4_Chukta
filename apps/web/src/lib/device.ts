const KEY = 'chukta.deviceId';

/** Guarded localStorage read. */
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore quota / private-mode failures */
  }
}

/**
 * A stable anonymous device id, generated once and stored on-device. It scopes
 * this browser's data on the server without any account or PII.
 */
export function getDeviceId(): string {
  let id = safeGet(KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    safeSet(KEY, id);
  }
  return id;
}
