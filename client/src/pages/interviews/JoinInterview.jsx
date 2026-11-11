
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  ArrowRight,
  ArrowLeft,
  Video,
  Users,
  Loader2,
  KeyRound,
} from "lucide-react";

import AppLayout from "../../components/layout/AppLayout";
import interviewService from "../../services/interviewService";
import toast from "react-hot-toast";

function JoinInterview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [roomCode, setRoomCode] = useState(
    searchParams.get("code")?.toUpperCase() || ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedCode = roomCode.trim().toUpperCase();

    if (!/^CC-[A-F0-9]{8}$/.test(normalizedCode)) {
      setError("Enter a valid invitation code, e.g. CC-A1B2C3D4.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await interviewService.joinInterview(
        normalizedCode
      );

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to join interview."
        );
      }

      toast.success("You joined the interview successfully!");

      navigate("/interviews", { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to join this interview.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex min-h-[70vh] items-center justify-center py-10">

        <div className="w-full max-w-lg">

          <button
            type="button"
            onClick={() => navigate("/interviews")}
            className="mb-6 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Interviews
          </button>

          <div className="rounded-2xl border border-white/10 bg-[#18181f] p-6 sm:p-8">

            <div className="flex flex-col items-center text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
                <Video size={30} />
              </div>

              <h1 className="mt-5 text-2xl font-bold text-white">
                Join an Interview
              </h1>

              <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">
                Enter the invitation code shared by your interviewer to
                join your technical interview.
              </p>

            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">

              <div>
                <label
                  htmlFor="roomCode"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Interview Invitation Code
                </label>

                <div className="relative">
                  <KeyRound
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                  />

                  <input
                    id="roomCode"
                    type="text"
                    value={roomCode}
                    onChange={(event) => {
                      setRoomCode(event.target.value.toUpperCase());
                      setError("");
                    }}
                    placeholder="CC-A1B2C3D4"
                    maxLength={11}
                    autoComplete="off"
                    className="w-full rounded-xl border border-white/10 bg-[#101016] py-4 pl-12 pr-4 text-center font-mono text-lg font-semibold tracking-widest text-white outline-none placeholder:text-zinc-600 focus:border-violet-500"
                  />
                </div>

                {error && (
                  <p className="mt-2 text-xs text-red-400">
                    {error}
                  </p>
                )}

              </div>

              <button
                type="submit"
                disabled={loading || !roomCode.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Joining Interview...
                  </>
                ) : (
                  <>
                    Join Interview
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

            </form>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <Users size={18} className="mt-0.5 shrink-0 text-violet-400" />

              <p className="text-xs leading-5 text-zinc-500">
                Make sure you are logged in with your candidate account.
                An interview invitation can only be assigned to one candidate.
              </p>
            </div>

          </div>

        </div>

      </div>
    </AppLayout>
  );
}

export default JoinInterview;
