import type { DbSession } from "./sessions";

export interface TrimTrackNavigationState {
  session?: DbSession;
  employeeIds: string[];
}
