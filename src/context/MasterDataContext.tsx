import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import defaultMasterData from "../data/defaultMasterData.json";
import type { Employee, Facility, MasterData, Room, Supervisor } from "../types";
import { sortEmployeesByNumber } from "../utils/employees";
import { generateId } from "../utils/id";
import {
  applyBackupSettings,
  downloadBackup,
  parseBackupJson,
  recordBackupExported,
  shouldShowBackupReminder,
} from "../utils/backup";
import {
  loadMasterData,
  normalizeMasterData,
  parseMasterDataJson,
  persistMasterData,
  MASTER_DATA_STORAGE_KEY,
} from "../utils/masterDataPersist";

interface MasterDataContextValue {
  employees: Employee[];
  facilities: Facility[];
  rooms: Room[];
  supervisors: Supervisor[];
  activeEmployees: Employee[];
  activeSupervisors: Supervisor[];
  addEmployee: (data: Omit<Employee, "id">) => void;
  updateEmployee: (id: string, data: Partial<Omit<Employee, "id">>) => void;
  deleteEmployee: (id: string) => void;
  addFacility: (data: Omit<Facility, "id">) => void;
  updateFacility: (id: string, data: Partial<Omit<Facility, "id">>) => void;
  deleteFacility: (id: string) => void;
  addRoom: (data: Omit<Room, "id">) => void;
  updateRoom: (id: string, data: Partial<Omit<Room, "id">>) => void;
  deleteRoom: (id: string) => void;
  addSupervisor: (data: Omit<Supervisor, "id">) => void;
  updateSupervisor: (id: string, data: Partial<Omit<Supervisor, "id">>) => void;
  deleteSupervisor: (id: string) => void;
  resetToDefaults: () => void;
  exportBackup: () => void;
  importBackup: (json: string) => void;
  reloadFromStorage: () => void;
  needsBackupReminder: boolean;
  dismissBackupReminder: () => void;
}

const MasterDataContext = createContext<MasterDataContextValue | null>(null);

export function MasterDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MasterData>(loadMasterData);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [reminderTick, setReminderTick] = useState(0);

  const commit = useCallback((next: MasterData) => {
    persistMasterData(next);
    setData(next);
    setReminderDismissed(false);
    setReminderTick((tick) => tick + 1);
    return next;
  }, []);

  const update = useCallback(
    (updater: (prev: MasterData) => MasterData) => {
      setReminderDismissed(false);
      setData((prev) => {
        const next = updater(prev);
        persistMasterData(next);
        return next;
      });
      setReminderTick((tick) => tick + 1);
    },
    [],
  );

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== MASTER_DATA_STORAGE_KEY || !event.newValue) return;
      try {
        setData(parseMasterDataJson(event.newValue));
      } catch {
        // Ignore invalid cross-tab payloads.
      }
    }

    function handleFocus() {
      setData(loadMasterData());
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const reloadFromStorage = useCallback(() => {
    setData(loadMasterData());
  }, []);

  const addEmployee = useCallback(
    (entry: Omit<Employee, "id">) => {
      update((prev) => ({
        ...prev,
        employees: [...prev.employees, { ...entry, id: generateId() }],
      }));
    },
    [update],
  );

  const updateEmployee = useCallback(
    (id: string, entry: Partial<Omit<Employee, "id">>) => {
      update((prev) => ({
        ...prev,
        employees: prev.employees.map((e) => (e.id === id ? { ...e, ...entry } : e)),
      }));
    },
    [update],
  );

  const deleteEmployee = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        employees: prev.employees.filter((e) => e.id !== id),
      }));
    },
    [update],
  );

  const addFacility = useCallback(
    (entry: Omit<Facility, "id">) => {
      update((prev) => ({
        ...prev,
        facilities: [...prev.facilities, { ...entry, id: generateId() }],
      }));
    },
    [update],
  );

  const updateFacility = useCallback(
    (id: string, entry: Partial<Omit<Facility, "id">>) => {
      update((prev) => ({
        ...prev,
        facilities: prev.facilities.map((f) => (f.id === id ? { ...f, ...entry } : f)),
      }));
    },
    [update],
  );

  const deleteFacility = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        facilities: prev.facilities.filter((f) => f.id !== id),
        rooms: prev.rooms.filter((r) => r.facilityId !== id),
      }));
    },
    [update],
  );

  const addRoom = useCallback(
    (entry: Omit<Room, "id">) => {
      update((prev) => ({
        ...prev,
        rooms: [...prev.rooms, { ...entry, id: generateId() }],
      }));
    },
    [update],
  );

  const updateRoom = useCallback(
    (id: string, entry: Partial<Omit<Room, "id">>) => {
      update((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) => (r.id === id ? { ...r, ...entry } : r)),
      }));
    },
    [update],
  );

  const deleteRoom = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        rooms: prev.rooms.filter((r) => r.id !== id),
      }));
    },
    [update],
  );

  const addSupervisor = useCallback(
    (entry: Omit<Supervisor, "id">) => {
      update((prev) => ({
        ...prev,
        supervisors: [...prev.supervisors, { ...entry, id: generateId() }],
      }));
    },
    [update],
  );

  const updateSupervisor = useCallback(
    (id: string, entry: Partial<Omit<Supervisor, "id">>) => {
      update((prev) => ({
        ...prev,
        supervisors: prev.supervisors.map((s) => (s.id === id ? { ...s, ...entry } : s)),
      }));
    },
    [update],
  );

  const deleteSupervisor = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        supervisors: prev.supervisors.filter((s) => s.id !== id),
      }));
    },
    [update],
  );

  const resetToDefaults = useCallback(() => {
    commit(normalizeMasterData(defaultMasterData as MasterData));
    setReminderDismissed(false);
    setReminderTick((tick) => tick + 1);
  }, [commit]);

  const exportBackup = useCallback(() => {
    downloadBackup(data);
    setReminderDismissed(true);
    setReminderTick((tick) => tick + 1);
  }, [data]);

  const importBackup = useCallback(
    (json: string) => {
      const { masterData, settings, exportedAt } = parseBackupJson(json);
      persistMasterData(masterData);
      setData(masterData);
      applyBackupSettings(settings);
      if (exportedAt) {
        recordBackupExported(exportedAt);
      }
      setReminderDismissed(true);
      setReminderTick((tick) => tick + 1);
    },
    [],
  );

  const needsBackupReminder = useMemo(
    () => !reminderDismissed && shouldShowBackupReminder(),
    [reminderDismissed, reminderTick, data],
  );

  const dismissBackupReminder = useCallback(() => {
    setReminderDismissed(true);
  }, []);

  const employees = useMemo(
    () => sortEmployeesByNumber(data.employees),
    [data.employees],
  );

  const activeEmployees = useMemo(
    () => sortEmployeesByNumber(data.employees.filter((e) => e.active)),
    [data.employees],
  );

  const activeSupervisors = useMemo(
    () => data.supervisors.filter((s) => s.active),
    [data.supervisors],
  );

  const value = useMemo(
    () => ({
      employees,
      facilities: data.facilities,
      rooms: data.rooms,
      supervisors: data.supervisors,
      activeEmployees,
      activeSupervisors,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      addFacility,
      updateFacility,
      deleteFacility,
      addRoom,
      updateRoom,
      deleteRoom,
      addSupervisor,
      updateSupervisor,
      deleteSupervisor,
      resetToDefaults,
      exportBackup,
      importBackup,
      reloadFromStorage,
      needsBackupReminder,
      dismissBackupReminder,
    }),
    [
      data,
      employees,
      activeEmployees,
      activeSupervisors,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      addFacility,
      updateFacility,
      deleteFacility,
      addRoom,
      updateRoom,
      deleteRoom,
      addSupervisor,
      updateSupervisor,
      deleteSupervisor,
      resetToDefaults,
      exportBackup,
      importBackup,
      reloadFromStorage,
      needsBackupReminder,
      dismissBackupReminder,
    ],
  );

  return (
    <MasterDataContext.Provider value={value}>{children}</MasterDataContext.Provider>
  );
}

export function useMasterData() {
  const ctx = useContext(MasterDataContext);
  if (!ctx) throw new Error("useMasterData must be used within MasterDataProvider");
  return ctx;
}
