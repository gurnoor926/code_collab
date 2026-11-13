import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReplayControls from "../ReplayControls";

describe("ReplayControls", () => {
  it("renders playback time and event counts correctly", () => {
    render(
      <ReplayControls
        isPlaying={false}
        currentTimeMs={65000}
        totalDurationMs={300000}
        currentEventIndex={2}
        totalEvents={10}
        currentLanguage="javascript"
        playbackSpeed={1}
        onPlayPause={vi.fn()}
        onSeekTime={vi.fn()}
        onPrevEvent={vi.fn()}
        onNextEvent={vi.fn()}
        onSeekRelative={vi.fn()}
        onSpeedChange={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(screen.getByText("01:05")).toBeInTheDocument();
    expect(screen.getByText("05:00")).toBeInTheDocument();
    expect(screen.getByText("Event 3 of 10")).toBeInTheDocument();
    expect(screen.getByText("javascript")).toBeInTheDocument();
  });

  it("triggers onPlayPause when the play button is clicked", async () => {
    const user = userEvent.setup();
    const handlePlayPause = vi.fn();

    render(
      <ReplayControls
        isPlaying={false}
        currentTimeMs={0}
        totalDurationMs={10000}
        currentEventIndex={0}
        totalEvents={5}
        currentLanguage="python"
        playbackSpeed={1}
        onPlayPause={handlePlayPause}
        onSeekTime={vi.fn()}
        onPrevEvent={vi.fn()}
        onNextEvent={vi.fn()}
        onSeekRelative={vi.fn()}
        onSpeedChange={vi.fn()}
        onReset={vi.fn()}
      />
    );

    const playButton = screen.getByTitle("Play (Space)");
    await user.click(playButton);

    expect(handlePlayPause).toHaveBeenCalledOnce();
  });

  it("allows selecting a playback speed", async () => {
    const user = userEvent.setup();
    const handleSpeedChange = vi.fn();

    render(
      <ReplayControls
        isPlaying={false}
        currentTimeMs={0}
        totalDurationMs={10000}
        currentEventIndex={0}
        totalEvents={5}
        currentLanguage="cpp"
        playbackSpeed={1}
        onPlayPause={vi.fn()}
        onSeekTime={vi.fn()}
        onPrevEvent={vi.fn()}
        onNextEvent={vi.fn()}
        onSeekRelative={vi.fn()}
        onSpeedChange={handleSpeedChange}
        onReset={vi.fn()}
      />
    );

    const twoXButton = screen.getByRole("button", { name: "2x" });
    await user.click(twoXButton);

    expect(handleSpeedChange).toHaveBeenCalledWith(2);
  });
});

