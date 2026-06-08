import { getSupabase } from "./supabase";

export interface DbSession {
  id: string;
  facility_id: string;
  room_id: string | null;
  supervisor_id: string;
  work_type: string;
  session_date: string;
  started_at: string;
  ended_at?: string | null;
  status: string;
  created_at?: string;
}

export interface CreateSessionInput {
  facility_id: string;
  room_id?: string | null;
  supervisor_id: string;
  work_type: string;
}

export async function endSupabaseSession(sessionId: string): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase
    .from("sessions")
    .update({
      ended_at: new Date().toISOString(),
      status: "completed",
    })
    .eq("id", sessionId);

  return { error: error?.message ?? null };
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function logSupabaseQuery(
  label: string,
  input: Record<string, unknown>,
  result: { data: unknown; error: { message: string; details?: string; code?: string } | null },
) {
  const rowCount = Array.isArray(result.data)
    ? result.data.length
    : result.data
      ? 1
      : 0;

  console.log(`[supabase] ${label}`, {
    input,
    rowCount,
    error: result.error?.message ?? null,
    details: result.error?.details ?? null,
    code: result.error?.code ?? null,
  });
}

export async function createSession(input: CreateSessionInput): Promise<{
  data: DbSession | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      data: null,
      error: "Supabase is not configured. Add your URL and anon key to .env.local and restart the dev server.",
    };
  }

  const insertPayload = {
    facility_id: input.facility_id,
    room_id: input.room_id ?? null,
    supervisor_id: input.supervisor_id,
    work_type: input.work_type,
    session_date: todayDateString(),
    started_at: new Date().toISOString(),
    status: "active",
  };

  const result = await supabase.from("sessions").insert(insertPayload).select().single();
  logSupabaseQuery("createSession insert.select().single()", insertPayload, result);

  if (result.error) {
    return {
      data: null,
      error: result.error.message,
    };
  }

  return {
    data: result.data as DbSession,
    error: null,
  };
}

export interface SessionDisplay {
  session: DbSession;
  facilityLabel: string;
  roomName: string | null;
  supervisorName: string;
}

export async function fetchSessionDisplay(sessionId: string): Promise<{
  data: SessionDisplay | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      data: null,
      error: "Supabase is not configured. Add your URL and anon key to .env.local and restart the dev server.",
    };
  }

  const sessionResult = await supabase
    .from("sessions")
    .select("id, facility_id, room_id, supervisor_id, work_type, session_date, started_at, ended_at, status, created_at")
    .eq("id", sessionId)
    .maybeSingle();

  logSupabaseQuery("fetchSessionDisplay sessions.eq(id).maybeSingle()", { sessionId }, sessionResult);

  if (sessionResult.error) {
    return { data: null, error: sessionResult.error.message };
  }

  if (!sessionResult.data) {
    return { data: null, error: "Session not found." };
  }

  const dbSession = sessionResult.data as DbSession;

  const [facilityResult, supervisorResult, roomResult] = await Promise.all([
    supabase
      .from("facilities")
      .select("facility_code, facility_name")
      .eq("id", dbSession.facility_id)
      .maybeSingle(),
    supabase
      .from("supervisors")
      .select("supervisor_name")
      .eq("id", dbSession.supervisor_id)
      .maybeSingle(),
    dbSession.room_id
      ? supabase.from("rooms").select("room_name").eq("id", dbSession.room_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  logSupabaseQuery(
    "fetchSessionDisplay facilities.eq(id).maybeSingle()",
    { facilityId: dbSession.facility_id },
    facilityResult,
  );
  logSupabaseQuery(
    "fetchSessionDisplay supervisors.eq(id).maybeSingle()",
    { supervisorId: dbSession.supervisor_id },
    supervisorResult,
  );
  if (dbSession.room_id) {
    logSupabaseQuery(
      "fetchSessionDisplay rooms.eq(id).maybeSingle()",
      { roomId: dbSession.room_id },
      roomResult,
    );
  }

  if (facilityResult.error) {
    return { data: null, error: facilityResult.error.message };
  }
  if (supervisorResult.error) {
    return { data: null, error: supervisorResult.error.message };
  }
  if (roomResult.error) {
    return { data: null, error: roomResult.error.message };
  }

  const facility = facilityResult.data as { facility_code: string | number; facility_name: string } | null;
  const supervisor = supervisorResult.data as { supervisor_name: string } | null;
  const room = roomResult.data as { room_name: string } | null;

  return {
    data: {
      session: dbSession,
      facilityLabel: facility
        ? `${facility.facility_code} — ${facility.facility_name}`
        : `Unknown facility (${dbSession.facility_id})`,
      roomName: room?.room_name ?? null,
      supervisorName: supervisor?.supervisor_name ?? `Unknown supervisor (${dbSession.supervisor_id})`,
    },
    error: null,
  };
}
