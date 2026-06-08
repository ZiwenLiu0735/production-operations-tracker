import { useState } from "react";
import { Button } from "../Button";
import {
  inputClass,
  selectClass,
  SettingsField,
} from "../settings/SettingsUi";
import {
  type DbEmployee,
  formatDbEmployeeCode,
  formatDbEmployeeDisplayName,
} from "../../lib/employees";
import {
  buildProductionEntryDraft,
  PRODUCTION_ENTRY_CATEGORIES,
  type ProductionEntryDraft,
} from "../../lib/productionEntries";

interface ProductionEntryModalProps {
  employee: DbEmployee;
  sessionId: string;
  onSave: (payload: ProductionEntryDraft) => void;
  onClose: () => void;
}

export function ProductionEntryModal({
  employee,
  sessionId,
  onSave,
  onClose,
}: ProductionEntryModalProps) {
  const [category, setCategory] = useState("");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const employeeCode = formatDbEmployeeCode(employee);

  function handleSave() {
    const result = buildProductionEntryDraft({
      sessionId,
      employeeId: employee.id,
      category,
      weight,
      notes,
    });

    if (!result.draft) {
      setValidationError(result.error);
      return;
    }

    onSave(result.draft);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-md rounded-2xl border border-surface-600 bg-surface-800 p-6 shadow-2xl">
        <h2 className="text-xl font-bold">Production Entry</h2>
        <p className="mt-1 text-sm text-white/50">Record weight for this employee</p>

        <div className="mt-6 space-y-4">
          <SettingsField label="Employee">
            <div className="rounded-xl border-2 border-surface-600 bg-surface-900 px-4 py-3">
              <p className="text-base font-semibold text-white">
                {formatDbEmployeeDisplayName(employee)}
              </p>
              {employeeCode && (
                <p className="mt-0.5 font-mono text-sm text-brand-400">{employeeCode}</p>
              )}
            </div>
          </SettingsField>

          <SettingsField label="Category">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setValidationError(null);
              }}
              className={selectClass}
            >
              <option value="">Select category…</option>
              {PRODUCTION_ENTRY_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </SettingsField>

          <SettingsField label="Weight">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={weight}
              onChange={(e) => {
                setWeight(e.target.value);
                setValidationError(null);
              }}
              className={`${inputClass} text-center text-2xl font-bold tabular-nums`}
              autoFocus
            />
          </SettingsField>

          <SettingsField label="Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes…"
              className={`${inputClass} resize-none`}
            />
          </SettingsField>
        </div>

        {validationError && (
          <p className="mt-4 text-sm text-red-300">{validationError}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button size="lg" fullWidth onClick={handleSave}>
            Save Entry
          </Button>
        </div>
      </div>
    </div>
  );
}
