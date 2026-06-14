import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppNav } from "../components/AppNav";
import { Button } from "../components/Button";
import { Layout } from "../components/Layout";
import { EmployeesTab } from "../components/settings/EmployeesTab";
import { FacilitiesTab } from "../components/settings/FacilitiesTab";
import { RoomsTab } from "../components/settings/RoomsTab";
import { SupervisorsTab } from "../components/settings/SupervisorsTab";
import { useMasterData } from "../context/MasterDataContext";

type SettingsTab = "employees" | "facilities" | "rooms" | "supervisors";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "employees", label: "Employees" },
  { id: "facilities", label: "Facilities" },
  { id: "rooms", label: "Rooms" },
  { id: "supervisors", label: "Supervisors" },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { reload } = useMasterData();
  const [activeTab, setActiveTab] = useState<SettingsTab>("employees");

  return (
    <Layout
      title="Settings"
      subtitle="View master data"
      onBack={() => navigate("/")}
      backLabel="Back"
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
              <h2 className="text-sm font-bold text-blue-100">
                Supabase read-only mode
              </h2>
              <p className="mt-1 text-sm text-white/50">
                These records are loaded from the remote database. Admin editing
                will be enabled in the next implementation step.
              </p>
            </section>

            {activeTab === "employees" && <EmployeesTab />}
            {activeTab === "facilities" && <FacilitiesTab />}
            {activeTab === "rooms" && <RoomsTab />}
            {activeTab === "supervisors" && <SupervisorsTab />}
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
