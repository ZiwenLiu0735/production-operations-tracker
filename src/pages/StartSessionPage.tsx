import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ActiveSessionFound } from "../components/ActiveSessionFound";
import { AppNav } from "../components/AppNav";
import { Button } from "../components/Button";
import { DeleteSessionModal } from "../components/DeleteSessionModal";
import { EmployeeIdentity } from "../components/EmployeeIdentity";
import { Layout } from "../components/Layout";
import { useMasterData } from "../context/MasterDataContext";
import { useSession } from "../context/SessionContext";
import { filterEmployees } from "../utils/employees";

export function StartSessionPage() {
  const navigate = useNavigate();
  const { session, startSession, endSession, clearSession } = useSession();
  const { facilities, rooms, activeEmployees, activeSupervisors } = useMasterData();

  const [facilityId, setFacilityId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const availableRooms = useMemo(
    () => rooms.filter((r) => r.facilityId === facilityId),
    [rooms, facilityId],
  );

  const facilityHasRooms = availableRooms.length > 0;

  const filteredEmployees = useMemo(
    () => filterEmployees(activeEmployees, searchQuery),
    [activeEmployees, searchQuery],
  );

  const canStart =
    facilityId !== "" &&
    (!facilityHasRooms || roomId !== "") &&
    supervisorId !== "" &&
    selectedEmployeeIds.length > 0;

  function toggleEmployee(id: string) {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }

  function handleStart(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    console.log("[StartSession] click", {
      canStart,
      facilityId,
      roomId,
      supervisorId,
      employeeCount: selectedEmployeeIds.length,
    });

    if (!canStart) {
      console.warn("[StartSession] blocked — form incomplete");
      return;
    }

    const facility = facilities.find((f) => f.id === facilityId);
    const supervisor = activeSupervisors.find((s) => s.id === supervisorId);

    if (!facility || !supervisor) {
      console.error("[StartSession] missing selection data");
      return;
    }

    const room = facilityHasRooms ? rooms.find((r) => r.id === roomId) : undefined;
    if (facilityHasRooms && !room) {
      console.error("[StartSession] room required for this facility");
      return;
    }

    const selectedEmployees = activeEmployees.filter((employee) =>
      selectedEmployeeIds.includes(employee.id),
    );

    try {
      // flushSync ensures session state is committed before navigation.
      // Without this, LiveSessionPage can mount with session=null on iPad Safari
      // and immediately redirect back here — appearing as if the button did nothing.
      flushSync(() => {
        startSession({
          facilityId,
          facilityName: facility.name,
          roomId: room?.id,
          roomName: room?.name,
          supervisorId,
          supervisorName: supervisor.name,
          employeeIds: selectedEmployeeIds,
          employees: selectedEmployees.map((employee) => ({
            id: employee.id,
            employeeNumber: employee.employeeNumber,
            legalName: employee.legalName,
            nickname: employee.nickname,
          })),
        });
      });

      console.log("[StartSession] session created, navigating to /session");
      navigate("/session", { state: { fromStart: true } });
    } catch (error) {
      console.error("[StartSession] failed", error);
    }
  }

  const hasActiveSession = session !== null && !session.endedAt;

  useEffect(() => {
    if (session?.endedAt) {
      navigate("/summary", { replace: true });
    }
  }, [session, navigate]);

  function handleResume() {
    navigate("/session");
  }

  function handleEndSession() {
    endSession();
    navigate("/summary");
  }

  function handleDeleteSession() {
    clearSession();
    setShowDeleteModal(false);
  }

  return (
    <Layout
      title="Start Session"
      subtitle="Set up a new trim production session"
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
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {facilities.map((facility) => (
                  <SelectTile
                    key={facility.id}
                    label={facility.name}
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
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {availableRooms.map((room) => (
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
                placeholder="Search by ID, name, or nickname…"
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

        {/* Fixed footer outside scroll container — avoids iOS Safari sticky/touch bugs */}
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50">
      {children}
    </h2>
  );
}

function SelectTile({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-12 rounded-xl border-2 px-4 py-3 text-left text-base font-semibold transition-all active:scale-[0.98] touch-manipulation
        ${
          selected
            ? "border-brand-500 bg-brand-600/15 text-white"
            : "border-surface-600 bg-surface-800 text-white/80 hover:border-surface-500 hover:text-white"
        }`}
    >
      {label}
    </button>
  );
}
