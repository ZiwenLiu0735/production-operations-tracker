import type { Session, WeightEntry } from "../types";

/** Returns the most recently created entry (by timestamp). */
export function getNewestEntry(entries: WeightEntry[]): WeightEntry | null {
  if (entries.length === 0) return null;
  return [...entries].sort((a, b) => b.timestamp - a.timestamp)[0];
}

/** Removes only the newest entry from an active session. */
export function undoLastEntry(session: Session): Session {
  const newest = getNewestEntry(session.entries);
  if (!newest) return session;

  return {
    ...session,
    entries: session.entries.filter((entry) => entry.id !== newest.id),
  };
}

export function canUndoLastEntry(session: Session | null): boolean {
  return Boolean(session && !session.endedAt && session.entries.length > 0);
}
