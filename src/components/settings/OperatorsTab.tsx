import { useMasterData } from "../../context/MasterDataContext";
import { sortEmployeesByNumber } from "../../utils/employees";
import { SettingsCard, SettingsPanel } from "./SettingsUi";

export function OperatorsTab() {
  const { operators } = useMasterData();

  return (
    <SettingsPanel
      title="Operators"
      description="Employees without a supervisor or admin role."
    >
      <div className="space-y-2">
        {sortEmployeesByNumber(operators).map((employee) => (
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
        {operators.length === 0 && (
          <p className="text-sm text-white/40">No operators configured.</p>
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
