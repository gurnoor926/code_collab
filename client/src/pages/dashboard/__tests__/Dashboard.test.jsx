import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Dashboard from "../Dashboard";

const mockUseAuth = vi.fn();

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../CandidateDashboard", () => ({
  default: () => <div data-testid="candidate-dashboard">Candidate Dashboard Component</div>,
}));

vi.mock("../InterviewerDashboard", () => ({
  default: () => <div data-testid="interviewer-dashboard">Interviewer Dashboard Component</div>,
}));

vi.mock("../../admin/AdminDashboard", () => ({
  default: () => <div data-testid="admin-dashboard">Admin Dashboard Component</div>,
}));

describe("Dashboard Role Dispatcher", () => {
  it("renders CandidateDashboard for candidate role", () => {
    mockUseAuth.mockReturnValue({ user: { role: "candidate" } });
    render(<Dashboard />);
    expect(screen.getByTestId("candidate-dashboard")).toBeInTheDocument();
  });

  it("renders InterviewerDashboard for interviewer role", () => {
    mockUseAuth.mockReturnValue({ user: { role: "interviewer" } });
    render(<Dashboard />);
    expect(screen.getByTestId("interviewer-dashboard")).toBeInTheDocument();
  });

  it("renders AdminDashboard for admin role", () => {
    mockUseAuth.mockReturnValue({ user: { role: "admin" } });
    render(<Dashboard />);
    expect(screen.getByTestId("admin-dashboard")).toBeInTheDocument();
  });
});

