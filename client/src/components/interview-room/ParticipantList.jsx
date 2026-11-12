
import { Circle, UserRound } from "lucide-react";

function ParticipantCard({
  user,
  isCurrentUser = false,
  isOnline = false,
}) {
  const name = user?.name || "Waiting for participant";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#181823] p-3">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-400">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <UserRound size={19} />
        )}

        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#181823] ${
            isOnline ? "bg-emerald-400" : "bg-zinc-500"
          }`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">
          {name}

          {isCurrentUser && (
            <span className="ml-1 text-xs text-indigo-400">
              (You)
            </span>
          )}
        </p>

        <p className="mt-0.5 text-xs text-zinc-500">
          {isOnline ? "Online" : "Offline"}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <Circle
          size={8}
          fill="currentColor"
          className={
            isOnline ? "text-emerald-400" : "text-zinc-600"
          }
        />

        <span
          className={`text-[10px] ${
            isOnline ? "text-emerald-400" : "text-zinc-500"
          }`}
        >
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>
    </div>
  );
}

function ParticipantList({
  interview,
  currentUser,
  participants = [],
  connected = false,
  joined = false,
}) {
  const currentUserId = String(
    currentUser?._id || currentUser?.id || ""
  );

  const isSameUser = (person) => {
    const personId = person?._id || person?.id;

    return (
      personId &&
      currentUserId &&
      String(personId) === currentUserId
    );
  };

  const isParticipantOnline = (person) => {
    if (isSameUser(person)) {
      return connected && joined;
    }

    const personId = String(person?._id || person?.id || "");

    return participants.some(
      (participant) =>
        String(participant.userId || participant._id || participant.id) ===
        personId
    );
  };

  const interviewer = interview?.interviewer;
  const candidate = interview?.candidate;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Participants
        </h3>

        <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-zinc-400">
          2 slots
        </span>
      </div>

      <ParticipantCard
        title="Interviewer"
        user={interviewer}
        isCurrentUser={isSameUser(interviewer)}
        isOnline={Boolean(interviewer && isParticipantOnline(interviewer))}
      />

      <ParticipantCard
        title="Candidate"
        user={candidate}
        isCurrentUser={isSameUser(candidate)}
        isOnline={Boolean(candidate && isParticipantOnline(candidate))}
      />
    </section>
  );
}

export default ParticipantList;
