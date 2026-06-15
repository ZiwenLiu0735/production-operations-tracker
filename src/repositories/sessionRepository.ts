import { supabase } from "../lib/supabase";
import type { ArchivedSession, Session, TrimCategory } from "../types";
import { getEmployeeTotals, getSessionTotals } from "../types";
import { joinRoomNames, joinSupervisorNames } from "../utils/sessionDisplay";

export type ProductionActivityType =
  | "trim"
  | "deleaf"
  | "chop"
  | "skirt"
  | "package"
  | "sorting";

export interface StartProductionSessionInput {
  facilityId: string;
  roomIds: string[];
  supervisorProfileIds: string[];
  employeeIds: string[];
  activityType: ProductionActivityType;
  strain?: string;
  binNumber?: string;
  trackingUid?: string;
}

export async function startProductionSession(
  input: StartProductionSessionInput,
): Promise<string> {
  const { data, error } = await supabase.rpc(
    "start_production_activity_session",
    {
      target_facility_id: input.facilityId,
      target_room_ids: input.roomIds,
      target_supervisor_profile_ids: input.supervisorProfileIds,
      target_employee_ids: input.employeeIds,
      target_activity_type: input.activityType,
      target_strain: input.strain,
      target_bin_number: input.binNumber,
      target_tracking_uid: input.trackingUid,
    },
  );

  if (error) {
    throw new Error(`Unable to start session: ${error.message}`);
  }

  if (!data) throw new Error("Supabase did not return a session ID.");
  return data;
}

export async function completeProductionSession(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc("complete_production_session", {
    target_session_id: sessionId,
  });

  if (error) {
    throw new Error(`Unable to complete session: ${error.message}`);
  }
}

export async function getProductionSession(sessionId: string): Promise<Session> {
  const [
    sessionResult,
    roomsResult,
    supervisorsResult,
    employeesResult,
    entriesResult,
  ] = await Promise.all([
    supabase
      .from("sessions")
      .select(
        "id, facility_id, facility_name_snapshot, activity_type, strain, bin_number, tracking_uid, started_at, ended_at",
      )
      .eq("id", sessionId)
      .single(),
    supabase
      .from("session_rooms")
      .select("room_id, room_name_snapshot")
      .eq("session_id", sessionId)
      .order("room_name_snapshot"),
    supabase
      .from("session_supervisors")
      .select("profile_id, display_name_snapshot")
      .eq("session_id", sessionId)
      .order("employee_number_snapshot"),
    supabase
      .from("session_employees")
      .select(
        "employee_id, employee_number_snapshot, legal_name_snapshot, preferred_name_snapshot",
      )
      .eq("session_id", sessionId)
      .order("employee_number_snapshot"),
    supabase
      .from("weight_entries")
      .select("id, employee_id, category, weight_grams, recorded_at")
      .eq("session_id", sessionId)
      .is("deleted_at", null)
      .order("recorded_at"),
  ]);

  const queryError =
    sessionResult.error ??
    roomsResult.error ??
    supervisorsResult.error ??
    employeesResult.error ??
    entriesResult.error;

  if (queryError) {
    throw new Error(`Unable to load session summary: ${queryError.message}`);
  }

  const sessionRow = sessionResult.data;
  if (!sessionRow) {
    throw new Error("Unable to load session summary: session was not found.");
  }

  const rooms = (roomsResult.data ?? []).map((room) => ({
    id: room.room_id,
    name: room.room_name_snapshot,
  }));
  const supervisors = (supervisorsResult.data ?? []).map((supervisor) => ({
    id: supervisor.profile_id,
    name: supervisor.display_name_snapshot,
  }));
  const employees = (employeesResult.data ?? []).map((employee) => ({
    id: employee.employee_id,
    employeeNumber: employee.employee_number_snapshot,
    legalName: employee.legal_name_snapshot,
    nickname: employee.preferred_name_snapshot ?? undefined,
  }));

  return {
    id: sessionRow.id,
    facilityId: sessionRow.facility_id,
    facilityName: sessionRow.facility_name_snapshot,
    rooms: rooms.length > 0 ? rooms : undefined,
    roomId: rooms[0]?.id,
    roomName: rooms.length > 0 ? joinRoomNames(rooms) : undefined,
    supervisors,
    supervisorId: supervisors[0]?.id ?? "",
    supervisorName: joinSupervisorNames(supervisors),
    cadillac:
      sessionRow.strain || sessionRow.bin_number || sessionRow.tracking_uid
        ? {
            strain: sessionRow.strain ?? undefined,
            binNumber: sessionRow.bin_number ?? undefined,
            uid: sessionRow.tracking_uid ?? undefined,
          }
        : undefined,
    workType: sessionRow.activity_type,
    employeeIds: employees.map((employee) => employee.id),
    employees,
    startedAt: Date.parse(sessionRow.started_at),
    endedAt: sessionRow.ended_at
      ? Date.parse(sessionRow.ended_at)
      : undefined,
    entries: (entriesResult.data ?? []).map((entry) => ({
      id: entry.id,
      employeeId: entry.employee_id,
      category: entry.category as TrimCategory,
      weight: entry.weight_grams,
      timestamp: Date.parse(entry.recorded_at),
    })),
  };
}

export async function listCompletedProductionSessions(): Promise<ArchivedSession[]> {
  const { data: sessionRows, error: sessionsError } = await supabase
    .from("sessions")
    .select(
      "id, facility_id, facility_name_snapshot, notes, started_at, ended_at",
    )
    .eq("status", "completed")
    .is("deleted_at", null)
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false });

  if (sessionsError) {
    throw new Error(`Unable to load session archive: ${sessionsError.message}`);
  }
  if (!sessionRows || sessionRows.length === 0) return [];

  const sessionIds = sessionRows.map((session) => session.id);
  const [roomsResult, supervisorsResult, employeesResult, entriesResult] =
    await Promise.all([
      supabase
        .from("session_rooms")
        .select("session_id, room_id, room_name_snapshot")
        .in("session_id", sessionIds),
      supabase
        .from("session_supervisors")
        .select("session_id, profile_id, display_name_snapshot")
        .in("session_id", sessionIds),
      supabase
        .from("session_employees")
        .select(
          "session_id, employee_id, employee_number_snapshot, legal_name_snapshot, preferred_name_snapshot",
        )
        .in("session_id", sessionIds),
      supabase
        .from("weight_entries")
        .select(
          "id, session_id, employee_id, category, weight_grams, recorded_at",
        )
        .in("session_id", sessionIds)
        .is("deleted_at", null)
        .order("recorded_at"),
    ]);

  const relatedError =
    roomsResult.error ??
    supervisorsResult.error ??
    employeesResult.error ??
    entriesResult.error;

  if (relatedError) {
    throw new Error(`Unable to load session archive: ${relatedError.message}`);
  }

  return sessionRows.map((sessionRow) => {
    const rooms = (roomsResult.data ?? [])
      .filter((room) => room.session_id === sessionRow.id)
      .map((room) => ({
        id: room.room_id,
        name: room.room_name_snapshot,
      }));
    const supervisors = (supervisorsResult.data ?? [])
      .filter((supervisor) => supervisor.session_id === sessionRow.id)
      .map((supervisor) => ({
        id: supervisor.profile_id,
        name: supervisor.display_name_snapshot,
      }));
    const entries = (entriesResult.data ?? [])
      .filter((entry) => entry.session_id === sessionRow.id)
      .map((entry) => ({
        id: entry.id,
        employeeId: entry.employee_id,
        category: entry.category as TrimCategory,
        weight: entry.weight_grams,
        timestamp: Date.parse(entry.recorded_at),
      }));
    const employees = (employeesResult.data ?? [])
      .filter((employee) => employee.session_id === sessionRow.id)
      .map((employee) => ({
        id: employee.employee_id,
        employeeNumber: employee.employee_number_snapshot,
        legalName: employee.legal_name_snapshot,
        nickname: employee.preferred_name_snapshot ?? undefined,
        totals: getEmployeeTotals(employee.employee_id, entries),
      }));
    const endedAt = Date.parse(sessionRow.ended_at!);

    return {
      id: sessionRow.id,
      facilityId: sessionRow.facility_id,
      facilityName: sessionRow.facility_name_snapshot,
      roomId: rooms[0]?.id,
      roomName: rooms.length > 0 ? joinRoomNames(rooms) : undefined,
      supervisorId: supervisors[0]?.id ?? "",
      supervisorName: joinSupervisorNames(supervisors),
      employees,
      entries,
      sessionTotals: getSessionTotals(entries),
      startedAt: Date.parse(sessionRow.started_at),
      endedAt,
      archivedAt: endedAt,
      notes: sessionRow.notes,
      auditLog: [],
    };
  });
}
