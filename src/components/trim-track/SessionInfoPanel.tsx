import type { SessionDisplay } from "../../lib/sessions";

interface SessionInfoPanelProps {
  display: SessionDisplay;
}

export function SessionInfoPanel({ display }: SessionInfoPanelProps) {
  const { session, facilityLabel, roomName, supervisorName } = display;

  return (
    <section className="space-y-3">
      <SectionHeading title="Session Information" />
      <div className="overflow-hidden rounded-xl border border-surface-600 bg-surface-800">
        <div className="divide-y divide-surface-600/50">
          <InfoRow label="Session ID" value={session.id} mono />
          <InfoRow label="Facility" value={facilityLabel} />
          <InfoRow label="Room" value={roomName ?? "—"} />
          <InfoRow label="Supervisor" value={supervisorName} />
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50">{title}</h2>
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
