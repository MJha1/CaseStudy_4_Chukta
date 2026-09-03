import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ShieldCheck, Sparkles, ChevronRight, Plus } from 'lucide-react';
import type { Challan, Vehicle } from '@chukta/shared';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listVehicles, listChallans, loadDemo } from '@/lib/api';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { useToast } from '@/components/Toast';

function inr(n: number): string {
  return n.toLocaleString('en-IN');
}

export function HomePage() {
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

  const stats = useMemo(() => {
    const unpaid = challans.filter((c) => c.status !== 'paid');
    const outstanding = unpaid.reduce((sum, c) => sum + c.amount, 0);
    const overdue = unpaid.filter((c) => c.status === 'overdue');
    const disputable = challans.filter((c) => c.flag);
    const disputableAmount = disputable.reduce((sum, c) => sum + c.amount, 0);
    return {
      outstanding,
      overdueCount: overdue.length,
      disputableCount: disputable.length,
      disputableAmount,
      anyOverdue: overdue.length > 0,
    };
  }, [challans]);

  const byVehicle = useMemo(() => {
    return vehicles.map((v) => {
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
  }, [vehicles, challans]);

  return (
    <div>
      <header className="px-4 pb-2 pt-6">
        <p className="text-[13px] font-semibold text-brand">Chukta</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          Clear your challans
        </h1>
      </header>

      <div className="space-y-3 px-4 pb-4">
        {/* Outstanding summary */}
        <Card className={stats.anyOverdue ? 'border-danger/30' : undefined}>
          <CardBody>
            <p className="text-[13px] font-semibold text-muted">Total outstanding</p>
            <p
              className={`tabular mt-0.5 text-3xl font-extrabold ${
                stats.anyOverdue ? 'text-danger' : 'text-ink'
              }`}
            >
              ₹{inr(stats.outstanding)}
            </p>
            {stats.disputableCount > 0 && (
              <p className="mt-1 text-[13px] font-semibold text-brand">
                ₹{inr(stats.disputableAmount)} looks disputable
              </p>
            )}
          </CardBody>
        </Card>

        {/* DL-risk banner */}
        {stats.anyOverdue ? (
          <div className="flex items-start gap-3 rounded-2xl bg-danger-soft p-3.5">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" />
            <div>
              <p className="text-[13px] font-bold text-danger">
                {stats.overdueCount} overdue — licence at risk
              </p>
              <p className="text-[12px] text-danger/80">
                Past the 60-day window fines escalate toward DL suspension. Pay valid ones,
                dispute the wrong ones.
              </p>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="flex items-center gap-3 rounded-2xl bg-brand-soft p-3.5">
              <ShieldCheck className="size-5 shrink-0 text-brand" />
              <p className="text-[13px] font-semibold text-brand-dark">
                Nothing overdue. You're in the clear.
              </p>
            </div>
          )
        )}

        {/* Primary CTA */}
        <Button size="block" onClick={() => navigate('/dispute/new')}>
          <Plus className="size-5" /> Draft a dispute
        </Button>

        {/* Vehicles */}
        <div className="pt-2">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[13px] font-bold text-ink">Your vehicles</p>
            <button
              onClick={() => navigate('/vehicles/new')}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand"
            >
              <Plus className="size-4" /> Add
            </button>
          </div>
          <div className="space-y-2.5">
            {byVehicle.map(({ vehicle, count, outstanding, overdue, flagged }) => (
              <button
                key={vehicle.id}
                onClick={() => navigate('/challans')}
                className="w-full text-left"
              >
                <Card className={overdue ? 'border-danger/30' : undefined}>
                  <CardBody className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="tabular text-[15px] font-bold text-ink">
                          {vehicle.plate}
                        </p>
                        {vehicle.isSample && <Badge tone="sample">Sample</Badge>}
                        {flagged && <Badge tone="warn">Flagged</Badge>}
                      </div>
                      <p className="text-[12px] text-muted">
                        {vehicle.model ?? vehicle.vehicleClass ?? 'Vehicle'} · {count} challan
                        {count === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`tabular text-[15px] font-bold ${
                          overdue ? 'text-danger' : 'text-ink'
                        }`}
                      >
                        ₹{inr(outstanding)}
                      </p>
                    </div>
                    <ChevronRight className="size-5 text-muted" />
                  </CardBody>
                </Card>
              </button>
            ))}
            {loading && <p className="py-6 text-center text-sm text-muted">Loading…</p>}
            {!loading && vehicles.length === 0 && (
              <Card>
                <CardBody className="flex flex-col items-center py-8 text-center">
                  <p className="text-[15px] font-bold text-ink">No vehicles yet</p>
                  <p className="mb-4 mt-1 max-w-[240px] text-[13px] text-muted">
                    Add your vehicle to track and dispute its challans — or load demo data to
                    explore.
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

        {/* Auto-fetch preview (F6) teaser */}
        <button
          onClick={() => navigate('/vehicles/new')}
          className="mt-1 flex w-full items-center gap-3 rounded-2xl border border-dashed border-line p-3.5 text-left hover:border-brand/40"
        >
          <Sparkles className="size-5 shrink-0 text-brand" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-ink">Auto-fetch all challans</p>
            <p className="text-[12px] text-muted">
              Preview — a live version fetches from VAHAN/mParivahan with your consent.
            </p>
          </div>
          <Badge tone="warn">Demo</Badge>
        </button>
      </div>
    </div>
  );
}
