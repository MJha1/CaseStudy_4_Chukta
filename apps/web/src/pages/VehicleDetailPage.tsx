import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Car,
  CarFront,
  Hash,
  BadgeCheck,
  CalendarDays,
  Gavel,
  AlertTriangle,
} from 'lucide-react';
import {
  prettyDate,
  flagLabel,
  flagToGround,
  daysLeft,
  type Challan,
  type Vehicle,
} from '@chukta/shared';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { listVehicles, listChallans, deleteVehicle } from '@/lib/api';
import { track } from '@/lib/analytics';
import { useToast } from '@/components/Toast';
import type { DraftState } from '@/components/drafter/draft';

const inr = (n: number) => n.toLocaleString('en-IN');

export function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    return Promise.all([listVehicles(), listChallans()])
      .then(([vs, cs]) => {
        setVehicle(vs.find((v) => v.id === id) ?? null);
        setChallans(cs.filter((c) => c.vehicleId === id));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const outstanding = useMemo(
    () => challans.filter((c) => c.status !== 'paid').reduce((s, c) => s + c.amount, 0),
    [challans],
  );
  const timeline = useMemo(
    () => [...challans].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [challans],
  );

  async function remove() {
    if (!vehicle) return;
    try {
      await deleteVehicle(vehicle.id);
      toast('Vehicle deleted');
      navigate('/');
    } catch {
      toast('Could not delete');
    }
  }

  function disputeChallan(c: Challan) {
    track('challan_viewed', { flag: c.flag ?? 'none' });
    const prefill: Partial<DraftState> = {
      plate: vehicle?.plate ?? '',
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
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate(-1)} aria-label="Back" className="text-ink">
          <ArrowLeft className="size-5" />
        </button>
        <p className="text-[15px] font-bold text-ink">Vehicle Details</p>
        <button
          onClick={remove}
          aria-label="Delete vehicle"
          className="text-muted hover:text-danger"
          disabled={!vehicle}
        >
          <Trash2 className="size-5" />
        </button>
      </header>

      {loading && <p className="py-10 text-center text-sm text-muted">Loading…</p>}

      {!loading && !vehicle && (
        <p className="py-10 text-center text-sm text-muted">Vehicle not found.</p>
      )}

      {vehicle && (
        <div className="space-y-4 px-4 py-4">
          {/* Hero card */}
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-brand-soft">
                <CarFront className="size-10 text-brand" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="tabular text-[20px] font-extrabold tracking-tight text-ink">
                  {vehicle.plate}
                </p>
                <p className="truncate text-[13px] text-muted">{vehicle.model ?? 'Vehicle'}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge tone={vehicle.soldDate ? 'neutral' : 'ok'}>
                    {vehicle.soldDate ? 'Sold' : 'Active'}
                  </Badge>
                  {vehicle.isSample && <Badge tone="sample">Demo</Badge>}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Details */}
          <Card>
            <CardBody className="divide-y divide-line p-0">
              <Row icon={Hash} label="Registration" value={vehicle.plate} mono />
              <Row icon={Car} label="Vehicle class" value={vehicle.vehicleClass ?? '—'} />
              <Row icon={BadgeCheck} label="Status" value={vehicle.soldDate ? 'Sold' : 'Active'} />
              {vehicle.soldDate && (
                <Row icon={CalendarDays} label="Sold on" value={prettyDate(vehicle.soldDate)} />
              )}
            </CardBody>
          </Card>

          {/* Outstanding */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-line bg-paper p-3.5">
              <p className="text-[11px] font-semibold text-muted">Outstanding</p>
              <p className="tabular mt-1 text-[18px] font-extrabold text-ink">₹{inr(outstanding)}</p>
            </div>
            <div className="rounded-2xl border border-line bg-paper p-3.5">
              <p className="text-[11px] font-semibold text-muted">Challans</p>
              <p className="tabular mt-1 text-[18px] font-extrabold text-ink">{challans.length}</p>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <p className="mb-2 text-[15px] font-bold text-ink">Challan history</p>
            {timeline.length === 0 ? (
              <Card>
                <CardBody className="py-6 text-center text-[13px] text-muted">
                  No challans on this vehicle.
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-3">
                {timeline.map((c) => {
                  const left = daysLeft(c.date);
                  return (
                    <Card key={c.id} className={c.flag ? 'ring-1 ring-warn/30' : undefined}>
                      <CardBody className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[14px] font-bold text-ink">{c.offence}</p>
                            <p className="text-[11px] text-muted">
                              {prettyDate(c.date)}
                              {c.location ? ` · ${c.location}` : ''}
                            </p>
                          </div>
                          <p className="tabular text-[14px] font-bold text-ink">₹{inr(c.amount)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            tone={
                              c.status === 'overdue'
                                ? 'danger'
                                : c.status === 'due'
                                  ? 'warn'
                                  : c.status === 'paid'
                                    ? 'ok'
                                    : 'neutral'
                            }
                          >
                            {c.status}
                          </Badge>
                          {c.status !== 'paid' && (
                            <span className="text-[11px] text-muted">
                              {left >= 0 ? `${left} days left` : `${Math.abs(left)} days overdue`}
                            </span>
                          )}
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Hash;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Icon className="size-[18px]" />
      </span>
      <span className="text-[13px] text-muted">{label}</span>
      <span className={`ml-auto text-[14px] font-semibold text-ink ${mono ? 'tabular' : ''}`}>
        {value}
      </span>
    </div>
  );
}
