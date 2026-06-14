import { useMasterData } from "../../context/MasterDataContext";
import { SettingsCard, SettingsPanel } from "./SettingsUi";

export function SupervisorsTab() {
  const { supervisors } = useMasterData();
  const sorted = [...supervisors].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <SettingsPanel
      title="Supervisors"
      description="Active supervisor and admin profiles currently stored in Supabase."
    >
      <div className="space-y-2">
        {sorted.map((supervisor) => (
          <SettingsCard key={supervisor.id}>
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold text-white">{supervisor.name}</p>
              <span className="text-xs text-brand-400">Active</span>
            </div>
          </SettingsCard>
        ))}
        {supervisors.length === 0 && (
          <p className="text-sm text-white/40">
            No supervisor profiles configured.
          </p>
        )}
      </div>
    </SettingsPanel>
  );
}
