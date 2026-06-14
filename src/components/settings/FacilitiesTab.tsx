import { useState } from "react";
import { useMasterData } from "../../context/MasterDataContext";
import { Button } from "../Button";
import {
  ActiveToggle,
  inputClass,
  SettingsCard,
  SettingsField,
  SettingsPanel,
} from "./SettingsUi";

export function FacilitiesTab() {
  const { createFacility, facilities, rooms } = useMasterData();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sorted = [...facilities].sort((a, b) => a.name.localeCompare(b.name));

  async function handleCreate() {
    const nextName = name.trim();
    if (!nextName || saving) return;

    setSaving(true);
    setError(null);
    try {
      await createFacility(nextName);
      setName("");
    } catch (createError) {
      setError(facilityErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsPanel
      title="Facilities"
      description="Create facilities, rename them, or deactivate records that should no longer appear in session setup."
    >
      <SettingsCard>
        <p className="mb-3 text-sm font-semibold text-white/70">Add Facility</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <SettingsField label="Facility Name" className="min-w-0 flex-1">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleCreate();
              }}
              className={inputClass}
              placeholder="Green Valley Cultivation"
              disabled={saving}
            />
          </SettingsField>
          <Button
            size="md"
            onClick={() => void handleCreate()}
            disabled={!name.trim() || saving}
          >
            {saving ? "Adding…" : "Add Facility"}
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </SettingsCard>

      <div className="space-y-2">
        {sorted.map((facility) => (
          <FacilityCard
            key={facility.id}
            facility={facility}
            roomCount={
              rooms.filter((room) => room.facilityId === facility.id).length
            }
          />
        ))}
        {facilities.length === 0 && (
          <p className="text-sm text-white/40">No facilities configured.</p>
        )}
      </div>
    </SettingsPanel>
  );
}

function FacilityCard({
  facility,
  roomCount,
}: {
  facility: { id: string; name: string; active: boolean };
  roomCount: number;
}) {
  const { updateFacility } = useMasterData();
  const [name, setName] = useState(facility.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasNameChange = name.trim() !== facility.name;

  async function saveName() {
    if (!name.trim() || !hasNameChange || saving) return;

    setSaving(true);
    setError(null);
    try {
      await updateFacility(facility.id, { name });
    } catch (updateError) {
      setError(facilityErrorMessage(updateError));
    } finally {
      setSaving(false);
    }
  }

  async function setActive(active: boolean) {
    if (saving) return;

    setSaving(true);
    setError(null);
    try {
      await updateFacility(facility.id, { active });
    } catch (updateError) {
      setError(facilityErrorMessage(updateError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsCard>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SettingsField label="Facility Name" className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void saveName();
            }}
            className={inputClass}
            disabled={saving}
          />
        </SettingsField>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-white/40">{roomCount} rooms</span>
          <ActiveToggle
            active={facility.active}
            onChange={(active) => void setActive(active)}
            disabled={saving}
          />
          <Button
            size="md"
            variant="secondary"
            onClick={() => void saveName()}
            disabled={!name.trim() || !hasNameChange || saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </SettingsCard>
  );
}

function facilityErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "Unable to save facility.";

  if (
    message.includes("facilities_name_unique") ||
    message.toLowerCase().includes("duplicate")
  ) {
    return "A facility with this name already exists.";
  }

  if (message.toLowerCase().includes("row-level security")) {
    return "Only an active admin can change facilities.";
  }

  return message;
}
