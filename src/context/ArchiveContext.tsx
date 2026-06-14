import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ArchivedSession, ArchivedWeightEntry, TrimCategory } from "../types";
import {
  adjustCategoryTotalEntries,
  appendAudit,
  duplicateArchivedSession,
  loadArchive,
  recomputeArchiveSession,
  saveArchiveSession,
  searchArchives,
} from "../utils/archive";
import { createAuditEntry, formatAuditValue } from "../utils/archiveAudit";
import { generateId } from "../utils/id";

export interface ArchiveSessionMetadataUpdate {
  facilityId?: string;
  facilityName?: string;
  roomId?: string;
  roomName?: string;
  supervisorId?: string;
  supervisorName?: string;
  startedAt?: number;
  notes?: string;
}

export interface ArchiveEntryInput {
  employeeId: string;
  category: TrimCategory;
  weight: number;
  timestamp?: number;
}

interface ArchiveContextValue {
  archives: ArchivedSession[];
  searchArchives: (query: string, includeDeleted?: boolean) => ArchivedSession[];
  getArchive: (id: string) => ArchivedSession | null;
  refreshArchives: () => void;
  updateSessionMetadata: (
    id: string,
    updates: ArchiveSessionMetadataUpdate,
    editedBy: string,
  ) => ArchivedSession | null;
  softDeleteSession: (id: string, editedBy: string) => ArchivedSession | null;
  restoreSession: (id: string, editedBy: string) => ArchivedSession | null;
  duplicateSession: (id: string, editedBy: string) => ArchivedSession | null;
  addEntry: (
    sessionId: string,
    entry: ArchiveEntryInput,
    editedBy: string,
  ) => ArchivedSession | null;
  updateEntry: (
    sessionId: string,
    entryId: string,
    updates: { weight?: number; category?: TrimCategory },
    editedBy: string,
  ) => ArchivedSession | null;
  softDeleteEntry: (
    sessionId: string,
    entryId: string,
    editedBy: string,
  ) => ArchivedSession | null;
  adjustCategoryTotal: (
    sessionId: string,
    employeeId: string,
    category: TrimCategory,
    newTotal: number,
    editedBy: string,
  ) => ArchivedSession | null;
}

const ArchiveContext = createContext<ArchiveContextValue | null>(null);

function commit(session: ArchivedSession | null) {
  if (!session) return null;
  return saveArchiveSession(session);
}

export function ArchiveProvider({ children }: { children: ReactNode }) {
  const [archives, setArchives] = useState<ArchivedSession[]>(() => loadArchive());

  const refreshArchives = useCallback(() => {
    setArchives(loadArchive());
  }, []);

  const getArchive = useCallback(
    (id: string) => archives.find((session) => session.id === id) ?? null,
    [archives],
  );

  const search = useCallback(
    (query: string, includeDeleted = false) => searchArchives(archives, query, includeDeleted),
    [archives],
  );

  const updateLocal = useCallback((session: ArchivedSession | null) => {
    if (!session) return null;
    setArchives(loadArchive());
    return session;
  }, []);

  const updateSessionMetadata = useCallback(
    (id: string, updates: ArchiveSessionMetadataUpdate, editedBy: string) => {
      const current = getArchive(id);
      if (!current || current.deletedAt) return null;

      let next = { ...current };
      const audits = [];

      const fields: Array<[keyof ArchiveSessionMetadataUpdate, string]> = [
        ["facilityName", "facility"],
        ["roomName", "room"],
        ["supervisorName", "supervisor"],
        ["notes", "notes"],
      ];

      for (const [key, label] of fields) {
        if (updates[key] !== undefined && updates[key] !== current[key as keyof ArchivedSession]) {
          audits.push(
            createAuditEntry({
              action: "session_update",
              editedBy,
              field: label,
              originalValue: formatAuditValue(current[key as keyof ArchivedSession] as string),
              newValue: formatAuditValue(updates[key] as string),
            }),
          );
        }
      }

      if (updates.startedAt !== undefined && updates.startedAt !== current.startedAt) {
        audits.push(
          createAuditEntry({
            action: "session_update",
            editedBy,
            field: "sessionDate",
            originalValue: formatAuditValue(current.startedAt),
            newValue: formatAuditValue(updates.startedAt),
          }),
        );
      }

      next = {
        ...next,
        ...updates,
      };

      for (const audit of audits) {
        next = appendAudit(next, audit);
      }

      return updateLocal(commit(recomputeArchiveSession(next)));
    },
    [getArchive, updateLocal],
  );

  const softDeleteSession = useCallback(
    (id: string, editedBy: string) => {
      const current = getArchive(id);
      if (!current || current.deletedAt) return null;

      const next = appendAudit(
        {
          ...current,
          deletedAt: Date.now(),
          deletedBy: editedBy,
        },
        createAuditEntry({
          action: "session_delete",
          editedBy,
          field: "deletedAt",
          originalValue: "active",
          newValue: "soft deleted",
        }),
      );

      return updateLocal(commit(next));
    },
    [getArchive, updateLocal],
  );

  const restoreSession = useCallback(
    (id: string, editedBy: string) => {
      const current = getArchive(id);
      if (!current || !current.deletedAt) return null;

      const next = appendAudit(
        {
          ...current,
          deletedAt: undefined,
          deletedBy: undefined,
        },
        createAuditEntry({
          action: "session_restore",
          editedBy,
          field: "deletedAt",
          originalValue: "soft deleted",
          newValue: "active",
        }),
      );

      return updateLocal(commit(next));
    },
    [getArchive, updateLocal],
  );

  const duplicateSession = useCallback(
    (id: string, editedBy: string) => {
      const current = getArchive(id);
      if (!current) return null;
      const duplicate = duplicateArchivedSession(current, editedBy);
      return updateLocal(duplicate);
    },
    [getArchive, updateLocal],
  );

  const addEntry = useCallback(
    (sessionId: string, entry: ArchiveEntryInput, editedBy: string) => {
      const current = getArchive(sessionId);
      if (!current || current.deletedAt) return null;

      const newEntry: ArchivedWeightEntry = {
        id: generateId(),
        employeeId: entry.employeeId,
        category: entry.category,
        weight: Math.round(entry.weight),
        timestamp: entry.timestamp ?? current.startedAt,
      };

      const next = appendAudit(
        {
          ...current,
          entries: [...current.entries, newEntry],
        },
        createAuditEntry({
          action: "entry_create",
          editedBy,
          employeeId: entry.employeeId,
          entryId: newEntry.id,
          field: "weight",
          newValue: String(newEntry.weight),
        }),
      );

      return updateLocal(commit(recomputeArchiveSession(next)));
    },
    [getArchive, updateLocal],
  );

  const updateEntry = useCallback(
    (
      sessionId: string,
      entryId: string,
      updates: { weight?: number; category?: TrimCategory },
      editedBy: string,
    ) => {
      const current = getArchive(sessionId);
      if (!current || current.deletedAt) return null;

      const existing = current.entries.find((entry) => entry.id === entryId && !entry.deletedAt);
      if (!existing) return null;

      let next = { ...current };
      const audits = [];

      if (updates.weight !== undefined && updates.weight !== existing.weight) {
        audits.push(
          createAuditEntry({
            action: "entry_update",
            editedBy,
            employeeId: existing.employeeId,
            entryId,
            field: "weight",
            originalValue: String(existing.weight),
            newValue: String(Math.round(updates.weight)),
          }),
        );
      }

      if (updates.category !== undefined && updates.category !== existing.category) {
        audits.push(
          createAuditEntry({
            action: "entry_update",
            editedBy,
            employeeId: existing.employeeId,
            entryId,
            field: "category",
            originalValue: existing.category,
            newValue: updates.category,
          }),
        );
      }

      next = {
        ...next,
        entries: next.entries.map((entry) => {
          if (entry.id !== entryId) return entry;
          return {
            ...entry,
            ...(updates.weight !== undefined ? { weight: Math.round(updates.weight) } : {}),
            ...(updates.category !== undefined ? { category: updates.category } : {}),
          };
        }),
      };

      for (const audit of audits) {
        next = appendAudit(next, audit);
      }

      return updateLocal(commit(recomputeArchiveSession(next)));
    },
    [getArchive, updateLocal],
  );

  const softDeleteEntry = useCallback(
    (sessionId: string, entryId: string, editedBy: string) => {
      const current = getArchive(sessionId);
      if (!current || current.deletedAt) return null;

      const existing = current.entries.find((entry) => entry.id === entryId && !entry.deletedAt);
      if (!existing) return null;

      const next = appendAudit(
        {
          ...current,
          entries: current.entries.map((entry) =>
            entry.id === entryId
              ? { ...entry, deletedAt: Date.now(), deletedBy: editedBy }
              : entry,
          ),
        },
        createAuditEntry({
          action: "entry_delete",
          editedBy,
          employeeId: existing.employeeId,
          entryId,
          field: "weight",
          originalValue: String(existing.weight),
          newValue: "soft deleted",
        }),
      );

      return updateLocal(commit(recomputeArchiveSession(next)));
    },
    [getArchive, updateLocal],
  );

  const adjustCategoryTotal = useCallback(
    (
      sessionId: string,
      employeeId: string,
      category: TrimCategory,
      newTotal: number,
      editedBy: string,
    ) => {
      const current = getArchive(sessionId);
      if (!current || current.deletedAt) return null;

      const { session } = adjustCategoryTotalEntries(
        current,
        employeeId,
        category,
        Math.round(newTotal),
        editedBy,
      );

      return updateLocal(commit(session));
    },
    [getArchive, updateLocal],
  );

  const value = useMemo(
    () => ({
      archives,
      searchArchives: search,
      getArchive,
      refreshArchives,
      updateSessionMetadata,
      softDeleteSession,
      restoreSession,
      duplicateSession,
      addEntry,
      updateEntry,
      softDeleteEntry,
      adjustCategoryTotal,
    }),
    [
      archives,
      search,
      getArchive,
      refreshArchives,
      updateSessionMetadata,
      softDeleteSession,
      restoreSession,
      duplicateSession,
      addEntry,
      updateEntry,
      softDeleteEntry,
      adjustCategoryTotal,
    ],
  );

  return <ArchiveContext.Provider value={value}>{children}</ArchiveContext.Provider>;
}

export function useArchive() {
  const ctx = useContext(ArchiveContext);
  if (!ctx) throw new Error("useArchive must be used within ArchiveProvider");
  return ctx;
}

export function useArchiveRefreshOnMount() {
  const { refreshArchives } = useArchive();
  useEffect(() => {
    refreshArchives();
  }, [refreshArchives]);
}
