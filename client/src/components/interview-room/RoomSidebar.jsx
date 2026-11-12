import ParticipantList from "./ParticipantList";
import VideoPanel from "./VideoPanel";
import RoomTimer from "./RoomTimer";

function RoomSidebar({
  interview,
  currentUser,
  localStream,
  remoteStream,
  remoteName,
  callStatus,
  error,
  micEnabled,
  remoteMicEnabled,
  remoteCameraEnabled,
  cameraEnabled,
  onToggleMic,
  onToggleCamera,
  onLeaveCall,
  participants = [],
  connected,
  joined,
  connectionQuality,
  connectionMetrics,
}) {
  return (
    <aside className="min-w-0 space-y-6">
      <RoomTimer
  durationMinutes={interview?.durationMinutes || 60}
  status={interview?.status}
  startedAt={interview?.startedAt}
  endedAt={interview?.endedAt}
  scheduledAt={interview?.scheduledAt}
/>

      <div className="rounded-2xl border border-white/10 bg-[#14141d] p-4">
        <ParticipantList
          interview={interview}
          currentUser={currentUser}
          participants={participants}
          connected={connected}
          joined={joined}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#14141d] p-4">
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
      </div>
    </aside>
  );
}

export default RoomSidebar;
