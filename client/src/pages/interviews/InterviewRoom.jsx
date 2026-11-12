import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";

import interviewService from "../../services/interviewService";
import submissionService from "../../services/submissionService";
import { useAuth } from "../../hooks/useAuth";

import RoomHeader from "../../components/interview-room/RoomHeader";
import RoomSidebar from "../../components/interview-room/RoomSidebar";
import CollaborativeEditor from "../../components/interview-room/CollaborativeEditor";
import ExecutionPanel from "../../components/interview-room/ExecutionPanel";

import useInterviewSocket from "../../hooks/useInterviewSocket";
import useWebRTC from "../../hooks/useWebRTC";

function InterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executionResult, setExecutionResult] = useState(null);
  const [executionLoading, setExecutionLoading] = useState(false);
  const [executionError, setExecutionError] = useState("");
  const [executionMode, setExecutionMode] = useState("run");

  const fetchInterview = useCallback(async () => {
    try {
      const response = await interviewService.getInterviewById(id);

      if (!response?.success || !response?.data) {
        throw new Error(response?.message || "Unable to load interview.");
      }

      setInterview(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load interview.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInterview();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchInterview]);

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

  const handleRunCode = async ({ code, language, problemId }) => {
    try {
      setExecutionLoading(true);
      setExecutionError("");
      setExecutionResult(null);
      setExecutionMode("run");

      const response = await submissionService.runExamples({
        problemId,
        language,
        code,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Code execution failed.");
      }

      setExecutionResult(response.data);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Code execution failed.";

      setExecutionError(message);
      toast.error(message);
    } finally {
      setExecutionLoading(false);
    }
  };

  const handleSubmitCode = async ({ code, language, problemId }) => {
    try {
      setExecutionLoading(true);
      setExecutionError("");
      setExecutionResult(null);
      setExecutionMode("submit");

      const response = await submissionService.submitSolution({
        problemId,
        language,
        code,
        interviewId: id,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Submission failed.");
      }

      setExecutionResult(response.data);

      toast.success("Solution submitted successfully.");
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Submission failed.";

      setExecutionError(message);
      toast.error(message);
    } finally {
      setExecutionLoading(false);
    }
  };

  const handleLeaveCall = () => {
    leaveCall();
    navigate(`/interviews/${id}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d14]">
        <LoaderCircle size={35} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d0d14] px-5 text-center">
        <h2 className="text-xl font-semibold text-white">
          Unable to open interview room
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          Check the interview details or your access permissions.
        </p>

        <Link
          to="/interviews"
          className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white"
        >
          Back to interviews
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d0d14] text-white">
      <RoomHeader interview={interview} />

      <div className="mx-auto flex max-w-[1900px] flex-wrap items-center justify-between gap-3 px-4 pt-4 lg:px-6">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              connected ? "bg-emerald-400" : "bg-red-400"
            }`}
          />

          <span className="text-xs text-zinc-400">
            {connected ? "Socket connected" : "Connecting to server..."}
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

      {socketError && (
        <div className="mx-auto mt-3 max-w-[1900px] rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {socketError}
        </div>
      )}

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
            problems={interview?.problems || []}
          />

          <ExecutionPanel
            result={executionResult}
            loading={executionLoading}
            error={executionError}
            mode={executionMode}
          />
        </div>

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
