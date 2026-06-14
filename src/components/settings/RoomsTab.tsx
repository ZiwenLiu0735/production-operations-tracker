import { useState } from "react";
import { useMasterData } from "../../context/MasterDataContext";
import type { Facility, Room } from "../../types";
import { Button } from "../Button";
import {
  ActiveToggle,
  inputClass,
  selectClass,
  SettingsCard,
  SettingsField,
  SettingsPanel,
} from "./SettingsUi";

export function RoomsTab() {
  const { createRoom, facilities, rooms } = useMasterData();
  const activeFacilities = facilities
    .filter((facility) => facility.active)
    .sort((a, b) => a.name.localeCompare(b.name));
  const [facilityId, setFacilityId] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sorted = [...rooms].sort((a, b) => {
    const facilityA = facilityName(facilities, a.facilityId);
    const facilityB = facilityName(facilities, b.facilityId);
    return facilityA.localeCompare(facilityB) || a.name.localeCompare(b.name);
  });

  async function handleCreate() {
    if (!facilityId || !name.trim() || saving) return;

    setSaving(true);
    setError(null);
    try {
      await createRoom({ facilityId, name });
      setName("");
    } catch (createError) {
      setError(roomErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsPanel
      title="Rooms"
      description="Create rooms, move them between facilities, or deactivate rooms that should no longer appear in session setup."
    >
      <SettingsCard>
        <p className="mb-3 text-sm font-semibold text-white/70">Add Room</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <SettingsField label="Facility">
            <select
              value={facilityId}
              onChange={(event) => setFacilityId(event.target.value)}
              className={selectClass}
              disabled={saving}
            >
              <option value="">Select facility…</option>
              {activeFacilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
          </SettingsField>
          <SettingsField label="Room Name">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleCreate();
              }}
              className={inputClass}
              placeholder="Trim Room A"
              disabled={saving}
            />
          </SettingsField>
          <Button
            size="md"
            onClick={() => void handleCreate()}
            disabled={!facilityId || !name.trim() || saving}
          >
            {saving ? "Adding…" : "Add Room"}
          </Button>
        </div>
        {activeFacilities.length === 0 && (
          <p className="mt-3 text-sm text-amber-200">
            Create or activate a facility before adding rooms.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </SettingsCard>

      <div className="space-y-2">
        {sorted.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            facilities={facilities}
          />
        ))}
        {rooms.length === 0 && (
          <p className="text-sm text-white/40">No rooms configured.</p>
        )}
      </div>
    </SettingsPanel>
  );
}

function RoomCard({
  room,
  facilities,
}: {
  room: Room;
  facilities: Facility[];
}) {
  const { updateRoom } = useMasterData();
  const [facilityId, setFacilityId] = useState(room.facilityId);
  const [name, setName] = useState(room.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasChanges =
    facilityId !== room.facilityId || name.trim() !== room.name;

  async function saveRoom() {
    if (!facilityId || !name.trim() || !hasChanges || saving) return;

    setSaving(true);
    setError(null);
    try {
      await updateRoom(room.id, { facilityId, name });
    } catch (updateError) {
      setError(roomErrorMessage(updateError));
    } finally {
      setSaving(false);
    }
  }

  async function setActive(active: boolean) {
    if (saving) return;

    setSaving(true);
    setError(null);
    try {
      await updateRoom(room.id, { active });
    } catch (updateError) {
      setError(roomErrorMessage(updateError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsCard>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <SettingsField label="Facility">
          <select
            value={facilityId}
            onChange={(event) => setFacilityId(event.target.value)}
            className={selectClass}
            disabled={saving}
          >
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
                {facility.active ? "" : " (Inactive)"}
              </option>
            ))}
          </select>
        </SettingsField>
        <SettingsField label="Room Name">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void saveRoom();
            }}
            className={inputClass}
            disabled={saving}
          />
        </SettingsField>
        <div className="flex flex-wrap items-center gap-2">
          <ActiveToggle
            active={room.active}
            onChange={(active) => void setActive(active)}
            disabled={saving}
          />
          <Button
            size="md"
            variant="secondary"
            onClick={() => void saveRoom()}
            disabled={!facilityId || !name.trim() || !hasChanges || saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </SettingsCard>
  );
}

function facilityName(facilities: Facility[], facilityId: string): string {
  return (
    facilities.find((facility) => facility.id === facilityId)?.name ??
    "Unknown facility"
  );
}

function roomErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unable to save room.";

  if (
    message.includes("rooms_facility_name_unique") ||
    message.toLowerCase().includes("duplicate")
  ) {
    return "This facility already has a room with that name.";
  }

  if (message.toLowerCase().includes("row-level security")) {
    return "Only an active admin can change rooms.";
  }

  return message;
}
