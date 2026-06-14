import { useMasterData } from "../../context/MasterDataContext";
import { sortEmployeesByNumber } from "../../utils/employees";
import { SettingsCard, SettingsPanel } from "./SettingsUi";

export function EmployeesTab() {
  const { employees } = useMasterData();

  return (
    <SettingsPanel
      title="Employees"
      description="Employees currently stored in Supabase."
    >
      <div className="space-y-2">
        {sortEmployeesByNumber(employees).map((employee) => (
          <SettingsCard key={employee.id}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-white">
                  #{employee.employeeNumber} {employee.legalName}
                </p>
                {employee.preferredName && (
                  <p className="text-sm text-white/50">
                    Preferred name: {employee.preferredName}
                  </p>
                )}
              </div>
              <StatusBadge active={employee.active} />
            </div>
          </SettingsCard>
        ))}
        {employees.length === 0 && (
          <p className="text-sm text-white/40">No employees configured.</p>
        )}
      </div>
    </SettingsPanel>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-brand-600/20 text-brand-400" : "bg-surface-700 text-white/40"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
