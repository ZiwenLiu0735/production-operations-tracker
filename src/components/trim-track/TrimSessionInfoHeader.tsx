import type { SessionDisplay } from "../../lib/sessions";
import { formatTime } from "../../utils/format";

interface TrimSessionInfoHeaderProps {
  display: SessionDisplay;
}

export function TrimSessionInfoHeader({ display }: TrimSessionInfoHeaderProps) {
  const items = [
    { label: "Facility", value: display.facilityLabel },
    ...(display.roomName ? [{ label: "Room", value: display.roomName }] : []),
    { label: "Supervisor", value: display.supervisorName },
    {
      label: "Start Time",
      value: formatTime(new Date(display.session.started_at).getTime()),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
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
