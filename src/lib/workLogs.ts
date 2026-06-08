import type { TrimCategory, WeightEntry } from "../types";
import { dbWorkLogToWeightEntry } from "../utils/dbEmployeeAdapter";
import { getSupabase } from "./supabase";

export interface DbWorkLog {
  id: string;
  session_id: string;
  employee_id: string;
  work_type: string;
  category: TrimCategory;
  weight: number;
  created_at: string;
}

export interface CreateWorkLogInput {
  session_id: string;
  employee_id: string;
  work_type: string;
  category: TrimCategory;
  weight: number;
}

export async function createWorkLog(
  input: CreateWorkLogInput,
): Promise<{ data: DbWorkLog | null; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const payload = {
    session_id: input.session_id,
    employee_id: input.employee_id,
    work_type: input.work_type,
    category: input.category,
    weight: input.weight,
  };

  const { data, error } = await supabase
    .from("work_logs")
    .insert(payload)
    .select("id, session_id, employee_id, work_type, category, weight, created_at")
    .maybeSingle();

  console.log("[workLogs] createWorkLog", {
    input: payload,
    rowCount: data ? 1 : 0,
    error: error?.message ?? null,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as DbWorkLog | null, error: null };
}

export async function deleteWorkLog(entryId: string): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase.from("work_logs").delete().eq("id", entryId);
  return { error: error?.message ?? null };
}

export async function updateWorkLog(
  entryId: string,
  updates: { weight?: number; category?: TrimCategory },
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const payload: Record<string, unknown> = {};
  if (updates.weight !== undefined) payload.weight = updates.weight;
  if (updates.category !== undefined) payload.category = updates.category;

  const { error } = await supabase.from("work_logs").update(payload).eq("id", entryId);
  return { error: error?.message ?? null };
}

export async function fetchWorkLogs(
  sessionId: string,
): Promise<{ data: WeightEntry[] | null; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("work_logs")
    .select("id, session_id, employee_id, work_type, category, weight, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  console.log("[workLogs] fetchWorkLogs", {
    sessionId,
    rowCount: data?.length ?? 0,
    error: error?.message ?? null,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: (data as DbWorkLog[]).map(dbWorkLogToWeightEntry),
    error: null,
  };
}
