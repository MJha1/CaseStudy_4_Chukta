export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="px-4 pb-3 pt-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
    </header>
  );
}
