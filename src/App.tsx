import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Button } from "./components/Button";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { ArchiveProvider } from "./context/ArchiveContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import {
  MasterDataProvider,
  useMasterData,
} from "./context/MasterDataContext";
import { SessionProvider } from "./context/SessionContext";
import { SyncProvider } from "./context/SyncContext";
import { ArchiveDetailPage } from "./pages/ArchiveDetailPage";
import { ArchiveEditPage } from "./pages/ArchiveEditPage";
import { ArchiveEmployeeEditPage } from "./pages/ArchiveEmployeeEditPage";
import { ArchivePage } from "./pages/ArchivePage";
import { LiveSessionPage } from "./pages/LiveSessionPage";
import { LoginPage } from "./pages/LoginPage";
import { AccountStatusPage } from "./pages/AccountStatusPage";
import { SettingsPage } from "./pages/SettingsPage";
import { HourlyTrackPage } from "./pages/HourlyTrackPage";
import {
  HOURLY_TRACK_PATH,
  START_SESSION_PATH,
  SUMMARY_PATH,
  TRIM_TRACK_LIVE_PATH,
} from "./lib/sessionRoutes";
import { StartSessionPage } from "./pages/StartSessionPage";

const EndSessionPage = lazy(() =>
  import("./pages/EndSessionPage").then((m) => ({ default: m.EndSessionPage })),
);

function PageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-900 text-white/60">
      Loading…
    </div>
  );
}

function OperationalRoutes() {
  const { profile } = useAuth();

  return (
    <SyncProvider>
      <MasterDataProvider>
        <MasterDataGate>
          <ArchiveProvider>
            <SessionProvider>
              <OfflineIndicator />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                <Route
                  path="/"
                  element={
                    <Navigate
                      to={
                        profile?.role === "admin"
                          ? "/settings"
                          : START_SESSION_PATH
                      }
                      replace
                    />
                  }
                />
                <Route path={START_SESSION_PATH} element={<StartSessionPage />} />
                <Route path={TRIM_TRACK_LIVE_PATH} element={<LiveSessionPage />} />
                <Route path={HOURLY_TRACK_PATH} element={<HourlyTrackPage />} />
                <Route
                  path="/settings"
                  element={
                    profile?.role === "admin" ? (
                      <SettingsPage />
                    ) : (
                      <Navigate to={START_SESSION_PATH} replace />
                    )
                  }
                />
                <Route path="/archive" element={<ArchivePage />} />
                <Route path="/archive/:id" element={<ArchiveDetailPage />} />
                <Route path="/archive/:id/edit" element={<ArchiveEditPage />} />
                <Route
                  path="/archive/:id/employee/:employeeId"
                  element={<ArchiveEmployeeEditPage />}
                />
                <Route path={SUMMARY_PATH} element={<EndSessionPage />} />
                <Route
                  path="/session"
                  element={<Navigate to={TRIM_TRACK_LIVE_PATH} replace />}
                />
                <Route
                  path="/trim-track/:sessionId"
                  element={<Navigate to={TRIM_TRACK_LIVE_PATH} replace />}
                />
                <Route
                  path="/trim-track/:sessionId/summary"
                  element={<Navigate to={SUMMARY_PATH} replace />}
                />
                <Route
                  path="/hourly-track/:sessionId"
                  element={<Navigate to={HOURLY_TRACK_PATH} replace />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </SessionProvider>
          </ArchiveProvider>
        </MasterDataGate>
      </MasterDataProvider>
    </SyncProvider>
  );
}

function MasterDataGate({ children }: { children: ReactNode }) {
  const { error, loading, reload } = useMasterData();

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface-900 p-6 text-center text-white">
        <h1 className="text-xl font-bold">Unable to load application data</h1>
        <p className="max-w-md text-sm text-white/60">{error}</p>
        <Button onClick={() => void reload()}>Try Again</Button>
      </div>
    );
  }

  return children;
}

function AuthGate() {
  const { employee, loading, profile, session } = useAuth();

  if (loading) return <PageLoader />;
  if (!session) return <LoginPage />;

  if (!profile || !employee || !profile.active || !employee.active) {
    return <AccountStatusPage mode="setup" />;
  }

  if (profile.role === "operator") {
    return <AccountStatusPage mode="operator" />;
  }

  return <OperationalRoutes />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AuthGate />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
