import type { SessionDisplay } from "../lib/sessions";
import type { Employee, Session, SessionEmployeeSnapshot, WeightEntry } from "../types";

function employeeToSnapshot(employee: Employee): SessionEmployeeSnapshot {
  return {
    id: employee.id,
    employeeNumber: employee.employeeNumber,
    legalName: employee.legalName,
    nickname: employee.nickname,
  };
}

export function toExportSession(
  display: SessionDisplay,
  employees: Employee[],
  entries: WeightEntry[],
): Session {
  const startedAt = new Date(display.session.started_at).getTime();
  const endedAt = display.session.ended_at
    ? new Date(display.session.ended_at).getTime()
    : undefined;

  return {
    id: display.session.id,
    facilityId: display.session.facility_id,
    facilityName: display.facilityLabel,
    roomId: display.session.room_id ?? undefined,
    roomName: display.roomName ?? undefined,
    supervisorId: display.session.supervisor_id,
    supervisorName: display.supervisorName,
    employeeIds: employees.map((employee) => employee.id),
    employees: employees.map(employeeToSnapshot),
    startedAt,
    endedAt,
    entries,
  };
}
