import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AddEmployeePickerModal } from "../components/trim-track/AddEmployeePickerModal";
import { TrimSessionInfoHeader } from "../components/trim-track/TrimSessionInfoHeader";
import { Button } from "../components/Button";
import { CompactEmployeeCard } from "../components/CompactEmployeeCard";
import { EmployeeDetailView } from "../components/EmployeeDetailView";
import { EmployeeIdentity } from "../components/EmployeeIdentity";
import { EditEntryModal } from "../components/EditEntryModal";
import { Layout } from "../components/Layout";
import { RecentEntries } from "../components/RecentEntries";
import { UndoLastEntryModal } from "../components/UndoLastEntryModal";
import { useTrimTrackSession } from "../hooks/useTrimTrackSession";
import type { TrimTrackNavigationState } from "../lib/trimTrackNavigation";
import type { TrimCategory, WeightEntry } from "../types";
import { getEmployeeTotals } from "../types";
import { getRecentEntries } from "../utils/export";
import { parseWholeWeight } from "../utils/format";
import { getNewestEntry } from "../utils/sessionEntries";

export function TrimTrackPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const navState = location.state as TrimTrackNavigationState | null;
  const initialEmployeeIds = navState?.employeeIds ?? [];
  const {
    display,
    employees,
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    addEmployee,
    removeEmployee,
    endSession,
  } = useTrimTrackSession(sessionId, initialEmployeeIds);

  const [activeEmployeeId, setActiveEmployeeId] = useState("");
  const [weight, setWeight] = useState("");
  const [flash, setFlash] = useState<TrimCategory | null>(null);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [undoEntry, setUndoEntry] = useState<WeightEntry | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const gridCols = employees.length > 12 ? "grid-cols-3" : "grid-cols-2";

  const recentEntries = useMemo(() => getRecentEntries(entries, 20), [entries]);

  useEffect(() => {
    if (!loading && !error && employees.length > 0 && !activeEmployeeId) {
      setActiveEmployeeId(employees[0].id);
    }
  }, [loading, error, employees, activeEmployeeId]);

  useEffect(() => {
    if (!loading && display?.session.status === "completed") {
      navigate(`/trim-track/${sessionId}/summary`, { replace: true });
    }
  }, [loading, display, sessionId, navigate]);

  const activeEmployee = employees.find((employee) => employee.id === activeEmployeeId);
  const parsedWeight = parseWholeWeight(weight);
  const editingEmployee = editingEntry
    ? employees.find((employee) => employee.id === editingEntry.employeeId)
    : null;
  const undoEmployee = undoEntry
    ? employees.find((employee) => employee.id === undoEntry.employeeId)
    : null;

  function handleEmployeeClick(employeeId: string) {
    setActiveEmployeeId(employeeId);
    inputRef.current?.focus();
  }

  async function handleCategoryClick(category: TrimCategory) {
    if (!activeEmployeeId || parsedWeight === null || saving) return;

    setSaving(true);
    setActionError(null);
    const saveError = await addEntry(activeEmployeeId, category, parsedWeight);
    setSaving(false);

    if (saveError) {
      setActionError(saveError);
      return;
    }

    setWeight("");
    setFlash(category);
    setTimeout(() => setFlash(null), 400);
    inputRef.current?.focus();
  }

  async function handleEndSession() {
    const endError = await endSession();
    if (endError) {
      setActionError(endError);
      return;
    }
    navigate(`/trim-track/${sessionId}/summary`);
  }

  async function handleAddEmployee(employeeId: string) {
    const addError = await addEmployee(employeeId);
    if (addError) {
      setActionError(addError);
      return;
    }
    setShowAddEmployee(false);
    setActiveEmployeeId(employeeId);
  }

  async function handleRemoveEmployee() {
    if (!activeEmployeeId) return;
    const employee = employees.find((item) => item.id === activeEmployeeId);
    if (
      !window.confirm(
        `Remove ${employee?.legalName ?? "this employee"} from the session? Existing entries will be kept.`,
      )
    ) {
      return;
    }

    const removeError = await removeEmployee(activeEmployeeId);
    if (removeError) {
      setActionError(removeError);
      return;
    }

    setActiveEmployeeId("");
  }

  function handleUndoClick() {
    const newest = getNewestEntry(entries);
    if (newest) setUndoEntry(newest);
  }

  async function handleConfirmUndo() {
    if (!undoEntry) return;
    const undoError = await deleteEntry(undoEntry.id);
    setUndoEntry(null);
    if (undoError) {
      setActionError(undoError);
      return;
    }
    setToast("Last entry removed");
    setTimeout(() => setToast(null), 2500);
    if (editingEntry?.id === undoEntry.id) setEditingEntry(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-900 text-white/50">
        Loading session…
      </div>
    );
  }

  if (error || !display) {
    return (
      <Layout title="Trim Track" headerRight={null}>
        <div className="p-6 text-red-200">{error ?? "Session not found."}</div>
      </Layout>
    );
  }

  return (
    <Layout
      onBack={() => navigate("/")}
      backLabel="Setup"
      headerCenter={<TrimSessionInfoHeader display={display} />}
      headerRight={
        <div className="flex items-center gap-2">
          <Button size="md" variant="secondary" onClick={() => setShowAddEmployee(true)}>
            Add Employee
          </Button>
          <Button
            size="md"
            variant="secondary"
            onClick={() => void handleRemoveEmployee()}
            disabled={!activeEmployeeId}
          >
            Remove Employee
          </Button>
          <Button variant="danger" size="md" onClick={() => void handleEndSession()}>
            End Session
          </Button>
        </div>
      }
    >
      {actionError && (
        <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {actionError}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-[24%] min-w-[200px] max-w-[280px] flex-col border-r border-surface-600/50 bg-surface-800/50">
          <div className="border-b border-surface-600/50 px-3 py-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
              Select Employee
            </h2>
          </div>
          <div className={`grid ${gridCols} flex-1 gap-1 overflow-y-auto p-2 content-start`}>
            {employees.map((employee) => {
              const totals = getEmployeeTotals(employee.id, entries);
              return (
                <CompactEmployeeCard
                  key={employee.id}
                  employee={employee}
                  totals={totals}
                  isActive={employee.id === activeEmployeeId}
                  onClick={() => handleEmployeeClick(employee.id)}
                />
              );
            })}
          </div>
        </aside>

        <section className="flex w-[38%] min-w-[280px] flex-col border-r border-surface-600/50 bg-surface-900">
          <div className="flex flex-1 flex-col overflow-hidden p-4">
            <div className="shrink-0 text-center">
              <p className="text-[10px] font-medium uppercase tracking-widest text-white/40">
                Current Employee
              </p>
              {activeEmployee && (
                <div className="mt-1">
                  <EmployeeIdentity employee={activeEmployee} size="md" align="center" />
                </div>
              )}
            </div>

            <div className="mt-3 shrink-0">
              <label
                htmlFor="weight-input"
                className="mb-1 block text-center text-[10px] font-medium uppercase tracking-widest text-white/40"
              >
                Weight (grams)
              </label>
              <input
                ref={inputRef}
                id="weight-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border-2 border-surface-600 bg-surface-800 px-4 py-3 text-center text-4xl font-bold tabular-nums text-white outline-none focus:border-brand-500"
                autoFocus
              />
            </div>

            <div className="mt-3 grid shrink-0 grid-cols-1 gap-2">
              <CategoryButton
                label="Regular Trim"
                variant="regular"
                flash={flash === "regular"}
                disabled={parsedWeight === null || saving}
                onClick={() => void handleCategoryClick("regular")}
              />
              <CategoryButton
                label="Stick Trim"
                variant="stick"
                flash={flash === "stick"}
                disabled={parsedWeight === null || saving}
                onClick={() => void handleCategoryClick("stick")}
              />
              <CategoryButton
                label="Smalls"
                variant="smalls"
                flash={flash === "smalls"}
                disabled={parsedWeight === null || saving}
                onClick={() => void handleCategoryClick("smalls")}
              />
            </div>

            <div className="mt-3 min-h-0 flex-1 overflow-hidden">
              <RecentEntries
                entries={recentEntries}
                compact
                headerAction={
                  entries.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleUndoClick}
                      className="shrink-0 rounded-lg border border-amber-500/50 bg-amber-600/20 px-2 py-1 text-[10px] font-semibold text-amber-200 transition-colors hover:bg-amber-600/35 active:scale-[0.97] touch-manipulation"
                    >
                      Undo Last Entry
                    </button>
                  ) : undefined
                }
              />
            </div>
          </div>
        </section>

        <section className="flex flex-1 flex-col overflow-hidden bg-surface-900/80">
          <div className="border-b border-surface-600/50 px-4 py-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
              Production Breakdown
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {activeEmployee ? (
              <EmployeeDetailView
                employee={activeEmployee}
                entries={entries}
                compact
                onEdit={setEditingEntry}
                onDelete={(entryId) => void deleteEntry(entryId)}
              />
            ) : (
              <p className="text-center text-sm text-white/30">
                Select an employee to view breakdown
              </p>
            )}
          </div>
        </section>
      </div>

      {showAddEmployee && (
        <AddEmployeePickerModal
          enrolledEmployeeIds={employees.map((employee) => employee.id)}
          onAdd={(employeeId) => void handleAddEmployee(employeeId)}
          onClose={() => setShowAddEmployee(false)}
        />
      )}

      {editingEntry && editingEmployee && (
        <EditEntryModal
          entry={editingEntry}
          employee={editingEmployee}
          onSave={(updates) => {
            void updateEntry(editingEntry.id, updates).then((updateError) => {
              if (updateError) setActionError(updateError);
              else setEditingEntry(null);
            });
          }}
          onDelete={() => {
            void deleteEntry(editingEntry.id).then((deleteErr) => {
              if (deleteErr) setActionError(deleteErr);
              else setEditingEntry(null);
            });
          }}
          onClose={() => setEditingEntry(null)}
        />
      )}

      {undoEntry && undoEmployee && (
        <UndoLastEntryModal
          entry={undoEntry}
          employee={undoEmployee}
          onConfirm={() => void handleConfirmUndo()}
          onClose={() => setUndoEntry(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-brand-500/40 bg-surface-800 px-5 py-3 text-sm font-semibold text-brand-300 shadow-lg">
          {toast}
        </div>
      )}
    </Layout>
  );
}

function CategoryButton({
  label,
  variant,
  flash,
  disabled,
  onClick,
}: {
  label: string;
  variant: "regular" | "stick" | "smalls";
  flash: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={variant}
      size="lg"
      fullWidth
      disabled={disabled}
      onClick={onClick}
      className={`transition-transform ${flash ? "scale-95 brightness-125" : ""}`}
    >
      {label}
    </Button>
  );
}
