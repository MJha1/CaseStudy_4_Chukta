import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Sparkles, Check, AlertTriangle, Search } from 'lucide-react';
import {
  prettyDate,
  type VehicleClass,
  type ProviderInfo,
  type FetchChallansResponse,
} from '@chukta/shared';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Input, Label, Hint, FieldError } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createVehicle, createChallan, listProviders, fetchVehicleChallans } from '@/lib/api';
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

  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [providerId, setProviderId] = useState<string>('');
  const [fetched, setFetched] = useState<FetchChallansResponse | null>(null);
  const [fetchedVehicleId, setFetchedVehicleId] = useState<string>('');

  useEffect(() => {
    listProviders()
      .then((p) => {
        setProviders(p);
        if (p[0]) setProviderId(p[0].id);
      })
      .catch(() => {});
  }, []);

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

  async function fetchFromProvider() {
    if (!validate() || !providerId) return;
    setBusy(true);
    try {
      const vehicle = await makeVehicle();
      track('vehicle_added', { source: 'autofetch', provider: providerId });
      const result = await fetchVehicleChallans(vehicle.id, providerId);
      setFetchedVehicleId(vehicle.id);
      setFetched(result);
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
      for (const c of fetched.challans) await createChallan({ ...c, vehicleId: fetchedVehicleId });
      toast(`${fetched.challans.length} challans added`);
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

            {/* F6 — fetch from a challan-data provider */}
            <div className="relative py-1 text-center">
              <span className="bg-bg px-3 text-[12px] font-semibold text-muted">or</span>
            </div>
            <Card className="border-dashed">
              <CardBody className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-brand" />
                  <p className="text-sm font-bold text-ink">Fetch challans from a provider</p>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-warn-soft p-2.5">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
                  <p className="text-[12px] font-semibold text-warn">
                    Demo providers — a live version fetches from a licensed VAHAN/mParivahan data
                    partner with your consent.
                  </p>
                </div>
                <div className="space-y-2">
                  {providers.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProviderId(p.id)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors',
                        providerId === p.id
                          ? 'border-brand bg-brand-soft'
                          : 'border-line bg-paper hover:border-brand/40',
                      )}
                    >
                      <span>
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-ink">{p.name}</span>
                          <Badge tone={p.simulated ? 'sample' : 'ok'}>
                            {p.simulated ? 'Demo' : 'Live'}
                          </Badge>
                        </span>
                        {p.note && <span className="block text-[12px] text-muted">{p.note}</span>}
                      </span>
                      <span
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                          providerId === p.id ? 'border-brand bg-brand text-white' : 'border-line',
                        )}
                      >
                        {providerId === p.id && <Check className="size-3" strokeWidth={3} />}
                      </span>
                    </button>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  size="block"
                  onClick={fetchFromProvider}
                  disabled={busy || !providerId}
                >
                  <Search className="size-4" /> {busy ? 'Fetching…' : 'Fetch challans'}
                </Button>
              </CardBody>
            </Card>
          </>
        ) : (
          /* F6 — preview of the provider's results */
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-xl bg-warn-soft p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
              <p className="text-[12px] font-semibold text-warn">
                {fetched.provider.name} (demo) returned these for {plate}. A live provider is a
                licensed data partner.
              </p>
            </div>
            <p className="text-[13px] font-semibold text-ink">
              {fetched.challans.length > 0
                ? `Found ${fetched.challans.length} challans`
                : 'No challans found for this vehicle'}
            </p>
            {fetched.challans.map((c, i) => (
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
            {fetched.challans.length > 0 && (
              <Button size="block" onClick={confirmFetched} disabled={busy}>
                <Check className="size-5" />{' '}
                {busy ? 'Adding…' : `Add ${fetched.challans.length} challans`}
              </Button>
            )}
            <Button variant="ghost" size="block" onClick={() => navigate('/challans')}>
              {fetched.challans.length > 0 ? 'Skip' : 'Done'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
