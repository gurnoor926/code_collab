
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Video,
} from "lucide-react";

const statItems = [
  {
    key: "total",
    label: "Total Interviews",
    icon: Video,
    description: "All your interview sessions",
    color: "text-indigo-400",
    background: "bg-indigo-500/10",
  },
  {
    key: "upcoming",
    label: "Upcoming",
    icon: CalendarDays,
    description: "Scheduled sessions",
    color: "text-blue-400",
    background: "bg-blue-500/10",
  },
  {
    key: "completed",
    label: "Completed",
    icon: CheckCircle2,
    description: "Finished sessions",
    color: "text-emerald-400",
    background: "bg-emerald-500/10",
  },
  {
    key: "active",
    label: "In Progress",
    icon: Clock3,
    description: "Active sessions",
    color: "text-amber-400",
    background: "bg-amber-500/10",
  },
];

function InterviewStats({ stats, loading }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statItems.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.key}
            className="rounded-2xl border border-white/10 bg-[#14141d] p-5 transition hover:border-indigo-500/30"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-zinc-400">{item.label}</p>

                <p className="mt-3 text-3xl font-bold text-white">
                  {loading ? (
                    <span className="inline-block h-8 w-12 animate-pulse rounded bg-white/10" />
                  ) : (
                    stats[item.key] ?? 0
                  )}
                </p>
              </div>

              <div className={`rounded-xl p-3 ${item.background}`}>
                <Icon size={21} className={item.color} />
              </div>
            </div>

            <p className="mt-3 text-xs text-zinc-500">
              {item.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default InterviewStats;
