import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { listCompletedProductionSessions } from "../repositories/sessionRepository";
import type { ArchivedSession } from "../types";
import { formatDate, formatDateShort } from "../utils/format";

interface ArchiveContextValue {
  archives: ArchivedSession[];
  error: string | null;
  loading: boolean;
  searchArchives: (query: string) => ArchivedSession[];
  getArchive: (id: string) => ArchivedSession | null;
  refreshArchives: () => Promise<void>;
}

const ArchiveContext = createContext<ArchiveContextValue | null>(null);

export function ArchiveProvider({ children }: { children: ReactNode }) {
  const [archives, setArchives] = useState<ArchivedSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshArchives = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      setArchives(await listCompletedProductionSessions());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load session archive.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const getArchive = useCallback(
    (id: string) => archives.find((session) => session.id === id) ?? null,
    [archives],
  );

  const searchArchives = useCallback(
    (query: string) => {
      const normalized = query.trim().toLowerCase().replace(/^#/, "");
      if (!normalized) return archives;

      return archives.filter((session) => {
        if (session.facilityName.toLowerCase().includes(normalized)) return true;

        const dateShort = formatDateShort(session.startedAt);
        const dateLong = formatDate(session.startedAt).toLowerCase();
        if (dateShort.includes(normalized) || dateLong.includes(normalized)) {
          return true;
        }

        return session.employees.some(
          (employee) =>
            String(employee.employeeNumber).includes(normalized) ||
            employee.legalName.toLowerCase().includes(normalized) ||
            employee.nickname?.toLowerCase().includes(normalized),
        );
      });
    },
    [archives],
  );

  const value = useMemo(
    () => ({
      archives,
      error,
      loading,
      searchArchives,
      getArchive,
      refreshArchives,
    }),
    [
      archives,
      error,
      loading,
      searchArchives,
      getArchive,
      refreshArchives,
    ],
  );

  return (
    <ArchiveContext.Provider value={value}>{children}</ArchiveContext.Provider>
  );
}

export function useArchive() {
  const context = useContext(ArchiveContext);
  if (!context) {
    throw new Error("useArchive must be used within ArchiveProvider");
  }
  return context;
}

export function useArchiveRefreshOnMount() {
  const { refreshArchives } = useArchive();
  useEffect(() => {
    void refreshArchives();
  }, [refreshArchives]);
}
