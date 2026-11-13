import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/routes/ProtectedRoute";
import GuestRoute from "./components/routes/GuestRoute";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import ProblemLibrary from "./pages/problems/ProblemLibrary";
import ProblemDetail from "./pages/problems/ProblemDetail";
import SubmissionHistory from "./pages/submissions/SubmissionHistory";
import SubmissionDetail from "./pages/submissions/SubmissionDetail";
import InterviewDashboard from "./pages/interviews/InterviewDashboard";
import CreateInterview from "./pages/interviews/CreateInterview";
import JoinInterview from "./pages/interviews/JoinInterview";
import InterviewDetails from "./pages/interviews/InterviewDetails";
import InterviewRoom from "./pages/interviews/InterviewRoom";
import InterviewEvaluation from "./pages/interviews/InterviewEvaluation";
import CandidateScorecard from "./pages/interviews/CandidateScorecard";
import EvaluationDashboard from "./pages/dashboard/EvaluationDashboard";
import InterviewReplay from "./pages/replay/InterviewReplay";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotificationCenter from "./pages/notifications/NotificationCenter";

function App() {
  return (
    <Routes>
      {/* Public guest routes */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Authenticated routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/problems/:id" element={<ProblemDetail />} />
        <Route path="/problems" element={<ProblemLibrary />} />
        <Route path="/submissions/:id" element={<SubmissionDetail />} />
        <Route path="/submissions" element={<SubmissionHistory />} />
        <Route path="/interviews" element={<InterviewDashboard />} />
        <Route path="/interviews/:id" element={<InterviewDetails />} />
        <Route path="/interviews/:id/room" element={<InterviewRoom />} />
        <Route path="/interviews/:id/replay" element={<InterviewReplay />} />
        <Route path="/interview/:id/replay" element={<InterviewReplay />} />
        <Route path="/notifications" element={<NotificationCenter />} />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["interviewer"]} />}>
        <Route
          path="/interviewer"
          element={
            <div className="min-h-screen bg-background p-8 text-white">
              Interviewer area
            </div>
          }
        />
        <Route path="/interviews/create" element={<CreateInterview />} />
        <Route
          path="/interviews/:id/evaluation"
          element={<InterviewEvaluation />}
        />
        <Route path="/evaluations" element={<EvaluationDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["candidate"]} />}>
        <Route path="/interviews/join" element={<JoinInterview />} />
        <Route
          path="/interviews/:id/scorecard"
          element={<CandidateScorecard />}
        />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
