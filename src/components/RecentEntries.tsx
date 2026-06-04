import { categoryLabel, formatTime, formatWeight } from "../utils/format";
import type { WeightEntry } from "../types";

interface RecentEntriesProps {
  entries: WeightEntry[];
  compact?: boolean;
}

export function RecentEntries({ entries, compact = false }: RecentEntriesProps) {
  if (entries.length === 0) {
    return (
      <div
        className={`rounded-xl border border-surface-600/50 bg-surface-800/50 ${compact ? "p-2" : "p-4"}`}
      >
        <h3
          className={`font-semibold uppercase tracking-widest text-white/40 ${compact ? "text-[10px]" : "text-sm"}`}
        >
          Recent Entries
        </h3>
        <p className={`text-center text-white/30 ${compact ? "mt-1 text-xs" : "mt-3 text-sm"}`}>
          No entries yet
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex h-full flex-col rounded-xl border border-surface-600/50 bg-surface-800/50 ${compact ? "p-2" : "p-4"}`}
    >
      <h3
        className={`mb-2 shrink-0 font-semibold uppercase tracking-widest text-white/40 ${compact ? "text-[10px]" : "text-sm"}`}
      >
        Recent Entries
      </h3>
      <div
        className={`min-h-0 flex-1 overflow-y-auto ${compact ? "space-y-1" : "max-h-72 space-y-2"}`}
      >
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`rounded-lg bg-surface-900/60 ${compact ? "px-2 py-1.5" : "px-4 py-3"}`}
          >
            <p className={`font-medium text-white/50 ${compact ? "text-[10px]" : "text-sm"}`}>
              {formatTime(entry.timestamp)}
            </p>
            <p className={`font-bold tabular-nums text-white ${compact ? "text-sm" : "text-lg"}`}>
              {formatWeight(entry.weight)}
            </p>
            <p className={`text-white/60 ${compact ? "text-[10px]" : "text-sm"}`}>
              {categoryLabel(entry.category)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
