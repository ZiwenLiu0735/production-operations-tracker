import type { Session } from "../types";
import { Button } from "./Button";
import { formatTime } from "../utils/format";

interface ActiveSessionFoundProps {
  session: Session;
  onResume: () => void;
  onEnd: () => void;
  onDelete: () => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export function ActiveSessionFound({
  session,
  onResume,
  onEnd,
  onDelete,
}: ActiveSessionFoundProps) {
  return (
    <div className="rounded-xl border border-brand-500/50 bg-brand-600/10 p-5">
      <h2 className="text-lg font-bold text-white">Active Session Found</h2>
      <p className="mt-1 text-sm text-white/60">
        {session.entries.length} entr{session.entries.length === 1 ? "y" : "ies"} recorded ·
        started {formatTime(session.startedAt)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <DetailRow label="Facility" value={session.facilityName} />
        <DetailRow label="Room" value={session.roomName ?? "—"} />
        <DetailRow label="Supervisor" value={session.supervisorName} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="md" onClick={onResume}>
          Resume Session
        </Button>
        <Button size="md" variant="secondary" onClick={onEnd}>
          End Session
        </Button>
        <Button size="md" variant="danger" onClick={onDelete}>
          Delete Session
        </Button>
      </div>
    </div>
  );
}
