import { formatLbs, formatWeight, formatWeightWithLbs } from "../utils/format";

export function ProductionStat({
  label,
  value,
  color = "text-white",
  variant,
}: {
  label: string;
  value: number;
  color?: string;
  variant?: "trim" | "stick" | "smalls";
}) {
  const variantClass =
    variant === "trim"
      ? "tt-stat-card--trim"
      : variant === "stick"
        ? "tt-stat-card--stick"
        : variant === "smalls"
          ? "tt-stat-card--smalls"
          : "";

  return (
    <div className={`tt-stat-card ${variantClass}`}>
      <p className="tt-stat-card__label">{label}</p>
      <p className={`tt-stat-card__value ${color}`}>{formatWeight(value)}</p>
      <p className="tt-stat-card__sub">{formatLbs(value)}</p>
    </div>
  );
}

export function GrandTotalCard({ grams }: { grams: number }) {
  return (
    <div className="tt-stat-card tt-stat-card--highlight">
      <p className="tt-stat-card__label">Grand Total</p>
      <p className="tt-stat-card__value text-brand-400">{formatWeight(grams)}</p>
      <p className="tt-stat-card__sub">{formatLbs(grams)}</p>
    </div>
  );
}

export function SummaryLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-sm text-white/50">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-white/90">
        {formatWeightWithLbs(value)}
      </span>
    </div>
  );
}
