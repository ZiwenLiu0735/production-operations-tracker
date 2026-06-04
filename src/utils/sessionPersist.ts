import type { Session } from "../types";

export const ACTIVE_SESSION_KEY = "trimtrack-active-session";
const LEGACY_SESSION_KEY = "trimtrack-session";

export function loadActiveSession(): Session | null {
  try {
    let raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) {
      raw = sessionStorage.getItem(LEGACY_SESSION_KEY);
      if (raw) {
        localStorage.setItem(ACTIVE_SESSION_KEY, raw);
        sessionStorage.removeItem(LEGACY_SESSION_KEY);
      }
    }
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Session;
    if (!parsed.id || !parsed.facilityName) return null;

    return {
      ...parsed,
      supervisorId: parsed.supervisorId ?? "",
      supervisorName: parsed.supervisorName ?? "Unknown",
      employeeIds: Array.isArray(parsed.employeeIds) ? parsed.employeeIds : [],
      employees: Array.isArray(parsed.employees) ? parsed.employees : [],
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
    };
  } catch {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    return null;
  }
}

export function persistActiveSession(session: Session | null) {
  if (session) {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
  }
}
