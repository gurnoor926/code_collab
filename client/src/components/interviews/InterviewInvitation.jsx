
import { useMemo } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Link,
  Users,
  Video,
} from "lucide-react";
import toast from "react-hot-toast";

function InterviewInvitation({ interview, onCreateAnother }) {
  const roomCode = interview?.roomCode;

  const invitationLink = useMemo(() => {
    if (!roomCode) return "";

    return `${window.location.origin}/interviews/join?code=${encodeURIComponent(roomCode)}`;
  }, [roomCode]);

  const copyText = async (value, message) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error("Unable to copy. Please copy it manually.");
    }
  };

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-violet-500/20 bg-[#18181f] p-6 sm:p-8">

      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
          <CheckCircle2 size={32} />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-white">
          Interview Created!
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          Share the invitation with your candidate so they can join.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-white/10 bg-[#101016] p-5">

        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Video size={16} className="text-violet-400" />
          Interview
        </div>

        <h3 className="mt-2 text-lg font-semibold text-white">
          {interview?.title}
        </h3>

        <div className="mt-6 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            Candidate invitation code
          </p>

          <p className="mt-3 break-all font-mono text-3xl font-bold tracking-wider text-violet-400">
            {roomCode}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            copyText(roomCode, "Room code copied!")
          }
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          <Copy size={16} />
          Copy Room Code
        </button>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Invitation Link
        </label>

        <div className="flex gap-2">
          <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#101016] px-3 py-3">
            <p className="truncate text-xs text-zinc-400">
              {invitationLink}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              copyText(invitationLink, "Invitation link copied!")
            }
            className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-zinc-300 transition hover:border-violet-500/40 hover:text-white"
          >
            <Link size={16} />
            Copy
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <Users size={19} className="mt-0.5 shrink-0 text-blue-400" />

        <p className="text-xs leading-5 text-zinc-400">
          Ask your candidate to log in to CodeCollab using their candidate
          account and open the invitation link. Only one candidate can join
          this interview.
        </p>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onCreateAnother}
          className="flex-1 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
        >
          Create Another
        </button>

        <button
          type="button"
          onClick={() => window.location.assign("/interviews")}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          Manage Interviews
          <ArrowRight size={16} />
        </button>
      </div>

    </section>
  );
}

export default InterviewInvitation;
