const HOURLY_WORK_TYPES = new Set(["deleaf", "chop", "skirt", "package", "sorting"]);

export function getSessionTrackPath(workType: string, sessionId: string): string {
  if (workType === "trim") {
    return `/trim-track/${sessionId}`;
  }

  if (HOURLY_WORK_TYPES.has(workType)) {
    return `/hourly-track/${sessionId}`;
  }

  return `/hourly-track/${sessionId}`;
}

export function formatWorkTypeLabel(workType: string): string {
  return workType.charAt(0).toUpperCase() + workType.slice(1);
}
