import { useState } from "react";
import { Button } from "../Button";
import { useMasterData } from "../../context/MasterDataContext";
import { SettingsCard, SettingsField, SettingsPanel, inputClass, selectClass } from "./SettingsUi";

export function RoomsTab() {
  const { facilities, rooms, addRoom, updateRoom, deleteRoom } = useMasterData();
  const [facilityId, setFacilityId] = useState("");
  const [name, setName] = useState("");

  function handleAdd() {
    if (!facilityId || !name.trim()) return;
    addRoom({ facilityId, name: name.trim() });
    setName("");
  }

  const sorted = [...rooms].sort((a, b) => {
    const facA = facilities.find((f) => f.id === a.facilityId)?.name ?? "";
    const facB = facilities.find((f) => f.id === b.facilityId)?.name ?? "";
    return facA.localeCompare(facB) || a.name.localeCompare(b.name);
  });

  return (
    <SettingsPanel title="Rooms" description="Manage trim and processing rooms by facility.">
      <SettingsCard>
        <p className="mb-3 text-sm font-semibold text-white/70">Add Room</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SettingsField label="Facility">
            <select
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              className={selectClass}
            >
              <option value="">Select facility…</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code} — {f.name}
                </option>
              ))}
            </select>
          </SettingsField>
          <SettingsField label="Room Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Trim Room A"
            />
          </SettingsField>
        </div>
        <Button size="md" className="mt-3" onClick={handleAdd} disabled={!facilityId}>
          Add Room
        </Button>
      </SettingsCard>

      {facilities.length === 0 && (
        <p className="text-sm text-white/40">Add a facility first before creating rooms.</p>
      )}

      <div className="space-y-2">
        {sorted.map((room) => (
          <SettingsCard key={room.id}>
            <div className="flex flex-wrap items-start gap-3">
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                <SettingsField label="Facility">
                  <select
                    value={room.facilityId}
                    onChange={(e) => updateRoom(room.id, { facilityId: e.target.value })}
                    className={selectClass}
                  >
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code} — {f.name}
                      </option>
                    ))}
                  </select>
                </SettingsField>
                <SettingsField label="Room Name">
                  <input
                    value={room.name}
                    onChange={(e) => updateRoom(room.id, { name: e.target.value })}
                    className={inputClass}
                  />
                </SettingsField>
              </div>
              <Button
                variant="danger"
                size="md"
                className="shrink-0"
                onClick={() => {
                  if (confirm(`Delete room ${room.name}?`)) deleteRoom(room.id);
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
