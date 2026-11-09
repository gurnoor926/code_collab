import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/routes/ProtectedRoute";
import GuestRoute from "./components/routes/GuestRoute";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import ProblemLibrary from "./pages/problems/ProblemLibrary";
import ProblemDetail from "./pages/problems/ProblemDetail";

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
      </Route>

      {/* Example role-protected routes */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route
          path="/admin"
          element={
            <div className="min-h-screen bg-background p-8 text-white">
              Admin area
            </div>
          }
        />
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
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
