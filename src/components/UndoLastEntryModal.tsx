import { Button } from "./Button";
import type { Employee, WeightEntry } from "../types";
import { CATEGORY_LABELS } from "../types";
import { formatEmployeeId } from "../utils/employees";
import { formatWeight } from "../utils/format";

function formatEmployeeUndoLabel(employee: Employee): string {
  const nick = employee.preferredName?.trim();
  const name = nick || employee.legalName;
  return `${formatEmployeeId(employee.employeeNumber)} ${name}`;
}

interface UndoLastEntryModalProps {
  entry: WeightEntry;
  employee: Employee;
  onConfirm: () => void;
  onClose: () => void;
  saving?: boolean;
}

export function UndoLastEntryModal({
  entry,
  employee,
  onConfirm,
  onClose,
  saving = false,
}: UndoLastEntryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-surface-800 p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-amber-200">Undo last entry?</h2>
        <div className="mt-4 space-y-2 rounded-xl border border-surface-600/50 bg-surface-900/60 px-4 py-3 text-sm">
          <p className="text-white/70">
            <span className="text-white/40">Employee: </span>
            {formatEmployeeUndoLabel(employee)}
          </p>
          <p className="text-white/70">
            <span className="text-white/40">Category: </span>
            {CATEGORY_LABELS[entry.category]}
          </p>
          <p className="text-white/70">
            <span className="text-white/40">Weight: </span>
            {formatWeight(entry.weight)}
          </p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            size="lg"
            fullWidth
            onClick={onConfirm}
            disabled={saving}
            className="border border-amber-500/50 bg-amber-600/25 text-amber-100 hover:bg-amber-600/40 active:bg-amber-700/40"
          >
            {saving ? "Removing…" : "Undo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
