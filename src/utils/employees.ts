import type { Employee } from "../types";

export function formatEmployeeId(number: number): string {
  return `#${number}`;
}

export function employeeNickname(employee: Employee): string | undefined {
  const nick = employee.nickname?.trim();
  return nick || undefined;
}

export function employeeDisplayName(employee: Employee): string {
  const nick = employeeNickname(employee);
  return nick ? `${employee.legalName} (${nick})` : employee.legalName;
}

export function matchesEmployeeSearch(employee: Employee, query: string): boolean {
  const q = query.trim().toLowerCase().replace(/^#/, "");
  if (!q) return true;

  const nick = employeeNickname(employee);
  return (
    String(employee.employeeNumber).includes(q) ||
    employee.legalName.toLowerCase().includes(q) ||
    (nick?.toLowerCase().includes(q) ?? false)
  );
}

export function sortEmployeesByNumber(employees: Employee[]): Employee[] {
  return [...employees].sort((a, b) => a.employeeNumber - b.employeeNumber);
}

export function filterEmployees(employees: Employee[], query: string): Employee[] {
  const filtered = !query.trim()
    ? employees
    : employees.filter((e) => matchesEmployeeSearch(e, query));
  return sortEmployeesByNumber(filtered);
}
