import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, ReceiptText, Gavel, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/challans', label: 'Challans', icon: ReceiptText, end: false },
  { to: '/disputes', label: 'Disputes', icon: Gavel, end: false },
  { to: '/pro', label: 'Pro', icon: Sparkles, end: false },
];

export function AppLayout() {
  const location = useLocation();
  // The drafter is a focused full-screen flow — hide the tab bar there.
  const hideNav = location.pathname.startsWith('/dispute/new');

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-bg shadow-black/5 sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-[2rem] sm:shadow-2xl sm:ring-1 sm:ring-line">
      <main className={cn('flex-1 overflow-y-auto', !hideNav && 'pb-24')}>
        <Outlet />
      </main>

      {!hideNav && (
        <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[440px] border-t border-line bg-paper/95 backdrop-blur sm:sticky sm:rounded-b-[2rem]">
          <div className="flex items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-1.5">
            {TABS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition-colors',
                    isActive ? 'text-brand' : 'text-muted hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('size-[22px]', isActive && 'stroke-[2.5]')} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
