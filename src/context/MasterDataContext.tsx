import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Employee,
  Facility,
  MasterData,
  ProfileDirectoryMember,
  Room,
  Supervisor,
} from "../types";
import {
  createFacility as createFacilityRecord,
  createRoom as createRoomRecord,
  getMasterData,
  updateFacility as updateFacilityRecord,
  updateRoom as updateRoomRecord,
  type RemoteMasterData,
} from "../repositories/masterDataRepository";
import { sortEmployeesByNumber } from "../utils/employees";

interface MasterDataContextValue {
  employees: Employee[];
  operators: Employee[];
  admins: ProfileDirectoryMember[];
  facilities: Facility[];
  rooms: Room[];
  supervisors: Supervisor[];
  activeEmployees: Employee[];
  activeOperators: Employee[];
  activeSupervisors: Supervisor[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  createFacility: (name: string) => Promise<void>;
  updateFacility: (
    id: string,
    updates: { name?: string; active?: boolean },
  ) => Promise<void>;
  createRoom: (input: { facilityId: string; name: string }) => Promise<void>;
  updateRoom: (
    id: string,
    updates: { facilityId?: string; name?: string; active?: boolean },
  ) => Promise<void>;
}

const MasterDataContext = createContext<MasterDataContextValue | null>(null);

const EMPTY_MASTER_DATA: MasterData = {
  employees: [],
  facilities: [],
  rooms: [],
  supervisors: [],
};

interface MasterDataState extends MasterData {
  operators: Employee[];
  admins: ProfileDirectoryMember[];
}

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

function toMasterDataState(remote: RemoteMasterData): MasterDataState {
  return {
    ...toMasterData(remote),
    operators: remote.operators,
    admins: remote.admins.map((admin) => ({
      profileId: admin.profileId,
      employeeId: admin.employeeId,
      employeeNumber: admin.employeeNumber,
      name: admin.displayName,
      active: admin.active,
      role: admin.role,
    })),
  };
}

export function MasterDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MasterDataState>({
    ...EMPTY_MASTER_DATA,
    operators: [],
    admins: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(toMasterDataState(await getMasterData()));
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
        if (active) setData(toMasterDataState(remote));
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

  const createRoom = useCallback(
    async (input: { facilityId: string; name: string }) => {
      const room = await createRoomRecord(input);
      setData((current) => ({
        ...current,
        rooms: [...current.rooms, room],
      }));
    },
    [],
  );

  const updateRoom = useCallback(
    async (
      id: string,
      updates: { facilityId?: string; name?: string; active?: boolean },
    ) => {
      const room = await updateRoomRecord(id, updates);
      setData((current) => ({
        ...current,
        rooms: current.rooms.map((item) =>
          item.id === room.id ? room : item,
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

  const operators = useMemo(
    () => sortEmployeesByNumber(data.operators),
    [data.operators],
  );

  const activeOperators = useMemo(
    () => sortEmployeesByNumber(data.operators.filter((employee) => employee.active)),
    [data.operators],
  );

  const activeSupervisors = useMemo(
    () => data.supervisors.filter((s) => s.active),
    [data.supervisors],
  );

  const value = useMemo(
    () => ({
      employees,
      operators,
      admins: data.admins,
      facilities: data.facilities,
      rooms: data.rooms,
      supervisors: data.supervisors,
      activeEmployees,
      activeOperators,
      activeSupervisors,
      loading,
      error,
      reload,
      createFacility,
      updateFacility,
      createRoom,
      updateRoom,
    }),
    [
      data,
      employees,
      operators,
      activeEmployees,
      activeOperators,
      activeSupervisors,
      loading,
      error,
      reload,
      createFacility,
      updateFacility,
      createRoom,
      updateRoom,
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
