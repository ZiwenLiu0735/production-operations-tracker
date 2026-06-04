import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppNav } from "../components/AppNav";
import { AuditTrailPanel } from "../components/AuditTrailPanel";
import { Button } from "../components/Button";
import { EmployeeIdentity } from "../components/EmployeeIdentity";
import { Layout } from "../components/Layout";
import { SessionInfoHeader } from "../components/SessionInfoHeader";
import { useArchive, useArchiveRefreshOnMount } from "../context/ArchiveContext";
import { getGrandTotal } from "../types";
import { exportRawDataCSV } from "../utils/export";
import { archivedToSession, snapshotToEmployee } from "../utils/archiveView";
import { sortEmployeesByNumber } from "../utils/employees";
import { GrandTotalCard, ProductionStat, SummaryLine } from "../components/WeightSummary";
import { formatDate, formatDuration, formatWeightWithLbs } from "../utils/format";

export function ArchiveDetailPage() {
  useArchiveRefreshOnMount();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getArchive } = useArchive();

  const archived = id ? getArchive(id) : null;

  const sessionView = useMemo(
    () => (archived ? archivedToSession(archived) : null),
    [archived],
  );

  const sortedEmployees = useMemo(
    () =>
      archived
        ? sortEmployeesByNumber(archived.employees.map(snapshotToEmployee))
        : [],
    [archived],
  );

  if (!archived || !sessionView) {
    return (
      <Layout title="Session Archive" headerRight={<AppNav />}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-white/50">Archived session not found.</p>
          <Link to="/archive" className="text-brand-400 underline">
            Back to Archive
          </Link>
        </div>
      </Layout>
    );
  }

  const sessionGrandTotal = getGrandTotal(archived.sessionTotals);
  const isDeleted = Boolean(archived.deletedAt);

  async function handleEmployeeReceipts() {
    const { exportEmployeeReceiptPDFs } = await import("../utils/pdfExport");
    await exportEmployeeReceiptPDFs(sessionView!, sortedEmployees);
  }

  async function handleSessionSummaryPdf() {
    const { exportSessionSummaryPDF } = await import("../utils/pdfExport");
    exportSessionSummaryPDF(sessionView!, sortedEmployees);
  }

  function handleRawDataCsv() {
    exportRawDataCSV(sessionView!, sortedEmployees);
  }

  return (
    <Layout
      title="Archived Session"
      subtitle={isDeleted ? "Soft deleted · read-only view" : "View mode · payroll and audit review"}
      onBack={() => navigate("/archive")}
      backLabel="Archive"
      headerRight={<AppNav />}
      headerCenter={<SessionInfoHeader session={sessionView} compact />}
    >
      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-5xl">
          {isDeleted && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-600/10 px-4 py-3 text-sm text-red-200">
              This session was soft deleted. Data is preserved for audit but hidden from the default
              archive list.
            </div>
          )}

          {!isDeleted && (
            <div className="mb-6 flex flex-wrap gap-2">
              <Button size="md" onClick={() => navigate(`/archive/${archived.id}/edit`)}>
                Edit Session
              </Button>
            </div>
          )}

          {archived.notes && (
            <div className="mb-6 rounded-xl border border-surface-600/50 bg-surface-800/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Notes</p>
              <p className="mt-1 text-sm text-white/70">{archived.notes}</p>
            </div>
          )}

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoCard label="Session Date" value={formatDate(archived.startedAt)} />
            <InfoCard
              label="Session Duration"
              value={formatDuration(archived.startedAt, archived.endedAt)}
            />
            <InfoCard
              label="Active Entries"
              value={String(archived.entries.filter((entry) => !entry.deletedAt).length)}
            />
            <GrandTotalCard grams={sessionGrandTotal} />
          </div>

          <div className="mb-6 grid grid-cols-3 gap-3">
            <ProductionStat
              label="Regular Trim"
              value={archived.sessionTotals.regular}
              color="text-trim-regular"
            />
            <ProductionStat
              label="Stick Trim"
              value={archived.sessionTotals.stick}
              color="text-trim-stick"
            />
            <ProductionStat
              label="Smalls"
              value={archived.sessionTotals.smalls}
              color="text-trim-smalls"
            />
          </div>

          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
            Employee Summary
          </h2>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sortedEmployees.map((employee) => {
              const snapshot = archived.employees.find((item) => item.id === employee.id)!;
              const total = getGrandTotal(snapshot.totals);
              return (
                <div
                  key={employee.id}
                  className="rounded-xl border border-surface-600 bg-surface-800 p-4"
                >
                  <EmployeeIdentity employee={employee} size="md" inlineName />
                  <div className="mt-3 space-y-2 border-t border-surface-600/50 pt-3">
                    <SummaryLine label="Regular" value={snapshot.totals.regular} />
                    <SummaryLine label="Stick" value={snapshot.totals.stick} />
                    <SummaryLine label="Smalls" value={snapshot.totals.smalls} />
                    <div className="flex items-baseline justify-between border-t border-surface-600/50 pt-2">
                      <span className="text-sm font-bold text-white/60">Total</span>
                      <span className="text-xl font-bold tabular-nums text-brand-400">
                        {formatWeightWithLbs(total)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
            Export
          </h2>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button size="lg" variant="secondary" onClick={handleEmployeeReceipts}>
              Employee Receipt PDF
            </Button>
            <Button size="lg" variant="secondary" onClick={handleSessionSummaryPdf}>
              Session Summary PDF
            </Button>
            <Button size="lg" variant="secondary" onClick={handleRawDataCsv}>
              Raw Data CSV
            </Button>
          </div>

          <AuditTrailPanel audits={archived.auditLog} />
        </div>
      </div>
    </Layout>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-surface-600 bg-surface-800 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

