import type { Employee, Session } from "../types";
import { sortEmployeesByNumber } from "./employees";

export function getSessionEmployees(
  session: Session,
  masterEmployees: Employee[],
): Employee[] {
  const masterById = new Map(masterEmployees.map((employee) => [employee.id, employee]));
  const snapshotById = new Map(session.employees.map((employee) => [employee.id, employee]));

  const resolved = session.employeeIds
    .map((id) => {
      const live = masterById.get(id);
      if (live) return live;

      const snapshot = snapshotById.get(id);
      if (snapshot) {
        return {
          id: snapshot.id,
          employeeNumber: snapshot.employeeNumber,
          legalName: snapshot.legalName,
          nickname: snapshot.nickname,
          active: true,
        };
      }

      return null;
    })
    .filter((employee): employee is Employee => employee !== null);

  return sortEmployeesByNumber(resolved);
}
