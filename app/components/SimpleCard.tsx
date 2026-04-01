interface SimpleCardProps {
  title: string;
  value: number | string;
  valueClassName?: string;
}

export default function SimpleCard({
  title,
  value,
  valueClassName,
}: SimpleCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </p>
      <p
        className={`mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl ${valueClassName ?? ''}`}
      >
        {value}
      </p>
    </div>
  );
}
