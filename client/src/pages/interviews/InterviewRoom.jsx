
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import toast from "react-hot-toast";

import interviewService from "../../services/interviewService";
import submissionService from "../../services/submissionService";
import replayService from "../../services/replayService";
import { useAuth } from "../../hooks/useAuth";

import RoomHeader from "../../components/interview-room/RoomHeader";
import RoomSidebar from "../../components/interview-room/RoomSidebar";
import CollaborativeEditor from "../../components/interview-room/CollaborativeEditor";
import ExecutionPanel from "../../components/interview-room/ExecutionPanel";

import useInterviewSocket from "../../hooks/useInterviewSocket";
import useWebRTC from "../../hooks/useWebRTC";

const EMPTY_PROBLEMS = [];

const getErrorMessage = (error, fallback) =>
  error.userMessage ||
  error.response?.data?.message ||
  error.message ||
  fallback;

function InterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const [executionResult, setExecutionResult] = useState(null);
  const [executionLoading, setExecutionLoading] = useState(false);
  const [executionError, setExecutionError] = useState("");
  const [executionMode, setExecutionMode] = useState("run");

  // Track asynchronous requests.
  const interviewRequestIdRef = useRef(0);
  const executionRequestIdRef = useRef(0);

  // Prevent duplicate replay initialization for the same interview.
  const replayStartedRef = useRef(new Set());

  // Fetch interview details.
  const fetchInterview = useCallback(async () => {
    const requestId = ++interviewRequestIdRef.current;

    try {
      setLoading(true);
      setLoadError("");
      setInterview(null);

      const response = await interviewService.getInterviewById(id);

      if (requestId !== interviewRequestIdRef.current) return;

      if (!response?.success || !response?.data) {
        throw new Error(
          response?.message || "Unable to load interview."
        );
      }

      setInterview(response.data);
    } catch (error) {
      if (requestId !== interviewRequestIdRef.current) return;

      const message = getErrorMessage(
        error,
        "Failed to load interview."
      );

      console.error("Interview loading error:", error);

      setLoadError(message);
      setInterview(null);
    } finally {
      if (requestId === interviewRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [id]);

  // Initial loading and retry.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInterview();
    }, 0);

    return () => {
      clearTimeout(timer);
      interviewRequestIdRef.current += 1;
    };
  }, [fetchInterview, retryCount]);

  // Invalidate pending code execution when the room changes or unmounts.
  useEffect(() => {
    return () => {
      executionRequestIdRef.current += 1;
    };
  }, [id]);

  // Start replay recording when an interviewer opens an active interview.
  useEffect(() => {
    if (
      interview?.status !== "active" ||
      currentUser?.role === "candidate"
    ) {
      return;
    }

    if (replayStartedRef.current.has(id)) {
      return;
    }

    replayStartedRef.current.add(id);

    replayService
      .startReplay(id, {
        initialCode: "",
        initialLanguage: "javascript",
      })
      .catch((error) => {
        replayStartedRef.current.delete(id);

        console.error("Replay initialization error:", error);
      });
  }, [interview?.status, id, currentUser?.role]);

  // Socket.IO connection.
  const {
    socket,
    connected,
    joined,
    error: socketError,
    participants,
  } = useInterviewSocket({
    interviewId: id,
    currentUser,
  });

  // WebRTC connection.
  const {
    localStream,
    remoteStream,
    remoteName,
    callStatus,
    error: webRTCError,
    micEnabled,
    cameraEnabled,
    remoteCameraEnabled,
    remoteMicEnabled,
    connectionQuality,
    connectionMetrics,
    toggleMicrophone,
    toggleCamera,
    leaveCall,
  } = useWebRTC({
    socket,
    joined,
    interviewId: id,
  });

  // Shared execution handler.
  const executeCode = useCallback(
    async (mode, { code, language, problemId }) => {
      const requestId = ++executionRequestIdRef.current;

      try {
        setExecutionLoading(true);
        setExecutionError("");
        setExecutionResult(null);
        setExecutionMode(mode);

        const payload = {
          problemId,
          language,
          code,
        };

        const response =
          mode === "run"
            ? await submissionService.runExamples(payload)
            : await submissionService.submitSolution({
                ...payload,
                interviewId: id,
              });

        // Ignore responses from older requests.
        if (requestId !== executionRequestIdRef.current) {
          return;
        }

        if (!response?.success) {
          throw new Error(
            response?.message ||
              (mode === "run"
                ? "Code execution failed."
                : "Submission failed.")
          );
        }

        setExecutionResult(response.data);

        if (mode === "submit") {
          toast.success("Solution submitted successfully.");
        }
      } catch (error) {
        if (requestId !== executionRequestIdRef.current) {
          return;
        }

        const message = getErrorMessage(
          error,
          mode === "run"
            ? "Code execution failed."
            : "Submission failed."
        );

        setExecutionError(message);
        toast.error(message);
      } finally {
        if (requestId === executionRequestIdRef.current) {
          setExecutionLoading(false);
        }
      }
    },
    [id]
  );

  // Run examples.
  const handleRunCode = useCallback(
    (payload) => executeCode("run", payload),
    [executeCode]
  );

  // Submit solution.
  const handleSubmitCode = useCallback(
    (payload) => executeCode("submit", payload),
    [executeCode]
  );

  // Leave the call and return to interview details.
  const handleLeaveCall = useCallback(() => {
    leaveCall();
    navigate(`/interviews/${id}`);
  }, [leaveCall, navigate, id]);

  // Retry interview loading.
  const handleRetry = useCallback(() => {
    setRetryCount((previous) => previous + 1);
  }, []);

  // Loading state.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d14]">
        <LoaderCircle
          size={35}
          className="animate-spin text-indigo-400"
        />
      </div>
    );
  }

  // Interview loading error.
  if (loadError || !interview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d0d14] px-5 text-center">
        <h2 className="text-xl font-semibold text-white">
          Unable to open interview room
        </h2>

        <p className="mt-2 max-w-md text-sm text-zinc-400">
          {loadError ||
            "Check the interview details or your access permissions."}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            <RefreshCw size={16} />
            Try again
          </button>

          <Link
            to="/interviews"
            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
          >
            Back to interviews
          </Link>
        </div>
      </div>
    );
  }

  const interviewProblems = interview.problems ?? EMPTY_PROBLEMS;

  return (
    <main className="min-h-screen bg-[#0d0d14] text-white">
      <RoomHeader
  interview={interview}
  participantCount={participants.length + 1}
/>

      {/* Connection status */}
      <div className="mx-auto flex max-w-[1900px] flex-wrap items-center justify-between gap-3 px-4 pt-4 lg:px-6">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              connected ? "bg-emerald-400" : "bg-red-400"
            }`}
          />

          <span className="text-xs text-zinc-400">
            {connected
              ? "Socket connected"
              : "Connecting to server..."}
          </span>

          {joined && (
            <span className="ml-2 rounded-md bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
              Joined interview
            </span>
          )}
        </div>

        <span className="text-xs text-zinc-500">
          {participants.length + 1} connected participant(s)
        </span>
      </div>

      {/* Socket error */}
      {socketError && (
        <div
          role="alert"
          className="mx-auto mt-3 max-w-[1900px] rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400"
        >
          {socketError}
        </div>
      )}

      {/* Interview workspace */}
      <div className="mx-auto grid max-w-[1900px] grid-cols-1 gap-6 p-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:p-6">
        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Coding Workspace
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Write and review solutions during your interview.
              </p>
            </div>

            <Link
              to={`/interviews/${id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft size={14} />
              Interview Details
            </Link>
          </div>

          <CollaborativeEditor
            onRun={handleRunCode}
            onSubmit={handleSubmitCode}
            socket={socket}
            joined={joined}
            currentUser={currentUser}
            interviewId={id}
            problems={interviewProblems}
          />

          <ExecutionPanel
            result={executionResult}
            loading={executionLoading}
            error={executionError}
            mode={executionMode}
          />
        </div>

        {/* Room sidebar */}
        <RoomSidebar
          interview={interview}
          currentUser={currentUser}
          localStream={localStream}
          remoteStream={remoteStream}
          remoteName={remoteName}
          callStatus={callStatus}
          error={webRTCError}
          micEnabled={micEnabled}
          cameraEnabled={cameraEnabled}
          remoteCameraEnabled={remoteCameraEnabled}
          remoteMicEnabled={remoteMicEnabled}
          onToggleMic={toggleMicrophone}
          onToggleCamera={toggleCamera}
          onLeaveCall={handleLeaveCall}
          participants={participants}
          connected={connected}
          joined={joined}
          connectionQuality={connectionQuality}
          connectionMetrics={connectionMetrics}
        />
      </div>
    </main>
  );
}

export default InterviewRoom;
