import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, SessionCadillacMeta, SessionEmployeeSnapshot, SessionRoomSnapshot, SessionSupervisorSnapshot, TrimCategory, WeightEntry } from "../types";
import {
  deleteWeightEntry,
  recordWeightEntry,
  updateWeightEntry,
} from "../repositories/weightEntryRepository";
import {
  completeProductionSession,
  getProductionSession,
} from "../repositories/sessionRepository";
import { archiveSession } from "../utils/archive";
import { joinRoomNames, joinSupervisorNames } from "../utils/sessionDisplay";
import { getNewestEntry } from "../utils/sessionEntries";
import { loadActiveSession, persistActiveSession } from "../utils/sessionPersist";
import { enqueueSync, processSyncQueue } from "../utils/syncQueue";

interface SessionContextValue {
  session: Session | null;
  startSession: (params: {
    id: string;
    facilityId: string;
    facilityName: string;
    supervisors: SessionSupervisorSnapshot[];
    rooms?: SessionRoomSnapshot[];
    cadillac?: SessionCadillacMeta;
    workType?: string;
    employeeIds: string[];
    employees: SessionEmployeeSnapshot[];
  }) => void;
  updateSessionCadillac: (updates: SessionCadillacMeta) => void;
  addEntry: (
    employeeId: string,
    category: TrimCategory,
    weight: number,
  ) => Promise<WeightEntry>;
  updateEntry: (
    entryId: string,
    updates: { weight?: number; category?: TrimCategory },
  ) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  undoLastEntry: () => Promise<WeightEntry | null>;
  addEmployee: (employee: SessionEmployeeSnapshot) => void;
  removeEmployee: (employeeId: string) => void;
  endSession: () => Promise<Session>;
  clearSession: () => void;
  reloadFromStorage: () => void;
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

  const reloadFromStorage = useCallback(() => {
    setSession(loadActiveSession());
  }, []);

  useEffect(() => {
    if (navigator.onLine) {
      processSyncQueue();
    }
  }, []);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        reloadFromStorage();
      }
    }

    window.addEventListener("focus", reloadFromStorage);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", reloadFromStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [reloadFromStorage]);

  const startSession = useCallback(
    (params: {
      id: string;
      facilityId: string;
      facilityName: string;
      supervisors: SessionSupervisorSnapshot[];
      rooms?: SessionRoomSnapshot[];
      cadillac?: SessionCadillacMeta;
      workType?: string;
      employeeIds: string[];
      employees: SessionEmployeeSnapshot[];
    }) => {
      const rooms = params.rooms ?? [];
      const supervisors = params.supervisors;
      const newSession: Session = {
        id: params.id,
        facilityId: params.facilityId,
        facilityName: params.facilityName,
        supervisors,
        rooms: rooms.length > 0 ? rooms : undefined,
        supervisorId: supervisors[0]?.id ?? "",
        supervisorName: joinSupervisorNames(supervisors),
        roomId: rooms[0]?.id,
        roomName: rooms.length > 0 ? joinRoomNames(rooms) : undefined,
        cadillac: params.cadillac,
        workType: params.workType,
        employeeIds: params.employeeIds,
        employees: params.employees,
        startedAt: Date.now(),
        entries: [],
      };
      commitSession(newSession);
      setSession(newSession);
    },
    [],
  );

  const updateSessionCadillac = useCallback((updates: SessionCadillacMeta) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        cadillac: {
          ...prev.cadillac,
          ...updates,
        },
      };
      commitSession(next);
      return next;
    });
  }, []);

  const addEntry = useCallback(
    async (employeeId: string, category: TrimCategory, weight: number) => {
      if (!session || session.endedAt) {
        throw new Error("No active session is available.");
      }

      const entry: WeightEntry = {
        id: await recordWeightEntry({
          sessionId: session.id,
          employeeId,
          category,
          weight,
        }),
        employeeId,
        category,
        weight: Math.round(weight),
        timestamp: Date.now(),
      };

      setSession((prev) => {
        if (!prev || prev.id !== session.id) return prev;
        const next = { ...prev, entries: [...prev.entries, entry] };
        commitSession(next);
        return next;
      });

      return entry;
    },
    [session],
  );

  const updateEntry = useCallback(
    async (
      entryId: string,
      updates: { weight?: number; category?: TrimCategory },
    ) => {
      const entry = session?.entries.find((item) => item.id === entryId);
      if (!session || !entry || session.endedAt) {
        throw new Error("The active weight entry was not found.");
      }

      const weight =
        updates.weight !== undefined ? Math.round(updates.weight) : entry.weight;
      const category = updates.category ?? entry.category;

      await updateWeightEntry({ entryId, weight, category });

      setSession((prev) => {
        if (!prev || prev.id !== session.id) return prev;
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
    [session],
  );

  const deleteEntry = useCallback(async (entryId: string) => {
    if (!session || !session.entries.some((entry) => entry.id === entryId)) {
      throw new Error("The active weight entry was not found.");
    }

    await deleteWeightEntry(entryId);

    setSession((prev) => {
      if (!prev || prev.id !== session.id) return prev;
      const next = {
        ...prev,
        entries: prev.entries.filter((e) => e.id !== entryId),
      };
      commitSession(next);
      return next;
    });
  }, [session]);

  const undoLastEntryFn = useCallback(async (): Promise<WeightEntry | null> => {
    if (!session || session.endedAt) return null;
    const newest = getNewestEntry(session.entries);
    if (!newest) return null;

    await deleteWeightEntry(newest.id);

    setSession((prev) => {
      if (!prev || prev.id !== session.id) return prev;
      const next = {
        ...prev,
        entries: prev.entries.filter((entry) => entry.id !== newest.id),
      };
      commitSession(next);
      return next;
    });

    return newest;
  }, [session]);

  const addEmployee = useCallback((employee: SessionEmployeeSnapshot) => {
    setSession((prev) => {
      if (!prev || prev.employeeIds.includes(employee.id)) return prev;
      const next = {
        ...prev,
        employeeIds: [...prev.employeeIds, employee.id],
        employees: [...prev.employees, employee],
      };
      commitSession(next);
      return next;
    });
  }, []);

  const removeEmployee = useCallback((employeeId: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        employeeIds: prev.employeeIds.filter((id) => id !== employeeId),
        employees: prev.employees.filter((employee) => employee.id !== employeeId),
      };
      commitSession(next);
      return next;
    });
  }, []);

  const endSession = useCallback(async () => {
    if (!session) {
      throw new Error("No active session is available.");
    }
    if (session.endedAt) return session;

    await completeProductionSession(session.id);
    const completedSession = await getProductionSession(session.id);

    commitSession(completedSession);
    archiveSession(completedSession);
    enqueueSync("session_archived", completedSession.id);
    processSyncQueue();
    setSession(completedSession);
    return completedSession;
  }, [session]);

  const clearSession = useCallback(() => {
    commitSession(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      startSession,
      updateSessionCadillac,
      addEntry,
      updateEntry,
      deleteEntry,
      undoLastEntry: undoLastEntryFn,
      addEmployee,
      removeEmployee,
      endSession,
      clearSession,
      reloadFromStorage,
    }),
    [
      session,
      startSession,
      updateSessionCadillac,
      addEntry,
      updateEntry,
      deleteEntry,
      undoLastEntryFn,
      addEmployee,
      removeEmployee,
      endSession,
      clearSession,
      reloadFromStorage,
    ],
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
