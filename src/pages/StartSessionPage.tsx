import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActiveSessionFound } from "../components/ActiveSessionFound";
import { AppNav } from "../components/AppNav";
import { Button } from "../components/Button";
import { DeleteSessionModal } from "../components/DeleteSessionModal";
import { EmployeeIdentity } from "../components/EmployeeIdentity";
import { Layout } from "../components/Layout";
import { SectionLabel, SelectTile } from "../components/SelectTile";
import { useMasterData } from "../context/MasterDataContext";
import { useSession } from "../context/SessionContext";
import { filterEmployees } from "../utils/employees";
import {
  getSessionTrackPath,
  HOURLY_TRACK_PATH,
  SUMMARY_PATH,
  TRIM_TRACK_LIVE_PATH,
} from "../lib/sessionRoutes";

const WORK_TYPE_OPTIONS = [
  { value: "trim", label: "TRIM" },
  { value: "deleaf", label: "DELEAF" },
  { value: "chop", label: "CHOP" },
  { value: "skirt", label: "SKIRT" },
  { value: "package", label: "PACKAGE" },
  { value: "sorting", label: "SORTING" },
];

export function StartSessionPage() {
  const navigate = useNavigate();
  const { session, startSession, endSession, clearSession } = useSession();
  const { facilities, activeSupervisors, activeEmployees, rooms } = useMasterData();

  const [facilityId, setFacilityId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [workType, setWorkType] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const facilityRooms = useMemo(
    () =>
      rooms.filter(
        (room) => room.facilityId === facilityId && room.active !== false,
      ),
    [rooms, facilityId],
  );
  const facilityHasRooms = facilityRooms.length > 0;

  const filteredEmployees = useMemo(
    () => filterEmployees(activeEmployees, searchQuery),
    [activeEmployees, searchQuery],
  );

  useEffect(() => {
    if (session?.endedAt) {
      navigate(SUMMARY_PATH, { replace: true });
    }
  }, [session, navigate]);

  const canStart =
    facilityId !== "" &&
    workType !== "" &&
    supervisorId !== "" &&
    selectedEmployeeIds.length > 0;

  function toggleEmployee(id: string) {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((employeeId) => employeeId !== id) : [...prev, id],
    );
  }

  function handleStart(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!canStart) return;

    const facility = facilities.find((item) => item.id === facilityId);
    const supervisor = activeSupervisors.find((item) => item.id === supervisorId);
    const room = roomId ? facilityRooms.find((item) => item.id === roomId) : undefined;

    if (!facility || !supervisor) return;

    const employees = selectedEmployeeIds
      .map((id) => activeEmployees.find((employee) => employee.id === id))
      .filter((employee): employee is NonNullable<typeof employee> => employee !== undefined)
      .map((employee) => ({
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        legalName: employee.legalName,
        nickname: employee.nickname,
      }));

    startSession({
      facilityId: facility.id,
      facilityName: facility.name,
      roomId: room?.id,
      roomName: room?.name,
      supervisorId: supervisor.id,
      supervisorName: supervisor.name,
      workType,
      employeeIds: employees.map((employee) => employee.id),
      employees,
    });

    navigate(getSessionTrackPath(workType));
  }

  const hasActiveSession = session !== null && !session.endedAt;

  function handleResume() {
    navigate(session?.workType === "trim" ? TRIM_TRACK_LIVE_PATH : HOURLY_TRACK_PATH);
  }

  function handleEndSession() {
    endSession();
    navigate(SUMMARY_PATH);
  }

  function handleDeleteSession() {
    clearSession();
    setShowDeleteModal(false);
  }

  return (
    <Layout
      title="Start Session"
      subtitle="Set up a new production session"
      onBack={hasActiveSession ? handleResume : undefined}
      backLabel="Resume Session"
      headerRight={<AppNav />}
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 pb-4">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            {hasActiveSession && session && (
              <ActiveSessionFound
                session={session}
                onResume={handleResume}
                onEnd={handleEndSession}
                onDelete={() => setShowDeleteModal(true)}
              />
            )}

            {showDeleteModal && session && (
              <DeleteSessionModal
                session={session}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteSession}
              />
            )}

            <section>
              <SectionLabel>Facility</SectionLabel>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {facilities.map((facility) => (
                  <SelectTile
                    key={facility.id}
                    label={facility.name.toUpperCase()}
                    selected={facilityId === facility.id}
                    onClick={() => {
                      setFacilityId(facility.id);
                      setRoomId("");
                    }}
                  />
                ))}
              </div>
            </section>

            {facilityId && facilityHasRooms && (
              <section>
                <SectionLabel>Room</SectionLabel>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {facilityRooms.map((room) => (
                    <SelectTile
                      key={room.id}
                      label={room.name}
                      selected={roomId === room.id}
                      onClick={() => setRoomId(room.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              <SectionLabel>Supervisor</SectionLabel>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {activeSupervisors.map((supervisor) => (
                  <SelectTile
                    key={supervisor.id}
                    label={supervisor.name}
                    selected={supervisorId === supervisor.id}
                    onClick={() => setSupervisorId(supervisor.id)}
                  />
                ))}
              </div>
            </section>

            <section>
              <SectionLabel>Work Type</SectionLabel>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {WORK_TYPE_OPTIONS.map((option) => (
                  <SelectTile
                    key={option.value}
                    label={option.label}
                    selected={workType === option.value}
                    onClick={() => setWorkType(option.value)}
                  />
                ))}
              </div>
            </section>

            <section>
              <SectionLabel>
                Employees
                {selectedEmployeeIds.length > 0 && (
                  <span className="ml-2 font-normal text-brand-400">
                    ({selectedEmployeeIds.length} selected)
                  </span>
                )}
              </SectionLabel>

              <input
                type="search"
                enterKeyHint="search"
                placeholder="Search by ID, name, or preferred name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-2 w-full rounded-xl border-2 border-surface-600 bg-surface-800 px-4 py-3 text-base text-white outline-none placeholder:text-white/30 focus:border-brand-500"
              />

              {filteredEmployees.length === 0 ? (
                <p className="mt-3 text-center text-sm text-white/40">
                  No employees match your search
                </p>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {filteredEmployees.map((employee) => {
                    const selected = selectedEmployeeIds.includes(employee.id);
                    return (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() => toggleEmployee(employee.id)}
                        className={`rounded-xl border-2 p-3 text-left transition-all active:scale-[0.97] touch-manipulation
                          ${
                            selected
                              ? "border-brand-500 bg-brand-600/15"
                              : "border-surface-600 bg-surface-800 hover:border-surface-500"
                          }`}
                      >
                        <EmployeeIdentity employee={employee} size="sm" />
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="relative z-10 shrink-0 border-t border-surface-600/50 bg-surface-900 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto w-full max-w-3xl">
            <Button size="lg" fullWidth disabled={!canStart} onClick={handleStart}>
              Start Session
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
