import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

type FacilityRow = Database["public"]["Tables"]["facilities"]["Row"];
type RoomRow = Database["public"]["Tables"]["rooms"]["Row"];
type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

interface SupervisorProfileRow {
  id: string;
  display_name: string;
  active: boolean;
  role: AppRole;
  employee_id: string | null;
  employees: Pick<
    EmployeeRow,
    "id" | "employee_number" | "legal_name" | "preferred_name" | "active"
  > | null;
}

export interface FacilityRecord {
  id: string;
  name: string;
  active: boolean;
}

export interface RoomRecord {
  id: string;
  facilityId: string;
  name: string;
  active: boolean;
}

export interface EmployeeRecord {
  id: string;
  employeeNumber: number;
  legalName: string;
  preferredName?: string;
  active: boolean;
}

export interface SupervisorRecord {
  profileId: string;
  employeeId: string;
  employeeNumber: number;
  displayName: string;
  active: boolean;
  role: Extract<AppRole, "admin" | "supervisor">;
}

export interface RemoteMasterData {
  facilities: FacilityRecord[];
  rooms: RoomRecord[];
  employees: EmployeeRecord[];
  supervisors: SupervisorRecord[];
}

function queryError(resource: string, message: string) {
  return new Error(`Unable to load ${resource}: ${message}`);
}

export function mapFacility(row: FacilityRow): FacilityRecord {
  return {
    id: row.id,
    name: row.name,
    active: row.active,
  };
}

export function mapRoom(row: RoomRow): RoomRecord {
  return {
    id: row.id,
    facilityId: row.facility_id,
    name: row.name,
    active: row.active,
  };
}

export function mapEmployee(row: EmployeeRow): EmployeeRecord {
  return {
    id: row.id,
    employeeNumber: row.employee_number,
    legalName: row.legal_name,
    preferredName: row.preferred_name ?? undefined,
    active: row.active,
  };
}

function mapSupervisor(row: SupervisorProfileRow): SupervisorRecord | null {
  const employee = row.employees;
  if (
    !employee ||
    !row.employee_id ||
    !row.active ||
    !employee.active ||
    (row.role !== "admin" && row.role !== "supervisor")
  ) {
    return null;
  }

  return {
    profileId: row.id,
    employeeId: employee.id,
    employeeNumber: employee.employee_number,
    displayName:
      employee.preferred_name ?? employee.legal_name ?? row.display_name,
    active: true,
    role: row.role,
  };
}

export async function getFacilities(): Promise<FacilityRecord[]> {
  const { data, error } = await supabase
    .from("facilities")
    .select("*")
    .order("name");

  if (error) throw queryError("facilities", error.message);
  return data.map(mapFacility);
}

export async function createFacility(name: string): Promise<FacilityRecord> {
  const { data, error } = await supabase
    .from("facilities")
    .insert({ name: name.trim() })
    .select()
    .single();

  if (error) throw queryError("facility", error.message);
  return mapFacility(data);
}

export async function updateFacility(
  id: string,
  updates: { name?: string; active?: boolean },
): Promise<FacilityRecord> {
  const values: Database["public"]["Tables"]["facilities"]["Update"] = {};

  if (updates.name !== undefined) values.name = updates.name.trim();
  if (updates.active !== undefined) values.active = updates.active;

  const { data, error } = await supabase
    .from("facilities")
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error) throw queryError("facility", error.message);
  return mapFacility(data);
}

export async function getRooms(): Promise<RoomRecord[]> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .order("name");

  if (error) throw queryError("rooms", error.message);
  return data.map(mapRoom);
}

export async function createRoom(input: {
  facilityId: string;
  name: string;
}): Promise<RoomRecord> {
  const { data, error } = await supabase
    .from("rooms")
    .insert({
      facility_id: input.facilityId,
      name: input.name.trim(),
    })
    .select()
    .single();

  if (error) throw queryError("room", error.message);
  return mapRoom(data);
}

export async function updateRoom(
  id: string,
  updates: { facilityId?: string; name?: string; active?: boolean },
): Promise<RoomRecord> {
  const values: Database["public"]["Tables"]["rooms"]["Update"] = {};

  if (updates.facilityId !== undefined) {
    values.facility_id = updates.facilityId;
  }
  if (updates.name !== undefined) values.name = updates.name.trim();
  if (updates.active !== undefined) values.active = updates.active;

  const { data, error } = await supabase
    .from("rooms")
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error) throw queryError("room", error.message);
  return mapRoom(data);
}

export async function getEmployees(): Promise<EmployeeRecord[]> {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("employee_number");

  if (error) throw queryError("employees", error.message);
  return data.map(mapEmployee);
}

export async function getSupervisors(): Promise<SupervisorRecord[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, active, role, employee_id, employees(id, employee_number, legal_name, preferred_name, active)",
    )
    .in("role", ["admin", "supervisor"])
    .eq("active", true)
    .order("display_name");

  if (error) throw queryError("supervisors", error.message);

  return data
    .map((row) => mapSupervisor(row as SupervisorProfileRow))
    .filter((row): row is SupervisorRecord => row !== null);
}

export async function getMasterData(): Promise<RemoteMasterData> {
  const [facilities, rooms, employees, supervisors] = await Promise.all([
    getFacilities(),
    getRooms(),
    getEmployees(),
    getSupervisors(),
  ]);

  return { facilities, rooms, employees, supervisors };
}
