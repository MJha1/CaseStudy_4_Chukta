import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Sparkles, Check, AlertTriangle } from 'lucide-react';
import {
  prettyDate,
  type VehicleClass,
  type CreateChallanInput,
} from '@chukta/shared';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Input, Label, Hint, FieldError } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { createVehicle, createChallan } from '@/lib/api';
import { simulateFetchedChallans } from '@/lib/simulate';
import { track } from '@/lib/analytics';
import { useToast } from '@/components/Toast';

const CLASSES: { value: VehicleClass; label: string }[] = [
  { value: 'LMV', label: 'Car / LMV' },
  { value: '2W', label: '2-wheeler' },
  { value: 'GOODS', label: 'Goods' },
  { value: 'TRANSPORT', label: 'Transport' },
];

export function AddVehiclePage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>('LMV');
  const [soldDate, setSoldDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // F6 preview state
  const [fetched, setFetched] = useState<CreateChallanInput[] | null>(null);

  function validate(): boolean {
    if (plate.replace(/\s+/g, '').length < 6) {
      setError('Enter a valid registration number (min 6 characters).');
      return false;
    }
    setError(null);
    return true;
  }

  async function makeVehicle() {
    return createVehicle({
      plate,
      model: model.trim() || undefined,
      vehicleClass,
      soldDate: soldDate || undefined,
    });
  }

  async function addVehicleOnly() {
    if (!validate()) return;
    setBusy(true);
    try {
      await makeVehicle();
      track('vehicle_added', { source: 'manual' });
      toast('Vehicle added');
      navigate('/challans');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not add vehicle');
    } finally {
      setBusy(false);
    }
  }

  async function fetchDemo() {
    if (!validate()) return;
    setBusy(true);
    try {
      const vehicle = await makeVehicle();
      track('vehicle_added', { source: 'autofetch_demo' });
      setFetched(simulateFetchedChallans(vehicle.id));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not fetch');
    } finally {
      setBusy(false);
    }
  }

  async function confirmFetched() {
    if (!fetched) return;
    setBusy(true);
    try {
      for (const c of fetched) await createChallan(c);
      toast(`${fetched.length} challans added`);
      navigate('/challans');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not add challans');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate(-1)} aria-label="Back" className="text-ink">
          <ArrowLeft className="size-5" />
        </button>
        <p className="text-[15px] font-bold text-ink">Add a vehicle</p>
      </header>

      <div className="flex-1 space-y-5 px-4 py-5">
        {!fetched ? (
          <>
            <div>
              <Label htmlFor="plate">Registration number *</Label>
              <Input
                id="plate"
                className="tabular uppercase"
                placeholder="DL 3C AB 1234"
                autoCapitalize="characters"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
              />
              <FieldError>{error}</FieldError>
            </div>

            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="e.g. Maruti Swift (optional)"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>

            <div>
              <Label>Vehicle class</Label>
              <div className="grid grid-cols-2 gap-2">
                {CLASSES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setVehicleClass(c.value)}
                    className={cn(
                      'rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors',
                      vehicleClass === c.value
                        ? 'border-brand bg-brand-soft text-brand-dark'
                        : 'border-line bg-paper text-ink hover:border-brand/40',
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <Hint>Used to flag offences that don't match your vehicle.</Hint>
            </div>

            <div>
              <Label htmlFor="soldDate">Sold on</Label>
              <Input
                id="soldDate"
                type="date"
                value={soldDate}
                onChange={(e) => setSoldDate(e.target.value)}
              />
              <Hint>If you've sold it, challans after this date are flagged.</Hint>
            </div>

            <Button size="block" onClick={addVehicleOnly} disabled={busy}>
              <Plus className="size-5" /> {busy ? 'Adding…' : 'Add vehicle'}
            </Button>

            {/* F6 — auto-fetch preview */}
            <div className="relative py-1 text-center">
              <span className="bg-bg px-3 text-[12px] font-semibold text-muted">or</span>
            </div>
            <Card className="border-dashed">
              <CardBody className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-brand" />
                  <p className="text-sm font-bold text-ink">Auto-fetch challans</p>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-warn-soft p-2.5">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
                  <p className="text-[12px] font-semibold text-warn">
                    Demo — a live version fetches from VAHAN/mParivahan with your consent.
                  </p>
                </div>
                <Button variant="secondary" size="block" onClick={fetchDemo} disabled={busy}>
                  {busy ? 'Fetching…' : 'Fetch challans (Demo)'}
                </Button>
              </CardBody>
            </Card>
          </>
        ) : (
          /* F6 — preview of simulated results */
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-xl bg-warn-soft p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
              <p className="text-[12px] font-semibold text-warn">
                Demo results for {plate}. A live version fetches these from VAHAN/mParivahan
                with your consent.
              </p>
            </div>
            <p className="text-[13px] font-semibold text-ink">
              Found {fetched.length} challans
            </p>
            {fetched.map((c, i) => (
              <Card key={i}>
                <CardBody className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-semibold text-ink">{c.offence}</p>
                    <p className="text-[12px] text-muted">
                      {prettyDate(c.date)}
                      {c.location ? ` · ${c.location}` : ''}
                    </p>
                  </div>
                  <p className="tabular text-[15px] font-bold text-ink">
                    ₹{c.amount.toLocaleString('en-IN')}
                  </p>
                </CardBody>
              </Card>
            ))}
            <Button size="block" onClick={confirmFetched} disabled={busy}>
              <Check className="size-5" /> {busy ? 'Adding…' : `Add ${fetched.length} challans`}
            </Button>
            <Button variant="ghost" size="block" onClick={() => navigate('/challans')}>
              Skip
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
