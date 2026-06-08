import type { DbEmployee } from "./employees";
import { fetchEmployees } from "./employees";
import type { DbFacility } from "./facilities";
import { fetchFacilities } from "./facilities";
import type { DbRoom } from "./rooms";
import { fetchRooms } from "./rooms";
import type { DbSupervisor } from "./supervisors";
import { fetchAllSupervisors } from "./supervisors";
import type { Employee, Facility, MasterData, Room, Supervisor } from "../types";
import { dbEmployeeToEmployee } from "../utils/dbEmployeeAdapter";

function mapFacility(facility: DbFacility): Facility {
  return {
    id: facility.id,
    code: String(facility.facility_code),
    name: facility.facility_name,
    active: facility.status === "active",
  };
}

function mapSupervisor(supervisor: DbSupervisor): Supervisor {
  return {
    id: supervisor.id,
    name: supervisor.supervisor_name,
    active: supervisor.status === "active",
  };
}

function mapRoom(room: DbRoom): Room {
  return {
    id: room.id,
    facilityId: room.facility_id,
    name: room.room_name,
    active: room.status === "active",
  };
}

function mapEmployee(employee: DbEmployee): Employee {
  return dbEmployeeToEmployee(employee);
}

export async function fetchMasterDataFromSupabase(): Promise<{
  data: MasterData | null;
  error: string | null;
}> {
  const [facilitiesResult, supervisorsResult, employeesResult, roomsResult] =
    await Promise.all([
      fetchFacilities(),
      fetchAllSupervisors(),
      fetchEmployees(),
      fetchRooms(),
    ]);

  const error =
    facilitiesResult.error ??
    supervisorsResult.error ??
    employeesResult.error ??
    roomsResult.error;

  if (error) {
    return { data: null, error };
  }

  return {
    data: {
      facilities: (facilitiesResult.data ?? []).map(mapFacility),
      supervisors: (supervisorsResult.data ?? []).map(mapSupervisor),
      employees: (employeesResult.data ?? []).map(mapEmployee),
      rooms: (roomsResult.data ?? []).map(mapRoom),
    },
    error: null,
  };
}
