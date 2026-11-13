
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "../../../context/AuthContext";
import ProtectedRoute from "../ProtectedRoute";

vi.mock("../../../services/authService", () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

import authService from "../../../services/authService";

function renderProtectedRoute({ token, user, allowedRoles, initialPath = "/protected" }) {
  localStorage.clear();

  if (token) {
    localStorage.setItem("token", token);
  }

  authService.getCurrentUser.mockResolvedValue({ user });

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
            <Route path="/protected" element={<h1>Protected Content</h1>} />
          </Route>

          <Route path="/login" element={<h1>Login Page</h1>} />
          <Route path="/unauthorized" element={<h1>Unauthorized Page</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("redirects unauthenticated users to login", async () => {
    renderProtectedRoute({
      token: null,
      user: null,
    });

    expect(await screen.findByRole("heading", {
      name: "Login Page",
    })).toBeInTheDocument();
  });

  it("allows authenticated users to access protected content", async () => {
    renderProtectedRoute({
      token: "valid-token",
      user: {
        _id: "user-1",
        name: "Test Candidate",
        role: "candidate",
      },
    });

    expect(await screen.findByRole("heading", {
      name: "Protected Content",
    })).toBeInTheDocument();
  });

  it("blocks users with unauthorized roles", async () => {
    renderProtectedRoute({
      token: "valid-token",
      user: {
        _id: "user-2",
        name: "Test Candidate",
        role: "candidate",
      },
      allowedRoles: ["admin"],
    });

    expect(await screen.findByRole("heading", {
      name: "Unauthorized Page",
    })).toBeInTheDocument();
  });

  it("allows users whose roles are permitted", async () => {
    renderProtectedRoute({
      token: "valid-token",
      user: {
        _id: "user-3",
        name: "Test Interviewer",
        role: "interviewer",
      },
      allowedRoles: ["interviewer", "admin"],
    });

    expect(await screen.findByRole("heading", {
      name: "Protected Content",
    })).toBeInTheDocument();
  });
});
