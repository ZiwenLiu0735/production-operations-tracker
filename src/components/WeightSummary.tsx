import { formatLbs, formatWeight, formatWeightWithLbs } from "../utils/format";

export function ProductionStat({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-surface-600 bg-surface-800 p-4 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{formatWeight(value)}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-white/50">
        {formatLbs(value)}
      </p>
    </div>
  );
}

export function GrandTotalCard({ grams }: { grams: number }) {
  return (
    <div className="rounded-xl border border-surface-600 bg-surface-800 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
        Grand Total
      </p>
      <p className="mt-0.5 text-base font-semibold tabular-nums text-white">{formatWeight(grams)}</p>
      <p className="text-sm font-semibold tabular-nums text-white/50">{formatLbs(grams)}</p>
    </div>
  );
}

export function SummaryLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-sm text-white/50">{label}:</span>
      <span className="text-sm font-semibold tabular-nums text-white">
        {formatWeightWithLbs(value)}
      </span>
    </div>
  );
}
