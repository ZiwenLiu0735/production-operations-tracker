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
      <div className="tt-session-info grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
        {items.map((item) => (
          <div key={item.label} className="tt-info-chip min-w-0">
            <p className="tt-info-chip__label">{item.label}</p>
            <p className="tt-info-chip__value truncate">{item.value}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="tt-info-chip min-w-0">
          <p className="tt-info-chip__label">{item.label}</p>
          <p className="tt-info-chip__value truncate">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
