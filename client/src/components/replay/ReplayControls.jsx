import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
} from "lucide-react";

const formatTime = (ms = 0) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

function ReplayControls({
  isPlaying,
  currentTimeMs,
  totalDurationMs,
  currentEventIndex,
  totalEvents,
  currentLanguage,
  playbackSpeed,
  onPlayPause,
  onSeekTime,
  onPrevEvent,
  onNextEvent,
  onSeekRelative,
  onSpeedChange,
  onReset,
}) {
  const speeds = [0.5, 1, 1.5, 2, 4];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#12121a]/95 p-4 shadow-2xl backdrop-blur-md">
      {/* Timeline scrubber bar */}
      <div className="space-y-2">
        <div className="relative flex items-center group">
          <input
            type="range"
            min={0}
            max={totalDurationMs || 1000}
            value={currentTimeMs}
            onChange={(e) => onSeekTime(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-indigo-500 transition hover:bg-zinc-700"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 font-semibold">{formatTime(currentTimeMs)}</span>
            <span>/</span>
            <span>{formatTime(totalDurationMs)}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded bg-white/5 px-2 py-0.5 text-zinc-400">
              Event {totalEvents > 0 ? currentEventIndex + 1 : 0} of {totalEvents}
            </span>
            <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-indigo-400 uppercase font-sans font-semibold text-[11px]">
              {currentLanguage}
            </span>
          </div>
        </div>
      </div>

      {/* Main control buttons */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
        {/* Playback navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onReset}
            title="Reset to beginning"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            onClick={() => onSeekRelative(-5000)}
            title="Rewind 5 seconds"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            <Rewind size={16} />
          </button>

          <button
            type="button"
            onClick={onPrevEvent}
            disabled={currentEventIndex <= 0}
            title="Previous event"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <SkipBack size={16} />
          </button>

          <button
            type="button"
            onClick={onPlayPause}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 hover:scale-105 active:scale-95"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={onNextEvent}
            disabled={currentEventIndex >= totalEvents - 1}
            title="Next event"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <SkipForward size={16} />
          </button>

          <button
            type="button"
            onClick={() => onSeekRelative(5000)}
            title="Forward 5 seconds"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            <FastForward size={16} />
          </button>
        </div>

        {/* Speed controls */}
        <div className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-zinc-900/60 p-1">
          <span className="px-2 text-xs font-medium text-zinc-500">Speed:</span>
          {speeds.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeedChange(s)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                playbackSpeed === s
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReplayControls;
