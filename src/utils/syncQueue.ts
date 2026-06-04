import type { SyncQueueItem } from "../types";
import { generateId } from "./id";

export const SYNC_QUEUE_KEY = "trimtrack-sync-queue";

export function loadSyncQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SyncQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(SYNC_QUEUE_KEY);
    return [];
  }
}

function persistSyncQueue(queue: SyncQueueItem[]) {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueSync(type: SyncQueueItem["type"], sessionId: string) {
  const queue = loadSyncQueue();
  queue.push({
    id: generateId(),
    type,
    sessionId,
    timestamp: Date.now(),
  });
  persistSyncQueue(queue);
}

export function processSyncQueue(): number {
  const queue = loadSyncQueue();
  if (queue.length === 0) return 0;

  // Local-first MVP: data is already persisted locally. When a remote API exists,
  // upload pending items here and remove them on success.
  persistSyncQueue([]);
  return queue.length;
}

export function pendingSyncCount(): number {
  return loadSyncQueue().length;
}
