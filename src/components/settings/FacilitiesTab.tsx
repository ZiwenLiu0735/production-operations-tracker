import { useState } from "react";
import { Button } from "../Button";
import { useMasterData } from "../../context/MasterDataContext";
import { SettingsCard, SettingsField, SettingsPanel, inputClass } from "./SettingsUi";

export function FacilitiesTab() {
  const { facilities, addFacility, updateFacility, deleteFacility, rooms } = useMasterData();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  function handleAdd() {
    if (!code.trim() || !name.trim()) return;
    addFacility({ code: code.trim().toUpperCase(), name: name.trim() });
    setCode("");
    setName("");
  }

  const sorted = [...facilities].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <SettingsPanel title="Facilities" description="Manage cultivation and processing facilities.">
      <SettingsCard>
        <p className="mb-3 text-sm font-semibold text-white/70">Add Facility</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SettingsField label="Facility Code">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className={inputClass}
              placeholder="GVC"
            />
          </SettingsField>
          <SettingsField label="Facility Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Green Valley Cultivation"
            />
          </SettingsField>
        </div>
        <Button size="md" className="mt-3" onClick={handleAdd}>
          Add Facility
        </Button>
      </SettingsCard>

      <div className="space-y-2">
        {sorted.map((facility) => {
          const roomCount = rooms.filter((r) => r.facilityId === facility.id).length;
          return (
            <SettingsCard key={facility.id}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                  <SettingsField label="Facility Code">
                    <input
                      value={facility.code}
                      onChange={(e) =>
                        updateFacility(facility.id, { code: e.target.value.toUpperCase() })
                      }
                      className={inputClass}
                    />
                  </SettingsField>
                  <SettingsField label="Facility Name">
                    <input
                      value={facility.name}
                      onChange={(e) => updateFacility(facility.id, { name: e.target.value })}
                      className={inputClass}
                    />
                  </SettingsField>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <span className="text-xs text-white/40">{roomCount} rooms</span>
                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => {
                      const msg =
                        roomCount > 0
                          ? `Delete ${facility.name}? This will also delete ${roomCount} room(s).`
                          : `Delete ${facility.name}?`;
                      if (confirm(msg)) deleteFacility(facility.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </SettingsCard>
          );
        })}
      </div>
    </SettingsPanel>
  );
}
