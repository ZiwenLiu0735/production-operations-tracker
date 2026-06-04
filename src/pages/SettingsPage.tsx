import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppNav } from "../components/AppNav";
import { Button } from "../components/Button";
import { ImportBackupModal } from "../components/ImportBackupModal";
import { Layout } from "../components/Layout";
import { EmployeesTab } from "../components/settings/EmployeesTab";
import { FacilitiesTab } from "../components/settings/FacilitiesTab";
import { RoomsTab } from "../components/settings/RoomsTab";
import { SupervisorsTab } from "../components/settings/SupervisorsTab";
import { useMasterData } from "../context/MasterDataContext";
import { backupFilename } from "../utils/backup";

type SettingsTab = "employees" | "facilities" | "rooms" | "supervisors";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "employees", label: "Employees" },
  { id: "facilities", label: "Facilities" },
  { id: "rooms", label: "Rooms" },
  { id: "supervisors", label: "Supervisors" },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const {
    exportBackup,
    importBackup,
    resetToDefaults,
    needsBackupReminder,
    dismissBackupReminder,
  } = useMasterData();
  const [activeTab, setActiveTab] = useState<SettingsTab>("employees");
  const [status, setStatus] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function showStatus(message: string) {
    setStatus(message);
    setTimeout(() => setStatus(null), 3000);
  }

  function handleExportBackup() {
    exportBackup();
    showStatus(`Backup downloaded (${backupFilename()})`);
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImport(String(reader.result));
      setShowImportModal(true);
    };
    reader.readAsText(file);
  }

  function handleConfirmImport() {
    if (!pendingImport) return;
    try {
      importBackup(pendingImport);
      showStatus("Backup imported — master data replaced");
    } catch {
      alert("Invalid backup file. Please select a TrimTrack backup JSON file.");
    } finally {
      setShowImportModal(false);
      setPendingImport(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleCancelImport() {
    setShowImportModal(false);
    setPendingImport(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <Layout
      title="Settings"
      subtitle="Manage master data"
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
              className={`shrink-0 min-h-11 rounded-xl px-5 text-sm font-semibold touch-manipulation ${
                activeTab === tab.id
                  ? "bg-brand-600/20 text-brand-400"
                  : "text-white/60 hover:bg-surface-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {needsBackupReminder && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-600/10 px-4 py-3">
                <p className="text-sm text-amber-100">
                  Your settings have changed. Consider exporting a backup.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="md" onClick={handleExportBackup}>
                    Export Backup
                  </Button>
                  <Button size="md" variant="ghost" onClick={dismissBackupReminder}>
                    Dismiss
                  </Button>
                </div>
              </div>
            )}

            <section className="rounded-xl border border-surface-600/50 bg-surface-800/60 px-4 py-4">
              <h2 className="text-sm font-bold text-white">Backup & Restore</h2>
              <p className="mt-1 text-sm text-white/50">
                Master data is saved in this browser only ({window.location.origin}). Export a
                backup before switching devices, browsers, or clearing storage.
              </p>
              <p className="mt-2 text-xs text-white/40">
                Backup includes employees, facilities, rooms, supervisors, and app settings.
                File: {backupFilename()}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="md" variant="secondary" onClick={handleExportBackup}>
                  Export Backup
                </Button>
                <Button
                  size="md"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Import Backup
                </Button>
              </div>
            </section>

            {activeTab === "employees" && <EmployeesTab />}
            {activeTab === "facilities" && <FacilitiesTab />}
            {activeTab === "rooms" && <RoomsTab />}
            {activeTab === "supervisors" && <SupervisorsTab />}
          </div>
        </div>

        <div className="shrink-0 border-t border-surface-600/50 bg-surface-900 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
            <Button
              size="md"
              variant="danger"
              onClick={() => {
                if (confirm("Reset all master data to defaults? This cannot be undone.")) {
                  resetToDefaults();
                  showStatus("Reset to defaults");
                }
              }}
            >
              Reset Defaults
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
              }}
            />
          </div>
          {status && (
            <p className="mx-auto mt-2 max-w-3xl text-center text-sm text-brand-400">{status}</p>
          )}
        </div>
      </div>

      {showImportModal && (
        <ImportBackupModal onConfirm={handleConfirmImport} onClose={handleCancelImport} />
      )}
    </Layout>
  );
}
