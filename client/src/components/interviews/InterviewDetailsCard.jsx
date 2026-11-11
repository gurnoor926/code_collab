
import {
  CalendarDays,
  Clock3,
  Hash,
} from "lucide-react";

const statusStyles = {
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  waiting: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  completed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

function InterviewDetailsCard({ interview }) {
  const scheduledDate = interview.scheduledAt
    ? new Date(interview.scheduledAt)
    : null;

  const formattedDate =
    scheduledDate && !Number.isNaN(scheduledDate.getTime())
      ? scheduledDate.toLocaleString("en-IN", {
          dateStyle: "long",
          timeStyle: "short",
        })
      : "Not scheduled";

  const status = interview.status || "scheduled";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm text-slate-400">Interview details</p>
          <h1 className="text-2xl font-bold text-white">
            {interview.title || "Untitled Interview"}
          </h1>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
            statusStyles[status] || statusStyles.scheduled
          }`}
        >
          {status}
        </span>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-400">
        {interview.description || "No description provided."}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoItem
          icon={CalendarDays}
          label="Scheduled date"
          value={formattedDate}
        />

        <InfoItem
          icon={Clock3}
          label="Duration"
          value={`${interview.durationMinutes || 60} minutes`}
        />

        <InfoItem
          icon={Hash}
          label="Room code"
          value={interview.roomCode || "Not available"}
        />
      </div>
    </section>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
      <div className="mb-2 flex items-center gap-2 text-slate-400">
        <Icon size={16} />
        <span className="text-xs">{label}</span>
      </div>
      <p className="break-words text-sm font-medium text-white">{value}</p>
    </div>
  );
}

export default InterviewDetailsCard;
