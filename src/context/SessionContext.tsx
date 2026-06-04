import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, SessionEmployeeSnapshot, TrimCategory, WeightEntry } from "../types";
import { archiveSession } from "../utils/archive";
import { generateId } from "../utils/id";
import { loadActiveSession, persistActiveSession } from "../utils/sessionPersist";
import { enqueueSync, processSyncQueue } from "../utils/syncQueue";

interface SessionContextValue {
  session: Session | null;
  startSession: (params: {
    facilityId: string;
    facilityName: string;
    roomId?: string;
    roomName?: string;
    supervisorId: string;
    supervisorName: string;
    employeeIds: string[];
    employees: SessionEmployeeSnapshot[];
  }) => void;
  addEntry: (employeeId: string, category: TrimCategory, weight: number) => void;
  updateEntry: (
    entryId: string,
    updates: { weight?: number; category?: TrimCategory },
  ) => void;
  deleteEntry: (entryId: string) => void;
  endSession: () => void;
  resumeSession: () => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function commitSession(session: Session | null) {
  persistActiveSession(session);
  if (session) {
    enqueueSync("session_update", session.id);
    if (navigator.onLine) {
      processSyncQueue();
    }
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadActiveSession);

  useEffect(() => {
    if (navigator.onLine) {
      processSyncQueue();
    }
  }, []);

  const startSession = useCallback(
    (params: {
      facilityId: string;
      facilityName: string;
      roomId?: string;
      roomName?: string;
      supervisorId: string;
      supervisorName: string;
      employeeIds: string[];
      employees: SessionEmployeeSnapshot[];
    }) => {
      const newSession: Session = {
        id: generateId(),
        ...params,
        startedAt: Date.now(),
        entries: [],
      };
      commitSession(newSession);
      setSession(newSession);
    },
    [],
  );

  const addEntry = useCallback(
    (employeeId: string, category: TrimCategory, weight: number) => {
      setSession((prev) => {
        if (!prev) return prev;
        const entry: WeightEntry = {
          id: generateId(),
          employeeId,
          category,
          weight: Math.round(weight),
          timestamp: Date.now(),
        };
        const next = { ...prev, entries: [...prev.entries, entry] };
        commitSession(next);
        return next;
      });
    },
    [],
  );

  const updateEntry = useCallback(
    (entryId: string, updates: { weight?: number; category?: TrimCategory }) => {
      setSession((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          entries: prev.entries.map((entry) => {
            if (entry.id !== entryId) return entry;
            return {
              ...entry,
              ...(updates.weight !== undefined
                ? { weight: Math.round(updates.weight) }
                : {}),
              ...(updates.category !== undefined ? { category: updates.category } : {}),
            };
          }),
        };
        commitSession(next);
        return next;
      });
    },
    [],
  );

  const deleteEntry = useCallback((entryId: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        entries: prev.entries.filter((e) => e.id !== entryId),
      };
      commitSession(next);
      return next;
    });
  }, []);

  const endSession = useCallback(() => {
    setSession((prev) => {
      if (!prev || prev.endedAt) return prev;
      const ended = { ...prev, endedAt: Date.now() };
      commitSession(ended);
      archiveSession(ended);
      enqueueSync("session_archived", ended.id);
      processSyncQueue();
      return ended;
    });
  }, []);

  const resumeSession = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const { endedAt: _, ...rest } = prev;
      commitSession(rest);
      return rest;
    });
  }, []);

  const clearSession = useCallback(() => {
    commitSession(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      startSession,
      addEntry,
      updateEntry,
      deleteEntry,
      endSession,
      resumeSession,
      clearSession,
    }),
    [session, startSession, addEntry, updateEntry, deleteEntry, endSession, resumeSession, clearSession],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
