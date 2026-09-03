import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Gavel, Plus, Car } from 'lucide-react';
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
import type { DraftState } from '@/components/drafter/draft';

const STATUS_TONE: Record<ChallanStatus, 'neutral' | 'warn' | 'danger' | 'ok'> = {
  pending: 'neutral',
  due: 'warn',
  overdue: 'danger',
  paid: 'ok',
};

export function ChallansPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoBusy, setDemoBusy] = useState(false);

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

  function disputeChallan(c: Challan) {
    track('challan_viewed', { flag: c.flag ?? 'none' });
    const v = vehicleById[c.vehicleId];
    const prefill: Partial<DraftState> = {
      plate: v?.plate ?? '',
      challanNo: '',
      amount: String(c.amount),
      date: c.date,
      city: c.city ?? '',
      location: c.location ?? '',
      offence: c.offence,
      ground: c.flag ? flagToGround[c.flag] : undefined,
    };
    navigate('/dispute/new', { state: { prefill } });
  }

  return (
    <div>
      <PageHeader title="Challans" subtitle="Every fine on your vehicles, wrong ones flagged." />

      <div className="px-4 pb-3">
        <Button variant="outline" size="block" onClick={() => navigate('/vehicles/new')}>
          <Plus className="size-4" /> Add vehicle
        </Button>
      </div>

      <div className="space-y-3 px-4 pb-4">
        {challans.map((c) => {
          const v = vehicleById[c.vehicleId];
          return (
            <Card key={c.id} className={c.flag ? 'border-warn/40' : undefined}>
              <CardBody className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="tabular text-[15px] font-bold text-ink">{v?.plate}</p>
                      {v?.isSample && <Badge tone="sample">Sample</Badge>}
                    </div>
                    <p className="text-[13px] text-muted">{c.offence}</p>
                  </div>
                  <p className="tabular text-[15px] font-bold text-ink">
                    ₹{c.amount.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                  <span className="text-[11px] text-muted">
                    {prettyDate(c.date)}
                    {c.location ? ` · ${c.location}` : ''}
                  </span>
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
              <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-brand-soft">
                <Car className="size-7 text-brand" />
              </div>
              <p className="text-base font-bold text-ink">No challans yet</p>
              <p className="mb-4 mt-1 max-w-[240px] text-[13px] text-muted">
                Add a vehicle to enter or fetch challans — or load demo data to explore.
              </p>
              <div className="flex flex-col items-center gap-2">
                <Button onClick={() => navigate('/vehicles/new')}>
                  <Plus className="size-4" /> Add vehicle
                </Button>
                <Button variant="ghost" onClick={handleLoadDemo} disabled={demoBusy}>
                  {demoBusy ? 'Loading…' : 'Load demo data'}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
