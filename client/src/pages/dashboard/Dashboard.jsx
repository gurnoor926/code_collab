
import { useAuth } from "../../hooks/useAuth";
import CandidateDashboard from "./CandidateDashboard";
import InterviewerDashboard from "./InterviewerDashboard";
import AdminDashboard from "../admin/AdminDashboard";

function Dashboard() {
  const { user } = useAuth();

  if (user?.role === "candidate") {
    return <CandidateDashboard />;
  }

  if (user?.role === "interviewer") {
    return <InterviewerDashboard />;
  }

  if (user?.role === "admin") {
    return <AdminDashboard />;
  }

  return <AdminDashboard />;
}

export default Dashboard;
