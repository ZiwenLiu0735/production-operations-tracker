import type { ArchiveAuditAction, ArchiveAuditEntry } from "../types";
import { generateId } from "./id";

export function createAuditEntry(params: {
  action: ArchiveAuditAction;
  editedBy: string;
  field?: string;
  originalValue?: string;
  newValue?: string;
  entryId?: string;
  employeeId?: string;
}): ArchiveAuditEntry {
  return {
    id: generateId(),
    editedAt: Date.now(),
    ...params,
  };
}

export function formatAuditValue(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}
