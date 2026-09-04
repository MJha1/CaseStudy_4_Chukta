import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Gavel,
  Plus,
  Car,
  ReceiptText,
  TrafficCone,
  Gauge,
  CircleParking,
  Truck,
  Smartphone,
  ShieldAlert,
} from 'lucide-react';
import {
  prettyDate,
  flagLabel,
  flagToGround,
  type Challan,
  type Vehicle,
  type ChallanStatus,
} from '@chukta/shared';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { listVehicles, listChallans, loadDemo } from '@/lib/api';
import { track } from '@/lib/analytics';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import type { DraftState } from '@/components/drafter/draft';

const STATUS_TONE: Record<ChallanStatus, 'neutral' | 'warn' | 'danger' | 'ok'> = {
  pending: 'neutral',
  due: 'warn',
  overdue: 'danger',
  paid: 'ok',
};

type TabKey = 'pending' | 'flagged' | 'all';

function offenceIcon(offence: string) {
  const o = offence.toLowerCase();
  if (/red light|signal/.test(o)) return TrafficCone;
  if (/speed/.test(o)) return Gauge;
  if (/park/.test(o)) return CircleParking;
  if (/overload|goods|truck|carrier/.test(o)) return Truck;
  if (/mobile|phone/.test(o)) return Smartphone;
  if (/helmet|seat ?belt/.test(o)) return ShieldAlert;
  return ReceiptText;
}

export function ChallansPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const { status } = useAuth();
  const [demoBusy, setDemoBusy] = useState(false);
  const [tab, setTab] = useState<TabKey>('pending');

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

  const vehicleById = useMemo(
    () => Object.fromEntries(vehicles.map((v) => [v.id, v])),
    [vehicles],
  );

  const counts = useMemo(
    () => ({
      pending: challans.filter((c) => c.status !== 'paid').length,
      flagged: challans.filter((c) => c.flag).length,
      all: challans.length,
    }),
    [challans],
  );

  const totalDue = useMemo(
    () => challans.filter((c) => c.status !== 'paid').reduce((s, c) => s + c.amount, 0),
    [challans],
  );

  const shown = useMemo(() => {
    if (tab === 'pending') return challans.filter((c) => c.status !== 'paid');
    if (tab === 'flagged') return challans.filter((c) => c.flag);
    return challans;
  }, [challans, tab]);

  function disputeChallan(c: Challan) {
    track('challan_viewed', { flag: c.flag ?? 'none' });
    const v = vehicleById[c.vehicleId];
    const prefill: Partial<DraftState> = {
      plate: v?.plate ?? '',
      amount: String(c.amount),
      date: c.date,
      city: c.city ?? '',
      location: c.location ?? '',
      offence: c.offence,
      ground: c.flag ? flagToGround[c.flag] : undefined,
    };
    navigate('/dispute/new', { state: { prefill } });
  }

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'flagged', label: 'Flagged', count: counts.flagged },
    { key: 'all', label: 'All', count: counts.all },
  ];

  return (
    <div>
      <PageHeader title="Challans" subtitle="Every fine on your vehicles — wrong ones flagged." />

      {/* Tabs */}
      <div className="px-4">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors',
                tab === t.key ? 'bg-brand text-white' : 'bg-paper text-muted ring-1 ring-line',
              )}
            >
              {t.label}
              <span
                className={cn(
                  'rounded-full px-1.5 text-[11px]',
                  tab === t.key ? 'bg-white/25' : 'bg-bg',
                )}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Total due summary */}
      {totalDue > 0 && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-3 rounded-2xl bg-danger-soft p-4">
            <span className="flex size-11 items-center justify-center rounded-xl bg-danger/10 text-danger">
              <ReceiptText className="size-6" />
            </span>
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-danger/80">Total outstanding</p>
              <p className="tabular text-[20px] font-extrabold text-danger">
                ₹{totalDue.toLocaleString('en-IN')}
              </p>
            </div>
            <Button size="sm" onClick={() => navigate('/dispute/new')}>
              <Gavel className="size-4" /> Dispute
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3 px-4 pb-4 pt-3">
        {shown.map((c) => {
          const v = vehicleById[c.vehicleId];
          const Icon = offenceIcon(c.offence);
          return (
            <Card key={c.id} className={c.flag ? 'ring-1 ring-warn/30' : undefined}>
              <CardBody className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-xl',
                      c.flag ? 'bg-warn-soft text-warn' : 'bg-brand-soft text-brand',
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[15px] font-bold text-ink">{c.offence}</p>
                    </div>
                    <p className="tabular text-[12px] text-muted">
                      {v?.plate}
                      {c.location ? ` · ${c.location}` : ''}
                    </p>
                    <p className="text-[11px] text-muted">{prettyDate(c.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-[15px] font-bold text-ink">
                      ₹{c.amount.toLocaleString('en-IN')}
                    </p>
                    <Badge tone={STATUS_TONE[c.status]} className="mt-1">
                      {c.status}
                    </Badge>
                  </div>
                </div>

                {c.flag && (
                  <div className="flex items-start gap-2 rounded-xl bg-warn-soft p-2.5">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
                    <p className="text-[12px] font-semibold text-warn">{flagLabel[c.flag]}</p>
                  </div>
                )}

                {c.status !== 'paid' && (
                  <Button
                    size="sm"
                    variant={c.flag ? 'primary' : 'secondary'}
                    onClick={() => disputeChallan(c)}
                  >
                    <Gavel className="size-4" /> Dispute this
                  </Button>
                )}
              </CardBody>
            </Card>
          );
        })}

        {loading && <p className="py-8 text-center text-sm text-muted">Loading…</p>}

        {!loading && challans.length === 0 && (
          <Card>
            <CardBody className="flex flex-col items-center py-10 text-center">
              <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-brand-soft">
                <Car className="size-7 text-brand" />
              </div>
              <p className="text-base font-bold text-ink">No challans yet</p>
              <p className="mb-4 mt-1 max-w-[240px] text-[13px] text-muted">
                Add a vehicle and we'll surface every fine on it
                {status !== 'signedin' ? ' — or load demo data to see how Chukta works.' : '.'}
              </p>
              <div className="flex flex-col items-center gap-2">
                <Button onClick={() => navigate('/vehicles/new')}>
                  <Plus className="size-4" /> Add vehicle
                </Button>
                {status !== 'signedin' && (
                  <Button variant="ghost" onClick={handleLoadDemo} disabled={demoBusy}>
                    {demoBusy ? 'Loading…' : 'Load demo data'}
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {!loading && challans.length > 0 && shown.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">Nothing in this tab.</p>
        )}
      </div>

      <p className="px-4 pb-2 text-center text-[11px] text-muted">
        Stay road-safe. Pay valid fines; dispute the wrong ones.
      </p>
    </div>
  );
}
