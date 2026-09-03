import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import { AppLayout } from '@/components/AppLayout';
import { ToastProvider } from '@/components/Toast';
import { AuthProvider, useAuth } from '@/lib/auth';
import { HomePage } from '@/pages/HomePage';
import { ChallansPage } from '@/pages/ChallansPage';
import { DisputesPage } from '@/pages/DisputesPage';
import { ProPage } from '@/pages/ProPage';
import { DrafterPage } from '@/pages/DrafterPage';
import { AddVehiclePage } from '@/pages/AddVehiclePage';
import { VehicleDetailPage } from '@/pages/VehicleDetailPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SignInPage } from '@/pages/SignInPage';

const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? 'unconfigured';

function Splash() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] items-center justify-center bg-bg">
      <p className="text-sm text-muted">Loading…</p>
    </div>
  );
}

/** Show the sign-in screen until the user signs in or chooses guest mode. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  if (status === 'loading') return <Splash />;
  if (status === 'signedout') return <SignInPage />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/challans" element={<ChallansPage />} />
        <Route path="/disputes" element={<DisputesPage />} />
        <Route path="/pro" element={<ProPage />} />
        <Route path="/dispute/new" element={<DrafterPage />} />
        <Route path="/vehicles/new" element={<AddVehiclePage />} />
        <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <AuthGate>
              <AppRoutes />
            </AuthGate>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
