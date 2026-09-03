import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@chukta/shared';
import { googleSignIn, fetchMe } from './api';
import { getDeviceId } from './device';
import {
  getSessionToken,
  setSessionToken,
  clearSessionToken,
  isGuestChosen,
  setGuestChosen,
  clearGuestChosen,
} from './session';

type Status = 'loading' | 'signedin' | 'guest' | 'signedout';

interface AuthContextValue {
  status: Status;
  user: User | null;
  signInWithGoogle: (idToken: string) => Promise<void>;
  continueAsGuest: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  status: 'loading',
  user: null,
  signInWithGoogle: async () => {},
  continueAsGuest: () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (getSessionToken()) {
        try {
          const u = await fetchMe();
          if (!cancelled) {
            setUser(u);
            setStatus('signedin');
          }
          return;
        } catch {
          clearSessionToken(); // stale/expired token
        }
      }
      if (!cancelled) setStatus(isGuestChosen() ? 'guest' : 'signedout');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signInWithGoogle = useCallback(async (idToken: string) => {
    const res = await googleSignIn(idToken, getDeviceId());
    setSessionToken(res.token);
    clearGuestChosen();
    setUser(res.user);
    setStatus('signedin');
  }, []);

  const continueAsGuest = useCallback(() => {
    setGuestChosen();
    setStatus('guest');
  }, []);

  const signOut = useCallback(() => {
    clearSessionToken();
    clearGuestChosen();
    setUser(null);
    setStatus('signedout');
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, signInWithGoogle, continueAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
