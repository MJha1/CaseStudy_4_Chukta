import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none',
  {
    variants: {
      tone: {
        neutral: 'bg-bg text-muted',
        brand: 'bg-brand-soft text-brand-dark',
        ok: 'bg-brand-soft text-brand-dark',
        warn: 'bg-warn-soft text-warn',
        danger: 'bg-danger-soft text-danger',
        sample: 'bg-warn-soft text-warn ring-1 ring-warn/30',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
