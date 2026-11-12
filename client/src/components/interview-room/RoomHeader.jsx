import {
  ArrowLeft,
  Circle,
  Code2,
  Copy,
  Users,
  Video,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function RoomHeader({ interview, participantCount = 1 }) {
  const navigate = useNavigate();

  const copyRoomCode = async () => {
    if (!interview?.roomCode) return;

    try {
      await navigator.clipboard.writeText(interview.roomCode);
      toast.success("Room code copied!");
    } catch {
      toast.error("Unable to copy room code.");
    }
  };

  const status = interview?.status || "scheduled";

  const statusColors = {
    scheduled: "text-blue-400",
    waiting: "text-amber-400",
    active: "text-emerald-400",
    completed: "text-zinc-400",
    cancelled: "text-red-400",
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#11111b] px-5 py-3">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/interviews")}
          className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
          title="Back to interviews"
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

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={copyRoomCode}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 hover:bg-white/10"
        >
          <Copy size={14} />
          {interview?.roomCode || "No room code"}
        </button>

        <div
          className={`flex items-center gap-2 text-xs font-medium capitalize ${
            statusColors[status] || "text-zinc-400"
          }`}
        >
          <Circle size={8} fill="currentColor" />
          {status}
        </div>

        <div className="hidden items-center gap-2 text-xs text-zinc-400 sm:flex">
          <Users size={15} />
          {participantCount} participant(s)
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
          <Video size={15} />
          Interview workspace
        </div>
      </div>
    </header>
  );
}

export default RoomHeader;