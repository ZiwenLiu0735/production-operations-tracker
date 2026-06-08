import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { ArchiveProvider } from "./context/ArchiveContext";
import { MasterDataProvider } from "./context/MasterDataContext";
import { SessionProvider } from "./context/SessionContext";
import { SyncProvider } from "./context/SyncContext";
import { ArchiveDetailPage } from "./pages/ArchiveDetailPage";
import { ArchiveEditPage } from "./pages/ArchiveEditPage";
import { ArchiveEmployeeEditPage } from "./pages/ArchiveEmployeeEditPage";
import { ArchivePage } from "./pages/ArchivePage";
import { LiveSessionPage } from "./pages/LiveSessionPage";
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

export default function App() {
  return (
    <ErrorBoundary>
      <SyncProvider>
        <MasterDataProvider>
          <ArchiveProvider>
            <SessionProvider>
              <BrowserRouter>
                <OfflineIndicator />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path={START_SESSION_PATH} element={<StartSessionPage />} />
                    <Route path={TRIM_TRACK_LIVE_PATH} element={<LiveSessionPage />} />
                    <Route path={HOURLY_TRACK_PATH} element={<HourlyTrackPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/archive" element={<ArchivePage />} />
                    <Route path="/archive/:id" element={<ArchiveDetailPage />} />
                    <Route path="/archive/:id/edit" element={<ArchiveEditPage />} />
                    <Route
                      path="/archive/:id/employee/:employeeId"
                      element={<ArchiveEmployeeEditPage />}
                    />
                    <Route path={SUMMARY_PATH} element={<EndSessionPage />} />
                    <Route path="/session" element={<Navigate to={TRIM_TRACK_LIVE_PATH} replace />} />
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
                    <Route path="*" element={<Navigate to={START_SESSION_PATH} replace />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </SessionProvider>
          </ArchiveProvider>
        </MasterDataProvider>
      </SyncProvider>
    </ErrorBoundary>
  );
}
