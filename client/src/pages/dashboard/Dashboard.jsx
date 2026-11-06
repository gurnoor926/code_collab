
import { useAuth } from "../../hooks/useAuth";
import CandidateDashboard from "./CandidateDashboard";
import InterviewerDashboard from "./InterviewerDashboard";
import AppLayout from "../../components/layout/AppLayout";

function Dashboard() {
  const { user } = useAuth();

  if (user?.role === "candidate") {
    return <CandidateDashboard />;
  }

  if (user?.role === "interviewer") {
    return <InterviewerDashboard />;
  }

  return (
    <AppLayout>
      <div className="rounded-xl border border-white/10 bg-[#18181f] p-8 text-center">
        <h1 className="text-xl font-semibold text-white">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Administrative controls will be implemented in a later phase.
        </p>
      </div>
    </AppLayout>
  );
}

export default Dashboard;
