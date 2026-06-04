import type { ArchiveAuditEntry } from "../types";
import { CATEGORY_LABELS } from "../types";
import { formatTime } from "../utils/format";

interface AuditTrailPanelProps {
  audits: ArchiveAuditEntry[];
  title?: string;
  employeeId?: string;
}

function formatAction(action: ArchiveAuditEntry["action"]): string {
  switch (action) {
    case "session_update":
      return "Session updated";
    case "entry_create":
      return "Entry added";
    case "entry_update":
      return "Entry edited";
    case "entry_delete":
      return "Entry soft deleted";
    case "session_delete":
      return "Session soft deleted";
    case "session_restore":
      return "Session restored";
    case "session_duplicate":
      return "Session duplicated";
    case "category_total_adjust":
      return "Category total adjusted";
    default:
      return action;
  }
}

function formatField(field?: string): string {
  if (!field) return "Value";
  if (field in CATEGORY_LABELS) return CATEGORY_LABELS[field as keyof typeof CATEGORY_LABELS];
  if (field.endsWith("_total")) {
    const category = field.replace("_total", "") as keyof typeof CATEGORY_LABELS;
    return `${CATEGORY_LABELS[category] ?? field} total`;
  }
  return field;
}

export function AuditTrailPanel({ audits, title = "Audit Trail", employeeId }: AuditTrailPanelProps) {
  const filtered = employeeId
    ? audits.filter((audit) => audit.employeeId === employeeId)
    : audits;

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-surface-600 bg-surface-800 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40">{title}</h2>
        <p className="mt-2 text-sm text-white/40">No edits recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-600 bg-surface-800 p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">{title}</h2>
      <div className="space-y-3">
        {filtered.map((audit) => (
          <div
            key={audit.id}
            className="rounded-lg border border-surface-600/50 bg-surface-900/60 px-3 py-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-white">{formatAction(audit.action)}</p>
              <p className="text-xs text-white/40">{formatTime(audit.editedAt)}</p>
            </div>
            <p className="mt-1 text-xs text-white/50">Edited by {audit.editedBy}</p>
            {(audit.originalValue !== undefined || audit.newValue !== undefined) && (
              <p className="mt-2 text-sm text-white/70">
                {formatField(audit.field)}:{" "}
                <span className="text-white/40">{audit.originalValue ?? "—"}</span>
                {" → "}
                <span className="font-semibold text-brand-400">{audit.newValue ?? "—"}</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
