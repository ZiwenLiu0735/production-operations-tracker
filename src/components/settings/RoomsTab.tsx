import { useMasterData } from "../../context/MasterDataContext";
import { SettingsCard, SettingsPanel } from "./SettingsUi";

export function RoomsTab() {
  const { facilities, rooms } = useMasterData();
  const sorted = [...rooms].sort((a, b) => {
    const facilityA =
      facilities.find((facility) => facility.id === a.facilityId)?.name ?? "";
    const facilityB =
      facilities.find((facility) => facility.id === b.facilityId)?.name ?? "";
    return facilityA.localeCompare(facilityB) || a.name.localeCompare(b.name);
  });

  return (
    <SettingsPanel title="Rooms" description="Rooms currently stored in Supabase.">
      <div className="space-y-2">
        {sorted.map((room) => (
          <SettingsCard key={room.id}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-white">{room.name}</p>
                <p className="text-sm text-white/50">
                  {facilities.find((facility) => facility.id === room.facilityId)
                    ?.name ?? "Unknown facility"}
                </p>
              </div>
              <span className="text-xs text-white/50">
                {room.active ? "Active" : "Inactive"}
              </span>
            </div>
          </SettingsCard>
        ))}
        {rooms.length === 0 && (
          <p className="text-sm text-white/40">No rooms configured.</p>
        )}
      </div>
    </SettingsPanel>
  );
}
