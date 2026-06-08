import { useMemo, useState } from "react";
import { EmployeeIdentity } from "./EmployeeIdentity";
import { Button } from "./Button";
import type { Employee } from "../types";
import { filterEmployees } from "../utils/employees";

interface PrototypeAddEmployeeModalProps {
  allEmployees: Employee[];
  enrolledEmployeeIds: string[];
  onAdd: (employee: Employee) => void;
  onClose: () => void;
}

export function PrototypeAddEmployeeModal({
  allEmployees,
  enrolledEmployeeIds,
  onAdd,
  onClose,
}: PrototypeAddEmployeeModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const enrolled = useMemo(() => new Set(enrolledEmployeeIds), [enrolledEmployeeIds]);

  const availableEmployees = useMemo(
    () => allEmployees.filter((employee) => !enrolled.has(employee.id)),
    [allEmployees, enrolled],
  );

  const filteredEmployees = useMemo(
    () => filterEmployees(availableEmployees, searchQuery),
    [availableEmployees, searchQuery],
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
          {filteredEmployees.length === 0 ? (
            <p className="text-center text-sm text-white/40">No available employees</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filteredEmployees.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => onAdd(employee)}
                  className="rounded-xl border-2 border-surface-600 bg-surface-900 p-3 text-left transition-all hover:border-brand-500 active:scale-[0.98]"
                >
                  <EmployeeIdentity employee={employee} size="sm" />
                </button>
              ))}
            </div>
          )}
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
