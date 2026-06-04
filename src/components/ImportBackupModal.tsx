import { Button } from "./Button";

interface ImportBackupModalProps {
  onConfirm: () => void;
  onClose: () => void;
}

export function ImportBackupModal({ onConfirm, onClose }: ImportBackupModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-md rounded-2xl border border-surface-600 bg-surface-800 p-6 shadow-2xl">
        <h2 className="text-xl font-bold">Import Backup?</h2>
        <p className="mt-3 text-sm text-white/60">
          This will replace all current master data on this device:
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-white/50">
          <li>Employees</li>
          <li>Facilities</li>
          <li>Rooms</li>
          <li>Supervisors</li>
          <li>App settings</li>
        </ul>
        <p className="mt-4 text-sm font-semibold text-amber-300">
          Your current data will be overwritten. Export a backup first if you need to keep it.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" size="lg" fullWidth onClick={onConfirm}>
            Replace Data
          </Button>
        </div>
      </div>
    </div>
  );
}
