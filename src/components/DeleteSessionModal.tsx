import { Button } from "./Button";
import type { Session } from "../types";
import { formatTime } from "../utils/format";

interface DeleteSessionModalProps {
  session: Session;
  onConfirm: () => void;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

export function DeleteSessionModal({ session, onConfirm, onClose }: DeleteSessionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-md rounded-2xl border border-surface-600 bg-surface-800 p-6 shadow-2xl">
        <h2 className="text-xl font-bold">Delete Session?</h2>

        <div className="mt-4 space-y-3 rounded-xl border border-surface-600/50 bg-surface-900/60 p-4">
          <DetailRow label="Facility" value={session.facilityName} />
          <DetailRow label="Room" value={session.roomName ?? "—"} />
          <DetailRow label="Start Time" value={formatTime(session.startedAt)} />
        </div>

        <p className="mt-4 text-sm text-white/50">This action cannot be undone.</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" size="lg" fullWidth onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
