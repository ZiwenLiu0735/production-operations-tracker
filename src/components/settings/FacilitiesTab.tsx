import { useMasterData } from "../../context/MasterDataContext";
import { SettingsCard, SettingsPanel } from "./SettingsUi";

export function FacilitiesTab() {
  const { facilities, rooms } = useMasterData();
  const sorted = [...facilities].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <SettingsPanel
      title="Facilities"
      description="Facilities currently stored in Supabase."
    >
      <div className="space-y-2">
        {sorted.map((facility) => {
          const roomCount = rooms.filter(
            (room) => room.facilityId === facility.id,
          ).length;

          return (
            <SettingsCard key={facility.id}>
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold text-white">{facility.name}</p>
                <div className="text-right">
                  <p className="text-xs text-white/40">{roomCount} rooms</p>
                  <p className="text-xs text-white/50">
                    {facility.active ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            </SettingsCard>
          );
        })}
        {facilities.length === 0 && (
          <p className="text-sm text-white/40">No facilities configured.</p>
        )}
      </div>
    </SettingsPanel>
  );
}
