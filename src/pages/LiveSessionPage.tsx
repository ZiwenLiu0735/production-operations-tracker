import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { CompactEmployeeCard } from "../components/CompactEmployeeCard";
import { EmployeeDetailView } from "../components/EmployeeDetailView";
import { EmployeeIdentity } from "../components/EmployeeIdentity";
import { EditEntryModal } from "../components/EditEntryModal";
import { UndoLastEntryModal } from "../components/UndoLastEntryModal";
import { RecentEntries } from "../components/RecentEntries";
import { Layout } from "../components/Layout";
import { SessionInfoHeader } from "../components/SessionInfoHeader";
import { useMasterData } from "../context/MasterDataContext";
import { useSession } from "../context/SessionContext";
import type { TrimCategory, WeightEntry } from "../types";
import { getEmployeeTotals } from "../types";
import { getRecentEntries } from "../utils/export";
import { getNewestEntry } from "../utils/sessionEntries";
import { getSessionEmployees } from "../utils/sessionEmployees";
import { parseWholeWeight } from "../utils/format";

export function LiveSessionPage() {
  const navigate = useNavigate();
  const { employees } = useMasterData();
  const { session, addEntry, updateEntry, deleteEntry, undoLastEntry, endSession } = useSession();

  const [activeEmployeeId, setActiveEmployeeId] = useState<string>("");
  const [weight, setWeight] = useState("");
  const [flash, setFlash] = useState<TrimCategory | null>(null);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [undoEntry, setUndoEntry] = useState<WeightEntry | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sessionEmployees = useMemo(() => {
    if (!session) return [];
    return getSessionEmployees(session, employees);
  }, [session, employees]);

  const recentEntries = useMemo(
    () => (session ? getRecentEntries(session.entries, 20) : []),
    [session],
  );

  const gridCols =
    sessionEmployees.length > 12 ? "grid-cols-3" : "grid-cols-2";

  useEffect(() => {
    if (!session) {
      navigate("/", { replace: true });
      return;
    }
    if (session.endedAt) {
      navigate("/summary", { replace: true });
      return;
    }
    if (!activeEmployeeId && sessionEmployees.length > 0) {
      setActiveEmployeeId(sessionEmployees[0].id);
    }
  }, [session, sessionEmployees, activeEmployeeId, navigate]);

  const activeEmployee = sessionEmployees.find((e) => e.id === activeEmployeeId);
  const parsedWeight = parseWholeWeight(weight);

  function handleEmployeeClick(employeeId: string) {
    setActiveEmployeeId(employeeId);
    inputRef.current?.focus();
  }

  function handleCategoryClick(category: TrimCategory) {
    if (!activeEmployeeId || parsedWeight === null) return;

    addEntry(activeEmployeeId, category, parsedWeight);
    setWeight("");
    setFlash(category);
    setTimeout(() => setFlash(null), 400);
    inputRef.current?.focus();
  }

  function handleBack() {
    if (
      window.confirm(
        "Return to session setup? Your entries are saved and you can resume this session.",
      )
    ) {
      navigate("/");
    }
  }

  function handleEndSession() {
    endSession();
    navigate("/summary");
  }

  function handleWeightChange(value: string) {
    setWeight(value.replace(/\D/g, ""));
  }

  if (!session) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-900 text-white/50">
        Loading session…
      </div>
    );
  }

  const activeSession = session;

  const editingEmployee = editingEntry
    ? employees.find((e) => e.id === editingEntry.employeeId)
    : null;

  const canUndo = activeSession.entries.length > 0;

  const undoEmployee = undoEntry
    ? sessionEmployees.find((employee) => employee.id === undoEntry.employeeId)
    : null;

  function handleUndoClick() {
    const newest = getNewestEntry(activeSession.entries);
    if (!newest) return;
    setUndoEntry(newest);
  }

  function handleConfirmUndo() {
    const entryToRemove = undoEntry;
    undoLastEntry();
    setUndoEntry(null);
    setToast("Last entry removed");
    setTimeout(() => setToast(null), 2500);
    if (editingEntry && entryToRemove && editingEntry.id === entryToRemove.id) {
      setEditingEntry(null);
    }
  }

  return (
    <Layout
      onBack={handleBack}
      backLabel="Setup"
      headerCenter={<SessionInfoHeader session={activeSession} compact />}
      headerRight={
        <Button variant="danger" size="md" onClick={handleEndSession}>
          End Session
        </Button>
      }
    >
      <div className="flex flex-1 overflow-hidden">
        {/* Left: compact employee selection */}
        <aside className="flex w-[24%] min-w-[200px] max-w-[280px] flex-col border-r border-surface-600/50 bg-surface-800/50">
          <div className="border-b border-surface-600/50 px-3 py-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
              Select Employee
            </h2>
          </div>
          <div className={`grid ${gridCols} flex-1 gap-1 overflow-y-auto p-2 content-start`}>
            {sessionEmployees.map((employee) => {
              const totals = getEmployeeTotals(employee.id, activeSession.entries);
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

        {/* Center: entry panel */}
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
                onChange={(e) => handleWeightChange(e.target.value)}
                className="w-full rounded-xl border-2 border-surface-600 bg-surface-800 px-4 py-3 text-center text-4xl font-bold tabular-nums text-white outline-none focus:border-brand-500"
                autoFocus
              />
            </div>

            <div className="mt-3 grid shrink-0 grid-cols-1 gap-2">
              <CategoryButton
                label="Regular Trim"
                variant="regular"
                flash={flash === "regular"}
                disabled={parsedWeight === null}
                onClick={() => handleCategoryClick("regular")}
              />
              <CategoryButton
                label="Stick Trim"
                variant="stick"
                flash={flash === "stick"}
                disabled={parsedWeight === null}
                onClick={() => handleCategoryClick("stick")}
              />
              <CategoryButton
                label="Smalls"
                variant="smalls"
                flash={flash === "smalls"}
                disabled={parsedWeight === null}
                onClick={() => handleCategoryClick("smalls")}
              />
            </div>

            <div className="mt-3 min-h-0 flex-1 overflow-hidden">
              <RecentEntries
                entries={recentEntries}
                compact
                headerAction={
                  canUndo ? (
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

        {/* Right: employee detail / breakdown */}
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
                entries={activeSession.entries}
                compact
                onEdit={setEditingEntry}
                onDelete={deleteEntry}
              />
            ) : (
              <p className="text-center text-sm text-white/30">
                Select an employee to view breakdown
              </p>
            )}
          </div>
        </section>
      </div>

      {editingEntry && editingEmployee && (
        <EditEntryModal
          entry={editingEntry}
          employee={editingEmployee}
          onSave={(updates) => {
            updateEntry(editingEntry.id, updates);
            setEditingEntry(null);
          }}
          onDelete={() => {
            deleteEntry(editingEntry.id);
            setEditingEntry(null);
          }}
          onClose={() => setEditingEntry(null)}
        />
      )}
      {undoEntry && undoEmployee && (
        <UndoLastEntryModal
          entry={undoEntry}
          employee={undoEmployee}
          onConfirm={handleConfirmUndo}
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
