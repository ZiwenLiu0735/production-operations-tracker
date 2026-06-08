import { useEffect, useMemo, useState } from "react";
import {
  type DbEmployee,
  fetchActiveEmployees,
  filterDbEmployees,
} from "../../lib/employees";
import { TrimTrackEmployeeCard } from "./TrimTrackEmployeeCard";

interface TrimTrackEmployeeSectionProps {
  onAddEntry?: (employee: DbEmployee) => void;
}

export function TrimTrackEmployeeSection({ onAddEntry }: TrimTrackEmployeeSectionProps) {
  const [employees, setEmployees] = useState<DbEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadEmployees() {
      setLoading(true);
      setError(null);

      const result = await fetchActiveEmployees();
      if (result.error) {
        setError(result.error);
        setEmployees([]);
      } else {
        setEmployees(result.data ?? []);
      }

      setLoading(false);
    }

    void loadEmployees();
  }, []);

  const filteredEmployees = useMemo(
    () => filterDbEmployees(employees, searchQuery),
    [employees, searchQuery],
  );

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50">Employees</h2>

      <input
        type="search"
        enterKeyHint="search"
        placeholder="Search by name, employee number, code, or preferred name…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full rounded-xl border-2 border-surface-600 bg-surface-800 px-4 py-3 text-base text-white outline-none placeholder:text-white/30 focus:border-brand-500"
      />

      {loading && <p className="text-sm text-white/50">Loading employees…</p>}

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Failed to load employees: {error}
        </div>
      )}

      {!loading && !error && filteredEmployees.length === 0 && (
        <p className="rounded-xl border border-surface-600 bg-surface-800 px-4 py-8 text-center text-sm text-white/50">
          {employees.length === 0
            ? "No active employees found."
            : "No employees match your search."}
        </p>
      )}

      {!loading && !error && filteredEmployees.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((employee) => (
            <TrimTrackEmployeeCard key={employee.id} employee={employee} onAddEntry={onAddEntry} />
          ))}
        </div>
      )}
    </section>
  );
}
