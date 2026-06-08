import { useEffect, useMemo, useState } from "react";
import { DbEmployeeIdentity } from "../DbEmployeeIdentity";
import { Button } from "../Button";
import {
  type DbEmployee,
  fetchActiveEmployees,
  filterDbEmployees,
} from "../../lib/employees";

interface AddEmployeePickerModalProps {
  enrolledEmployeeIds: string[];
  onAdd: (employeeId: string) => void;
  onClose: () => void;
}

export function AddEmployeePickerModal({
  enrolledEmployeeIds,
  onAdd,
  onClose,
}: AddEmployeePickerModalProps) {
  const [employees, setEmployees] = useState<DbEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const enrolled = useMemo(() => new Set(enrolledEmployeeIds), [enrolledEmployeeIds]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await fetchActiveEmployees();
      if (result.error) {
        setError(result.error);
        setEmployees([]);
      } else {
        setEmployees((result.data ?? []).filter((employee) => !enrolled.has(employee.id)));
      }
      setLoading(false);
    }
    void load();
  }, [enrolled]);

  const filteredEmployees = useMemo(
    () => filterDbEmployees(employees, searchQuery),
    [employees, searchQuery],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="flex max-h-[85dvh] w-full max-w-lg flex-col rounded-2xl border border-surface-600 bg-surface-800 shadow-2xl">
        <div className="border-b border-surface-600/50 p-6">
          <h2 className="text-xl font-bold">Add Employee</h2>
          <p className="mt-1 text-sm text-white/50">Select an employee to add to this session</p>
          <input
            type="search"
            placeholder="Search employees…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-4 w-full rounded-xl border-2 border-surface-600 bg-surface-900 px-4 py-3 text-base text-white outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="text-sm text-white/50">Loading employees…</p>}
          {error && <p className="text-sm text-red-300">{error}</p>}
          {!loading && !error && filteredEmployees.length === 0 && (
            <p className="text-center text-sm text-white/40">No available employees</p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filteredEmployees.map((employee) => (
              <button
                key={employee.id}
                type="button"
                onClick={() => onAdd(employee.id)}
                className="rounded-xl border-2 border-surface-600 bg-surface-900 p-3 text-left transition-all hover:border-brand-500 active:scale-[0.98]"
              >
                <DbEmployeeIdentity employee={employee} size="sm" />
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-surface-600/50 p-4">
          <Button variant="secondary" size="md" fullWidth onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
