import { useState } from "react";
import { sortEmployeesByNumber } from "../../utils/employees";
import { Button } from "../Button";
import { useMasterData } from "../../context/MasterDataContext";
import {
  ActiveToggle,
  SettingsCard,
  SettingsField,
  SettingsPanel,
  inputClass,
} from "./SettingsUi";

export function EmployeesTab() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useMasterData();
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [legalName, setLegalName] = useState("");
  const [nickname, setNickname] = useState("");

  function handleAdd() {
    const num = parseInt(employeeNumber, 10);
    if (!num || !legalName.trim()) return;
    if (employees.some((e) => e.employeeNumber === num)) {
      alert("Employee ID already exists");
      return;
    }
    addEmployee({
      employeeNumber: num,
      legalName: legalName.trim(),
      nickname: nickname.trim() || undefined,
      active: true,
    });
    setEmployeeNumber("");
    setLegalName("");
    setNickname("");
  }

  const sorted = sortEmployeesByNumber(employees);

  return (
    <SettingsPanel
      title="Employees"
      description="Manage trim room employees. Only active employees appear in session setup."
    >
      <SettingsCard>
        <p className="mb-3 text-sm font-semibold text-white/70">Add Employee</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SettingsField label="Employee ID">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value.replace(/\D/g, ""))}
              className={inputClass}
              placeholder="23"
            />
          </SettingsField>
          <SettingsField label="Legal Name">
            <input
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className={inputClass}
              placeholder="Deyou Xu"
            />
          </SettingsField>
          <SettingsField label="Nickname (optional)">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={inputClass}
              placeholder="John"
            />
          </SettingsField>
        </div>
        <Button size="md" className="mt-3" onClick={handleAdd}>
          Add Employee
        </Button>
      </SettingsCard>

      <div className="space-y-2">
        {sorted.map((employee) => (
          <SettingsCard key={employee.id}>
            <div className="flex flex-wrap items-start gap-3">
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
                <SettingsField label="Employee ID">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={String(employee.employeeNumber)}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/\D/g, ""), 10);
                      if (num > 0) updateEmployee(employee.id, { employeeNumber: num });
                    }}
                    className={inputClass}
                  />
                </SettingsField>
                <SettingsField label="Legal Name">
                  <input
                    value={employee.legalName}
                    onChange={(e) =>
                      updateEmployee(employee.id, { legalName: e.target.value })
                    }
                    className={inputClass}
                  />
                </SettingsField>
                <SettingsField label="Nickname (optional)">
                  <input
                    value={employee.nickname ?? ""}
                    onChange={(e) =>
                      updateEmployee(employee.id, {
                        nickname: e.target.value.trim() || undefined,
                      })
                    }
                    className={inputClass}
                  />
                </SettingsField>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <ActiveToggle
                  active={employee.active}
                  onChange={(active) => updateEmployee(employee.id, { active })}
                />
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    if (confirm(`Delete employee #${employee.employeeNumber}?`)) {
                      deleteEmployee(employee.id);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </SettingsCard>
        ))}
      </div>
    </SettingsPanel>
  );
}
