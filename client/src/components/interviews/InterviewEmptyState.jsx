
import { CalendarDays, Plus, Video } from "lucide-react";

function InterviewEmptyState({ role }) {
  const isInterviewer = ["interviewer", "admin"].includes(role);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#14141d]/60 px-5 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
        {isInterviewer ? (
          <CalendarDays size={30} />
        ) : (
          <Video size={30} />
        )}
      </div>

      <h3 className="text-xl font-semibold text-white">
        No interviews yet
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
        {isInterviewer
          ? "Your interview sessions will appear here. Create your first interview to get started."
          : "You don't have any interview sessions yet. Once you're invited or join a session, it will appear here."}
      </p>

      <div className="mt-6 flex items-center gap-2 text-xs text-zinc-500">
        <Plus size={14} />
        <span>Interview sessions will appear here automatically.</span>
      </div>
    </div>
  );
}

export default InterviewEmptyState;
