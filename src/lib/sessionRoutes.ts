export const START_SESSION_PATH = "/";
export const TRIM_TRACK_LIVE_PATH = "/trim-track/live";
export const HOURLY_TRACK_PATH = "/hourly-track";
export const SUMMARY_PATH = "/summary";

const HOURLY_WORK_TYPES = new Set(["deleaf", "chop", "skirt", "package", "sorting"]);

export function getSessionTrackPath(workType: string): string {
  if (workType === "trim") {
    return TRIM_TRACK_LIVE_PATH;
  }

  if (HOURLY_WORK_TYPES.has(workType)) {
    return HOURLY_TRACK_PATH;
  }

  return HOURLY_TRACK_PATH;
}

export function formatWorkTypeLabel(workType: string): string {
  return workType.charAt(0).toUpperCase() + workType.slice(1);
}
