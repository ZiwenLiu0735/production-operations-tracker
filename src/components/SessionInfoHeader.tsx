import type { Session } from "../types";
import { formatTime } from "../utils/format";

interface SessionInfoHeaderProps {
  session: Session;
  compact?: boolean;
  /** Single-line inline layout for live session header */
  variant?: "default" | "live";
}

export function SessionInfoHeader({
  session,
  compact = false,
  variant = "default",
}: SessionInfoHeaderProps) {
  const items = [
    { label: "Facility", value: session.facilityName },
    ...(session.roomName ? [{ label: "Room", value: session.roomName }] : []),
    { label: "Supervisor", value: session.supervisorName },
    { label: "Start Time", value: formatTime(session.startedAt) },
  ];

  if (variant === "live") {
    return (
      <div className="tt-session-info-live">
        {items.map((item, index) => (
          <span key={item.label} className="tt-session-info-live__segment">
            {index > 0 ? <span className="tt-session-info-live__sep" aria-hidden="true">·</span> : null}
            <span className="tt-session-info-live__label">{item.label}</span>
            <span className="tt-session-info-live__value">{item.value}</span>
          </span>
        ))}
      </div>
    );
  }

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
