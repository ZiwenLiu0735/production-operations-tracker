import { getSupabase } from "./supabase";

export interface DbEmployee {
  id: string;
  employee_number: number | null;
  employee_code: string | null;
  legal_name: string;
  preferred_name: string | null;
  status: string | null;
  created_at?: string;
}

export function formatDbEmployeeCode(employee: DbEmployee): string | null {
  if (employee.employee_code?.trim()) {
    return employee.employee_code.trim();
  }
  if (employee.employee_number != null) {
    return `EMP #${employee.employee_number}`;
  }
  return null;
}

export function formatDbEmployeeDisplayName(employee: DbEmployee): string {
  const preferred = employee.preferred_name?.trim();
  return preferred ? `${employee.legal_name} (${preferred})` : employee.legal_name;
}

export function matchesDbEmployeeSearch(employee: DbEmployee, query: string): boolean {
  const q = query.trim().toLowerCase().replace(/^#/, "").replace(/^emp\s#?/, "");
  if (!q) return true;

  const code = formatDbEmployeeCode(employee)?.toLowerCase() ?? "";
  const preferred = employee.preferred_name?.trim().toLowerCase() ?? "";
  const employeeCode = employee.employee_code?.trim().toLowerCase() ?? "";

  return (
    employee.legal_name.toLowerCase().includes(q) ||
    preferred.includes(q) ||
    (employee.employee_number != null && String(employee.employee_number).includes(q)) ||
    employeeCode.includes(q) ||
    code.includes(q)
  );
}

export function sortDbEmployeesByNumber(employees: DbEmployee[]): DbEmployee[] {
  return [...employees].sort((a, b) => {
    const numA = a.employee_number ?? Number.MAX_SAFE_INTEGER;
    const numB = b.employee_number ?? Number.MAX_SAFE_INTEGER;
    if (numA !== numB) return numA - numB;
    return a.legal_name.localeCompare(b.legal_name);
  });
}

export function filterDbEmployees(employees: DbEmployee[], query: string): DbEmployee[] {
  const filtered = !query.trim()
    ? employees
    : employees.filter((employee) => matchesDbEmployeeSearch(employee, query));
  return sortDbEmployeesByNumber(filtered);
}

export async function fetchActiveEmployees(): Promise<{
  data: DbEmployee[] | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      data: null,
      error: "Supabase is not configured. Add your URL and anon key to .env.local and restart the dev server.",
    };
  }

  const { data, error } = await supabase
    .from("employees")
    .select("id, employee_number, employee_code, legal_name, preferred_name, status, created_at")
    .eq("status", "active")
    .order("employee_number");

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  return {
    data: sortDbEmployeesByNumber(data as DbEmployee[]),
    error: null,
  };
}

export async function fetchEmployees(): Promise<{
  data: DbEmployee[] | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      data: null,
      error: "Supabase is not configured. Add your URL and anon key to .env.local and restart the dev server.",
    };
  }

  const { data, error } = await supabase
    .from("employees")
    .select("id, employee_number, employee_code, legal_name, preferred_name, status, created_at")
    .order("employee_number");

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  return {
    data: sortDbEmployeesByNumber(data as DbEmployee[]),
    error: null,
  };
}

export async function fetchEmployeesByIds(
  employeeIds: string[],
): Promise<{ data: DbEmployee[] | null; error: string | null }> {
  if (employeeIds.length === 0) {
    return { data: [], error: null };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("employees")
    .select("id, employee_number, employee_code, legal_name, preferred_name, status, created_at")
    .in("id", employeeIds)
    .order("employee_number");

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: sortDbEmployeesByNumber(data as DbEmployee[]),
    error: null,
  };
}
