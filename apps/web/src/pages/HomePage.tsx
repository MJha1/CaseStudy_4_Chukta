import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Plus,
  ChevronRight,
  Gavel,
  ReceiptText,
  Car,
  Clock,
  Sparkles,
  FileText,
  Moon,
  Sun,
  X,
  BellOff,
  Lock,
  BadgeCheck,
  BadgePercent,
} from 'lucide-react';
import { SignInIcon } from '@/components/icons/SignInIcon';
import { daysLeft, flagLabel, type Challan, type Vehicle } from '@chukta/shared';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listVehicles, listChallans, loadDemo } from '@/lib/api';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';

const inr = (n: number) => n.toLocaleString('en-IN');

const QUICK_ACTIONS = [
  { label: 'Draft dispute', icon: Gavel, to: '/dispute/new' },
  { label: 'Challans', icon: ReceiptText, to: '/challans' },
  { label: 'Add vehicle', icon: Car, to: '/vehicles/new' },
  { label: 'My disputes', icon: FileText, to: '/disputes' },
  { label: 'Deadlines', icon: Clock, to: '/challans' },
  { label: 'Chukta Pro', icon: Sparkles, to: '/pro' },
];

type Notif = {
  id: string;
  tone: 'danger' | 'warn' | 'brand';
  title: string;
  detail: string;
};

export function HomePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, status, backToSignIn } = useAuth();
  const { theme, toggle } = useTheme();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoBusy, setDemoBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  const load = useCallback(() => {
    return Promise.all([listVehicles(), listChallans()])
      .then(([v, c]) => {
        setVehicles(v);
        setChallans(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useRefreshOnFocus(load);

  async function handleLoadDemo() {
    setDemoBusy(true);
    try {
      await loadDemo();
      await load();
      toast('Demo data loaded');
    } catch {
      toast('Could not load demo data');
    } finally {
      setDemoBusy(false);
    }
  }

  // Search: open the matching garage vehicle, or start adding it (prefilled) so
  // the user can fetch its challans — fulfilling "find challans on any vehicle".
  function runSearch() {
    const q = query.trim().toUpperCase().replace(/\s+/g, '');
    if (!q) return;
    const match = vehicles.find((v) => v.plate.replace(/\s+/g, '').includes(q));
    if (match) navigate(`/vehicles/${match.id}`);
    else navigate('/vehicles/new', { state: { plate: q } });
  }

  const stats = useMemo(() => {
    const unpaid = challans.filter((c) => c.status !== 'paid');
    return {
      outstanding: unpaid.reduce((s, c) => s + c.amount, 0),
      disputable: challans.filter((c) => c.flag).reduce((s, c) => s + c.amount, 0),
      overdue: unpaid.filter((c) => c.status === 'overdue').length,
      anyOverdue: unpaid.some((c) => c.status === 'overdue'),
    };
  }, [challans]);

  const garage = useMemo(() => {
    const q = query.trim().toUpperCase();
    return vehicles
      .filter((v) => !q || v.plate.includes(q))
      .map((v) => {
        const cs = challans.filter((c) => c.vehicleId === v.id);
        const unpaid = cs.filter((c) => c.status !== 'paid');
        return {
          vehicle: v,
          count: cs.length,
          outstanding: unpaid.reduce((s, c) => s + c.amount, 0),
          overdue: unpaid.some((c) => c.status === 'overdue'),
          flagged: cs.some((c) => c.flag),
        };
      });
  }, [vehicles, challans, query]);

  const reminders = useMemo(() => {
    const byPlate = new Map(vehicles.map((v) => [v.id, v.plate]));
    return challans
      .filter((c) => c.status !== 'paid')
      .map((c) => ({ c, left: daysLeft(c.date), plate: byPlate.get(c.vehicleId) ?? '' }))
      .sort((a, b) => a.left - b.left)
      .slice(0, 3);
  }, [challans, vehicles]);

  // Live notifications derived from the user's own challans (no push infra):
  // overdue (licence risk) → due-soon → likely-wrong. Recomputed on every load.
  const notifications = useMemo<Notif[]>(() => {
    const plateOf = new Map(vehicles.map((v) => [v.id, v.plate]));
    const list: Notif[] = [];
    for (const c of challans) {
      if (c.status === 'paid') continue;
      const plate = plateOf.get(c.vehicleId) ?? '';
      if (c.status === 'overdue') {
        list.push({
          id: `od-${c.id}`,
          tone: 'danger',
          title: 'Overdue — licence at risk',
          detail: `${c.offence} on ${plate} · ₹${inr(c.amount)}`,
        });
      } else {
        const left = daysLeft(c.date);
        if (left >= 0 && left < 15) {
          list.push({
            id: `due-${c.id}`,
            tone: 'warn',
            title: `Due in ${left} day${left === 1 ? '' : 's'}`,
            detail: `${c.offence} on ${plate}`,
          });
        }
      }
      if (c.flag) {
        list.push({
          id: `fl-${c.id}`,
          tone: 'brand',
          title: 'Likely wrong — worth disputing',
          detail: `${flagLabel[c.flag]} · ₹${inr(c.amount)} on ${plate}`,
        });
      }
    }
    const rank = { danger: 0, warn: 1, brand: 2 };
    return list.sort((a, b) => rank[a.tone] - rank[b.tone]);
  }, [challans, vehicles]);

  return (
    <div>
      {/* Header */}
      <header className="flex items-center justify-between px-4 pb-1 pt-6">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand text-white">
            <ShieldCheck className="size-5" />
          </div>
          <span className="text-[17px] font-extrabold tracking-tight text-ink">Chukta</span>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Utility cluster — theme + notifications read as one quiet unit. */}
          <div className="flex items-center gap-0.5 rounded-full bg-paper p-0.5 ring-1 ring-line">
            <button
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex size-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-bg"
            >
              {theme === 'dark' ? <Sun className="size-[17px]" /> : <Moon className="size-[17px]" />}
            </button>
            <button
              onClick={() => setNotifOpen(true)}
              aria-label="Notifications"
              className="relative flex size-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-bg"
            >
              <Bell className="size-[17px]" />
              {notifications.length > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-paper" />
              )}
            </button>
          </div>
          {/* Identity — visually distinct from the utility cluster above. */}
          {status === 'signedin' ? (
            <button
              onClick={() => navigate('/profile')}
              aria-label="Profile"
              className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-[13px] font-bold text-brand-dark"
            >
              {user?.picture ? (
                <img src={user.picture} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
              ) : (
                initials(user?.name, user?.email)
              )}
            </button>
          ) : (
            <button
              onClick={backToSignIn}
              aria-label="Sign in"
              className="flex h-9 items-center gap-1.5 rounded-full bg-brand-soft pl-2.5 pr-3 text-[13px] font-semibold text-brand"
            >
              <SignInIcon className="size-[18px]" />
              Sign in
            </button>
          )}
        </div>
      </header>

      <div className="px-4 pb-2 pt-2">
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">
          {user?.name ? `Hello, ${user.name.split(' ')[0]} 👋` : 'Hello 👋'}
        </h1>
        <p className="text-[13px] text-muted">Manage your vehicles and clear your challans.</p>
      </div>

      {/* Hero — finding challans on a vehicle is the primary job of this screen. */}
      <div className="px-4 pb-3 pt-2">
        <p className="mb-2 text-[13px] font-semibold text-muted">Find challans on any vehicle</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch();
          }}
          className="flex items-center gap-2.5 rounded-2xl border border-line bg-paper px-4 py-3.5 shadow-sm transition-shadow focus-within:border-brand/50 focus-within:shadow-md"
        >
          <Search className="size-5 shrink-0 text-brand" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            placeholder="Search by vehicle no."
            enterKeyHint="search"
            className="tabular flex-1 bg-transparent text-[16px] font-semibold text-ink placeholder:font-sans placeholder:text-[15px] placeholder:font-normal placeholder:text-muted/80 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!query.trim()}
            aria-label="Search"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-opacity disabled:opacity-40"
          >
            <ArrowRight className="size-[18px]" />
          </button>
        </form>
      </div>

      {/* Hero stat pair — the money at stake, promoted above the garage. */}
      {vehicles.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 px-4 pb-3">
          <div className="rounded-2xl border border-line bg-paper p-4">
            <p className="text-[12px] font-semibold text-muted">Outstanding</p>
            <p
              className={`tabular mt-1 text-[26px] font-extrabold leading-none ${
                stats.anyOverdue ? 'text-danger' : 'text-ink'
              }`}
            >
              ₹{inr(stats.outstanding)}
            </p>
          </div>
          <div className="rounded-2xl border border-brand/25 bg-brand-soft p-4">
            <p className="text-[12px] font-semibold text-brand-dark">Disputable</p>
            <p className="tabular mt-1 text-[26px] font-extrabold leading-none text-brand">
              ₹{inr(stats.disputable)}
            </p>
          </div>
        </div>
      )}

      {/* DL-risk banner */}
      {stats.anyOverdue && (
        <div className="mx-4 mb-3 flex items-start gap-3 rounded-2xl bg-danger-soft p-3.5">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-danger">
              {stats.overdue} overdue — licence at risk
            </p>
            <p className="text-[12px] text-danger/80">
              Past 60 days fines escalate toward DL suspension. Pay valid ones, dispute the wrong.
            </p>
            <button
              onClick={() => navigate('/challans')}
              className="mt-2.5 inline-flex h-8 items-center gap-1 rounded-full bg-danger px-3.5 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Review &amp; dispute <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Trust strip — the differentiator, kept small and quiet. */}
      <div className="mx-4 mb-4 grid grid-cols-3 gap-1.5 rounded-2xl bg-paper px-2.5 py-3 ring-1 ring-line">
        <TrustPoint icon={BadgeCheck} text="Only pay when a wrong fine is cancelled" />
        <TrustPoint icon={Lock} text="Your evidence never leaves your phone" />
        <TrustPoint icon={BadgePercent} text="Never a cut of a valid fine" />
      </div>

      {/* My Garage */}
      <section className="px-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[15px] font-bold text-ink">My Garage</p>
          <button
            onClick={() => navigate('/vehicles/new')}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand"
          >
            <Plus className="size-4" /> Add
          </button>
        </div>

        {loading && <p className="py-6 text-center text-sm text-muted">Loading…</p>}

        {!loading && vehicles.length === 0 && (
          <Card>
            <CardBody className="flex flex-col items-center py-8 text-center">
              <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-brand-soft">
                <Car className="size-7 text-brand" />
              </div>
              <p className="text-[15px] font-bold text-ink">No vehicles yet</p>
              <p className="mb-4 mt-1 max-w-[240px] text-[13px] text-muted">
                Add your first vehicle and we'll track every challan on it
                {status !== 'signedin' ? ' — or load demo data to see how Chukta works.' : '.'}
              </p>
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => navigate('/vehicles/new')}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white"
                >
                  <Plus className="size-4" /> Add vehicle
                </button>
                {status !== 'signedin' && (
                  <button
                    onClick={handleLoadDemo}
                    disabled={demoBusy}
                    className="text-[13px] font-semibold text-muted hover:text-ink"
                  >
                    {demoBusy ? 'Loading…' : 'Load demo data'}
                  </button>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        <div className="space-y-3">
          {garage.map(({ vehicle, count, outstanding, overdue, flagged }) => (
            <button
              key={vehicle.id}
              onClick={() => navigate(`/vehicles/${vehicle.id}`)}
              className="w-full text-left"
            >
              <Card className={overdue ? 'ring-1 ring-danger/20' : undefined}>
                <CardBody className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft">
                      <Car className="size-7 text-brand" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="tabular truncate text-[16px] font-bold text-ink">
                          {vehicle.plate}
                        </p>
                        {vehicle.isSample && <Badge tone="sample">Demo</Badge>}
                      </div>
                      <p className="truncate text-[12px] text-muted">
                        {vehicle.model ?? 'Vehicle'}
                        {vehicle.soldDate ? ' · Sold' : ''}
                      </p>
                    </div>
                    <ChevronRight className="size-5 text-muted" />
                  </div>
                  <div className="flex items-center gap-2 border-t border-line pt-3">
                    <Chip label={vehicle.vehicleClass ?? 'Vehicle'} />
                    <Chip label={`${count} challan${count === 1 ? '' : 's'}`} />
                    {flagged && <Badge tone="warn">Flagged</Badge>}
                    <span
                      className={cnAmount(overdue)}
                    >
                      ₹{inr(outstanding)}
                    </span>
                  </div>
                </CardBody>
              </Card>
            </button>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 pt-5">
        <p className="mb-2.5 text-[15px] font-bold text-ink">Quick Actions</p>
        <div className="grid grid-cols-3 gap-2.5">
          {QUICK_ACTIONS.map(({ label, icon: Icon, to }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-paper p-3 text-center transition-colors hover:border-brand/40"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon className="size-[22px]" />
              </span>
              <span className="text-[11.5px] font-semibold leading-tight text-ink">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Reminders */}
      {reminders.length > 0 && (
        <section className="px-4 pb-4 pt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[15px] font-bold text-ink">Upcoming deadlines</p>
            <button
              onClick={() => navigate('/challans')}
              className="text-[13px] font-semibold text-brand"
            >
              View all
            </button>
          </div>
          <Card>
            <CardBody className="divide-y divide-line p-0">
              {reminders.map(({ c, left, plate }) => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={`flex size-9 items-center justify-center rounded-xl ${
                      left < 0 ? 'bg-danger-soft text-danger' : left < 15 ? 'bg-warn-soft text-warn' : 'bg-brand-soft text-brand'
                    }`}
                  >
                    <Clock className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{c.offence}</p>
                    <p className="tabular text-[11px] text-muted">{plate}</p>
                  </div>
                  <span
                    className={`text-[12px] font-bold ${
                      left < 0 ? 'text-danger' : left < 15 ? 'text-warn' : 'text-muted'
                    }`}
                  >
                    {left >= 0 ? `${left}d left` : `${Math.abs(left)}d over`}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
        </section>
      )}

      {notifOpen && (
        <NotificationsSheet
          items={notifications}
          onClose={() => setNotifOpen(false)}
          onSelect={() => {
            setNotifOpen(false);
            navigate('/challans');
          }}
        />
      )}
    </div>
  );
}

const NOTIF_DOT: Record<Notif['tone'], string> = {
  danger: 'bg-danger',
  warn: 'bg-warn',
  brand: 'bg-brand',
};

function NotificationsSheet({
  items,
  onClose,
  onSelect,
}: {
  items: Notif[];
  onClose: () => void;
  onSelect: (n: Notif) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[75dvh] w-full max-w-[440px] flex-col rounded-t-2xl bg-paper sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-sm font-bold text-ink">Notifications</p>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
            <X className="size-5" />
          </button>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-brand-soft">
              <BellOff className="size-6 text-brand" />
            </div>
            <p className="text-[14px] font-semibold text-ink">You're all clear</p>
            <p className="max-w-[240px] text-[12.5px] text-muted">
              No overdue, upcoming or flagged challans right now.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line overflow-y-auto">
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => onSelect(n)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-bg"
              >
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${NOTIF_DOT[n.tone]}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-ink">{n.title}</span>
                  <span className="tabular block truncate text-[12px] text-muted">{n.detail}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function initials(name?: string, email?: string): string {
  const src = name?.trim() || email || '';
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] ?? 'U').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-bg px-2.5 py-1 text-[11px] font-semibold text-muted">
      {label}
    </span>
  );
}

function cnAmount(overdue: boolean): string {
  return `tabular ml-auto text-[14px] font-bold ${overdue ? 'text-danger' : 'text-ink'}`;
}

function TrustPoint({
  icon: Icon,
  text,
}: {
  icon: typeof ShieldCheck;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <Icon className="size-4 text-brand" />
      <p className="text-[10.5px] leading-tight text-muted">{text}</p>
    </div>
  );
}
