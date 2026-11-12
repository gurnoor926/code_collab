
import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3 } from "lucide-react";
import toast from "react-hot-toast";

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
}

function RoomTimer({
  durationMinutes = 60,
  status,
  startedAt,
  endedAt,
  scheduledAt,
}) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const notifiedRef = useRef(false);

  const startTimestamp = startedAt
    ? new Date(startedAt).getTime()
    : null;

  const endTimestamp = endedAt
    ? new Date(endedAt).getTime()
    : null;

  const scheduledTimestamp = scheduledAt
    ? new Date(scheduledAt).getTime()
    : null;

  const durationSeconds = durationMinutes * 60;

  const remainingSeconds = useMemo(() => {
    if (status === "active" && Number.isFinite(startTimestamp)) {
      const endTime = startTimestamp + durationSeconds * 1000;

      return Math.max(0, Math.ceil((endTime - currentTime) / 1000));
    }

    if (
      status === "scheduled" &&
      Number.isFinite(scheduledTimestamp)
    ) {
      return Math.max(
        0,
        Math.ceil((scheduledTimestamp - currentTime) / 1000),
      );
    }

    if (
      status === "completed" &&
      Number.isFinite(startTimestamp) &&
      Number.isFinite(endTimestamp)
    ) {
      return Math.max(
        0,
        Math.ceil((endTimestamp - startTimestamp) / 1000),
      );
    }

    return durationSeconds;
  }, [
    status,
    startTimestamp,
    endTimestamp,
    scheduledTimestamp,
    durationSeconds,
    currentTime,
  ]);

  // Update the displayed time every second.
  useEffect(() => {
    if (!["active", "scheduled"].includes(status)) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [status, startedAt, scheduledAt]);

  // Notify when the allocated interview duration expires.
  useEffect(() => {
    if (status !== "active" || remainingSeconds > 0) {
      return;
    }

    if (!notifiedRef.current) {
      notifiedRef.current = true;
      toast.error("Interview time has expired.");
    }
  }, [status, remainingSeconds]);

  // Reset notification state for a different interview start.
  useEffect(() => {
    notifiedRef.current = false;
  }, [startedAt]);

  const isActive = status === "active";
  const isScheduled = status === "scheduled";
  const isCompleted = status === "completed";
  const isCancelled = status === "cancelled";

  const timerLabel = isActive
    ? remainingSeconds === 0
      ? "Time expired"
      : "Time remaining"
    : isScheduled
      ? scheduledTimestamp
        ? remainingSeconds === 0
          ? "Scheduled start reached"
          : "Starts in"
        : "Scheduled interview"
      : isCompleted
        ? "Interview duration"
        : isCancelled
          ? "Interview cancelled"
          : "Waiting to start";

  const isLowTime = isActive && remainingSeconds <= 300;

  const displayTime =
    isCancelled
      ? "--:--:--"
      : isActive && !Number.isFinite(startTimestamp)
        ? "Syncing..."
        : isScheduled && !Number.isFinite(scheduledTimestamp)
          ? "--:--:--"
          : formatTime(remainingSeconds);

  return (
    <div className="rounded-xl border border-white/10 bg-[#14141d] px-4 py-4">
      <div className="flex items-center gap-3">
        <div
          className={`rounded-lg p-2 ${
            isLowTime
              ? "bg-red-500/10 text-red-400"
              : "bg-indigo-500/10 text-indigo-400"
          }`}
        >
          <Clock3 size={19} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            {timerLabel}
          </p>

          <p
            className={`mt-1 font-mono text-xl font-bold tabular-nums ${
              isLowTime ? "text-red-400" : "text-white"
            }`}
          >
            {displayTime}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-zinc-500">Allocated</p>
          <p className="mt-1 text-sm font-semibold text-zinc-300">
            {durationMinutes} min
          </p>
        </div>
      </div>

      {isActive && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isLowTime ? "bg-red-500" : "bg-indigo-500"
            }`}
            style={{
              width: `${Math.min(
                100,
                Math.max(0, (remainingSeconds / durationSeconds) * 100),
              )}%`,
            }}
          />
        </div>
      )}

      {isCompleted && (
        <p className="mt-2 text-xs text-emerald-400">
          Interview completed
        </p>
      )}

      {isCancelled && (
        <p className="mt-2 text-xs text-red-400">
          This interview has been cancelled.
        </p>
      )}
    </div>
  );
}

export default RoomTimer;
