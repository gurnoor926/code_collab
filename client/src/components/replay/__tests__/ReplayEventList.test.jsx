import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReplayEventList from "../ReplayEventList";

describe("ReplayEventList Component", () => {
  const mockEvents = [
    { eventType: "interview_started", sequence: 1, elapsedMs: 0, payload: {} },
    { eventType: "code_change", sequence: 2, elapsedMs: 5000, payload: { code: "const a = 1;" } },
    { eventType: "language_change", sequence: 3, elapsedMs: 12000, payload: { language: "python" } },
  ];

  it("renders empty state message when no events are available", () => {
    render(<ReplayEventList events={[]} currentEventIndex={-1} onSelectEvent={vi.fn()} />);
    expect(screen.getByText("No events match the criteria.")).toBeInTheDocument();
  });

  it("renders event list items with timestamps", () => {
    render(
      <ReplayEventList
        events={mockEvents}
        currentEventIndex={1}
        onSelectEvent={vi.fn()}
      />
    );

    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(screen.getByText("00:05")).toBeInTheDocument();
    expect(screen.getByText("00:12")).toBeInTheDocument();
    expect(screen.getByText("Started")).toBeInTheDocument();
  });

  it("triggers onSelectEvent when an event is clicked", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <ReplayEventList
        events={mockEvents}
        currentEventIndex={0}
        onSelectEvent={handleSelect}
      />
    );

    const codeEventButton = screen.getByText("00:05").closest("button");
    await user.click(codeEventButton);

    expect(handleSelect).toHaveBeenCalledWith(1);
  });
});
