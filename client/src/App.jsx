
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/routes/ProtectedRoute";
import GuestRoute from "./components/routes/GuestRoute";

// Authentication pages
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));

// Dashboard pages
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const EvaluationDashboard = lazy(
  () => import("./pages/dashboard/EvaluationDashboard")
);
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

// Problem pages
const ProblemLibrary = lazy(
  () => import("./pages/problems/ProblemLibrary")
);
const ProblemDetail = lazy(() => import("./pages/problems/ProblemDetail"));

// Submission pages
const SubmissionHistory = lazy(
  () => import("./pages/submissions/SubmissionHistory")
);
const SubmissionDetail = lazy(
  () => import("./pages/submissions/SubmissionDetail")
);

// Interview pages
const InterviewDashboard = lazy(
  () => import("./pages/interviews/InterviewDashboard")
);
const CreateInterview = lazy(
  () => import("./pages/interviews/CreateInterview")
);
const JoinInterview = lazy(
  () => import("./pages/interviews/JoinInterview")
);
const InterviewDetails = lazy(
  () => import("./pages/interviews/InterviewDetails")
);
const InterviewRoom = lazy(
  () => import("./pages/interviews/InterviewRoom")
);
const InterviewEvaluation = lazy(
  () => import("./pages/interviews/InterviewEvaluation")
);
const CandidateScorecard = lazy(
  () => import("./pages/interviews/CandidateScorecard")
);

// Other pages
const InterviewReplay = lazy(
  () => import("./pages/replay/InterviewReplay")
);
const NotificationCenter = lazy(
  () => import("./pages/notifications/NotificationCenter")
);
const Unauthorized = lazy(() => import("./pages/Unauthorized"));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-indigo-500" />
        <p className="text-sm text-gray-400">Loading page...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
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

        {/* Interviewer routes */}
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

        {/* Candidate routes */}
        <Route element={<ProtectedRoute allowedRoles={["candidate"]} />}>
          <Route path="/interviews/join" element={<JoinInterview />} />

          <Route
            path="/interviews/:id/scorecard"
            element={<CandidateScorecard />}
          />
        </Route>

        {/* Common routes */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
