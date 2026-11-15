
import { memo, useEffect, useRef, useState } from "react";

import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  PhoneOff,
  UserRound,
  Wifi,
} from "lucide-react";

// Stable default values
const EMPTY_METRICS = {};

// Connection quality configuration
const QUALITY_CONFIG = {
  good: {
    label: "Good connection",
    color: "bg-green-500",
    text: "text-green-400",
    bars: 3,
  },
  fair: {
    label: "Fair connection",
    color: "bg-yellow-500",
    text: "text-yellow-400",
    bars: 2,
  },
  poor: {
    label: "Poor connection",
    color: "bg-red-500",
    text: "text-red-400",
    bars: 1,
  },
  unknown: {
    label: "Checking connection",
    color: "bg-gray-500",
    text: "text-gray-400",
    bars: 0,
  },
};

// Call status labels
const STATUS_LABELS = {
  idle: "Not connected",
  waiting: "Waiting for participant",
  connecting: "Connecting...",
  connected: "Connected",
  reconnecting: "Reconnecting...",
  failed: "Connection failed",
  ended: "Call ended",
};

// Safely retrieve a user ID.
const getUserId = (user) => {
  const id = user?._id || user?.id || user;

  if (!id) return "";

  if (typeof id === "object") {
    return String(id._id || id.id || "");
  }

  return String(id);
};

// Video tile
const VideoTile = memo(function VideoTile({
  stream,
  name,
  role,
  muted = false,
  cameraEnabled = true,
  micEnabled = true,
}) {
  const videoRef = useRef(null);

  const hasVideoTrack = Boolean(
    stream?.getVideoTracks().some(
      (track) => track.readyState === "live"
    )
  );

  const showVideo = hasVideoTrack && cameraEnabled;

  // Keep the video element mounted so a stream assigned before
  // its video track becomes available can still play correctly.
  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.srcObject = stream || null;

    if (stream && hasVideoTrack && cameraEnabled) {
      video.play().catch((error) => {
        // Autoplay interruptions are not necessarily fatal.
        if (error.name !== "AbortError") {
          console.warn("Video playback could not start:", error);
        }
      });
    }

    return () => {
      video.srcObject = null;
    };
  }, [stream, hasVideoTrack, cameraEnabled]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#25253a] via-[#1b1b2b] to-[#11111b]">
      {/* Video element remains mounted */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        aria-label={`${name} video`}
        className={`h-full w-full object-cover ${
          muted ? "scale-x-[-1]" : ""
        } ${showVideo ? "block" : "hidden"}`}
      />

      {/* Camera-off placeholder */}
      {!showVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-indigo-400/20 bg-indigo-500/15 text-indigo-300">
            <UserRound size={29} />
          </div>

          <p className="text-sm font-semibold text-white">
            {name}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {role}
          </p>
        </div>
      )}

      {/* Participant name */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg border border-white/5 bg-black/60 px-3 py-1.5">
        <span className="text-xs font-medium text-white">
          {name}
        </span>
      </div>

      {/* Microphone status */}
      <div
        className={`absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${
          micEnabled
            ? "bg-black/60 text-emerald-400"
            : "bg-red-500/20 text-red-400"
        }`}
        title={micEnabled ? "Microphone on" : "Microphone muted"}
        aria-label={micEnabled ? "Microphone on" : "Microphone muted"}
      >
        {micEnabled ? <Mic size={13} /> : <MicOff size={13} />}

        <span className="text-[10px] font-medium">
          {micEnabled ? "Mic On" : "Muted"}
        </span>
      </div>
    </div>
  );
});

// Connection quality indicator
const ConnectionQuality = memo(function ConnectionQuality({
  quality,
  metrics = EMPTY_METRICS,
}) {
  const config =
    QUALITY_CONFIG[quality] || QUALITY_CONFIG.unknown;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-gray-900/80 px-3 py-2"
      aria-label={config.label}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-5 items-end gap-0.5">
          {[1, 2, 3].map((bar) => (
            <span
              key={bar}
              className={`w-1.5 rounded-sm ${
                bar <= config.bars
                  ? config.color
                  : "bg-gray-600"
              }`}
              style={{ height: `${bar * 5 + 3}px` }}
            />
          ))}
        </div>

        <span className={`text-xs font-medium ${config.text}`}>
          {config.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
        <span>
          RTT:{" "}
          {metrics.rtt !== null && metrics.rtt !== undefined
            ? `${metrics.rtt} ms`
            : "—"}
        </span>

        <span>
          Jitter:{" "}
          {metrics.jitter !== null && metrics.jitter !== undefined
            ? `${metrics.jitter} ms`
            : "—"}
        </span>

        <span>
          Loss:{" "}
          {metrics.packetLoss !== null &&
          metrics.packetLoss !== undefined
            ? `${metrics.packetLoss}%`
            : "—"}
        </span>
      </div>
    </div>
  );
});

// Main video panel
const VideoPanel = memo(function VideoPanel({
  interview,
  currentUser,
  localStream,
  remoteStream,
  remoteName,
  callStatus = "idle",
  error,
  micEnabled = false,
  cameraEnabled = false,
  onToggleMic,
  onToggleCamera,
  onLeaveCall,
  remoteCameraEnabled = true,
  remoteMicEnabled = true,
  connectionQuality = "unknown",
  connectionMetrics = EMPTY_METRICS,
}) {
  const [leaving, setLeaving] = useState(false);

  const currentUserId = getUserId(currentUser);
  const interviewerId = getUserId(interview?.interviewer);

  const isInterviewer = currentUserId
    ? currentUserId === interviewerId
    : currentUser?.role === "interviewer";

  const localName =
    currentUser?.name ||
    (isInterviewer ? "Interviewer" : "Candidate");

  const localRole = isInterviewer
    ? "Interviewer (You)"
    : "Candidate (You)";

  const otherParticipant = isInterviewer
    ? interview?.candidate
    : interview?.interviewer;

  const otherName =
    remoteName ||
    otherParticipant?.name ||
    (isInterviewer
      ? "Waiting for candidate"
      : "Waiting for interviewer");

  const isConnected = callStatus === "connected";

  const hasAudioTrack = Boolean(
    localStream?.getAudioTracks().some(
      (track) => track.readyState === "live"
    )
  );

  const hasLocalVideoTrack = Boolean(
    localStream?.getVideoTracks().some(
      (track) => track.readyState === "live"
    )
  );

  const handleLeaveCall = async () => {
    if (leaving || callStatus === "ended") return;

    try {
      setLeaving(true);
      await onLeaveCall?.();
    } catch (leaveError) {
      console.error("Unable to leave call:", leaveError);
      setLeaving(false);
    }
  };

  return (
    <section className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Video Conference
          </h3>

          <p className="mt-1 text-xs text-zinc-500">
            Interview participants
          </p>
        </div>

        <span
          role="status"
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-medium ${
            isConnected
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-amber-500/10 text-amber-400"
          }`}
        >
          <Wifi size={12} />
          {STATUS_LABELS[callStatus] || "Connecting..."}
        </span>
      </div>

      {/* Remote participant */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-400">
            Other participant
          </p>

          <span className="text-[10px] text-zinc-600">
            Remote
          </span>
        </div>

        <VideoTile
          stream={remoteStream}
          name={otherName}
          role="Interview participant"
          cameraEnabled={remoteCameraEnabled}
          micEnabled={remoteMicEnabled}
        />
      </div>

      {/* Local participant */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-400">
            You
          </p>

          <span className="text-[10px] text-emerald-400">
            Local preview
          </span>
        </div>

        <VideoTile
          stream={localStream}
          name={localName}
          role={localRole}
          muted
          cameraEnabled={cameraEnabled}
          micEnabled={micEnabled}
        />
      </div>

      {/* Connection quality */}
      <ConnectionQuality
        quality={connectionQuality}
        metrics={connectionMetrics}
      />

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs leading-relaxed text-red-400"
        >
          {error}
        </div>
      )}

      {/* Call controls */}
      <div className="rounded-xl border border-white/10 bg-[#181823] p-4">
        <p className="mb-3 text-xs font-medium text-zinc-400">
          Call controls
        </p>

        <div className="flex items-center justify-center gap-3">
          {/* Microphone */}
          <button
            type="button"
            onClick={onToggleMic}
            disabled={!hasAudioTrack || !onToggleMic}
            aria-label={
              micEnabled ? "Mute microphone" : "Unmute microphone"
            }
            aria-pressed={micEnabled}
            title={
              micEnabled ? "Mute microphone" : "Unmute microphone"
            }
            className={`rounded-xl border p-3 transition ${
              micEnabled
                ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={onToggleCamera}
            disabled={!hasLocalVideoTrack || !onToggleCamera}
            aria-label={
              cameraEnabled ? "Turn camera off" : "Turn camera on"
            }
            aria-pressed={cameraEnabled}
            title={
              cameraEnabled ? "Turn camera off" : "Turn camera on"
            }
            className={`rounded-xl border p-3 transition ${
              cameraEnabled
                ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {cameraEnabled ? (
              <Camera size={18} />
            ) : (
              <CameraOff size={18} />
            )}
          </button>

          {/* Leave call */}
          <button
            type="button"
            onClick={handleLeaveCall}
            disabled={leaving || callStatus === "ended"}
            aria-label="Leave video call"
            title="Leave video call"
            className="rounded-xl border border-red-500/20 bg-red-600 p-3 text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PhoneOff size={18} />
          </button>
        </div>

        <p className="mt-3 text-center text-[10px] text-zinc-500">
          {micEnabled ? "Microphone on" : "Microphone muted"}
          {" · "}
          {cameraEnabled ? "Camera on" : "Camera off"}
        </p>
      </div>
    </section>
  );
});

export default VideoPanel;
