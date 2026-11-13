import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import JoinInterview from "../JoinInterview";

vi.mock("../../../services/interviewService", () => ({
  default: {
    joinInterview: vi.fn(),
  },
}));

vi.mock("../../../components/layout/AppLayout", () => ({
  default: ({ children }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import interviewService from "../../../services/interviewService";
import toast from "react-hot-toast";

function renderJoinInterview(initialEntries = ["/interviews/join"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/interviews/join" element={<JoinInterview />} />
        <Route path="/interviews" element={<h1>Interviews List Page</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("JoinInterview Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the join interview view and inputs", () => {
    renderJoinInterview();

    expect(screen.getByRole("heading", { name: /join an interview/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/interview invitation code/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join interview/i })).toBeInTheDocument();
  });

  it("shows an error when code format does not match CC-XXXXXXXX", async () => {
    const user = userEvent.setup();
    renderJoinInterview();

    const input = screen.getByLabelText(/interview invitation code/i);
    await user.type(input, "BAD-CODE");

    const submitBtn = screen.getByRole("button", { name: /join interview/i });
    await user.click(submitBtn);

    expect(screen.getByText(/enter a valid invitation code/i)).toBeInTheDocument();
    expect(interviewService.joinInterview).not.toHaveBeenCalled();
  });

  it("submits valid code and redirects to interviews page on success", async () => {
    const user = userEvent.setup();
    interviewService.joinInterview.mockResolvedValueOnce({ success: true, interviewId: "int-123" });

    renderJoinInterview();

    const input = screen.getByLabelText(/interview invitation code/i);
    await user.type(input, "CC-A1B2C3D4");

    const submitBtn = screen.getByRole("button", { name: /join interview/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(interviewService.joinInterview).toHaveBeenCalledWith("CC-A1B2C3D4");
    });

    expect(toast.success).toHaveBeenCalledWith("You joined the interview successfully!");
    expect(await screen.findByRole("heading", { name: "Interviews List Page" })).toBeInTheDocument();
  });
});

