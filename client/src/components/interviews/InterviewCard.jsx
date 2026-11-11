
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Users,
  Video,
} from "lucide-react";

const statusStyles = {
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  waiting: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  completed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

function InterviewCard({ interview, onOpen }) {
  const status = interview.status?.toLowerCase() || "scheduled";

  const statusClass =
    statusStyles[status] ||
    "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

  const formatDate = (date) => {
    if (!date) return "Not scheduled";

    return new Date(date).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="group rounded-2xl border border-white/10 bg-[#14141d] p-5 transition hover:-translate-y-0.5 hover:border-indigo-500/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-400">
            <Video size={21} />
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-semibold text-white">
              {interview.title}
            </h3>

            <p className="mt-1 text-xs text-zinc-500">
              {interview.durationMinutes || 60} minutes
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusClass}`}
        >
          {status}
        </span>
      </div>

      <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-400">
        {interview.description || "No description provided."}
      </p>

      <div className="mt-5 space-y-3 border-t border-white/5 pt-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <CalendarDays size={15} className="text-indigo-400" />
          {formatDate(interview.scheduledAt)}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Clock3 size={15} className="text-indigo-400" />
          {interview.durationMinutes || 60} minutes
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Users size={15} className="text-indigo-400" />
          {interview.candidate?.name || "Waiting for candidate"}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen(interview)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-white"
      >
        View Interview
        <ArrowUpRight
          size={16}
          className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </button>
    </div>
  );
}

export default InterviewCard;
