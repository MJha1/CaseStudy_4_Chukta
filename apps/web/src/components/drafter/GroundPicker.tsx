import { Check } from 'lucide-react';
import { GROUND_LIST, GROUNDS } from '@chukta/shared';
import { Input, Label, Textarea, Hint } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import type { DraftState } from './draft';

interface Props {
  draft: DraftState;
  update: (patch: Partial<DraftState>) => void;
}

/** Step 2 — pick a ground, show its evidence checklist, capture contact + extras. */
export function GroundPicker({ draft, update }: Props) {
  const ground = draft.ground ? GROUNDS[draft.ground] : undefined;

  return (
    <div className="space-y-5">
      <div>
        <Label>Why is this challan wrong?</Label>
        <div className="space-y-2">
          {GROUND_LIST.map((g) => {
            const selected = draft.ground === g.key;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => update({ ground: g.key })}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors',
                  selected
                    ? 'border-brand bg-brand-soft'
                    : 'border-line bg-paper hover:border-brand/40',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                    selected ? 'border-brand bg-brand text-white' : 'border-line',
                  )}
                >
                  {selected && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{g.title}</span>
                  <span className="block text-[13px] text-muted">{g.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {ground && (
        <>
          {ground.extraField && (
            <div>
              <Label htmlFor="extra">{ground.extraField.label}</Label>
              {ground.extraField.key === 'saleDate' ? (
                <Input
                  id="extra"
                  type="date"
                  value={draft.saleDate}
                  onChange={(e) => update({ saleDate: e.target.value })}
                />
              ) : (
                <Input
                  id="extra"
                  placeholder={ground.extraField.placeholder}
                  value={draft.receipt}
                  onChange={(e) => update({ receipt: e.target.value })}
                />
              )}
            </div>
          )}

          <div className="rounded-xl border border-line bg-bg p-3.5">
            <p className="mb-2 text-[13px] font-semibold text-ink">Evidence to attach</p>
            <ul className="space-y-1.5">
              {ground.evidence.map((e) => (
                <li key={e} className="flex items-start gap-2 text-[13px] text-muted">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                  {e}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            placeholder="For the letter"
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="mobile">Mobile</Label>
          <Input
            id="mobile"
            className="tabular"
            inputMode="tel"
            placeholder="10-digit"
            value={draft.mobile}
            onChange={(e) => update({ mobile: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="note">Anything to add?</Label>
        <Textarea
          id="note"
          placeholder="Optional note included in the letter"
          value={draft.note}
          onChange={(e) => update({ note: e.target.value })}
        />
        <Hint>Optional — a line of context for the officer.</Hint>
      </div>
    </div>
  );
}
