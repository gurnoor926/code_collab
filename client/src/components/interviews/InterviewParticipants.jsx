
import { Mail, UserRound } from "lucide-react";

function ParticipantCard({ title, person }) {
  const name = person?.name || "Not assigned";
  const email = person?.email || "No email available";

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/70 p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-400">
          <UserRound size={20} />
        </div>

        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{name}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
            <Mail size={13} />
            <span className="truncate">{email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InterviewParticipants({ interview }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-white">
        Participants
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        <ParticipantCard
          title="Interviewer"
          person={interview.interviewer}
        />

        <ParticipantCard
          title="Candidate"
          person={interview.candidate}
        />
      </div>
    </section>
  );
}

export default InterviewParticipants;
