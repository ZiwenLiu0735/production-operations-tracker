import { EmployeeIdentity } from "./EmployeeIdentity";
import type { Employee, TrimCategory, WeightEntry } from "../types";
import { CATEGORY_LABELS, getEntriesByCategory, getEmployeeTotals, getGrandTotal } from "../types";
import { formatTime, formatWeight, formatWeightWithLbs } from "../utils/format";

interface EmployeeDetailViewProps {
  employee: Employee;
  entries: WeightEntry[];
  compact?: boolean;
  onEdit?: (entry: WeightEntry) => void;
  onDelete?: (entryId: string) => void;
}

export function EmployeeDetailView({
  employee,
  entries,
  compact = false,
  onEdit,
  onDelete,
}: EmployeeDetailViewProps) {
  const totals = getEmployeeTotals(employee.id, entries);
  const grandTotal = getGrandTotal(totals);
  const categories: TrimCategory[] = ["regular", "stick", "smalls"];
  const canEdit = Boolean(onEdit && onDelete);

  return (
    <div className={compact ? "space-y-2" : "flex h-full flex-col"}>
      <EmployeeIdentity employee={employee} size={compact ? "sm" : "lg"} align="center" />

      <div className={`${compact ? "space-y-2" : "mt-6 flex-1 space-y-4 overflow-y-auto"}`}>
        {categories.map((category) => {
          const categoryEntries = getEntriesByCategory(employee.id, category, entries);
          const subtotal = categoryEntries.reduce((sum, e) => sum + e.weight, 0);

          return (
            <div
              key={category}
              className={`rounded-xl border border-surface-600 bg-surface-800 ${compact ? "p-2.5" : "p-4"}`}
            >
              <h3 className={`font-bold text-white ${compact ? "text-sm" : "text-base"}`}>
                {CATEGORY_LABELS[category]}
              </h3>

              {categoryEntries.length > 0 ? (
                <div className="mt-1.5 space-y-1">
                  {categoryEntries.map((entry) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      compact={compact}
                      canEdit={canEdit}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              ) : (
                <p className={`text-white/30 ${compact ? "mt-1 text-xs" : "mt-2 text-sm"}`}>
                  No entries
                </p>
              )}

              <div className="mt-2 flex items-baseline justify-between border-t border-surface-600/50 pt-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/50">
                  Subtotal
                </span>
                <span
                  className={`font-bold tabular-nums text-white ${compact ? "text-sm" : "text-lg"}`}
                >
                  {formatWeightWithLbs(subtotal)}
                </span>
              </div>
            </div>
          );
        })}

        <div
          className={`rounded-xl border-2 border-brand-500 bg-brand-600/10 ${compact ? "p-2.5" : "p-4"}`}
        >
          <div className="flex items-baseline justify-between">
            <span
              className={`font-bold uppercase tracking-wide text-white ${compact ? "text-sm" : "text-base"}`}
            >
              TOTAL
            </span>
            <span
              className={`font-bold tabular-nums text-brand-400 ${compact ? "text-lg" : "text-2xl"}`}
            >
              {formatWeightWithLbs(grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EntryRow({
  entry,
  compact,
  canEdit,
  onEdit,
  onDelete,
}: {
  entry: WeightEntry;
  compact: boolean;
  canEdit: boolean;
  onEdit?: (entry: WeightEntry) => void;
  onDelete?: (entryId: string) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg bg-surface-900/80 ${compact ? "px-2 py-1.5" : "px-3 py-2"}`}
    >
      <div className="min-w-0 flex-1">
        <p className={`font-bold tabular-nums text-white ${compact ? "text-sm" : "text-base"}`}>
          {formatWeight(entry.weight)}
        </p>
        <p className={`text-white/50 ${compact ? "text-[10px]" : "text-xs"}`}>
          {formatTime(entry.timestamp)}
        </p>
      </div>
      {canEdit && (
        <div className={`ml-2 flex shrink-0 ${compact ? "gap-1" : "gap-2"}`}>
          <button
            onClick={() => onEdit!(entry)}
            className={`rounded-md bg-surface-600 font-semibold text-white active:bg-surface-500 ${compact ? "min-h-8 px-2 text-[10px]" : "min-h-9 px-3 text-xs"}`}
          >
            Edit
          </button>
          <button
            onClick={() => onDelete!(entry.id)}
            className={`rounded-md bg-red-900/60 font-semibold text-red-300 active:bg-red-900 ${compact ? "min-h-8 px-2 text-[10px]" : "min-h-9 px-3 text-xs"}`}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
