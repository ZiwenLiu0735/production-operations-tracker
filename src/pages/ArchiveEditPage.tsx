import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppNav } from "../components/AppNav";
import { AuditTrailPanel } from "../components/AuditTrailPanel";
import { Button } from "../components/Button";
import { useEditorNameAction } from "../components/EditorNameModal";
import { EmployeeIdentity } from "../components/EmployeeIdentity";
import { Layout } from "../components/Layout";
import { inputClass, selectClass, SettingsField } from "../components/settings/SettingsUi";
import { useArchive, useArchiveRefreshOnMount } from "../context/ArchiveContext";
import { useMasterData } from "../context/MasterDataContext";
import { getGrandTotal } from "../types";
import {
  applyDateInputValue,
  archivedToSession,
  dateInputValue,
  snapshotToEmployee,
} from "../utils/archiveView";
import { sortEmployeesByNumber } from "../utils/employees";
import { formatWeight } from "../utils/format";

export function ArchiveEditPage() {
  useArchiveRefreshOnMount();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getArchive, updateSessionMetadata } = useArchive();
  const { facilities, rooms, supervisors } = useMasterData();
  const { runWithEditorName, editorModal } = useEditorNameAction();

  const archived = id ? getArchive(id) : null;

  const [facilityId, setFacilityId] = useState(() => archived?.facilityId ?? "");
  const [roomId, setRoomId] = useState(() => archived?.roomId ?? "");
  const [supervisorId, setSupervisorId] = useState(() => archived?.supervisorId ?? "");
  const [sessionDate, setSessionDate] = useState(() =>
    archived ? dateInputValue(archived.startedAt) : "",
  );
  const [notes, setNotes] = useState(() => archived?.notes ?? "");

  const availableRooms = useMemo(
    () => rooms.filter((room) => room.facilityId === facilityId),
    [rooms, facilityId],
  );

  const sortedEmployees = useMemo(
    () => (archived ? sortEmployeesByNumber(archived.employees.map(snapshotToEmployee)) : []),
    [archived],
  );

  if (!archived) {
    return (
      <Layout title="Edit Archive" headerRight={<AppNav />}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-white/50">Archived session not found.</p>
          <Link to="/archive" className="text-brand-400 underline">
            Back to Archive
          </Link>
        </div>
      </Layout>
    );
  }

  if (archived.deletedAt) {
    return (
      <Layout title="Edit Archive" headerRight={<AppNav />}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-white/50">This session was soft deleted and cannot be edited.</p>
          <Button size="md" onClick={() => navigate(`/archive/${archived.id}`)}>
            View Session
          </Button>
        </div>
      </Layout>
    );
  }

  const sessionView = archivedToSession(archived);

  function handleSaveMetadata() {
    const facility = facilities.find((item) => item.id === facilityId);
    const supervisor = supervisors.find((item) => item.id === supervisorId);
    const room = availableRooms.find((item) => item.id === roomId);

    if (!facility || !supervisor) return;

    runWithEditorName((editedBy) => {
      updateSessionMetadata(
        archived!.id,
        {
          facilityId: facility.id,
          facilityName: facility.name,
          roomId: room?.id,
          roomName: room?.name,
          supervisorId: supervisor.id,
          supervisorName: supervisor.name,
          startedAt: applyDateInputValue(archived!.startedAt, sessionDate),
          notes: notes.trim(),
        },
        editedBy,
      );
    });
  }

  return (
    <Layout
      title="Edit Archived Session"
      subtitle="Changes are audit logged · entries preserved on soft delete"
      onBack={() => navigate(`/archive/${archived.id}`)}
      backLabel="View"
      headerRight={<AppNav />}
    >
      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SettingsField label="Facility">
              <select
                value={facilityId}
                onChange={(e) => {
                  setFacilityId(e.target.value);
                  setRoomId("");
                }}
                className={selectClass}
              >
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
            </SettingsField>

            <SettingsField label="Room">
              {availableRooms.length > 0 ? (
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">No room</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input className={inputClass} value="" disabled placeholder="No rooms configured" />
              )}
            </SettingsField>

            <SettingsField label="Supervisor">
              <select
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className={selectClass}
              >
                {supervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.name}
                  </option>
                ))}
              </select>
            </SettingsField>

            <SettingsField label="Session Date">
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className={inputClass}
              />
            </SettingsField>
          </div>

          <SettingsField label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${inputClass} resize-y`}
              placeholder="Payroll notes, corrections, supervisor comments…"
            />
          </SettingsField>

          <Button size="lg" onClick={handleSaveMetadata}>
            Save Session Details
          </Button>

          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
              Employee Summary
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {sortedEmployees.map((employee) => {
                const snapshot = archived.employees.find((item) => item.id === employee.id)!;
                const total = getGrandTotal(snapshot.totals);
                return (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => navigate(`/archive/${archived.id}/employee/${employee.id}`)}
                    className="rounded-xl border border-surface-600 bg-surface-800 p-4 text-left transition-colors hover:border-brand-500/50 active:scale-[0.99] touch-manipulation"
                  >
                    <EmployeeIdentity employee={employee} size="md" inlineName />
                    <div className="mt-3 flex items-center justify-between border-t border-surface-600/50 pt-3">
                      <span className="text-sm text-white/50">Total production</span>
                      <span className="text-lg font-bold tabular-nums text-brand-400">
                        {formatWeight(total)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-brand-400">Edit employee session →</p>
                  </button>
                );
              })}
            </div>
          </div>

          <AuditTrailPanel audits={archived.auditLog} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button size="lg" variant="secondary" onClick={() => navigate(`/archive/${archived.id}`)}>
              View Session
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={async () => {
                const { exportSessionSummaryPDF } = await import("../utils/pdfExport");
                exportSessionSummaryPDF(
                  sessionView,
                  sortedEmployees,
                );
              }}
            >
              Export Summary PDF
            </Button>
          </div>
        </div>
      </div>
      {editorModal}
    </Layout>
  );
}
