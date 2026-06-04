import type { Employee } from "../types";
import { getGrandTotal, type EmployeeTotals } from "../types";
import { employeeNickname, formatEmployeeId } from "../utils/employees";
import { formatWeight } from "../utils/format";

interface CompactEmployeeCardProps {
  employee: Employee;
  totals: EmployeeTotals;
  isActive: boolean;
  onClick: () => void;
}

export function CompactEmployeeCard({
  employee,
  totals,
  isActive,
  onClick,
}: CompactEmployeeCardProps) {
  const total = getGrandTotal(totals);

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border px-2 py-1.5 text-left transition-all active:scale-[0.98]
        ${
          isActive
            ? "border-brand-500 bg-brand-600/20"
            : "border-surface-600/80 bg-surface-800 hover:border-surface-500"
        }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-sm font-bold tabular-nums text-brand-400">
          {formatEmployeeId(employee.employeeNumber)}
        </span>
        <span className="text-xs font-bold tabular-nums text-white/60">
          {formatWeight(total)}
        </span>
      </div>
      <p className="truncate text-xs font-medium leading-tight text-white">
        {employee.legalName}
      </p>
      {employeeNickname(employee) && (
        <p className="truncate text-[10px] leading-tight text-white/40">
          ({employeeNickname(employee)})
        </p>
      )}
    </button>
  );
}
