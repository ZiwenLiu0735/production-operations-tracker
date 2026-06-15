import { supabase } from "../lib/supabase";
import type { TrimCategory } from "../types";

export async function recordWeightEntry(input: {
  sessionId: string;
  employeeId: string;
  category: TrimCategory;
  weight: number;
}): Promise<string> {
  const { data, error } = await supabase.rpc("record_weight_entry", {
    target_session_id: input.sessionId,
    target_employee_id: input.employeeId,
    target_category: input.category,
    target_weight_grams: Math.round(input.weight),
  });

  if (error) throw new Error(`Unable to record weight: ${error.message}`);
  if (!data) throw new Error("Supabase did not return a weight entry ID.");
  return data;
}

export async function updateWeightEntry(input: {
  entryId: string;
  category: TrimCategory;
  weight: number;
}): Promise<void> {
  const { error } = await supabase.rpc("update_weight_entry", {
    target_entry_id: input.entryId,
    target_category: input.category,
    target_weight_grams: Math.round(input.weight),
  });

  if (error) throw new Error(`Unable to update weight: ${error.message}`);
}

export async function deleteWeightEntry(entryId: string): Promise<void> {
  const { error } = await supabase.rpc("delete_weight_entry", {
    target_entry_id: entryId,
  });

  if (error) throw new Error(`Unable to delete weight: ${error.message}`);
}
