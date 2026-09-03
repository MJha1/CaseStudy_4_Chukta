import { Calendar, Check } from 'lucide-react';
import {
  daysLeft,
  deadlineTone,
  escalationTimeline,
  calendarUrl,
  type DeadlineTone,
} from '@chukta/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';

const toneToBadge: Record<DeadlineTone, 'ok' | 'warn' | 'danger'> = {
  ok: 'ok',
  warn: 'warn',
  danger: 'danger',
};

/** "N days left" / "N days overdue" chip with warn/danger styling (spec §F2). */
export function DaysLeftChip({ date }: { date: string }) {
  const left = daysLeft(date);
  const tone = deadlineTone(date);
  const label = left >= 0 ? `${left} days left` : `${Math.abs(left)} days overdue`;
  return <Badge tone={toneToBadge[tone]}>{label}</Badge>;
}

/** The escalation timeline: Issued → Pay by 60 → Fine ↑ → Virtual Court → DL suspended. */
export function DeadlineTimeline({ date }: { date: string }) {
  const milestones = escalationTimeline(date);
  return (
    <ol className="flex items-start justify-between gap-1">
      {milestones.map((m, i) => (
        <li key={m.key} className="relative flex flex-1 flex-col items-center text-center">
          {i > 0 && (
            <span
              className={cn(
                'absolute right-1/2 top-[9px] h-0.5 w-full',
                m.passed ? 'bg-brand' : 'bg-line',
              )}
            />
          )}
          <span
            className={cn(
              'relative z-10 flex size-[20px] items-center justify-center rounded-full border-2',
              m.passed
                ? 'border-brand bg-brand text-white'
                : m.imminent
                  ? 'border-warn bg-warn-soft text-warn'
                  : 'border-line bg-paper text-muted',
            )}
          >
            {m.passed && <Check className="size-3" strokeWidth={3} />}
          </span>
          <span
            className={cn(
              'mt-1.5 text-[10px] font-semibold leading-tight',
              m.imminent ? 'text-warn' : m.passed ? 'text-ink' : 'text-muted',
            )}
          >
            {m.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** "Add to Google Calendar" reminder link (opens a prefilled event). */
export function CalendarButton({
  plate,
  date,
  className,
}: {
  plate: string;
  date: string;
  className?: string;
}) {
  return (
    <a
      href={calendarUrl(plate, date)}
      target="_blank"
      rel="noreferrer"
      onClick={() => track('reminder_clicked', { plate })}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-paper px-5 text-sm font-semibold text-ink transition-colors hover:bg-bg',
        className,
      )}
    >
      <Calendar className="size-4" />
      Add reminder
    </a>
  );
}
