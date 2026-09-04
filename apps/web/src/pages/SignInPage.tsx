import { GoogleLogin } from '@react-oauth/google';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function SignInPage() {
  const { signInWithGoogle, continueAsGuest } = useAuth();
  const toast = useToast();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-bg sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-[2.25rem] sm:shadow-2xl sm:ring-1 sm:ring-line">
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
          <ShieldCheck className="size-9" />
        </div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Chukta</h1>
        <p className="mt-2 max-w-[280px] text-[14px] text-muted">
          Find every challan on your vehicles, flag the wrong ones, and dispute or clear them
          before your licence is at risk.
        </p>

        <div className="mt-8 flex w-full max-w-[300px] flex-col items-center gap-3">
          {CLIENT_ID ? (
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={(cred) => {
                  if (cred.credential) {
                    signInWithGoogle(cred.credential).catch(() => toast('Sign-in failed'));
                  }
                }}
                onError={() => toast('Sign-in failed')}
                shape="pill"
                text="continue_with"
                width="300"
              />
            </div>
          ) : (
            <p className="rounded-xl bg-paper px-3 py-2 text-[12px] font-medium text-muted ring-1 ring-line">
              Google sign-in isn't configured on this deployment.
            </p>
          )}

          <button
            onClick={continueAsGuest}
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-ink"
          >
            Continue as guest <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      <p className="px-8 pb-8 text-center text-[11px] text-muted">
        Sign in to sync your vehicles and disputes across devices. Guest data stays on this device
        until you sign in.
      </p>
    </div>
  );
}
