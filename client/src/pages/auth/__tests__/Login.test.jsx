
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import Login from "../Login";

const { mockLogin, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

function renderLogin(initialEntries = ["/login"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<h1>Dashboard Page</h1>} />
        <Route path="/problems" element={<h1>Problems Page</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email, password and sign-in controls", () => {
    renderLogin();

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /create account/i })
    ).toHaveAttribute("href", "/register");
  });

  it("logs in successfully and navigates to dashboard", async () => {
    const user = userEvent.setup();

    mockLogin.mockResolvedValue({
      token: "test-token",
      user: { name: "Test Candidate" },
    });

    const { container } = renderLogin();

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com"
    );

    const passwordInput = container.querySelector('input[type="password"]');
    expect(passwordInput).toBeInTheDocument();

    await user.type(passwordInput, "password123");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    expect(await screen.findByRole("heading", {
      name: "Dashboard Page",
    })).toBeInTheDocument();

    expect(mockToastSuccess).toHaveBeenCalledWith("Welcome back!");
  });

  it("trims whitespace from the email before login", async () => {
    const user = userEvent.setup();

    mockLogin.mockResolvedValue({
      token: "test-token",
      user: { name: "Test Candidate" },
    });

    const { container } = renderLogin();

    await user.type(
      screen.getByLabelText(/email address/i),
      "  test@example.com  "
    );

    const passwordInput = container.querySelector('input[type="password"]');
    await user.type(passwordInput, "password123");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("shows an error when login fails", async () => {
    const user = userEvent.setup();

    mockLogin.mockRejectedValue({
      response: {
        data: {
          message: "Invalid credentials",
        },
      },
    });

    const { container } = renderLogin();

    await user.type(
      screen.getByLabelText(/email address/i),
      "wrong@example.com"
    );

    const passwordInput = container.querySelector('input[type="password"]');
    await user.type(passwordInput, "wrong-password");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Invalid credentials");
    });

    expect(screen.queryByRole("heading", {
      name: "Dashboard Page",
    })).not.toBeInTheDocument();
  });

  it("redirects to the originally requested page after login", async () => {
    const user = userEvent.setup();

    mockLogin.mockResolvedValue({
      token: "test-token",
      user: { name: "Test Candidate" },
    });

    const { container } = renderLogin([
      {
        pathname: "/login",
        state: {
          from: {
            pathname: "/problems",
          },
        },
      },
    ]);

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com"
    );

    const passwordInput = container.querySelector('input[type="password"]');
    await user.type(passwordInput, "password123");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("heading", {
      name: "Problems Page",
    })).toBeInTheDocument();
  });
});
