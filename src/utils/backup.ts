import type { MasterData } from "../types";
import { getEditorName, setEditorName } from "./editorIdentity";
import { formatDateShort } from "./format";
import { normalizeMasterData, parseMasterDataJson } from "./masterDataPersist";

export const LAST_BACKUP_EXPORT_KEY = "trimtrack-last-backup-export";
export const MASTER_DATA_MODIFIED_KEY = "trimtrack-master-data-modified";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface TrimTrackAppSettings {
  editorName?: string;
}

export interface TrimTrackBackup {
  version: 1;
  exportedAt: string;
  employees: MasterData["employees"];
  facilities: MasterData["facilities"];
  rooms: MasterData["rooms"];
  supervisors: MasterData["supervisors"];
  settings: TrimTrackAppSettings;
}

export function markMasterDataModified() {
  localStorage.setItem(MASTER_DATA_MODIFIED_KEY, String(Date.now()));
}

export function recordBackupExported(timestamp = Date.now()) {
  localStorage.setItem(LAST_BACKUP_EXPORT_KEY, String(timestamp));
}

export function getLastBackupExportTime(): number | null {
  const raw = localStorage.getItem(LAST_BACKUP_EXPORT_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getMasterDataModifiedTime(): number | null {
  const raw = localStorage.getItem(MASTER_DATA_MODIFIED_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function shouldShowBackupReminder(): boolean {
  const lastModified = getMasterDataModifiedTime();
  if (!lastModified) return false;

  const lastBackup = getLastBackupExportTime();
  const hasChangesSinceBackup = !lastBackup || lastModified > lastBackup;
  const noRecentBackup = !lastBackup || Date.now() - lastBackup >= SEVEN_DAYS_MS;

  return hasChangesSinceBackup && noRecentBackup;
}

export function buildBackupPayload(data: MasterData): TrimTrackBackup {
  const normalized = normalizeMasterData(data);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    employees: normalized.employees,
    facilities: normalized.facilities,
    rooms: normalized.rooms,
    supervisors: normalized.supervisors,
    settings: {
      editorName: getEditorName() ?? undefined,
    },
  };
}

export function backupFilename(date = new Date()): string {
  return `trimtrack-backup-${formatDateShort(date.getTime())}.json`;
}

export function serializeBackup(data: MasterData): string {
  return JSON.stringify(buildBackupPayload(data), null, 2);
}

function isTrimTrackBackup(value: unknown): value is TrimTrackBackup {
  if (!value || typeof value !== "object") return false;
  const backup = value as TrimTrackBackup;
  return (
    backup.version === 1 &&
    Array.isArray(backup.employees) &&
    Array.isArray(backup.facilities) &&
    Array.isArray(backup.rooms) &&
    Array.isArray(backup.supervisors)
  );
}

export function parseBackupJson(json: string): {
  masterData: MasterData;
  settings: TrimTrackAppSettings;
  exportedAt: number | null;
} {
  const parsed = JSON.parse(json) as unknown;

  if (isTrimTrackBackup(parsed)) {
    const masterData = normalizeMasterData({
      employees: parsed.employees,
      facilities: parsed.facilities,
      rooms: parsed.rooms,
      supervisors: parsed.supervisors,
    });
    return {
      masterData,
      settings: parsed.settings ?? {},
      exportedAt: parsed.exportedAt ? Date.parse(parsed.exportedAt) : null,
    };
  }

  const masterData = parseMasterDataJson(json);
  return { masterData, settings: {}, exportedAt: null };
}

export function applyBackupSettings(settings: TrimTrackAppSettings) {
  if (settings.editorName) {
    setEditorName(settings.editorName);
  }
}

export function downloadBackup(data: MasterData) {
  const payload = buildBackupPayload(data);
  recordBackupExported(Date.parse(payload.exportedAt));
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = backupFilename();
  link.click();
  URL.revokeObjectURL(url);
}
