import type { DbEmployee } from "../lib/employees";
import type { Employee, SessionEmployeeSnapshot, TrimCategory, WeightEntry } from "../types";
import type { DbWorkLog } from "../lib/workLogs";

export function dbEmployeeToEmployee(employee: DbEmployee): Employee {
  const preferred = employee.preferred_name?.trim();
  return {
    id: employee.id,
    employeeNumber: employee.employee_number ?? 0,
    legalName: employee.legal_name,
    nickname: preferred || undefined,
    active: employee.status === "active",
  };
}

export function dbEmployeeToSnapshot(employee: DbEmployee): SessionEmployeeSnapshot {
  const mapped = dbEmployeeToEmployee(employee);
  return {
    id: mapped.id,
    employeeNumber: mapped.employeeNumber,
    legalName: mapped.legalName,
    nickname: mapped.nickname,
  };
}

export function dbWorkLogToWeightEntry(entry: DbWorkLog): WeightEntry {
  return {
    id: entry.id,
    employeeId: entry.employee_id,
    category: entry.category as TrimCategory,
    weight: Math.round(entry.weight),
    timestamp: new Date(entry.created_at).getTime(),
  };
}
