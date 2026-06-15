import { supabase } from "../lib/supabase";

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
