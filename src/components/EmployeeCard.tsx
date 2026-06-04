import { EmployeeIdentity } from "./EmployeeIdentity";
import type { Employee, EmployeeTotals } from "../types";
import { getGrandTotal } from "../types";
import { formatWeight } from "../utils/format";

interface EmployeeCardProps {
  employee: Employee;
  totals: EmployeeTotals;
  isActive: boolean;
  onClick: () => void;
}

export function EmployeeCard({ employee, totals, isActive, onClick }: EmployeeCardProps) {
  const grandTotal = getGrandTotal(totals);

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border-2 p-4 text-left transition-all duration-150 active:scale-[0.98]
        ${
          isActive
            ? "border-brand-500 bg-brand-600/15 shadow-lg shadow-brand-500/10"
            : "border-surface-600 bg-surface-800 hover:border-surface-500 hover:bg-surface-700"
        }`}
    >
      <EmployeeIdentity employee={employee} size="card" />

      <div className="mt-3 space-y-1.5 border-t border-surface-600/50 pt-3">
        <WeightLine label="Regular Trim" value={totals.regular} color="text-trim-regular" />
        <WeightLine label="Stick Trim" value={totals.stick} color="text-trim-stick" />
        <WeightLine label="Smalls" value={totals.smalls} color="text-trim-smalls" />
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-sm font-bold uppercase tracking-wide text-white/60">TOTAL</span>
          <span className="text-xl font-bold tabular-nums text-brand-400">
            {formatWeight(grandTotal)}
          </span>
        </div>
      </div>
    </button>
  );
}

function WeightLine({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-white/50">{label}:</span>
      <span className={`text-base font-semibold tabular-nums ${color}`}>
        {formatWeight(value)}
      </span>
    </div>
  );
}
