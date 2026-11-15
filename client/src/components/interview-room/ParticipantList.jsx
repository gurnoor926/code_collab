
import { memo, useMemo } from "react";
import { Circle, UserRound } from "lucide-react";

const getUserId = (user) => {
  const id = user?._id || user?.id || user?.userId;

  if (!id) return "";

  // Support populated MongoDB references.
  if (typeof id === "object") {
    return String(id._id || id.id || "");
  }

  return String(id);
};

const ParticipantCard = memo(function ParticipantCard({
  user,
  title,
  isCurrentUser = false,
  isOnline = false,
}) {
  const name = user?.name || title || "Waiting for participant";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#181823] p-3">
      {/* Avatar */}
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-500/15 text-indigo-400">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={`${name}'s avatar`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <UserRound size={19} />
        )}

        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#181823] ${
            isOnline ? "bg-emerald-400" : "bg-zinc-500"
          }`}
          aria-label={isOnline ? "Online" : "Offline"}
        />
      </div>

      {/* User details */}
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
          {title}
        </p>
      </div>

      {/* Connection status */}
      <div
        className={`flex shrink-0 items-center gap-1.5 text-[10px] ${
          isOnline ? "text-emerald-400" : "text-zinc-500"
        }`}
        role="status"
      >
        <Circle size={8} fill="currentColor" />
        {isOnline ? "Online" : "Offline"}
      </div>
    </div>
  );
});

const ParticipantList = memo(function ParticipantList({
  interview,
  currentUser,
  participants = [],
  connected = false,
  joined = false,
}) {
  const currentUserId = getUserId(currentUser);

  const onlineUserIds = useMemo(() => {
    return new Set(
      participants
        .map((participant) => getUserId(participant))
        .filter(Boolean)
    );
  }, [participants]);

  const isSameUser = (person) => {
    const personId = getUserId(person);

    return Boolean(
      personId &&
      currentUserId &&
      personId === currentUserId
    );
  };

  const isParticipantOnline = (person) => {
    if (!person || !getUserId(person)) {
      return false;
    }

    if (isSameUser(person)) {
      return connected && joined;
    }

    return onlineUserIds.has(getUserId(person));
  };

  const interviewer = interview?.interviewer;
  const candidate = interview?.candidate;

  return (
    <section className="space-y-3" aria-label="Interview participants">
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
        isOnline={isParticipantOnline(interviewer)}
      />

      <ParticipantCard
        title="Candidate"
        user={candidate}
        isCurrentUser={isSameUser(candidate)}
        isOnline={isParticipantOnline(candidate)}
      />
    </section>
  );
});

export default ParticipantList;
