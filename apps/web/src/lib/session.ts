const TOKEN_KEY = 'chukta.session';
const MODE_KEY = 'chukta.mode'; // 'guest' once the user chooses guest mode

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
    /* ignore */
  }
}
function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const getSessionToken = () => safeGet(TOKEN_KEY);
export const setSessionToken = (t: string) => safeSet(TOKEN_KEY, t);
export const clearSessionToken = () => safeRemove(TOKEN_KEY);

export const isGuestChosen = () => safeGet(MODE_KEY) === 'guest';
export const setGuestChosen = () => safeSet(MODE_KEY, 'guest');
export const clearGuestChosen = () => safeRemove(MODE_KEY);
