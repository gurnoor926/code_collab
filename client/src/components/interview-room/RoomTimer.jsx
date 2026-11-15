
import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3 } from "lucide-react";
import toast from "react-hot-toast";

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
}

function parseTimestamp(value) {
  if (!value) return null;

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp) ? timestamp : null;
}

function RoomTimer({
  durationMinutes = 60,
  status,
  startedAt,
  endedAt,
  scheduledAt,
}) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Track expiry notifications per interview start.
  const notifiedStartRef = useRef(null);

  const safeDurationMinutes =
    Number.isFinite(Number(durationMinutes)) &&
    Number(durationMinutes) > 0
      ? Number(durationMinutes)
      : 60;

  const startTimestamp = parseTimestamp(startedAt);
  const endTimestamp = parseTimestamp(endedAt);
  const scheduledTimestamp = parseTimestamp(scheduledAt);

  const durationSeconds = safeDurationMinutes * 60;

  // Update displayed time every second while scheduled or active.
  useEffect(() => {
    if (!["active", "scheduled"].includes(status)) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [status, startedAt, scheduledAt]);

  // Calculate the displayed time from absolute timestamps.
  const remainingSeconds = useMemo(() => {
    if (status === "active") {
      if (startTimestamp === null) return null;

      const endTime =
        startTimestamp + durationSeconds * 1000;

      return Math.max(
        0,
        Math.ceil((endTime - currentTime) / 1000)
      );
    }

    if (status === "scheduled") {
      if (scheduledTimestamp === null) return null;

      return Math.max(
        0,
        Math.ceil((scheduledTimestamp - currentTime) / 1000)
      );
    }

    if (status === "completed") {
      if (
        startTimestamp === null ||
        endTimestamp === null
      ) {
        return null;
      }

      return Math.max(
        0,
        Math.floor((endTimestamp - startTimestamp) / 1000)
      );
    }

    return null;
  }, [
    status,
    startTimestamp,
    endTimestamp,
    scheduledTimestamp,
    durationSeconds,
    currentTime,
  ]);

  // Notify only once for each interview start.
  useEffect(() => {
    if (
      status !== "active" ||
      startTimestamp === null ||
      remainingSeconds === null ||
      remainingSeconds > 0
    ) {
      return;
    }

    const startKey = String(startTimestamp);

    if (notifiedStartRef.current === startKey) {
      return;
    }

    notifiedStartRef.current = startKey;

    toast.error("Interview time has expired.");
  }, [status, startTimestamp, remainingSeconds]);

  const isActive = status === "active";
  const isScheduled = status === "scheduled";
  const isCompleted = status === "completed";
  const isCancelled = status === "cancelled";

  const isLowTime =
    isActive &&
    remainingSeconds !== null &&
    remainingSeconds <= 300;

  // Timer labels.
  const timerLabel = isActive
    ? remainingSeconds === null
      ? "Synchronizing timer"
      : remainingSeconds === 0
        ? "Time expired"
        : "Time remaining"
    : isScheduled
      ? scheduledTimestamp === null
        ? "Scheduled interview"
        : remainingSeconds === 0
          ? "Scheduled start reached"
          : "Starts in"
      : isCompleted
        ? "Interview duration"
        : isCancelled
          ? "Interview cancelled"
          : "Waiting to start";

  // Timer display.
  const displayTime = isCancelled
    ? "--:--:--"
    : remainingSeconds === null
      ? "--:--:--"
      : formatTime(remainingSeconds);

  // Progress percentage for active interviews.
  const progressPercentage =
    isActive && remainingSeconds !== null
      ? Math.min(
          100,
          Math.max(
            0,
            (remainingSeconds / durationSeconds) * 100
          )
        )
      : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-[#14141d] px-4 py-4">
      <div className="flex items-center gap-3">
        {/* Timer icon */}
        <div
          className={`rounded-lg p-2 ${
            isLowTime
              ? "bg-red-500/10 text-red-400"
              : "bg-indigo-500/10 text-indigo-400"
          }`}
        >
          <Clock3 size={19} />
        </div>

        {/* Timer display */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            {timerLabel}
          </p>

          <p
            role="timer"
            aria-live="off"
            className={`mt-1 font-mono text-xl font-bold tabular-nums ${
              isLowTime ? "text-red-400" : "text-white"
            }`}
          >
            {displayTime}
          </p>
        </div>

        {/* Allocated duration */}
        <div className="text-right">
          <p className="text-[10px] text-zinc-500">
            Allocated
          </p>

          <p className="mt-1 text-sm font-semibold text-zinc-300">
            {safeDurationMinutes} min
          </p>
        </div>
      </div>

      {/* Active interview progress */}
      {isActive && (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5"
          role="progressbar"
          aria-label="Interview time remaining"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercentage}
        >
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isLowTime ? "bg-red-500" : "bg-indigo-500"
            }`}
            style={{
              width: `${progressPercentage}%`,
            }}
          />
        </div>
      )}

      {/* Completed state */}
      {isCompleted && (
        <p className="mt-2 text-xs text-emerald-400">
          Interview completed
        </p>
      )}

      {/* Cancelled state */}
      {isCancelled && (
        <p className="mt-2 text-xs text-red-400">
          This interview has been cancelled.
        </p>
      )}
    </div>
  );
}

export default RoomTimer;
