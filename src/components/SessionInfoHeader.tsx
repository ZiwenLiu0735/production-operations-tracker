import type { Session } from "../types";
import { formatTime } from "../utils/format";

interface SessionInfoHeaderProps {
  session: Session;
  compact?: boolean;
}

export function SessionInfoHeader({ session, compact = false }: SessionInfoHeaderProps) {
  const items = [
    { label: "Facility", value: session.facilityName },
    ...(session.roomName ? [{ label: "Room", value: session.roomName }] : []),
    { label: "Supervisor", value: session.supervisorName },
    { label: "Start Time", value: formatTime(session.startedAt) },
  ];

  if (compact) {
    return (
      <div className="tt-session-info grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              {item.label}
            </p>
            <p className="truncate text-sm font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-surface-600/50 bg-surface-800/60 px-3 py-2"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
            {item.label}
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
