import { useMasterData } from "../../context/MasterDataContext";
import { SettingsCard, SettingsPanel } from "./SettingsUi";

export function AdminsTab() {
  const { admins } = useMasterData();
  const sorted = [...admins].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <SettingsPanel
      title="Admins"
      description="Profiles with the admin role."
    >
      <div className="space-y-2">
        {sorted.map((admin) => (
          <SettingsCard key={admin.profileId}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-white">{admin.name}</p>
                <p className="text-sm text-white/50">
                  Employee #{admin.employeeNumber}
                </p>
              </div>
              <span className="text-xs text-brand-400">Active</span>
            </div>
          </SettingsCard>
        ))}
        {admins.length === 0 && (
          <p className="text-sm text-white/40">No admin profiles configured.</p>
        )}
      </div>
    </SettingsPanel>
  );
}
