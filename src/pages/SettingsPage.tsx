import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppNav } from "../components/AppNav";
import { Button } from "../components/Button";
import { Layout } from "../components/Layout";
import { AdminsTab } from "../components/settings/AdminsTab";
import { OperatorsTab } from "../components/settings/OperatorsTab";
import { FacilitiesTab } from "../components/settings/FacilitiesTab";
import { RoomsTab } from "../components/settings/RoomsTab";
import { SupervisorsTab } from "../components/settings/SupervisorsTab";
import { useMasterData } from "../context/MasterDataContext";
import { START_SESSION_PATH } from "../lib/sessionRoutes";

type SettingsTab =
  | "operators"
  | "supervisors"
  | "admins"
  | "facilities"
  | "rooms";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "operators", label: "Operators" },
  { id: "supervisors", label: "Supervisors" },
  { id: "admins", label: "Admins" },
  { id: "facilities", label: "Facilities" },
  { id: "rooms", label: "Rooms" },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { reload } = useMasterData();
  const [activeTab, setActiveTab] = useState<SettingsTab>("operators");

  return (
    <Layout
      title="Settings"
      subtitle="Manage master data"
      onBack={() => navigate(START_SESSION_PATH)}
      backLabel="Start Session"
      headerRight={<AppNav />}
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-surface-600/50 px-4 py-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`tt-settings-tab shrink-0 ${
                activeTab === tab.id ? "tt-settings-tab--active" : ""
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            <section className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-4">
              <h2 className="text-sm font-bold text-blue-100">Supabase master data</h2>
              <p className="mt-1 text-sm text-white/50">
                Role directories are read-only. User accounts and employee
                details will be managed together from the Users page.
              </p>
            </section>

            {activeTab === "operators" && <OperatorsTab />}
            {activeTab === "supervisors" && <SupervisorsTab />}
            {activeTab === "admins" && <AdminsTab />}
            {activeTab === "facilities" && <FacilitiesTab />}
            {activeTab === "rooms" && <RoomsTab />}
          </div>
        </div>

        <div className="shrink-0 border-t border-surface-600/50 bg-surface-900 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-3xl">
            <Button size="md" variant="secondary" onClick={() => void reload()}>
              Refresh Data
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
