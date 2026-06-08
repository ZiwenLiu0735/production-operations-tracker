import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { EmployeeIdentity } from "../components/EmployeeIdentity";
import { Layout } from "../components/Layout";
import { TrimSessionInfoHeader } from "../components/trim-track/TrimSessionInfoHeader";
import { GrandTotalCard, ProductionStat, SummaryLine } from "../components/WeightSummary";
import { fetchEmployeesByIds } from "../lib/employees";
import { fetchWorkLogs } from "../lib/workLogs";
import { fetchSessionDisplay, type SessionDisplay } from "../lib/sessions";
import type { Employee, WeightEntry } from "../types";
import { getEmployeeTotals, getGrandTotal, getSessionTotals } from "../types";
import { dbEmployeeToEmployee } from "../utils/dbEmployeeAdapter";
import { exportRawDataCSV } from "../utils/export";
import { sortEmployeesByNumber } from "../utils/employees";
import { formatDate, formatDuration, formatTime, formatWeightWithLbs } from "../utils/format";
import { toExportSession } from "../utils/supabaseSessionAdapter";

export function TrimSessionSummaryPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [display, setDisplay] = useState<SessionDisplay | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Session ID is missing.");
      setLoading(false);
      return;
    }

    const id = sessionId;

    async function loadSummary() {
      setLoading(true);
      setError(null);

      const [displayResult, entriesResult] = await Promise.all([
        fetchSessionDisplay(id),
        fetchWorkLogs(id),
      ]);

      if (displayResult.error || entriesResult.error) {
        setError(displayResult.error ?? entriesResult.error);
        setDisplay(null);
        setEmployees([]);
        setEntries([]);
        setLoading(false);
        return;
      }

      const loadedEntries = entriesResult.data ?? [];
      const employeeIds = [...new Set(loadedEntries.map((entry) => entry.employeeId))];
      const employeesResult = await fetchEmployeesByIds(employeeIds);

      if (employeesResult.error) {
        setError(employeesResult.error);
        setDisplay(null);
        setEmployees([]);
        setEntries([]);
      } else {
        setDisplay(displayResult.data);
        setEmployees((employeesResult.data ?? []).map(dbEmployeeToEmployee));
        setEntries(loadedEntries);
      }

      setLoading(false);
    }

    void loadSummary();
  }, [sessionId]);

  const sessionTotals = useMemo(() => getSessionTotals(entries), [entries]);
  const sessionGrandTotal = getGrandTotal(sessionTotals);
  const sortedEmployees = useMemo(() => sortEmployeesByNumber(employees), [employees]);

  const startedAt = display ? new Date(display.session.started_at).getTime() : 0;
  const endedAt = display?.session.ended_at
    ? new Date(display.session.ended_at).getTime()
    : Date.now();

  const exportSession = useMemo(() => {
    if (!display) return null;
    return toExportSession(display, employees, entries);
  }, [display, employees, entries]);

  async function handleEmployeeReceipts() {
    if (!exportSession) return;
    setExportStatus("Generating employee receipts…");
    try {
      const { exportEmployeeReceiptPDFs } = await import("../utils/pdfExport");
      await exportEmployeeReceiptPDFs(exportSession, employees);
      setExportStatus(
        sortedEmployees.length === 1
          ? "Employee receipt downloaded"
          : `Downloaded zip with ${sortedEmployees.length} employee receipts`,
      );
    } catch (err) {
      setExportStatus(err instanceof Error ? err.message : "Export failed");
    } finally {
      setTimeout(() => setExportStatus(null), 4000);
    }
  }

  async function handleSessionSummaryPdf() {
    if (!exportSession) return;
    try {
      const { exportSessionSummaryPDF } = await import("../utils/pdfExport");
      exportSessionSummaryPDF(exportSession, employees);
      setExportStatus("Session summary PDF downloaded");
    } catch (err) {
      setExportStatus(err instanceof Error ? err.message : "Export failed");
    }
    setTimeout(() => setExportStatus(null), 4000);
  }

  function handleRawDataCsv() {
    if (!exportSession) return;
    exportRawDataCSV(exportSession, employees);
    setExportStatus("Raw data CSV downloaded");
    setTimeout(() => setExportStatus(null), 4000);
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-900 text-white/50">
        Loading summary…
      </div>
    );
  }

  if (error || !display) {
    return (
      <Layout title="Session Complete" headerRight={null}>
        <div className="p-6 text-red-200">{error ?? "Session not found."}</div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Session Complete"
      onBack={() => navigate("/")}
      backLabel="Home"
      headerCenter={<TrimSessionInfoHeader display={display} />}
    >
      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <InfoCard label="Facility" value={display.facilityLabel} />
            {display.roomName && <InfoCard label="Room" value={display.roomName} />}
            <InfoCard label="Supervisor" value={display.supervisorName} />
            <InfoCard label="Start Time" value={formatTime(startedAt)} />
            <InfoCard label="End Time" value={formatTime(endedAt)} />
            <InfoCard label="Duration" value={formatDuration(startedAt, endedAt)} />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoCard label="Session Date" value={formatDate(startedAt)} />
            <InfoCard label="Total Entries" value={String(entries.length)} />
            <div className="sm:col-span-2">
              <GrandTotalCard grams={sessionGrandTotal} />
            </div>
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
              const totals = getEmployeeTotals(employee.id, entries);
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
                        {formatWeightWithLbs(total)}
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
            <Button size="lg" variant="secondary" onClick={() => void handleEmployeeReceipts()}>
              Employee Receipt PDF
            </Button>
            <Button size="lg" variant="secondary" onClick={() => void handleSessionSummaryPdf()}>
              Session Summary PDF
            </Button>
            <Button size="lg" variant="secondary" onClick={handleRawDataCsv}>
              Raw Data CSV
            </Button>
          </div>
          {exportStatus && (
            <p className="mb-4 text-center text-sm text-brand-400">{exportStatus}</p>
          )}

          <Button size="lg" fullWidth onClick={() => navigate("/")}>
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
