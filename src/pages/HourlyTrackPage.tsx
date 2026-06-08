import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppNav } from "../components/AppNav";
import { Layout } from "../components/Layout";
import { SessionInfoHeader } from "../components/SessionInfoHeader";
import { useSession } from "../context/SessionContext";

export function HourlyTrackPage() {
  const navigate = useNavigate();
  const { session } = useSession();

  useEffect(() => {
    if (!session) {
      navigate("/", { replace: true });
      return;
    }
    if (session.workType === "trim") {
      navigate("/session", { replace: true });
      return;
    }
    if (session.endedAt) {
      navigate("/summary", { replace: true });
    }
  }, [session, navigate]);

  if (!session) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-900 text-white/50">
        Loading session…
      </div>
    );
  }

  return (
    <Layout
      title="Hourly Track"
      subtitle="Live production session"
      onBack={() => navigate("/")}
      backLabel="Setup"
      headerCenter={<SessionInfoHeader session={session} compact />}
      headerRight={<AppNav />}
    >
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          <div className="rounded-xl border border-dashed border-surface-500 bg-surface-800/40 px-4 py-10 text-center">
            <p className="text-sm font-medium text-white/70">
              {(session.workType ?? "hourly").toUpperCase()} workflow — prototype placeholder
            </p>
            <p className="mt-2 text-sm text-white/40">
              Hourly tracking UI coming soon. Use TRIM work type for the full production floor workflow.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
