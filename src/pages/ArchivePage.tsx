import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppNav } from "../components/AppNav";
import { Button } from "../components/Button";
import { useEditorNameAction } from "../components/EditorNameModal";
import { Layout } from "../components/Layout";
import { useArchive, useArchiveRefreshOnMount } from "../context/ArchiveContext";
import { formatDate, formatWeight } from "../utils/format";
import { getGrandTotal } from "../types";

export function ArchivePage() {
  useArchiveRefreshOnMount();
  const navigate = useNavigate();
  const { searchArchives, softDeleteSession, duplicateSession, restoreSession } = useArchive();
  const { runWithEditorName, editorModal } = useEditorNameAction();
  const [query, setQuery] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const results = useMemo(() => {
    return searchArchives(query, includeDeleted).sort((a, b) => b.endedAt - a.endedAt);
  }, [query, includeDeleted, searchArchives]);

  return (
    <Layout
      title="Session Archive"
      subtitle="Completed sessions for payroll and audit review"
      headerRight={<AppNav />}
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="shrink-0 space-y-3 border-b border-surface-600/50 px-6 py-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by employee ID, name, date, or facility…"
            className="tt-input max-w-3xl"
          />
          <label className="flex items-center gap-2 text-sm text-white/50">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
              className="h-4 w-4 rounded border-surface-600"
            />
            Show soft-deleted sessions
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-3xl space-y-3">
            {results.length === 0 ? (
              <p className="text-center text-sm text-white/40">
                {query.trim()
                  ? "No sessions match your search"
                  : "No archived sessions yet. Completed sessions appear here automatically."}
              </p>
            ) : (
              results.map((session) => {
                const grandTotal = getGrandTotal(session.sessionTotals);
                const isDeleted = Boolean(session.deletedAt);

                return (
                  <div
                    key={session.id}
                    className={`tt-archive-card ${isDeleted ? "tt-archive-card--deleted" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-white">
                          {session.facilityName}
                          {session.roomName ? ` · ${session.roomName}` : ""}
                        </p>
                        <p className="mt-1 text-sm text-white/50">
                          {formatDate(session.startedAt)} · {session.supervisorName}
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                          {session.employees.length} employees · {session.entries.filter((e) => !e.deletedAt).length} active entries
                        </p>
                        {isDeleted && (
                          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-red-400">
                            Soft deleted
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-bold tabular-nums text-brand-400">
                          {formatWeight(grandTotal)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="md" variant="secondary" onClick={() => navigate(`/archive/${session.id}`)}>
                        View
                      </Button>
                      {!isDeleted && (
                        <Button size="md" onClick={() => navigate(`/archive/${session.id}/edit`)}>
                          Edit
                        </Button>
                      )}
                      <Button
                        size="md"
                        variant="secondary"
                        onClick={() => {
                          runWithEditorName((editedBy) => {
                            const duplicate = duplicateSession(session.id, editedBy);
                            if (duplicate) navigate(`/archive/${duplicate.id}/edit`);
                          });
                        }}
                      >
                        Duplicate
                      </Button>
                      {isDeleted ? (
                        <Button
                          size="md"
                          variant="secondary"
                          onClick={() => {
                            runWithEditorName((editedBy) => restoreSession(session.id, editedBy));
                          }}
                        >
                          Restore
                        </Button>
                      ) : (
                        <Button
                          size="md"
                          variant="danger"
                          onClick={() => {
                            if (
                              confirm(
                                "Soft delete this archived session? It will be hidden from the list but preserved for audit.",
                              )
                            ) {
                              runWithEditorName((editedBy) => softDeleteSession(session.id, editedBy));
                            }
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {editorModal}
    </Layout>
  );
}
