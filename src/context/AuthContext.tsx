import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type AppRole = "admin" | "supervisor" | "operator";

export interface AuthEmployee {
  id: string;
  employeeNumber: number;
  legalName: string;
  preferredName?: string;
  active: boolean;
}

export interface AuthProfile {
  id: string;
  employeeId: string | null;
  displayName: string;
  role: AppRole;
  active: boolean;
}

interface ProfileRow {
  id: string;
  employee_id: string | null;
  display_name: string;
  role: AppRole;
  active: boolean;
  employees:
    | EmployeeRow
    | EmployeeRow[]
    | null;
}

interface EmployeeRow {
  id: string;
  employee_number: number;
  legal_name: string;
  preferred_name: string | null;
  active: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  employee: AuthEmployee | null;
  loading: boolean;
  identityError: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapIdentity(row: ProfileRow) {
  const employeeRow = Array.isArray(row.employees)
    ? row.employees[0] ?? null
    : row.employees;

  const profile: AuthProfile = {
    id: row.id,
    employeeId: row.employee_id,
    displayName: row.display_name,
    role: row.role,
    active: row.active,
  };

  const employee = employeeRow
    ? {
        id: employeeRow.id,
        employeeNumber: employeeRow.employee_number,
        legalName: employeeRow.legal_name,
        preferredName: employeeRow.preferred_name ?? undefined,
        active: employeeRow.active,
      }
    : null;

  return { profile, employee };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [employee, setEmployee] = useState<AuthEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const requestId = useRef(0);

  const loadIdentity = useCallback(async (user: User | null) => {
    const currentRequest = ++requestId.current;

    if (!user) {
      setProfile(null);
      setEmployee(null);
      setIdentityError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIdentityError(null);

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, employee_id, display_name, role, active, employees(id, employee_number, legal_name, preferred_name, active)",
      )
      .eq("id", user.id)
      .maybeSingle();

    if (currentRequest !== requestId.current) return;

    if (error) {
      setProfile(null);
      setEmployee(null);
      setIdentityError(error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setProfile(null);
      setEmployee(null);
      setIdentityError("Your application profile is unavailable or inactive.");
      setLoading(false);
      return;
    }

    const identity = mapIdentity(data as ProfileRow);
    setProfile(identity.profile);
    setEmployee(identity.employee);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      void loadIdentity(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      window.setTimeout(() => {
        if (active) void loadIdentity(nextSession?.user ?? null);
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadIdentity]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      employee,
      loading,
      identityError,
      signIn,
      signOut,
    }),
    [session, profile, employee, loading, identityError, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
