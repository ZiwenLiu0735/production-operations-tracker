import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Employee, Facility, MasterData, Room, Supervisor } from "../types";
import {
  createFacility as createFacilityRecord,
  getMasterData,
  updateFacility as updateFacilityRecord,
  type RemoteMasterData,
} from "../repositories/masterDataRepository";
import { sortEmployeesByNumber } from "../utils/employees";

interface MasterDataContextValue {
  employees: Employee[];
  facilities: Facility[];
  rooms: Room[];
  supervisors: Supervisor[];
  activeEmployees: Employee[];
  activeSupervisors: Supervisor[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  createFacility: (name: string) => Promise<void>;
  updateFacility: (
    id: string,
    updates: { name?: string; active?: boolean },
  ) => Promise<void>;
}

const MasterDataContext = createContext<MasterDataContextValue | null>(null);

const EMPTY_MASTER_DATA: MasterData = {
  employees: [],
  facilities: [],
  rooms: [],
  supervisors: [],
};

function toMasterData(remote: RemoteMasterData): MasterData {
  return {
    facilities: remote.facilities,
    rooms: remote.rooms,
    employees: remote.employees,
    supervisors: remote.supervisors.map((supervisor) => ({
      id: supervisor.profileId,
      name: supervisor.displayName,
      active: supervisor.active,
    })),
  };
}

export function MasterDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MasterData>(EMPTY_MASTER_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(toMasterData(await getMasterData()));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load master data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    void getMasterData()
      .then((remote) => {
        if (active) setData(toMasterData(remote));
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load master data.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const createFacility = useCallback(async (name: string) => {
    const facility = await createFacilityRecord(name);
    setData((current) => ({
      ...current,
      facilities: [...current.facilities, facility],
    }));
  }, []);

  const updateFacility = useCallback(
    async (
      id: string,
      updates: { name?: string; active?: boolean },
    ) => {
      const facility = await updateFacilityRecord(id, updates);
      setData((current) => ({
        ...current,
        facilities: current.facilities.map((item) =>
          item.id === facility.id ? facility : item,
        ),
      }));
    },
    [],
  );

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
      loading,
      error,
      reload,
      createFacility,
      updateFacility,
    }),
    [
      data,
      employees,
      activeEmployees,
      activeSupervisors,
      loading,
      error,
      reload,
      createFacility,
      updateFacility,
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
