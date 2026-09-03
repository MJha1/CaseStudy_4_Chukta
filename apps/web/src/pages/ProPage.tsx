import { Check, Star, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/Toast';

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    tagline: 'Find + pay — the hook.',
    features: ['Manual challan entry', 'Dispute drafter', 'Deadline reminders'],
    highlight: false,
  },
  {
    name: 'Dispute success-fee',
    price: '₹199',
    tagline: 'or ~10% of the amount saved — charged only when a wrong challan is cancelled.',
    features: ['Aligned incentive', 'You pay only on a win', 'The moat'],
    highlight: true,
  },
  {
    name: 'Pro',
    price: '₹99',
    unit: '/ vehicle / year',
    tagline: 'Real-time alerts + licence-risk guardian + family/multi-vehicle.',
    features: ['Real-time new-challan alerts', 'Licence-risk guardian', 'Multi-vehicle & family'],
    highlight: false,
  },
  {
    name: 'Fleet / B2B',
    price: 'Custom',
    tagline: 'Per-vehicle plans for taxis, trucks, delivery.',
    features: ['Bulk vehicles', 'Team access', 'Highest ARPU'],
    highlight: false,
  },
];

const GUARDRAILS = [
  'No cut of legitimate fines',
  'No pay-to-skip',
  'No selling personal data',
];

export function ProPage() {
  const toast = useToast();

  return (
    <div>
      <PageHeader title="Chukta Pro" subtitle="Aligned incentives — we only win when you do." />

      <div className="space-y-3 px-4 pb-4">
        {PLANS.map((plan) => (
          <Card key={plan.name} className={plan.highlight ? 'border-brand' : undefined}>
            <CardBody className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {plan.highlight && <Star className="size-4 fill-brand text-brand" />}
                    <p className="text-[15px] font-bold text-ink">{plan.name}</p>
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted">{plan.tagline}</p>
                </div>
                <div className="text-right">
                  <p className="tabular text-lg font-extrabold text-ink">{plan.price}</p>
                  {plan.unit && <p className="text-[11px] text-muted">{plan.unit}</p>}
                </div>
              </div>
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-ink">
                    <Check className="size-4 text-brand" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlight ? 'primary' : 'outline'}
                size="block"
                onClick={() => toast('Demo — payments simulated')}
              >
                {plan.name === 'Fleet / B2B' ? 'Talk to us' : 'Choose plan'}
              </Button>
            </CardBody>
          </Card>
        ))}

        <div className="mt-1 rounded-2xl bg-brand-soft p-4">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="size-5 text-brand" />
            <p className="text-[13px] font-bold text-brand-dark">Our guardrails</p>
          </div>
          <ul className="space-y-1.5">
            {GUARDRAILS.map((g) => (
              <li key={g} className="flex items-center gap-2 text-[13px] text-brand-dark">
                <Check className="size-4" /> {g}
              </li>
            ))}
          </ul>
        </div>

        <p className="px-1 pt-1 text-center text-[11px] text-muted">
          Ethics = pro-compliance. We surface what's legitimately owed and fight only errors.
        </p>
      </div>
    </div>
  );
}
