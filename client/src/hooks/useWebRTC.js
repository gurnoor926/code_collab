
import { useCallback, useEffect, useRef, useState } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const MEDIA_SETTINGS_KEY = "codecollab-media-settings";
const SIGNALING_TIMEOUT = 10000;

const getSavedMediaSettings = () => {
  try {
    const saved = JSON.parse(
      localStorage.getItem(MEDIA_SETTINGS_KEY),
    );

    return {
      micEnabled: saved?.micEnabled ?? true,
      cameraEnabled: saved?.cameraEnabled ?? true,
    };
  } catch {
    return {
      micEnabled: true,
      cameraEnabled: true,
    };
  }
};

const saveMediaSettings = (settings) => {
  try {
    localStorage.setItem(
      MEDIA_SETTINGS_KEY,
      JSON.stringify(settings),
    );
  } catch (error) {
    console.error("Unable to save media preferences:", error);
  }
};

function useWebRTC({ socket, joined, interviewId }) {
  // --------------------------------------------------
  // Refs
  // --------------------------------------------------

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remotePeerIdRef = useRef(null);

  const pendingCandidatesRef = useRef([]);

  const webrtcJoinedRef = useRef(false);
  const statsIntervalRef = useRef(null);

  const mountedRef = useRef(false);
  const mediaAllowedRef = useRef(false);
  const mediaReadyRef = useRef(false);

  const mediaInitializationRef = useRef(null);
  const mediaRequestIdRef = useRef(0);

  const mediaSettingsRef = useRef(null);

  // --------------------------------------------------
  // State
  // --------------------------------------------------

  const [initialMediaSettings] = useState(getSavedMediaSettings);

  if (mediaSettingsRef.current === null) {
    mediaSettingsRef.current = initialMediaSettings;
  }

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const [remoteName, setRemoteName] = useState("");

  const [callStatus, setCallStatus] = useState("idle");
  const [error, setError] = useState("");

  const [micEnabled, setMicEnabled] = useState(
    initialMediaSettings.micEnabled,
  );

  const [cameraEnabled, setCameraEnabled] = useState(
    initialMediaSettings.cameraEnabled,
  );

  const [remoteCameraEnabled, setRemoteCameraEnabled] = useState(true);
  const [remoteMicEnabled, setRemoteMicEnabled] = useState(true);

  const [connectionQuality, setConnectionQuality] = useState("unknown");

  const [connectionMetrics, setConnectionMetrics] = useState({
    rtt: null,
    jitter: null,
    packetLoss: null,
  });

  // --------------------------------------------------
  // Local media lifecycle
  // --------------------------------------------------

  const stopLocalMedia = useCallback(() => {
    // Invalidate any pending media request.
    mediaRequestIdRef.current += 1;

    mediaAllowedRef.current = false;
    mediaReadyRef.current = false;

    mediaInitializationRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      localStreamRef.current = null;
    }

    setLocalStream(null);
  }, []);

  const ensureLocalMedia = useCallback(async () => {
    if (!mediaAllowedRef.current || !mountedRef.current) {
      return null;
    }

    // Reuse an existing stream.
    if (localStreamRef.current?.active) {
      return localStreamRef.current;
    }

    // Prevent duplicate getUserMedia requests.
    if (mediaInitializationRef.current) {
      return mediaInitializationRef.current;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Camera and microphone access requires HTTPS or localhost.",
      );
    }

    const requestId = ++mediaRequestIdRef.current;

    let requestPromise;

    requestPromise = navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: true,
      })
      .then((stream) => {
        // Do not retain streams from cancelled requests.
        if (
          !mountedRef.current ||
          !mediaAllowedRef.current ||
          requestId !== mediaRequestIdRef.current
        ) {
          stream.getTracks().forEach((track) => track.stop());
          return null;
        }

        const settings = mediaSettingsRef.current;

        stream.getAudioTracks().forEach((track) => {
          track.enabled = settings.micEnabled;
        });

        stream.getVideoTracks().forEach((track) => {
          track.enabled = settings.cameraEnabled;
        });

        localStreamRef.current = stream;
        mediaReadyRef.current = true;

        setLocalStream(stream);

        return stream;
      })
      .finally(() => {
        if (mediaInitializationRef.current === requestPromise) {
          mediaInitializationRef.current = null;
        }
      });

    mediaInitializationRef.current = requestPromise;

    return requestPromise;
  }, []);

  // Track component mount/unmount independently of socket state.
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      stopLocalMedia();
    };
  }, [stopLocalMedia]);

  // --------------------------------------------------
  // Peer connection cleanup
  // --------------------------------------------------

  const closePeerConnection = useCallback(() => {
    const peerConnection = peerConnectionRef.current;

    if (peerConnection) {
      peerConnection.ontrack = null;
      peerConnection.onicecandidate = null;
      peerConnection.onconnectionstatechange = null;
      peerConnection.oniceconnectionstatechange = null;

      peerConnection.close();

      peerConnectionRef.current = null;
    }

    pendingCandidatesRef.current = [];

    setRemoteStream(null);
  }, []);

  // --------------------------------------------------
  // Peer connection creation
  // --------------------------------------------------

  const createPeerConnection = useCallback(
    (peerId) => {
      if (peerConnectionRef.current) {
        if (
          remotePeerIdRef.current === peerId &&
          peerConnectionRef.current.connectionState !== "closed" &&
          peerConnectionRef.current.connectionState !== "failed" &&
          peerConnectionRef.current.signalingState !== "closed"
        ) {
          return peerConnectionRef.current;
        }

        closePeerConnection();
      }

      const peerConnection = new RTCPeerConnection(ICE_SERVERS);

      peerConnectionRef.current = peerConnection;
      remotePeerIdRef.current = peerId;

      // Attach existing local tracks.
      const stream = localStreamRef.current;

      if (stream) {
        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });
      }

      // Send ICE candidates.
      peerConnection.onicecandidate = (event) => {
        if (!event.candidate || !socket?.connected || !peerId) {
          return;
        }

        socket.timeout(SIGNALING_TIMEOUT).emit(
          "webrtc:ice-candidate",
          {
            peerId,
            candidate: event.candidate.toJSON(),
          },
          (timeoutError, response) => {
            if (timeoutError || !response?.success) {
              console.error(
                "ICE candidate relay failed:",
                timeoutError || response?.message,
              );
            }
          },
        );
      };

      // Receive remote media.
      peerConnection.ontrack = (event) => {
        const stream =
          event.streams?.[0] || new MediaStream([event.track]);

        setRemoteStream(stream);
        setCallStatus("connected");
        setError("");
      };

      // Monitor connection state.
      peerConnection.onconnectionstatechange = () => {
        if (peerConnectionRef.current !== peerConnection) {
          return;
        }

        const state = peerConnection.connectionState;

        console.log("WebRTC connection state:", state);

        if (state === "connected") {
          setCallStatus("connected");
          setError("");
        } else if (state === "connecting") {
          setCallStatus("connecting");
        } else if (state === "disconnected") {
          setCallStatus("reconnecting");
          setError(
            "Connection interrupted. Attempting to reconnect...",
          );
        } else if (state === "failed") {
          setCallStatus("reconnecting");
          setError(
            "Connection lost. Waiting for signaling reconnection.",
          );
        } else if (state === "closed") {
          setCallStatus("ended");
        }
      };

      return peerConnection;
    },
    [socket],
  );

  // --------------------------------------------------
  // ICE candidate handling
  // --------------------------------------------------

  const flushPendingCandidates = useCallback(async (peerConnection) => {
    if (!peerConnection.remoteDescription) {
      return;
    }

    const candidates = [...pendingCandidatesRef.current];

    pendingCandidatesRef.current = [];

    for (const candidate of candidates) {
      try {
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate),
        );
      } catch (candidateError) {
        console.error(
          "Unable to add queued ICE candidate:",
          candidateError,
        );
      }
    }
  }, []);

  // --------------------------------------------------
  // Send WebRTC offer
  // --------------------------------------------------

  const createOffer = useCallback(
    async (peerId) => {
      try {
        if (!socket?.connected) {
          throw new Error("Signaling connection is unavailable.");
        }

        const peerConnection = createPeerConnection(peerId);

        const offer = await peerConnection.createOffer();

        await peerConnection.setLocalDescription(offer);

        socket.timeout(SIGNALING_TIMEOUT).emit(
          "webrtc:offer",
          {
            peerId,
            sdp: peerConnection.localDescription,
          },
          (timeoutError, response) => {
            if (timeoutError || !response?.success) {
              setError(
                response?.message || "Unable to send call offer.",
              );

              return;
            }

            setCallStatus("connecting");
          },
        );

        setCallStatus("connecting");
      } catch (offerError) {
        console.error("WebRTC offer error:", offerError);

        setError(
          offerError.message || "Unable to start the video call.",
        );

        setCallStatus("failed");
      }
    },
    [createPeerConnection, socket],
  );

  // --------------------------------------------------
  // Handle incoming offer
  // --------------------------------------------------

  const handleOffer = useCallback(
    async (data = {}) => {
      try {
        if (!data.peerId || !data.sdp) {
          return;
        }

        if (!socket?.connected) {
          return;
        }

        remotePeerIdRef.current = data.peerId;

        const peerConnection = createPeerConnection(data.peerId);

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.sdp),
        );

        await flushPendingCandidates(peerConnection);

        const answer = await peerConnection.createAnswer();

        await peerConnection.setLocalDescription(answer);

        socket.timeout(SIGNALING_TIMEOUT).emit(
          "webrtc:answer",
          {
            peerId: data.peerId,
            sdp: peerConnection.localDescription,
          },
          (timeoutError, response) => {
            if (timeoutError || !response?.success) {
              setError(
                response?.message || "Unable to send call answer.",
              );
            }
          },
        );

        setCallStatus("connecting");
      } catch (offerError) {
        console.error("WebRTC offer handling error:", offerError);

        setError("Unable to process the incoming call.");
      }
    },
    [createPeerConnection, flushPendingCandidates, socket],
  );

  // --------------------------------------------------
  // Handle incoming answer
  // --------------------------------------------------

  const handleAnswer = useCallback(
    async (data = {}) => {
      try {
        const peerConnection = peerConnectionRef.current;

        if (!peerConnection || !data.sdp) {
          return;
        }

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.sdp),
        );

        await flushPendingCandidates(peerConnection);
      } catch (answerError) {
        console.error("WebRTC answer error:", answerError);

        setError("Unable to establish the video connection.");
      }
    },
    [flushPendingCandidates],
  );

  // --------------------------------------------------
  // Handle incoming ICE candidate
  // --------------------------------------------------

  const handleIceCandidate = useCallback(async (data = {}) => {
    try {
      if (!data.candidate) {
        return;
      }

      const peerConnection = peerConnectionRef.current;

      if (!peerConnection || !peerConnection.remoteDescription) {
        pendingCandidatesRef.current.push(data.candidate);
        return;
      }

      await peerConnection.addIceCandidate(
        new RTCIceCandidate(data.candidate),
      );
    } catch (candidateError) {
      console.error("ICE candidate error:", candidateError);
    }
  }, []);

  // --------------------------------------------------
  // Leave call
  // --------------------------------------------------

  const leaveCall = useCallback(() => {
    console.log("Leaving WebRTC call:", {
      interviewId,
      socketId: socket?.id,
      connected: socket?.connected,
      joined: webrtcJoinedRef.current,
    });

    if (socket?.connected && webrtcJoinedRef.current) {
      socket.emit("webrtc:leave", (response) => {
        console.log("WebRTC leave acknowledgement:", response);
      });
    }

    webrtcJoinedRef.current = false;

    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }

    closePeerConnection();
    stopLocalMedia();

    remotePeerIdRef.current = null;

    pendingCandidatesRef.current = [];

    setRemoteStream(null);
    setRemoteName("");

    setRemoteCameraEnabled(true);
    setRemoteMicEnabled(true);

    setCallStatus("ended");
    setError("");

    setConnectionQuality("unknown");

    setConnectionMetrics({
      rtt: null,
      jitter: null,
      packetLoss: null,
    });
  }, [
    closePeerConnection,
    stopLocalMedia,
    socket,
    interviewId,
  ]);

  // --------------------------------------------------
  // WebRTC signaling lifecycle
  // --------------------------------------------------

  useEffect(() => {
    if (!socket || !joined || !interviewId || !socket.connected) {
      return;
    }

    let cancelled = false;

    // ----------------------------------------------
    // Signaling event handlers
    // ----------------------------------------------

    const handlePeerJoined = (data = {}) => {
      if (!data.peerId) {
        return;
      }

      if (remotePeerIdRef.current && remotePeerIdRef.current !== data.peerId) {
        closePeerConnection();
      }

      remotePeerIdRef.current = data.peerId;

      setRemoteName(data.name || "Participant");

      setRemoteCameraEnabled(data.cameraEnabled !== false);
      setRemoteMicEnabled(data.micEnabled !== false);

      setCallStatus("waiting");
    };

    const handleRemoteCameraState = (data = {}) => {
      if (
        data.peerId &&
        data.peerId !== remotePeerIdRef.current
      ) {
        return;
      }

      setRemoteCameraEnabled(data.cameraEnabled !== false);
    };

    const handleRemoteMicState = (data = {}) => {
      if (
        data.peerId &&
        data.peerId !== remotePeerIdRef.current
      ) {
        return;
      }

      setRemoteMicEnabled(data.micEnabled !== false);
    };

    const handlePeerLeft = (data = {}) => {
      if (
        data.peerId &&
        data.peerId !== remotePeerIdRef.current
      ) {
        return;
      }

      closePeerConnection();

      remotePeerIdRef.current = null;

      setRemoteName("");

      setCallStatus("waiting");

      setRemoteCameraEnabled(true);
      setRemoteMicEnabled(true);

      setConnectionQuality("unknown");

      setConnectionMetrics({
        rtt: null,
        jitter: null,
        packetLoss: null,
      });
    };

    const handleSocketError = (data = {}) => {
      console.error("WebRTC socket error:", data);

      setError(data.message || "WebRTC signaling error.");
    };

    // ----------------------------------------------
    // Register listeners before joining
    // ----------------------------------------------

    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:ice-candidate", handleIceCandidate);

    socket.on("webrtc:peer-joined", handlePeerJoined);
    socket.on("webrtc:peer-left", handlePeerLeft);

    socket.on("webrtc:error", handleSocketError);

    socket.on("webrtc:camera-state", handleRemoteCameraState);
    socket.on("webrtc:mic-state", handleRemoteMicState);

    // ----------------------------------------------
    // Start call
    // ----------------------------------------------

    const startCall = async () => {
      try {
        setError("");

        // Media is acquired only when the interview room
        // has successfully joined.
        mediaAllowedRef.current = true;

        const stream = await ensureLocalMedia();

        if (cancelled || !stream) {
          return;
        }

        if (!socket.connected) {
          return;
        }

        setCallStatus("waiting");

        socket.timeout(SIGNALING_TIMEOUT).emit(
          "webrtc:join",
          {
            interviewId,
            cameraEnabled: mediaSettingsRef.current.cameraEnabled,
            micEnabled: mediaSettingsRef.current.micEnabled,
          },
          async (timeoutError, response) => {
            if (cancelled) {
              return;
            }

            if (timeoutError) {
              setError("Joining the video call timed out.");
              setCallStatus("failed");
              return;
            }

            console.log("WEBRTC JOIN RESPONSE:", {
              interviewId,
              success: response?.success,
              message: response?.message,
              peers: response?.peers,
              socketId: socket.id,
            });

            if (!response?.success) {
              setError(
                response?.message || "Unable to join video call.",
              );

              setCallStatus("failed");
              return;
            }

            webrtcJoinedRef.current = true;

            const existingPeer = response.peers?.[0];

            if (existingPeer?.peerId) {
              remotePeerIdRef.current = existingPeer.peerId;

              setRemoteName(
                existingPeer.name || "Participant",
              );

              setRemoteCameraEnabled(
                existingPeer.cameraEnabled !== false,
              );

              setRemoteMicEnabled(
                existingPeer.micEnabled !== false,
              );

              await createOffer(existingPeer.peerId);
            } else {
              setRemoteName("");

              setRemoteCameraEnabled(true);
              setRemoteMicEnabled(true);

              setCallStatus("waiting");
            }
          },
        );
      } catch (mediaError) {
        console.error("WebRTC startup error:", mediaError);

        if (!cancelled) {
          setError(
            mediaError.name === "NotAllowedError"
              ? "Camera or microphone permission was denied. Allow access in your browser settings."
              : mediaError.message ||
                  "Unable to start your camera and microphone.",
          );

          setCallStatus("failed");
        }
      }
    };

    startCall();

    // ----------------------------------------------
    // Signaling cleanup
    // ----------------------------------------------

    return () => {
      cancelled = true;

      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:ice-candidate", handleIceCandidate);

      socket.off("webrtc:peer-joined", handlePeerJoined);
      socket.off("webrtc:peer-left", handlePeerLeft);

      socket.off("webrtc:error", handleSocketError);

      socket.off("webrtc:camera-state", handleRemoteCameraState);
      socket.off("webrtc:mic-state", handleRemoteMicState);

      // Leave the signaling room when possible.
      if (socket.connected && webrtcJoinedRef.current) {
        socket.emit("webrtc:leave");
      }

      webrtcJoinedRef.current = false;

      // Stop statistics monitoring.
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }

      // Close the old peer connection.
      // IMPORTANT: Do not stop local media here.
      // The same stream is reused after socket reconnection.
      closePeerConnection();

      remotePeerIdRef.current = null;

      pendingCandidatesRef.current = [];
    };
  }, [
    socket,
    joined,
    interviewId,
    ensureLocalMedia,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    closePeerConnection,
  ]);

  // --------------------------------------------------
  // Connection quality monitoring
  // --------------------------------------------------

  useEffect(() => {
    const activeStatuses = [
      "connecting",
      "connected",
      "reconnecting",
    ];

    if (!activeStatuses.includes(callStatus)) {
      return;
    }

    let cancelled = false;

    const collectConnectionStats = async () => {
      const peerConnection = peerConnectionRef.current;

      if (
        !peerConnection ||
        peerConnection.connectionState === "closed"
      ) {
        return;
      }

      try {
        const stats = await peerConnection.getStats();

        if (cancelled) {
          return;
        }

        let rtt = null;
        let jitter = null;

        let packetsReceived = 0;
        let packetsLost = 0;

        stats.forEach((report) => {
          if (
            report.type === "candidate-pair" &&
            report.state === "succeeded" &&
            report.nominated &&
            report.currentRoundTripTime !== undefined
          ) {
            rtt = report.currentRoundTripTime * 1000;
          }

          if (
            report.type === "inbound-rtp" &&
            !report.isRemote &&
            (report.kind === "audio" || report.kind === "video")
          ) {
            if (report.jitter !== undefined) {
              jitter =
                jitter === null
                  ? report.jitter * 1000
                  : Math.max(jitter, report.jitter * 1000);
            }

            packetsReceived += report.packetsReceived || 0;
            packetsLost += report.packetsLost || 0;
          }
        });

        const totalPackets = packetsReceived + packetsLost;

        const packetLoss =
          totalPackets > 0
            ? (packetsLost / totalPackets) * 100
            : null;

        let quality = "unknown";

        if (
          rtt !== null ||
          jitter !== null ||
          packetLoss !== null
        ) {
          const poor =
            (rtt !== null && rtt > 300) ||
            (jitter !== null && jitter > 50) ||
            (packetLoss !== null && packetLoss > 5);

          const fair =
            (rtt !== null && rtt > 150) ||
            (jitter !== null && jitter > 30) ||
            (packetLoss !== null && packetLoss > 2);

          if (poor) {
            quality = "poor";
          } else if (fair) {
            quality = "fair";
          } else {
            quality = "good";
          }
        }

        setConnectionQuality(quality);

        setConnectionMetrics({
          rtt: rtt !== null ? Math.round(rtt) : null,
          jitter:
            jitter !== null ? Number(jitter.toFixed(2)) : null,
          packetLoss:
            packetLoss !== null
              ? Number(packetLoss.toFixed(2))
              : null,
        });
      } catch (statsError) {
        if (!cancelled) {
          console.error(
            "Unable to collect connection statistics:",
            statsError,
          );
        }
      }
    };

    collectConnectionStats();

    statsIntervalRef.current = setInterval(
      collectConnectionStats,
      2000,
    );

    return () => {
      cancelled = true;

      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }
    };
  }, [callStatus]);

  // --------------------------------------------------
  // Toggle microphone
  // --------------------------------------------------

  const toggleMicrophone = useCallback(() => {
    const nextEnabled = !micEnabled;

    mediaSettingsRef.current = {
      ...mediaSettingsRef.current,
      micEnabled: nextEnabled,
    };

    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });

    setMicEnabled(nextEnabled);

    saveMediaSettings(mediaSettingsRef.current);

    if (socket?.connected) {
      socket.emit("webrtc:mic-state", {
        peerId: remotePeerIdRef.current,
        micEnabled: nextEnabled,
      });
    }
  }, [micEnabled, socket]);

  // --------------------------------------------------
  // Toggle camera
  // --------------------------------------------------

  const toggleCamera = useCallback(() => {
    const nextEnabled = !cameraEnabled;

    mediaSettingsRef.current = {
      ...mediaSettingsRef.current,
      cameraEnabled: nextEnabled,
    };

    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });

    setCameraEnabled(nextEnabled);

    saveMediaSettings(mediaSettingsRef.current);

    if (socket?.connected) {
      socket.emit("webrtc:camera-state", {
        peerId: remotePeerIdRef.current,
        cameraEnabled: nextEnabled,
      });
    }
  }, [cameraEnabled, socket]);

  // --------------------------------------------------
  // Return hook values
  // --------------------------------------------------

  return {
    localStream,
    remoteStream,
    remoteName,

    callStatus,
    error,

    micEnabled,
    cameraEnabled,

    remoteCameraEnabled,
    remoteMicEnabled,

    connectionQuality,
    connectionMetrics,

    toggleMicrophone,
    toggleCamera,

    leaveCall,
  };
}

export default useWebRTC;
