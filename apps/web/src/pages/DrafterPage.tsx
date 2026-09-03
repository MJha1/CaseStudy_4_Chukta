import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { generateLetter } from '@chukta/shared';
import { Button } from '@/components/ui/button';
import { ChallanForm } from '@/components/drafter/ChallanForm';
import { GroundPicker } from '@/components/drafter/GroundPicker';
import { LetterOutput } from '@/components/drafter/LetterOutput';
import {
  emptyDraft,
  validateStep1,
  hasErrors,
  toLetterInput,
  type DraftState,
  type Step1Errors,
} from '@/components/drafter/draft';
import { createDispute } from '@/lib/api';
import { track } from '@/lib/analytics';
import { useToast } from '@/components/Toast';

const STEP_TITLES = ['Enter the challan', 'Pick a ground', 'Your letter'];

export function DrafterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const prefill = (location.state as { prefill?: Partial<DraftState> } | null)?.prefill;
  const [draft, setDraft] = useState<DraftState>({ ...emptyDraft, ...prefill });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Step1Errors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const openedRef = useRef(false);
  useEffect(() => {
    if (!openedRef.current) {
      openedRef.current = true;
      track('drafter_opened');
    }
  }, []);

  const update = (patch: Partial<DraftState>) => setDraft((d) => ({ ...d, ...patch }));

  const letter = useMemo(
    () => (step === 2 && draft.ground ? generateLetter(toLetterInput(draft)) : ''),
    [step, draft],
  );

  function next() {
    if (step === 0) {
      const e = validateStep1(draft);
      setErrors(e);
      if (hasErrors(e)) return;
    }
    if (step === 1) {
      if (!draft.ground) {
        toast('Pick a ground to continue');
        return;
      }
      track('dispute_drafted', { ground: draft.ground });
    }
    setStep((s) => Math.min(s + 1, 2));
  }

  function back() {
    if (step === 0) {
      navigate(-1);
      return;
    }
    setStep((s) => s - 1);
  }

  async function onSave() {
    if (!draft.ground) return;
    setSaving(true);
    try {
      const input = toLetterInput(draft);
      await createDispute({ ...input, letter });
      track('dispute_saved', { ground: draft.ground });
      setSaved(true);
      toast('Saved to Disputes');
      window.setTimeout(() => navigate('/disputes'), 700);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  const canProceed =
    step === 0 ? true : step === 1 ? Boolean(draft.ground) : false;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button onClick={back} aria-label="Back" className="text-ink">
            {step === 0 ? <X className="size-5" /> : <ArrowLeft className="size-5" />}
          </button>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Step {step + 1} of 3
            </p>
            <p className="text-[15px] font-bold text-ink">{STEP_TITLES[step]}</p>
          </div>
        </div>
        <div className="mt-2.5 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-brand' : 'bg-line'}`}
            />
          ))}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {step === 0 && <ChallanForm draft={draft} errors={errors} update={update} />}
        {step === 1 && <GroundPicker draft={draft} update={update} />}
        {step === 2 && (
          <LetterOutput
            draft={draft}
            letter={letter}
            saved={saved}
            saving={saving}
            onSave={onSave}
          />
        )}
      </div>

      {/* Footer nav */}
      {step < 2 && (
        <footer className="sticky bottom-0 border-t border-line bg-paper px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <Button size="block" onClick={next} disabled={!canProceed}>
            {step === 1 ? 'Generate letter' : 'Continue'}
          </Button>
        </footer>
      )}
    </div>
  );
}
