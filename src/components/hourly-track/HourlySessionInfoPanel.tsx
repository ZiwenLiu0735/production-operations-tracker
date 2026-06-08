import type { SessionDisplay } from "../../lib/sessions";
import { formatWorkTypeLabel } from "../../lib/sessionRoutes";

interface HourlySessionInfoPanelProps {
  display: SessionDisplay;
}

export function HourlySessionInfoPanel({ display }: HourlySessionInfoPanelProps) {
  const { session, facilityLabel, roomName, supervisorName } = display;

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50">
        Session Information
      </h2>
      <div className="overflow-hidden rounded-xl border border-surface-600 bg-surface-800">
        <div className="divide-y divide-surface-600/50">
          <InfoRow label="Session ID" value={session.id} mono />
          <InfoRow label="Facility" value={facilityLabel} />
          <InfoRow label="Room" value={roomName ?? "—"} />
          <InfoRow label="Supervisor" value={supervisorName} />
          <InfoRow label="Work Type" value={formatWorkTypeLabel(session.work_type)} />
        </div>
      </div>
    </section>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <span className="text-xs font-semibold uppercase tracking-widest text-white/40">{label}</span>
      <span
        className={`text-right text-sm text-white ${mono ? "font-mono text-xs text-white/70" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
