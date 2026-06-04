import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppNav } from "../components/AppNav";
import { AuditTrailPanel } from "../components/AuditTrailPanel";
import { Button } from "../components/Button";
import { useEditorNameAction } from "../components/EditorNameModal";
import { EditEntryModal } from "../components/EditEntryModal";
import { EmployeeIdentity } from "../components/EmployeeIdentity";
import { Layout } from "../components/Layout";
import { inputClass, SettingsField } from "../components/settings/SettingsUi";
import { useArchive, useArchiveRefreshOnMount } from "../context/ArchiveContext";
import type { ArchivedWeightEntry, TrimCategory } from "../types";
import { CATEGORY_LABELS, getEntriesByCategory, getGrandTotal } from "../types";
import { getActiveEntries } from "../utils/archive";
import { snapshotToEmployee } from "../utils/archiveView";
import { formatTime, formatWeight, parseWholeWeight } from "../utils/format";

const CATEGORIES: TrimCategory[] = ["regular", "stick", "smalls"];

export function ArchiveEmployeeEditPage() {
  useArchiveRefreshOnMount();
  const { id, employeeId } = useParams<{ id: string; employeeId: string }>();
  const navigate = useNavigate();
  const {
    getArchive,
    addEntry,
    updateEntry,
    softDeleteEntry,
    adjustCategoryTotal,
  } = useArchive();
  const { runWithEditorName, editorModal } = useEditorNameAction();

  const archived = id ? getArchive(id) : null;
  const employeeSnapshot = archived?.employees.find((employee) => employee.id === employeeId);

  const [editingEntry, setEditingEntry] = useState<ArchivedWeightEntry | null>(null);
  const [categoryTotals, setCategoryTotals] = useState<Record<TrimCategory, string>>({
    regular: "0",
    stick: "0",
    smalls: "0",
  });
  const [addingCategory, setAddingCategory] = useState<TrimCategory | null>(null);
  const [newEntryWeight, setNewEntryWeight] = useState("");

  const employee = employeeSnapshot ? snapshotToEmployee(employeeSnapshot) : null;

  const activeEntries = useMemo(() => {
    if (!archived || !employeeId) return [];
    return getActiveEntries(archived.entries).filter((entry) => entry.employeeId === employeeId);
  }, [archived, employeeId]);

  useEffect(() => {
    if (!employeeSnapshot) return;
    setCategoryTotals({
      regular: String(employeeSnapshot.totals.regular),
      stick: String(employeeSnapshot.totals.stick),
      smalls: String(employeeSnapshot.totals.smalls),
    });
  }, [employeeSnapshot]);

  if (!archived || !employeeSnapshot || !employee) {
    return (
      <Layout title="Employee Session Editor" headerRight={<AppNav />}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-white/50">Employee session not found.</p>
          <Link to="/archive" className="text-brand-400 underline">
            Back to Archive
          </Link>
        </div>
      </Layout>
    );
  }

  function handleSaveCategoryTotal(category: TrimCategory) {
    const parsed = parseWholeWeight(categoryTotals[category]);
    if (parsed === null) return;

    runWithEditorName((editedBy) => {
      adjustCategoryTotal(archived!.id, employee!.id, category, parsed, editedBy);
    });
  }

  function handleAddEntry() {
    if (!addingCategory) return;
    const parsed = parseWholeWeight(newEntryWeight);
    if (parsed === null) return;

    runWithEditorName((editedBy) => {
      addEntry(
        archived!.id,
        {
          employeeId: employee!.id,
          category: addingCategory,
          weight: parsed,
          timestamp: archived!.startedAt,
        },
        editedBy,
      );
      setAddingCategory(null);
      setNewEntryWeight("");
    });
  }

  return (
    <Layout
      title="Employee Session Editor"
      subtitle="Edit entries and category totals · all changes audit logged"
      onBack={() => navigate(`/archive/${archived.id}/edit`)}
      backLabel="Session Edit"
      headerRight={<AppNav />}
    >
      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <div className="rounded-xl border border-surface-600 bg-surface-800 p-4">
            <EmployeeIdentity employee={employee} size="lg" align="center" />
            <p className="mt-3 text-center text-sm text-white/50">
              Grand total:{" "}
              <span className="font-bold tabular-nums text-brand-400">
                {formatWeight(getGrandTotal(employeeSnapshot.totals))}
              </span>
            </p>
          </div>

          {CATEGORIES.map((category) => {
            const entries = getEntriesByCategory(employee.id, category, activeEntries);
            return (
              <section
                key={category}
                className="rounded-xl border border-surface-600 bg-surface-800 p-4"
              >
                <div className="flex flex-wrap items-end gap-3">
                  <SettingsField label={`${CATEGORY_LABELS[category]} Total (g)`} className="min-w-0 flex-1">
                    <input
                      value={categoryTotals[category]}
                      onChange={(e) =>
                        setCategoryTotals((prev) => ({
                          ...prev,
                          [category]: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      className={inputClass}
                      inputMode="numeric"
                    />
                  </SettingsField>
                  <Button size="md" onClick={() => handleSaveCategoryTotal(category)}>
                    Save Total
                  </Button>
                  <Button
                    size="md"
                    variant="secondary"
                    onClick={() => {
                      setAddingCategory(category);
                      setNewEntryWeight("");
                    }}
                  >
                    Add Entry
                  </Button>
                </div>

                <div className="mt-4 space-y-2">
                  {entries.length === 0 ? (
                    <p className="text-sm text-white/40">No active entries in this category.</p>
                  ) : (
                    entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-surface-600/50 bg-surface-900/60 px-3 py-2"
                      >
                        <div>
                          <p className="text-base font-bold tabular-nums text-white">
                            {formatWeight(entry.weight)}
                          </p>
                          <p className="text-xs text-white/40">{formatTime(entry.timestamp)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="md" variant="secondary" onClick={() => setEditingEntry(entry)}>
                            Edit
                          </Button>
                          <Button
                            size="md"
                            variant="danger"
                            onClick={() => {
                              runWithEditorName((editedBy) => {
                                softDeleteEntry(archived.id, entry.id, editedBy);
                              });
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            );
          })}

          <AuditTrailPanel audits={archived.auditLog} employeeId={employee.id} />
        </div>
      </div>

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          employee={employee}
          onSave={(updates) => {
            runWithEditorName((editedBy) => {
              updateEntry(archived.id, editingEntry.id, updates, editedBy);
              setEditingEntry(null);
            });
          }}
          onDelete={() => {
            runWithEditorName((editedBy) => {
              softDeleteEntry(archived.id, editingEntry.id, editedBy);
              setEditingEntry(null);
            });
          }}
          onClose={() => setEditingEntry(null)}
        />
      )}

      {addingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-md rounded-2xl border border-surface-600 bg-surface-800 p-6 shadow-2xl">
            <h2 className="text-xl font-bold">Add Entry</h2>
            <p className="mt-1 text-sm text-white/50">{CATEGORY_LABELS[addingCategory]}</p>
            <SettingsField label="Weight (grams)" className="mt-4">
              <input
                value={newEntryWeight}
                onChange={(e) => setNewEntryWeight(e.target.value.replace(/\D/g, ""))}
                className={`${inputClass} text-center text-3xl font-bold tabular-nums`}
                inputMode="numeric"
                autoFocus
              />
            </SettingsField>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => setAddingCategory(null)}
              >
                Cancel
              </Button>
              <Button
                size="lg"
                fullWidth
                disabled={parseWholeWeight(newEntryWeight) === null}
                onClick={handleAddEntry}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {editorModal}
    </Layout>
  );
}
