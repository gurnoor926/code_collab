import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RoomTimer from "../RoomTimer";

describe("RoomTimer Component", () => {
  it("renders scheduled duration correctly when interview has not started", () => {
    render(<RoomTimer durationMinutes={45} status="scheduled" />);

    expect(screen.getByText("--:--:--")).toBeInTheDocument();
    expect(screen.getByText(/45\s*min/i)).toBeInTheDocument();
  });

  it("calculates and displays remaining time for active interview", () => {
    const startedAt = new Date(Date.now() - 15 * 60 * 1000).toISOString(); // started 15 mins ago
    render(
      <RoomTimer
        durationMinutes={60}
        status="active"
        startedAt={startedAt}
      />
    );

    // Remaining should be approximately 45 minutes (00:45:xx or 00:44:xx)
    expect(screen.getByText(/00:4[4-5]:\d\d/)).toBeInTheDocument();
  });
});
