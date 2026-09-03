import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, Check, Gavel, Plus, X, Copy } from 'lucide-react';
import { GROUNDS, prettyDate, type Dispute } from '@chukta/shared';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DaysLeftChip, CalendarButton } from '@/components/Deadline';
import { listDisputes, setDisputeFiled, deleteDispute } from '@/lib/api';
import { track } from '@/lib/analytics';
import { useToast } from '@/components/Toast';
import { copyText } from '@/lib/clipboard';
import { PageHeader } from '@/components/PageHeader';

export function DisputesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [disputes, setDisputes] = useState<Dispute[] | null>(null);
  const [viewing, setViewing] = useState<Dispute | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDisputes()
      .then(setDisputes)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load disputes'));
  }, []);

  async function toggleFiled(d: Dispute) {
    const nextFiled = !d.filed;
    setDisputes((list) =>
      list ? list.map((x) => (x.id === d.id ? { ...x, filed: nextFiled } : x)) : list,
    );
    try {
      await setDisputeFiled(d.id, nextFiled);
      if (nextFiled) track('dispute_filed', { ground: d.ground });
    } catch {
      toast('Could not update — try again');
      setDisputes((list) =>
        list ? list.map((x) => (x.id === d.id ? { ...x, filed: d.filed } : x)) : list,
      );
    }
  }

  async function remove(d: Dispute) {
    setDisputes((list) => (list ? list.filter((x) => x.id !== d.id) : list));
    try {
      await deleteDispute(d.id);
      toast('Dispute deleted');
    } catch {
      toast('Could not delete');
      listDisputes().then(setDisputes).catch(() => {});
    }
  }

  return (
    <div>
      <PageHeader title="Disputes" subtitle="Every letter you've drafted, tracked on-device." />

      <div className="space-y-3 px-4 pb-4">
        {error && <p className="text-sm text-danger">{error}</p>}

        {disputes && disputes.length === 0 && (
          <Card>
            <CardBody className="flex flex-col items-center py-10 text-center">
              <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-brand-soft">
                <Gavel className="size-7 text-brand" />
              </div>
              <p className="text-base font-bold text-ink">No disputes yet</p>
              <p className="mb-4 mt-1 max-w-[220px] text-[13px] text-muted">
                Draft a grievance letter for a wrong challan and it will appear here.
              </p>
              <Button onClick={() => navigate('/dispute/new')}>
                <Plus className="size-4" /> Draft a dispute
              </Button>
            </CardBody>
          </Card>
        )}

        {disputes?.map((d) => (
          <Card key={d.id}>
            <CardBody className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="tabular text-[15px] font-bold text-ink">{d.plate}</p>
                  <p className="text-[13px] text-muted">{d.offence}</p>
                </div>
                <p className="tabular text-[15px] font-bold text-ink">
                  ₹{d.amount.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">{GROUNDS[d.ground].title}</Badge>
                {d.filed ? (
                  <Badge tone="ok">
                    <Check className="size-3" /> Filed
                  </Badge>
                ) : (
                  <DaysLeftChip date={d.date} />
                )}
                <span className="text-[11px] text-muted">{prettyDate(d.date)}</span>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                <Button size="sm" variant="secondary" onClick={() => setViewing(d)}>
                  <FileText className="size-4" /> View letter
                </Button>
                <CalendarButton
                  plate={d.plate}
                  date={d.date}
                  className="h-9 px-4 text-[13px]"
                />
                <Button
                  size="sm"
                  variant={d.filed ? 'outline' : 'primary'}
                  onClick={() => toggleFiled(d)}
                >
                  <Check className="size-4" /> {d.filed ? 'Filed' : 'Mark filed'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger hover:bg-danger-soft"
                  onClick={() => remove(d)}
                  aria-label="Delete dispute"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}

        {disputes === null && !error && (
          <p className="py-8 text-center text-sm text-muted">Loading…</p>
        )}
      </div>

      {viewing && (
        <LetterViewer dispute={viewing} onClose={() => setViewing(null)} onCopy={() => toast('Letter copied')} />
      )}
    </div>
  );
}

function LetterViewer({
  dispute,
  onClose,
  onCopy,
}: {
  dispute: Dispute;
  onClose: () => void;
  onCopy: () => void;
}) {
  async function copy() {
    if (await copyText(dispute.letter)) onCopy();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[85dvh] w-full max-w-[440px] flex-col rounded-t-2xl bg-paper sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-sm font-bold text-ink">Grievance letter</p>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
            <X className="size-5" />
          </button>
        </div>
        <pre className="flex-1 overflow-y-auto whitespace-pre-wrap px-4 py-4 font-mono text-[12px] leading-relaxed text-ink">
          {dispute.letter}
        </pre>
        <div className="border-t border-line p-3">
          <Button size="block" onClick={copy}>
            <Copy className="size-4" /> Copy letter
          </Button>
        </div>
      </div>
    </div>
  );
}
