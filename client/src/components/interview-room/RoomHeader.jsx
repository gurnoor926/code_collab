
import { useState } from "react";
import {
  ArrowLeft,
  Circle,
  Code2,
  Copy,
  Users,
  Video,
  Check,
} from "lucide-react";

import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS = {
  scheduled: "text-blue-400",
  waiting: "text-amber-400",
  active: "text-emerald-400",
  completed: "text-zinc-400",
  cancelled: "text-red-400",
};

function RoomHeader({ interview, participantCount = 1 }) {
  const navigate = useNavigate();

  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  const roomCode = interview?.roomCode;
  const status = interview?.status || "scheduled";

  const statusColor =
    STATUS_COLORS[status] || "text-zinc-400";

  const copyRoomCode = async () => {
    if (!roomCode || copying) return;

    try {
      setCopying(true);

      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is unavailable.");
      }

      await navigator.clipboard.writeText(roomCode);

      setCopied(true);
      toast.success("Room code copied!");

      // Reset copied indicator.
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Room code copy error:", error);
      toast.error("Unable to copy room code.");
    } finally {
      setCopying(false);
    }
  };

  const displayStatus =
    status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#11111b] px-5 py-3">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/interviews")}
          aria-label="Back to interviews"
          title="Back to interviews"
          className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <ArrowLeft size={19} />
        </button>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-400">
            <Code2 size={21} />
          </div>

          <div>
            <h1 className="max-w-[220px] truncate text-sm font-semibold text-white sm:max-w-sm">
              {interview?.title || "Interview Room"}
            </h1>

            <p className="mt-0.5 text-xs text-zinc-500">
              CodeCollab Workspace
            </p>
          </div>
        </div>
      </div>

      {/* Right section */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Room code */}
        <button
          type="button"
          onClick={copyRoomCode}
          disabled={!roomCode || copying}
          aria-label={
            roomCode
              ? `Copy room code ${roomCode}`
              : "Room code unavailable"
          }
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copied ? (
            <Check size={14} className="text-emerald-400" />
          ) : (
            <Copy size={14} />
          )}

          {roomCode || "No room code"}
        </button>

        {/* Interview status */}
        <div
          className={`flex items-center gap-2 text-xs font-medium ${statusColor}`}
          role="status"
          aria-label={`Interview status: ${displayStatus}`}
        >
          <Circle size={8} fill="currentColor" />
          {displayStatus}
        </div>

        {/* Participants */}
        <div className="hidden items-center gap-2 text-xs text-zinc-400 sm:flex">
          <Users size={15} />
          {participantCount} participant(s)
        </div>

        {/* Workspace indicator */}
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
          <Video size={15} />
          Interview workspace
        </div>
      </div>
    </header>
  );
}

export default RoomHeader;
