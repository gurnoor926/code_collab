import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import Register from "../Register";

const { mockRegister, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockRegister: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<h1>Dashboard Page</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Register Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form fields and role selector options", () => {
    renderRegister();

    expect(screen.getByRole("heading", { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^candidate/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^interviewer/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("validates password confirmation match", async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/email address/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "secret123");
    await user.type(screen.getByLabelText(/confirm password/i), "mismatch456");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(mockToastError).toHaveBeenCalledWith("Passwords do not match.");
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("submits successfully and redirects to dashboard", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({
      token: "jwt-token-123",
      user: { name: "Jane Doe", role: "candidate" },
    });

    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/email address/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "secret123");
    await user.type(screen.getByLabelText(/confirm password/i), "secret123");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });

    expect(await screen.findByRole("heading", { name: "Dashboard Page" })).toBeInTheDocument();
    expect(mockToastSuccess).toHaveBeenCalledWith("Account created successfully!");
  });
});
