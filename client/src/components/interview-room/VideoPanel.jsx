import { useEffect, useRef } from "react";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  PhoneOff,
  UserRound,
  Wifi,
} from "lucide-react";

function VideoTile({
  stream,
  name,
  role,
  muted = false,
  cameraEnabled,
  micEnabled,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.srcObject = stream || null;

    if (stream) {
      video.play().catch((error) => {
        console.warn("Video playback could not start:", error);
      });
    }

    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  const hasVideoTrack = stream
    ?.getVideoTracks()
    .some((track) => track.readyState === "live");

  const showVideo = hasVideoTrack && cameraEnabled;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#25253a] via-[#1b1b2b] to-[#11111b]">
      {/* Keep video mounted even when camera is disabled */}
      {hasVideoTrack && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`h-full w-full object-cover ${
            muted ? "scale-x-[-1]" : ""
          } ${showVideo ? "block" : "hidden"}`}
        />
      )}

      {/* Camera-off placeholder */}
      {!showVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-indigo-400/20 bg-indigo-500/15 text-indigo-300">
            <UserRound size={29} />
          </div>

          <p className="text-sm font-semibold text-white">{name}</p>

          <p className="mt-1 text-xs text-zinc-500">{role}</p>
        </div>
      )}

      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg border border-white/5 bg-black/60 px-3 py-1.5">
        <span className="text-xs font-medium text-white">{name}</span>
      </div>
      <div
        className={`absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${
          micEnabled
            ? "bg-black/60 text-emerald-400"
            : "bg-red-500/20 text-red-400"
        }`}
        title={micEnabled ? "Microphone on" : "Microphone muted"}
      >
        {micEnabled ? <Mic size={13} /> : <MicOff size={13} />}
        <span className="text-[10px] font-medium">
          {micEnabled ? "Mic On" : "Muted"}
        </span>
      </div>
    </div>
  );
}

function ConnectionQuality({ quality, metrics }) {
  const qualityConfig = {
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

  const config = qualityConfig[quality] || qualityConfig.unknown;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-gray-900/80 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="flex h-5 items-end gap-0.5">
          {[1, 2, 3].map((bar) => (
            <span
              key={bar}
              className={`w-1.5 rounded-sm ${
                bar <= config.bars ? config.color : "bg-gray-600"
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
          {metrics.packetLoss !== null && metrics.packetLoss !== undefined
            ? `${metrics.packetLoss}%`
            : "—"}
        </span>
      </div>
    </div>
  );
}

function VideoPanel({
  interview,
  currentUser,
  localStream,
  remoteStream,
  remoteName,
  callStatus,
  error,
  micEnabled,
  cameraEnabled,
  onToggleMic,
  onToggleCamera,
  onLeaveCall,
  remoteCameraEnabled = true,
  remoteMicEnabled = true,
  connectionQuality = "unknown",
  connectionMetrics = {},
}) {
  const currentUserId = String(currentUser?._id || currentUser?.id || "");
  const interviewerId = String(
    interview?.interviewer?._id || interview?.interviewer || "",
  );

  const isInterviewer = currentUserId === interviewerId;

  const localName =
    currentUser?.name || (isInterviewer ? "Interviewer" : "Candidate");

  const localRole = isInterviewer ? "Interviewer (You)" : "Candidate (You)";

  const otherParticipant = isInterviewer
    ? interview?.candidate
    : interview?.interviewer;

  const otherName =
    remoteName ||
    otherParticipant?.name ||
    (isInterviewer ? "Waiting for candidate" : "Waiting for interviewer");

  const statusLabels = {
    idle: "Not connected",
    waiting: "Waiting for participant",
    connecting: "Connecting...",
    connected: "Connected",
    reconnecting: "Reconnecting...",
    failed: "Connection failed",
    ended: "Call ended",
  };

  const isConnected = callStatus === "connected";

  return (
    <section className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Video Conference</h3>

          <p className="mt-1 text-xs text-zinc-500">Interview participants</p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-medium ${
            isConnected
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-amber-500/10 text-amber-400"
          }`}
        >
          <Wifi size={12} />
          {statusLabels[callStatus] || "Connecting..."}
        </span>
      </div>

      {/* Remote participant */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-400">Other participant</p>

          <span className="text-[10px] text-zinc-600">Remote</span>
        </div>

        <VideoTile
          stream={remoteStream}
          name={otherName}
          role="Interview participant"
          cameraEnabled={remoteCameraEnabled}
          micEnabled={remoteMicEnabled}
        />
        <ConnectionQuality
          quality={connectionQuality}
          metrics={connectionMetrics}
        />
      </div>

      {/* Local participant */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-400">You</p>

          <span className="text-[10px] text-emerald-400">Local preview</span>
        </div>

        <VideoTile
          stream={localStream}
          name={localName}
          role={localRole}
          muted
          cameraEnabled={cameraEnabled}
          micEnabled={micEnabled}
        />
        <ConnectionQuality
          quality={connectionQuality}
          metrics={connectionMetrics}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs leading-relaxed text-red-400">
          {error}
        </div>
      )}

      {/* Call controls */}
      <div className="rounded-xl border border-white/10 bg-[#181823] p-4">
        <p className="mb-3 text-xs font-medium text-zinc-400">Call controls</p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onToggleMic}
            disabled={!localStream}
            title={micEnabled ? "Mute microphone" : "Unmute microphone"}
            className={`rounded-xl border p-3 transition ${
              micEnabled
                ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          <button
            type="button"
            onClick={onToggleCamera}
            disabled={!localStream}
            title={cameraEnabled ? "Turn camera off" : "Turn camera on"}
            className={`rounded-xl border p-3 transition ${
              cameraEnabled
                ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {cameraEnabled ? <Camera size={18} /> : <CameraOff size={18} />}
          </button>

          <button
            type="button"
            onClick={onLeaveCall}
            disabled={!localStream && callStatus === "ended"}
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
}

export default VideoPanel;
