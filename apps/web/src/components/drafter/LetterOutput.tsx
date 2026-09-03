import { useState } from 'react';
import { Copy, Check, Save, ExternalLink } from 'lucide-react';
import { HOW_TO_FILE_STEPS, COURT_NOTE } from '@chukta/shared';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { DeadlineTimeline, DaysLeftChip, CalendarButton } from '@/components/Deadline';
import { copyText } from '@/lib/clipboard';
import { useToast } from '@/components/Toast';
import type { DraftState } from './draft';

interface Props {
  draft: DraftState;
  letter: string;
  saved: boolean;
  saving: boolean;
  onSave: () => void;
}

/** Step 3 — the generated letter, how-to-file checklist, deadline, save + reminder. */
export function LetterOutput({ draft, letter, saved, saving, onSave }: Props) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const plate = draft.plate.trim().toUpperCase().replace(/\s+/g, '');

  async function copy() {
    const ok = await copyText(letter);
    if (ok) {
      setCopied(true);
      toast('Letter copied');
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      toast('Could not copy — select and copy manually');
    }
  }

  return (
    <div className="space-y-5">
      {/* Deadline */}
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Deadline</p>
            {draft.date && <DaysLeftChip date={draft.date} />}
          </div>
          {draft.date && <DeadlineTimeline date={draft.date} />}
          {draft.date && (
            <CalendarButton plate={plate} date={draft.date} className="w-full" />
          )}
        </CardBody>
      </Card>

      {/* Letter */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Your grievance letter</p>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <textarea
          readOnly
          value={letter}
          onFocus={(e) => e.currentTarget.select()}
          className="h-72 w-full resize-none rounded-xl border border-line bg-paper p-3.5 font-mono text-[12px] leading-relaxed text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      {/* How to file */}
      <Card>
        <CardBody>
          <p className="mb-3 text-sm font-semibold text-ink">How to file it</p>
          <ol className="space-y-2.5">
            {HOW_TO_FILE_STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-[13px] text-ink">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-dark">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-3 border-t border-line pt-3 text-[12px] text-muted">{COURT_NOTE}</p>
          <a
            href="https://echallan.parivahan.gov.in"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand"
          >
            Open the complaint portal <ExternalLink className="size-3.5" />
          </a>
        </CardBody>
      </Card>

      {/* Save */}
      <Button size="block" onClick={onSave} disabled={saving || saved}>
        {saved ? (
          <>
            <Check className="size-5" /> Saved to Disputes
          </>
        ) : (
          <>
            <Save className="size-5" /> {saving ? 'Saving…' : 'Save & track'}
          </>
        )}
      </Button>
    </div>
  );
}
