import { useSync } from "../context/SyncContext";

export function OfflineIndicator() {
  const { isOnline, pendingCount } = useSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`shrink-0 border-b px-4 py-2.5 text-center text-xs font-semibold tracking-wide ${
        isOnline
          ? "border-brand-500/25 bg-brand-600/8 text-brand-300"
          : "border-amber-500/25 bg-amber-600/8 text-amber-200"
      }`}
    >
      {isOnline
        ? `Saved locally · Syncing ${pendingCount} change${pendingCount === 1 ? "" : "s"}…`
        : "Offline — all data saved locally. Will sync when connection returns."}
    </div>
  );
}
