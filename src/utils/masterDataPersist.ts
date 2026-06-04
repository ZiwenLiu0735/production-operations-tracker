import defaultMasterData from "../data/defaultMasterData.json";
import type { MasterData } from "../types";
import { markMasterDataModified } from "./backup";

export const MASTER_DATA_STORAGE_KEY = "trimtrack-master-data";

export function normalizeMasterData(data: MasterData): MasterData {
  return {
    employees: data.employees.map((e) => ({
      ...e,
      active: e.active ?? true,
      nickname: e.nickname?.trim() || undefined,
    })),
    facilities: data.facilities.map((f) => ({
      ...f,
      code: f.code ?? f.name.slice(0, 3).toUpperCase(),
    })),
    rooms: [...data.rooms],
    supervisors: data.supervisors.map((s) => ({ ...s, active: s.active ?? true })),
  };
}

export function loadMasterData(): MasterData {
  try {
    const raw = localStorage.getItem(MASTER_DATA_STORAGE_KEY);
    if (raw) {
      return normalizeMasterData(JSON.parse(raw) as MasterData);
    }
  } catch {
    localStorage.removeItem(MASTER_DATA_STORAGE_KEY);
  }
  return normalizeMasterData(defaultMasterData as MasterData);
}

export function persistMasterData(data: MasterData) {
  localStorage.setItem(MASTER_DATA_STORAGE_KEY, JSON.stringify(normalizeMasterData(data)));
  markMasterDataModified();
}

export function parseMasterDataJson(json: string): MasterData {
  const parsed = normalizeMasterData(JSON.parse(json) as MasterData);
  if (!parsed.employees || !parsed.facilities || !parsed.rooms || !parsed.supervisors) {
    throw new Error("Invalid master data JSON");
  }
  return parsed;
}
