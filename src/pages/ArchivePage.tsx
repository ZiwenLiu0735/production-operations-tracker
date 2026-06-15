import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppNav } from "../components/AppNav";
import { Button } from "../components/Button";
import { Layout } from "../components/Layout";
import { useArchive, useArchiveRefreshOnMount } from "../context/ArchiveContext";
import { formatDate, formatWeight } from "../utils/format";
import { getGrandTotal } from "../types";

export function ArchivePage() {
  useArchiveRefreshOnMount();
  const navigate = useNavigate();
  const { error, loading, refreshArchives, searchArchives } = useArchive();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    return searchArchives(query).sort((a, b) => b.endedAt - a.endedAt);
  }, [query, searchArchives]);

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
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-3xl space-y-3">
            {loading ? (
              <p className="text-center text-sm text-white/40">
                Loading completed sessions…
              </p>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm text-red-300">{error}</p>
                <Button
                  size="md"
                  variant="secondary"
                  onClick={() => void refreshArchives()}
                >
                  Try Again
                </Button>
              </div>
            ) : results.length === 0 ? (
              <p className="text-center text-sm text-white/40">
                {query.trim()
                  ? "No sessions match your search"
                  : "No archived sessions yet. Completed sessions appear here automatically."}
              </p>
            ) : (
              results.map((session) => {
                const grandTotal = getGrandTotal(session.sessionTotals);

                return (
                  <div
                    key={session.id}
                    className="tt-archive-card"
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
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
