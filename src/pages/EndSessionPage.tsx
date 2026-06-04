import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { EmployeeIdentity } from "../components/EmployeeIdentity";
import { Layout } from "../components/Layout";
import { SessionInfoHeader } from "../components/SessionInfoHeader";
import { useArchiveRefreshOnMount } from "../context/ArchiveContext";
import { useMasterData } from "../context/MasterDataContext";
import { useSession } from "../context/SessionContext";
import { getEmployeeTotals, getGrandTotal, getSessionTotals } from "../types";
import { sortEmployeesByNumber } from "../utils/employees";
import { exportRawDataCSV } from "../utils/export";
import { formatDate, formatDuration, formatWeight } from "../utils/format";
import { getSessionEmployees } from "../utils/sessionEmployees";

export function EndSessionPage() {
  useArchiveRefreshOnMount();
  const navigate = useNavigate();
  const { employees } = useMasterData();
  const { session, clearSession, resumeSession } = useSession();
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      navigate("/", { replace: true });
    }
  }, [session, navigate]);

  const sessionEmployees = useMemo(() => {
    if (!session) return [];
    return getSessionEmployees(session, employees);
  }, [session, employees]);

  const sessionTotals = useMemo(
    () =>
      session ? getSessionTotals(session.entries) : { regular: 0, stick: 0, smalls: 0 },
    [session],
  );

  const sessionGrandTotal = getGrandTotal(sessionTotals);
  const sessionEndedAt = session?.endedAt ?? Date.now();

  function handleBack() {
    resumeSession();
    navigate("/session");
  }

  function handleNewSession() {
    clearSession();
    navigate("/");
  }

  async function handleEmployeeReceipts() {
    if (!session) return;
    setExportStatus("Generating employee receipts…");
    try {
      const { exportEmployeeReceiptPDFs } = await import("../utils/pdfExport");
      await exportEmployeeReceiptPDFs(session, employees);
      setExportStatus(
        sessionEmployees.length === 1
          ? "Employee receipt downloaded"
          : `Downloaded zip with ${sessionEmployees.length} employee receipts`,
      );
    } catch (err) {
      setExportStatus(err instanceof Error ? err.message : "Export failed");
    } finally {
      setTimeout(() => setExportStatus(null), 4000);
    }
  }

  async function handleSessionSummaryPdf() {
    if (!session) return;
    try {
      const { exportSessionSummaryPDF } = await import("../utils/pdfExport");
      exportSessionSummaryPDF(session, employees);
      setExportStatus("Session summary PDF downloaded");
    } catch (err) {
      setExportStatus(err instanceof Error ? err.message : "Export failed");
    }
    setTimeout(() => setExportStatus(null), 4000);
  }

  function handleRawDataCsv() {
    if (!session) return;
    exportRawDataCSV(session, employees);
    setExportStatus("Raw data CSV downloaded");
    setTimeout(() => setExportStatus(null), 4000);
  }

  if (!session) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-900 text-white/50">
        Loading…
      </div>
    );
  }

  const sortedEmployees = sortEmployeesByNumber(sessionEmployees);

  return (
    <Layout
      title="Session Complete"
      onBack={handleBack}
      backLabel="Resume"
      headerCenter={<SessionInfoHeader session={session} compact />}
    >
      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoCard label="Session Date" value={formatDate(session.startedAt)} />
            <InfoCard
              label="Session Duration"
              value={formatDuration(session.startedAt, sessionEndedAt)}
            />
            <InfoCard label="Total Entries" value={String(session.entries.length)} />
            <InfoCard label="Grand Total" value={formatWeight(sessionGrandTotal)} />
          </div>

          <div className="mb-6 grid grid-cols-3 gap-3">
            <ProductionStat
              label="Regular Trim"
              value={sessionTotals.regular}
              color="text-trim-regular"
            />
            <ProductionStat
              label="Stick Trim"
              value={sessionTotals.stick}
              color="text-trim-stick"
            />
            <ProductionStat
              label="Smalls"
              value={sessionTotals.smalls}
              color="text-trim-smalls"
            />
          </div>

          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
            Employee Summary
          </h2>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sortedEmployees.map((employee) => {
              const totals = getEmployeeTotals(employee.id, session.entries);
              const total = getGrandTotal(totals);
              return (
                <div
                  key={employee.id}
                  className="rounded-xl border border-surface-600 bg-surface-800 p-4"
                >
                  <EmployeeIdentity employee={employee} size="md" inlineName />
                  <div className="mt-3 space-y-2 border-t border-surface-600/50 pt-3">
                    <SummaryLine label="Regular" value={totals.regular} />
                    <SummaryLine label="Stick" value={totals.stick} />
                    <SummaryLine label="Smalls" value={totals.smalls} />
                    <div className="flex items-baseline justify-between border-t border-surface-600/50 pt-2">
                      <span className="text-sm font-bold text-white/60">Total</span>
                      <span className="text-xl font-bold tabular-nums text-brand-400">
                        {formatWeight(total)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
            Export Options
          </h2>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
          {exportStatus && (
            <p className="mb-4 text-center text-sm text-brand-400">{exportStatus}</p>
          )}

          <Button size="lg" fullWidth onClick={handleNewSession}>
            Start New Session
          </Button>
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

function ProductionStat({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-surface-600 bg-surface-800 p-4 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{formatWeight(value)}</p>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-white/50">{label}:</span>
      <span className="text-sm font-semibold tabular-nums text-white">
        {formatWeight(value)}
      </span>
    </div>
  );
}
