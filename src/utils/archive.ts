import type {
  ArchivedSession,
  ArchivedWeightEntry,
  ArchiveAuditEntry,
  Session,
  TrimCategory,
} from "../types";
import { getEmployeeTotals, getSessionTotals } from "../types";
import { createAuditEntry } from "./archiveAudit";
import { formatDate, formatDateShort } from "./format";
import { generateId } from "./id";

export const ARCHIVE_STORAGE_KEY = "trimtrack-session-archive";

export function getActiveEntries(entries: ArchivedWeightEntry[]): ArchivedWeightEntry[] {
  return entries.filter((entry) => !entry.deletedAt);
}

export function normalizeArchivedSession(session: ArchivedSession): ArchivedSession {
  return {
    ...session,
    notes: session.notes ?? "",
    auditLog: session.auditLog ?? [],
    entries: Array.isArray(session.entries) ? session.entries : [],
    employees: Array.isArray(session.employees) ? session.employees : [],
  };
}

export function recomputeArchiveSession(session: ArchivedSession): ArchivedSession {
  const activeEntries = getActiveEntries(session.entries);
  return {
    ...session,
    employees: session.employees.map((employee) => ({
      ...employee,
      totals: getEmployeeTotals(employee.id, activeEntries),
    })),
    sessionTotals: getSessionTotals(activeEntries),
  };
}

export function loadArchive(): ArchivedSession[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ArchivedSession[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((session) => recomputeArchiveSession(normalizeArchivedSession(session)));
  } catch {
    localStorage.removeItem(ARCHIVE_STORAGE_KEY);
    return [];
  }
}

export function persistArchive(archives: ArchivedSession[]) {
  localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archives));
}

export function saveArchiveSession(session: ArchivedSession) {
  const archives = loadArchive();
  const normalized = recomputeArchiveSession(normalizeArchivedSession(session));
  const index = archives.findIndex((item) => item.id === normalized.id);
  if (index >= 0) {
    const next = [...archives];
    next[index] = normalized;
    persistArchive(next);
    return normalized;
  }
  persistArchive([normalized, ...archives]);
  return normalized;
}

export function buildArchivedSession(session: Session): ArchivedSession {
  const endedAt = session.endedAt ?? Date.now();
  const employeeSource =
    session.employees.length > 0
      ? session.employees
      : session.employeeIds.map((id) => ({
          id,
          employeeNumber: 0,
          legalName: "Unknown",
        }));

  const entries: ArchivedWeightEntry[] = session.entries.map((entry) => ({ ...entry }));

  const archived: ArchivedSession = {
    id: session.id,
    facilityId: session.facilityId,
    facilityName: session.facilityName,
    roomId: session.roomId,
    roomName: session.roomName,
    supervisorId: session.supervisorId,
    supervisorName: session.supervisorName,
    employees: employeeSource.map((employee) => ({
      ...employee,
      totals: getEmployeeTotals(employee.id, entries),
    })),
    entries,
    sessionTotals: getSessionTotals(entries),
    startedAt: session.startedAt,
    endedAt,
    archivedAt: Date.now(),
    notes: "",
    auditLog: [],
  };

  return recomputeArchiveSession(archived);
}

export function archiveSession(session: Session): ArchivedSession {
  return saveArchiveSession(buildArchivedSession(session));
}

export function getArchivedSession(id: string): ArchivedSession | null {
  return loadArchive().find((session) => session.id === id) ?? null;
}

export function searchArchives(
  archives: ArchivedSession[],
  query: string,
  includeDeleted = false,
): ArchivedSession[] {
  const visible = includeDeleted ? archives : archives.filter((session) => !session.deletedAt);
  const q = query.trim().toLowerCase().replace(/^#/, "");
  if (!q) return visible;

  return visible.filter((session) => {
    if (session.facilityName.toLowerCase().includes(q)) return true;

    const dateShort = formatDateShort(session.startedAt);
    const dateLong = formatDate(session.startedAt).toLowerCase();
    if (dateShort.includes(q) || dateLong.includes(q)) return true;

    return session.employees.some(
      (employee) =>
        String(employee.employeeNumber).includes(q) ||
        employee.legalName.toLowerCase().includes(q) ||
        employee.nickname?.toLowerCase().includes(q),
    );
  });
}

export function appendAudit(
  session: ArchivedSession,
  audit: ArchiveAuditEntry,
): ArchivedSession {
  return {
    ...session,
    auditLog: [audit, ...session.auditLog],
  };
}

export function duplicateArchivedSession(
  session: ArchivedSession,
  editedBy: string,
): ArchivedSession {
  const newId = generateId();
  const duplicate: ArchivedSession = {
    ...session,
    id: newId,
    archivedAt: Date.now(),
    deletedAt: undefined,
    deletedBy: undefined,
    entries: session.entries.map((entry) => ({
      ...entry,
      id: generateId(),
      deletedAt: entry.deletedAt,
      deletedBy: entry.deletedBy,
    })),
    auditLog: [
      createAuditEntry({
        action: "session_duplicate",
        editedBy,
        field: "sourceSessionId",
        originalValue: session.id,
        newValue: newId,
      }),
    ],
  };
  return saveArchiveSession(duplicate);
}

export function adjustCategoryTotalEntries(
  session: ArchivedSession,
  employeeId: string,
  category: TrimCategory,
  newTotal: number,
  editedBy: string,
): { session: ArchivedSession; audits: ArchiveAuditEntry[] } {
  const activeEntries = getActiveEntries(session.entries).filter(
    (entry) => entry.employeeId === employeeId && entry.category === category,
  );
  const currentTotal = activeEntries.reduce((sum, entry) => sum + entry.weight, 0);
  const delta = newTotal - currentTotal;
  if (delta === 0) {
    return { session, audits: [] };
  }

  let nextSession = session;
  const audits: ArchiveAuditEntry[] = [];

  if (delta > 0) {
    const entry: ArchivedWeightEntry = {
      id: generateId(),
      employeeId,
      category,
      weight: delta,
      timestamp: session.startedAt,
    };
    nextSession = {
      ...nextSession,
      entries: [...nextSession.entries, entry],
    };
    audits.push(
      createAuditEntry({
        action: "category_total_adjust",
        editedBy,
        employeeId,
        entryId: entry.id,
        field: `${category}_total`,
        originalValue: String(currentTotal),
        newValue: String(newTotal),
      }),
      createAuditEntry({
        action: "entry_create",
        editedBy,
        employeeId,
        entryId: entry.id,
        field: "weight",
        newValue: String(delta),
      }),
    );
  } else {
    let remaining = -delta;
    let entries = [...nextSession.entries];

    for (const entry of [...activeEntries].sort((a, b) => b.timestamp - a.timestamp)) {
      if (remaining <= 0) break;

      if (entry.weight <= remaining) {
        entries = entries.map((item) =>
          item.id === entry.id
            ? { ...item, deletedAt: Date.now(), deletedBy: editedBy }
            : item,
        );
        audits.push(
          createAuditEntry({
            action: "entry_delete",
            editedBy,
            employeeId,
            entryId: entry.id,
            field: "weight",
            originalValue: String(entry.weight),
            newValue: "soft deleted",
          }),
        );
        remaining -= entry.weight;
      } else {
        const newWeight = entry.weight - remaining;
        entries = entries.map((item) =>
          item.id === entry.id ? { ...item, weight: newWeight } : item,
        );
        audits.push(
          createAuditEntry({
            action: "entry_update",
            editedBy,
            employeeId,
            entryId: entry.id,
            field: "weight",
            originalValue: String(entry.weight),
            newValue: String(newWeight),
          }),
        );
        remaining = 0;
      }
    }

    audits.unshift(
      createAuditEntry({
        action: "category_total_adjust",
        editedBy,
        employeeId,
        field: `${category}_total`,
        originalValue: String(currentTotal),
        newValue: String(newTotal),
      }),
    );

    nextSession = { ...nextSession, entries };
  }

  for (const audit of audits) {
    nextSession = appendAudit(nextSession, audit);
  }

  return { session: recomputeArchiveSession(nextSession), audits };
}

export function exportArchiveJson(): string {
  return JSON.stringify(loadArchive(), null, 2);
}

export function enqueueArchiveExportFilename(): string {
  return `trimtrack-archive-export_${formatDateShort(Date.now())}_${generateId().slice(0, 8)}.json`;
}
