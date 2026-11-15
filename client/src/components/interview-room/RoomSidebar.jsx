
import ParticipantList from "./ParticipantList";
import VideoPanel from "./VideoPanel";
import RoomTimer from "./RoomTimer";

function RoomSidebar({
  interview,
  currentUser,

  localStream = null,
  remoteStream = null,
  remoteName = "",

  callStatus = "disconnected",
  error = "",

  micEnabled = false,
  remoteMicEnabled = false,

  remoteCameraEnabled = false,
  cameraEnabled = false,

  onToggleMic,
  onToggleCamera,
  onLeaveCall,

  participants = [],
  connected = false,
  joined = false,

  connectionQuality = "unknown",
  connectionMetrics = null,
}) {
  const durationMinutes = interview?.durationMinutes || 60;

  return (
    <aside
      className="min-w-0 space-y-6"
      aria-label="Interview room sidebar"
    >
      {/* Interview timer */}
      <RoomTimer
        durationMinutes={durationMinutes}
        status={interview?.status}
        startedAt={interview?.startedAt}
        endedAt={interview?.endedAt}
        scheduledAt={interview?.scheduledAt}
      />

      {/* Participants */}
      <section className="rounded-2xl border border-white/10 bg-[#14141d] p-4">
        <ParticipantList
          interview={interview}
          currentUser={currentUser}
          participants={participants}
          connected={connected}
          joined={joined}
        />
      </section>

      {/* Video and call controls */}
      <section className="rounded-2xl border border-white/10 bg-[#14141d] p-4">
        <VideoPanel
          interview={interview}
          currentUser={currentUser}
          localStream={localStream}
          remoteStream={remoteStream}
          remoteName={remoteName}
          callStatus={callStatus}
          error={error}
          micEnabled={micEnabled}
          cameraEnabled={cameraEnabled}
          remoteCameraEnabled={remoteCameraEnabled}
          remoteMicEnabled={remoteMicEnabled}
          onToggleMic={onToggleMic}
          onToggleCamera={onToggleCamera}
          onLeaveCall={onLeaveCall}
          connectionQuality={connectionQuality}
          connectionMetrics={connectionMetrics}
        />
      </section>
    </aside>
  );
}

export default RoomSidebar;
