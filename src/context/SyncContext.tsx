import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { pendingSyncCount, processSyncQueue } from "../utils/syncQueue";

interface SyncContextValue {
  isOnline: boolean;
  pendingCount: number;
  syncNow: () => number;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [pendingCount, setPendingCount] = useState(() => pendingSyncCount());

  const syncNow = useCallback(() => {
    const processed = processSyncQueue();
    setPendingCount(pendingSyncCount());
    return processed;
  }, []);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      syncNow();
    }

    function handleOffline() {
      setIsOnline(false);
      setPendingCount(pendingSyncCount());
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncNow]);

  useEffect(() => {
    setPendingCount(pendingSyncCount());
  }, [isOnline]);

  const value = useMemo(
    () => ({ isOnline, pendingCount, syncNow }),
    [isOnline, pendingCount, syncNow],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
}
