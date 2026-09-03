import { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Input, Label, FieldError, Hint } from '@/components/ui/field';
import type { DraftState, Step1Errors } from './draft';

interface Props {
  draft: DraftState;
  errors: Step1Errors;
  update: (patch: Partial<DraftState>) => void;
}

/** Step 1 — enter the challan details. */
export function ChallanForm({ draft, errors, update }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ screenshot: reader.result as string });
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="plate">Vehicle number *</Label>
        <Input
          id="plate"
          className="tabular uppercase"
          placeholder="DL 3C AB 1234"
          autoCapitalize="characters"
          value={draft.plate}
          onChange={(e) => update({ plate: e.target.value.toUpperCase() })}
        />
        <FieldError>{errors.plate}</FieldError>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="amount">Fine amount (₹) *</Label>
          <Input
            id="amount"
            className="tabular"
            inputMode="numeric"
            placeholder="2000"
            value={draft.amount}
            onChange={(e) => update({ amount: e.target.value.replace(/[^\d]/g, '') })}
          />
          <FieldError>{errors.amount}</FieldError>
        </div>
        <div>
          <Label htmlFor="date">Challan date *</Label>
          <Input
            id="date"
            type="date"
            value={draft.date}
            onChange={(e) => update({ date: e.target.value })}
          />
          <FieldError>{errors.date}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="offence">Offence *</Label>
        <Input
          id="offence"
          placeholder="e.g. Jumping red light"
          value={draft.offence}
          onChange={(e) => update({ offence: e.target.value })}
        />
        <FieldError>{errors.offence}</FieldError>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="challanNo">Challan no.</Label>
          <Input
            id="challanNo"
            className="tabular"
            placeholder="Optional"
            value={draft.challanNo}
            onChange={(e) => update({ challanNo: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="city">City / State</Label>
          <Input
            id="city"
            placeholder="e.g. Delhi"
            value={draft.city}
            onChange={(e) => update({ city: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="Where it happened (optional)"
          value={draft.location}
          onChange={(e) => update({ location: e.target.value })}
        />
      </div>

      <div>
        <Label>Screenshot of the challan</Label>
        {draft.screenshot ? (
          <div className="relative overflow-hidden rounded-xl border border-line">
            <img src={draft.screenshot} alt="Challan screenshot" className="max-h-52 w-full object-contain bg-bg" />
            <button
              type="button"
              onClick={() => update({ screenshot: undefined })}
              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-ink/80 text-paper"
              aria-label="Remove screenshot"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-bg py-6 text-sm font-semibold text-muted hover:text-ink"
          >
            <ImagePlus className="size-5" />
            Attach screenshot
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        <Hint>Stays on your device — it never leaves your phone.</Hint>
      </div>
    </div>
  );
}
