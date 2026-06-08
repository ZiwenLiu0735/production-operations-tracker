import { useCallback, useEffect, useRef, useState } from "react";
import { fetchEmployeesByIds } from "../lib/employees";
import {
  createWorkLog,
  deleteWorkLog,
  fetchWorkLogs,
  updateWorkLog,
} from "../lib/workLogs";
import {
  endSupabaseSession,
  fetchSessionDisplay,
  type SessionDisplay,
} from "../lib/sessions";
import type { Employee, TrimCategory, WeightEntry } from "../types";
import { dbEmployeeToEmployee } from "../utils/dbEmployeeAdapter";

interface UseTrimTrackSessionResult {
  display: SessionDisplay | null;
  employees: Employee[];
  entries: WeightEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addEntry: (employeeId: string, category: TrimCategory, weight: number) => Promise<string | null>;
  updateEntry: (
    entryId: string,
    updates: { weight?: number; category?: TrimCategory },
  ) => Promise<string | null>;
  deleteEntry: (entryId: string) => Promise<string | null>;
  addEmployee: (employeeId: string) => Promise<string | null>;
  removeEmployee: (employeeId: string) => Promise<string | null>;
  endSession: () => Promise<string | null>;
}

export function useTrimTrackSession(
  sessionId: string | undefined,
  initialEmployeeIds: string[] = [],
): UseTrimTrackSessionResult {
  const [display, setDisplay] = useState<SessionDisplay | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [participantIds, setParticipantIds] = useState<string[]>(() => initialEmployeeIds);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seededFromEntriesRef = useRef(false);

  useEffect(() => {
    if (initialEmployeeIds.length > 0) {
      setParticipantIds((prev) => [...new Set([...prev, ...initialEmployeeIds])]);
    }
  }, [initialEmployeeIds]);

  const loadEmployees = useCallback(async (employeeIds: string[]) => {
    if (employeeIds.length === 0) {
      setEmployees([]);
      return null;
    }

    const result = await fetchEmployeesByIds(employeeIds);
    if (result.error) {
      return result.error;
    }

    setEmployees((result.data ?? []).map(dbEmployeeToEmployee));
    return null;
  }, []);

  const refresh = useCallback(async () => {
    if (!sessionId) {
      setError("Session ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [displayResult, entriesResult] = await Promise.all([
      fetchSessionDisplay(sessionId),
      fetchWorkLogs(sessionId),
    ]);

    if (displayResult.error || entriesResult.error) {
      setError(displayResult.error ?? entriesResult.error);
      setDisplay(null);
      setEntries([]);
      setLoading(false);
      return;
    }

    const loadedEntries = entriesResult.data ?? [];
    setDisplay(displayResult.data);
    setEntries(loadedEntries);

    setParticipantIds((prev) => {
      if (prev.length > 0 || loadedEntries.length === 0 || seededFromEntriesRef.current) {
        return prev;
      }
      seededFromEntriesRef.current = true;
      return [...new Set(loadedEntries.map((entry) => entry.employeeId))];
    });

    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (loading) return;

    void loadEmployees(participantIds).then((employeeError) => {
      if (employeeError) setError(employeeError);
    });
  }, [participantIds, loading, loadEmployees]);

  const addEntry = useCallback(
    async (employeeId: string, category: TrimCategory, weight: number) => {
      if (!sessionId) return "Session ID is missing.";

      const result = await createWorkLog({
        session_id: sessionId,
        employee_id: employeeId,
        work_type: display?.session.work_type ?? "trim",
        category,
        weight: Math.round(weight),
      });

      if (result.error) return result.error;

      const entriesResult = await fetchWorkLogs(sessionId);
      if (entriesResult.error) return entriesResult.error;
      setEntries(entriesResult.data ?? []);
      return null;
    },
    [sessionId, display?.session.work_type],
  );

  const updateEntry = useCallback(
    async (entryId: string, updates: { weight?: number; category?: TrimCategory }) => {
      const payload = {
        ...updates,
        weight: updates.weight !== undefined ? Math.round(updates.weight) : undefined,
      };
      const result = await updateWorkLog(entryId, payload);
      if (result.error) return result.error;

      if (!sessionId) return "Session ID is missing.";
      const entriesResult = await fetchWorkLogs(sessionId);
      if (entriesResult.error) return entriesResult.error;
      setEntries(entriesResult.data ?? []);
      return null;
    },
    [sessionId],
  );

  const deleteEntryFn = useCallback(
    async (entryId: string) => {
      const result = await deleteWorkLog(entryId);
      if (result.error) return result.error;

      if (!sessionId) return "Session ID is missing.";
      const entriesResult = await fetchWorkLogs(sessionId);
      if (entriesResult.error) return entriesResult.error;
      setEntries(entriesResult.data ?? []);
      return null;
    },
    [sessionId],
  );

  const addEmployee = useCallback(
    async (employeeId: string) => {
      if (participantIds.includes(employeeId)) return null;
      setParticipantIds((prev) => [...prev, employeeId]);
      return null;
    },
    [participantIds],
  );

  const removeEmployee = useCallback(async (employeeId: string) => {
    setParticipantIds((prev) => prev.filter((id) => id !== employeeId));
    return null;
  }, []);

  const endSession = useCallback(async () => {
    if (!sessionId) return "Session ID is missing.";
    const result = await endSupabaseSession(sessionId);
    return result.error;
  }, [sessionId]);

  return {
    display,
    employees,
    entries,
    loading,
    error,
    refresh,
    addEntry,
    updateEntry,
    deleteEntry: deleteEntryFn,
    addEmployee,
    removeEmployee,
    endSession,
  };
}
