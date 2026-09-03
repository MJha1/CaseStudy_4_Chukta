import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, ReceiptText, Gavel, Sparkles, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const LEFT_TABS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/challans', label: 'Challans', icon: ReceiptText, end: false },
];
const RIGHT_TABS = [
  { to: '/disputes', label: 'Disputes', icon: Gavel, end: false },
  { to: '/pro', label: 'Pro', icon: Sparkles, end: false },
];

function Tab({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  end: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10.5px] font-semibold transition-colors',
          isActive ? 'text-brand' : 'text-muted hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('size-[21px]', isActive && 'stroke-[2.5]')} />
          {label}
        </>
      )}
    </NavLink>
  );
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Focused full-screen flows hide the tab bar.
  const hideNav =
    location.pathname.startsWith('/dispute/new') ||
    location.pathname.startsWith('/vehicles/new');

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-bg sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:overflow-hidden sm:rounded-[2.25rem] sm:shadow-2xl sm:ring-1 sm:ring-line">
      <main className={cn('flex-1 overflow-y-auto', !hideNav && 'pb-28')}>
        <Outlet />
      </main>

      {!hideNav && (
        <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[440px] border-t border-line bg-paper/95 backdrop-blur sm:sticky sm:rounded-b-[2.25rem]">
          <div className="relative flex items-stretch px-2 pb-[env(safe-area-inset-bottom)] pt-1.5">
            {LEFT_TABS.map((t) => (
              <Tab key={t.to} {...t} />
            ))}

            {/* Center action button */}
            <div className="flex w-[68px] shrink-0 items-start justify-center">
              <button
                onClick={() => navigate('/vehicles/new')}
                aria-label="Add vehicle"
                className="-mt-6 flex size-14 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 ring-4 ring-bg transition-transform active:scale-95"
              >
                <Plus className="size-7" strokeWidth={2.5} />
              </button>
            </div>

            {RIGHT_TABS.map((t) => (
              <Tab key={t.to} {...t} />
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
