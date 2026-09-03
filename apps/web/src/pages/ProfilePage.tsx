import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { ArrowLeft, LogOut, ShieldCheck, UserRound, Moon, Sun } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/components/Toast';
import { cn } from '@/lib/utils';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

function initials(name?: string, email?: string): string {
  const src = name?.trim() || email || '';
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] ?? 'U').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

export function ProfilePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { status, user, signInWithGoogle, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate(-1)} aria-label="Back" className="text-ink">
          <ArrowLeft className="size-5" />
        </button>
        <p className="text-[15px] font-bold text-ink">Profile</p>
      </header>

      <div className="space-y-4 px-4 py-5">
        {/* Appearance */}
        <div>
          <p className="mb-2 px-1 text-[13px] font-bold text-ink">Appearance</p>
          <div className="grid grid-cols-2 gap-2">
            {(['dark', 'light'] as const).map((t) => {
              const Icon = t === 'dark' ? Moon : Sun;
              return (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-2xl border p-3.5 text-sm font-semibold capitalize transition-colors',
                    theme === t
                      ? 'border-brand bg-brand-soft text-brand-dark'
                      : 'border-line bg-paper text-ink hover:border-brand/40',
                  )}
                >
                  <Icon className="size-4" /> {t}
                </button>
              );
            })}
          </div>
        </div>

        {status === 'signedin' && user ? (
          <>
            <Card>
              <CardBody className="flex items-center gap-4">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="size-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-16 items-center justify-center rounded-full bg-brand-soft text-[20px] font-bold text-brand-dark">
                    {initials(user.name, user.email)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-[17px] font-bold text-ink">{user.name ?? 'You'}</p>
                  <p className="truncate text-[13px] text-muted">{user.email}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-brand">
                    <ShieldCheck className="size-3.5" /> Signed in with Google
                  </span>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <p className="text-[13px] text-muted">
                  Your vehicles, challans and disputes sync to this account and follow you on any
                  device you sign in on.
                </p>
              </CardBody>
            </Card>

            <Button
              variant="outline"
              size="block"
              className="text-danger"
              onClick={() => {
                signOut();
                toast('Signed out');
                navigate('/');
              }}
            >
              <LogOut className="size-4" /> Sign out
            </Button>
          </>
        ) : (
          <>
            <Card>
              <CardBody className="flex flex-col items-center py-8 text-center">
                <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-bg text-muted">
                  <UserRound className="size-7" />
                </div>
                <p className="text-[15px] font-bold text-ink">You're a guest</p>
                <p className="mb-4 mt-1 max-w-[260px] text-[13px] text-muted">
                  Sign in with Google to sync across devices. Your current data will be moved to
                  your account.
                </p>
                {CLIENT_ID ? (
                  <GoogleLogin
                    onSuccess={(cred) => {
                      if (cred.credential) {
                        signInWithGoogle(cred.credential)
                          .then(() => toast('Signed in'))
                          .catch(() => toast('Sign-in failed'));
                      }
                    }}
                    onError={() => toast('Sign-in failed')}
                    shape="pill"
                    text="signin_with"
                  />
                ) : (
                  <p className="rounded-xl bg-warn-soft px-3 py-2 text-[12px] font-semibold text-warn">
                    Google sign-in isn't configured on this deployment.
                  </p>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
