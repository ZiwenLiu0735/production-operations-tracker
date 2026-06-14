import type { ArchivedSession, Employee, Session } from "../types";

export function snapshotToEmployee(
  snapshot: ArchivedSession["employees"][number],
): Employee {
  return {
    id: snapshot.id,
    employeeNumber: snapshot.employeeNumber,
    legalName: snapshot.legalName,
    preferredName: snapshot.nickname,
    active: true,
  };
}

export function archivedToSession(archived: ArchivedSession): Session {
  return {
    id: archived.id,
    facilityId: archived.facilityId,
    facilityName: archived.facilityName,
    roomId: archived.roomId,
    roomName: archived.roomName,
    supervisorId: archived.supervisorId,
    supervisorName: archived.supervisorName,
    employeeIds: archived.employees.map((employee) => employee.id),
    employees: archived.employees,
    startedAt: archived.startedAt,
    endedAt: archived.endedAt,
    entries: archived.entries.filter((entry) => !entry.deletedAt),
  };
}

export function dateInputValue(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function applyDateInputValue(currentTimestamp: number, dateValue: string): number {
  const [year, month, day] = dateValue.split("-").map(Number);
  const current = new Date(currentTimestamp);
  current.setFullYear(year, month - 1, day);
  return current.getTime();
}
