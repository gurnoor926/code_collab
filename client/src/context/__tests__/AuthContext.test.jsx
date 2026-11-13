
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider } from "../AuthContext";
import { useAuth } from "../../hooks/useAuth";

vi.mock("../../services/authService", () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

import authService from "../../services/authService";

function AuthConsumer() {
  const { user, loading, isAuthenticated, login, logout } = useAuth();

  return (
    <div>
      <p data-testid="loading">{String(loading)}</p>
      <p data-testid="authenticated">{String(isAuthenticated)}</p>
      <p data-testid="user">{user?.name || "No user"}</p>

      <button
        onClick={() =>
          login({ email: "test@example.com", password: "password123" })
        }
      >
        Login
      </button>

      <button onClick={logout}>Logout</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("starts unauthenticated when no token exists", async () => {
    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("user")).toHaveTextContent("No user");
    expect(authService.getCurrentUser).not.toHaveBeenCalled();
  });

  it("restores authentication when a valid token exists", async () => {
    localStorage.setItem("token", "valid-token");

    authService.getCurrentUser.mockResolvedValue({
      user: {
        _id: "user-1",
        name: "Test Candidate",
        role: "candidate",
      },
    });

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("Test Candidate");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(authService.getCurrentUser).toHaveBeenCalledOnce();
  });

  it("removes an invalid token during initialization", async () => {
    localStorage.setItem("token", "expired-token");

    authService.getCurrentUser.mockRejectedValue(
      new Error("Unauthorized")
    );

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(localStorage.getItem("token")).toBeNull();
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
  });

  it("stores the token and user after successful login", async () => {
    authService.login.mockResolvedValue({
      token: "new-auth-token",
      user: {
        _id: "user-2",
        name: "New Candidate",
        role: "candidate",
      },
    });

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    await act(async () => {
      screen.getByRole("button", { name: "Login" }).click();
    });

    expect(localStorage.getItem("token")).toBe("new-auth-token");
    expect(screen.getByTestId("user")).toHaveTextContent("New Candidate");
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
  });

  it("clears the user and token on logout", async () => {
    localStorage.setItem("token", "valid-token");

    authService.getCurrentUser.mockResolvedValue({
      user: {
        _id: "user-1",
        name: "Test Candidate",
        role: "candidate",
      },
    });

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("Test Candidate");
    });

    await act(async () => {
      screen.getByRole("button", { name: "Logout" }).click();
    });

    expect(localStorage.getItem("token")).toBeNull();
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("user")).toHaveTextContent("No user");
  });
});
