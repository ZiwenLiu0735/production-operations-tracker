import { useState } from "react";
import { Button } from "../Button";
import { useMasterData } from "../../context/MasterDataContext";
import {
  ActiveToggle,
  SettingsCard,
  SettingsField,
  SettingsPanel,
  inputClass,
} from "./SettingsUi";

export function SupervisorsTab() {
  const { supervisors, addSupervisor, updateSupervisor, deleteSupervisor } = useMasterData();
  const [name, setName] = useState("");

  function handleAdd() {
    if (!name.trim()) return;
    addSupervisor({ name: name.trim(), active: true });
    setName("");
  }

  const sorted = [...supervisors].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <SettingsPanel
      title="Supervisors"
      description="Manage trim room supervisors. Only active supervisors appear in session setup."
    >
      <SettingsCard>
        <p className="mb-3 text-sm font-semibold text-white/70">Add Supervisor</p>
        <SettingsField label="Supervisor Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Alex Morgan"
          />
        </SettingsField>
        <Button size="md" className="mt-3" onClick={handleAdd}>
          Add Supervisor
        </Button>
      </SettingsCard>

      <div className="space-y-2">
        {sorted.map((supervisor) => (
          <SettingsCard key={supervisor.id}>
            <div className="flex flex-wrap items-center gap-3">
              <SettingsField label="Supervisor Name" className="min-w-0 flex-1">
                <input
                  value={supervisor.name}
                  onChange={(e) => updateSupervisor(supervisor.id, { name: e.target.value })}
                  className={inputClass}
                />
              </SettingsField>
              <ActiveToggle
                active={supervisor.active}
                onChange={(active) => updateSupervisor(supervisor.id, { active })}
              />
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  if (confirm(`Delete supervisor ${supervisor.name}?`)) {
                    deleteSupervisor(supervisor.id);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </SettingsCard>
        ))}
      </div>
    </SettingsPanel>
  );
}
