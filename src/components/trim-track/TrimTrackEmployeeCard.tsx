import { Button } from "../Button";
import {
  type DbEmployee,
  formatDbEmployeeCode,
  formatDbEmployeeDisplayName,
} from "../../lib/employees";

interface TrimTrackEmployeeCardProps {
  employee: DbEmployee;
  onAddEntry?: (employee: DbEmployee) => void;
}

export function TrimTrackEmployeeCard({ employee, onAddEntry }: TrimTrackEmployeeCardProps) {
  const employeeCode = formatDbEmployeeCode(employee);
  const statusLabel = employee.status?.trim() || "Unknown";

  return (
    <article className="flex flex-col rounded-xl border border-surface-600 bg-surface-800 p-4">
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="truncate text-base font-semibold text-white">
          {formatDbEmployeeDisplayName(employee)}
        </h3>
        {employeeCode && (
          <p className="font-mono text-sm font-semibold tabular-nums text-brand-400">{employeeCode}</p>
        )}
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-400/90">{statusLabel}</p>
      </div>

      <Button
        size="md"
        variant="secondary"
        fullWidth
        className="mt-4"
        onClick={() => onAddEntry?.(employee)}
      >
        Add Entry
      </Button>
    </article>
  );
}
