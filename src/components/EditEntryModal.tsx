import { useState } from "react";
import { Button } from "./Button";
import type { Employee, TrimCategory, WeightEntry } from "../types";
import { CATEGORY_LABELS } from "../types";
import { formatTime, parseWholeWeight } from "../utils/format";
import { formatEmployeeId } from "../utils/employees";

interface EditEntryModalProps {
  entry: WeightEntry;
  employee: Employee;
  onSave: (updates: { weight: number; category: TrimCategory }) => void;
  onDelete: () => void;
  onClose: () => void;
  saving?: boolean;
}

export function EditEntryModal({
  entry,
  employee,
  onSave,
  onDelete,
  onClose,
  saving = false,
}: EditEntryModalProps) {
  const [weight, setWeight] = useState(String(entry.weight));
  const [category, setCategory] = useState<TrimCategory>(entry.category);

  const parsedWeight = parseWholeWeight(weight);
  const canSave = parsedWeight !== null;

  function handleSave() {
    if (!canSave) return;
    onSave({ weight: parsedWeight, category });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-md rounded-2xl border border-surface-600 bg-surface-800 p-6 shadow-2xl">
        <h2 className="text-xl font-bold">Edit Entry</h2>
        <p className="mt-1 text-sm text-white/50">
          {formatEmployeeId(employee.employeeNumber)} {employee.legalName} ·{" "}
          {formatTime(entry.timestamp)}
        </p>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium uppercase tracking-widest text-white/40">
            Weight (grams)
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={weight}
            onChange={(e) => setWeight(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-xl border-2 border-surface-600 bg-surface-900 px-4 py-4 text-center text-3xl font-bold tabular-nums text-white outline-none focus:border-brand-500"
            autoFocus
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium uppercase tracking-widest text-white/40">
            Category
          </label>
          <div className="grid grid-cols-1 gap-2">
            {(["regular", "stick", "smalls"] as TrimCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                disabled={saving}
                className={`min-h-14 rounded-xl border-2 px-4 text-left text-base font-semibold transition-all
                  ${
                    category === cat
                      ? "border-brand-500 bg-brand-600/15 text-white"
                      : "border-surface-600 bg-surface-900 text-white/70 hover:border-surface-500"
                  }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            variant="danger"
            size="lg"
            fullWidth
            onClick={onDelete}
            disabled={saving}
          >
            {saving ? "Saving…" : "Delete"}
          </Button>
          <Button
            size="lg"
            fullWidth
            disabled={!canSave || saving}
            onClick={handleSave}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="md"
          fullWidth
          className="mt-3"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
