import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  ArrowLeft,
  Clock,
  Film,
  LoaderCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import interviewService from "../../services/interviewService";
import replayService from "../../services/replayService";
import submissionService from "../../services/submissionService";

import ReplayControls from "../../components/replay/ReplayControls";
import ReplayEventList from "../../components/replay/ReplayEventList";
import ReplaySubmissionsTab from "../../components/replay/ReplaySubmissionsTab";

function InterviewReplay() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState(null);
  const [replaySession, setReplaySession] = useState(null);
  const [rawEvents, setRawEvents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState("events"); // "events" | "submissions" | "info"

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [editorTheme, setEditorTheme] = useState("vs-dark");

  const playTimerRef = useRef(null);
  const editorRef = useRef(null);

  // Fetch all replay events (including paginated pages if needed)
  const fetchAllEvents = useCallback(async () => {
    try {
      let allEvents = [];
      let afterSequence = 0;
      let hasMore = true;
      let sessionData = null;

      while (hasMore) {
        const res = await replayService.getReplayEvents(id, {
          afterSequence,
          limit: 500,
        });

        if (res?.success && res.data) {
          sessionData = res.data.session;
          const events = res.data.events || [];
          allEvents = [...allEvents, ...events];
          hasMore = res.data.hasMore && events.length > 0;
          afterSequence = res.data.nextAfterSequence;
        } else {
          hasMore = false;
        }
      }

      setReplaySession(sessionData);
      setRawEvents(allEvents);
    } catch (error) {
      console.warn("Replay events fetch notice:", error.message);
      // If 404 or empty, rawEvents stays empty
      setRawEvents([]);
    }
  }, [id]);

  // Load interview details & submissions
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [interviewRes, submissionsRes] = await Promise.allSettled([
          interviewService.getInterviewById(id),
          submissionService.getInterviewSubmissions(id),
        ]);

        if (!mounted) return;

        if (interviewRes.status === "fulfilled" && interviewRes.value?.data) {
          setInterview(interviewRes.value.data);
        }

        if (submissionsRes.status === "fulfilled" && submissionsRes.value?.data) {
          setSubmissions(submissionsRes.value.data);
        }

        await fetchAllEvents();
      } catch {
        if (mounted) {
          toast.error("Failed to load interview replay data.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [id, fetchAllEvents]);

  // Total duration in ms
  const totalDurationMs = useMemo(() => {
    if (rawEvents.length === 0) return 0;
    const lastEvent = rawEvents[rawEvents.length - 1];
    return Math.max(1000, lastEvent.elapsedMs || 0);
  }, [rawEvents]);

  // Pre-calculate reconstructed states for all events
  const reconstructedStates = useMemo(() => {
    const states = [];
    let runningCode = replaySession?.initialCode || "";
    let runningLanguage = replaySession?.initialLanguage || "javascript";

    for (let index = 0; index < rawEvents.length; index++) {
      const ev = rawEvents[index];
      if (ev.eventType === "code_change" && ev.payload?.code !== undefined) {
        runningCode = ev.payload.code;
        if (ev.payload.language) runningLanguage = ev.payload.language;
      } else if (
        ev.eventType === "language_change" &&
        ev.payload?.language
      ) {
        runningLanguage = ev.payload.language;
      } else if (ev.eventType === "snapshot" && ev.payload) {
        if (ev.payload.code !== undefined) runningCode = ev.payload.code;
        if (ev.payload.language) runningLanguage = ev.payload.language;
      }

      states.push({
        event: ev,
        originalIndex: index,
        elapsedMs: ev.elapsedMs || 0,
        code: runningCode,
        language: runningLanguage,
      });
    }

    return states;
  }, [rawEvents, replaySession]);

  // Find the event corresponding to currentTimeMs
  const currentEventIndex = useMemo(() => {
    if (reconstructedStates.length === 0) return -1;
    let idx = 0;
    for (let i = 0; i < reconstructedStates.length; i++) {
      if (reconstructedStates[i].elapsedMs <= currentTimeMs) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [reconstructedStates, currentTimeMs]);

  // Current code and language to display
  const currentDisplayState = useMemo(() => {
    if (currentEventIndex < 0 || !reconstructedStates[currentEventIndex]) {
      return {
        code: replaySession?.initialCode || "// No code changes recorded in this session.",
        language: replaySession?.initialLanguage || "javascript",
      };
    }
    return reconstructedStates[currentEventIndex];
  }, [currentEventIndex, reconstructedStates, replaySession]);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      return;
    }

    const intervalStep = 100; // updates every 100ms
    playTimerRef.current = setInterval(() => {
      setCurrentTimeMs((prev) => {
        const nextTime = prev + intervalStep * playbackSpeed;
        if (nextTime >= totalDurationMs) {
          setIsPlaying(false);
          return totalDurationMs;
        }
        return nextTime;
      });
    }, intervalStep);

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, playbackSpeed, totalDurationMs]);

  // Handle Play / Pause toggle
  const handlePlayPause = () => {
    if (currentTimeMs >= totalDurationMs) {
      setCurrentTimeMs(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  // Seek to specific time
  const handleSeekTime = (timeMs) => {
    const clamped = Math.max(0, Math.min(timeMs, totalDurationMs));
    setCurrentTimeMs(clamped);
  };

  // Seek relative
  const handleSeekRelative = (deltaMs) => {
    handleSeekTime(currentTimeMs + deltaMs);
  };

  // Jump to specific event
  const handleSelectEvent = (eventIndex) => {
    if (reconstructedStates[eventIndex]) {
      setCurrentTimeMs(reconstructedStates[eventIndex].elapsedMs);
    }
  };

  // Previous Event
  const handlePrevEvent = () => {
    if (currentEventIndex > 0) {
      handleSelectEvent(currentEventIndex - 1);
    }
  };

  // Next Event
  const handleNextEvent = () => {
    if (currentEventIndex < reconstructedStates.length - 1) {
      handleSelectEvent(currentEventIndex + 1);
    }
  };

  // Reset to beginning
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTimeMs(0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handleSeekRelative(-5000);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleSeekRelative(5000);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a10]">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle size={38} className="animate-spin text-indigo-500" />
          <p className="text-sm font-medium text-zinc-400">Loading interview replay...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#0b0b12] text-white">
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0e0e17]/95 backdrop-blur-xl px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1900px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/interviews/${id}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Film size={14} />
                </div>
                <h1 className="font-semibold text-white">
                  {interview?.title || "Session Replay"}
                </h1>
                {interview?.roomCode && (
                  <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-zinc-400">
                    {interview.roomCode}
                  </span>
                )}
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                  Recorded Session
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                {interview?.interviewer && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-zinc-500">Interviewer:</span>
                    <strong className="text-zinc-300 font-medium">
                      {interview.interviewer.name}
                    </strong>
                  </span>
                )}
                {interview?.candidate && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-zinc-500">Candidate:</span>
                    <strong className="text-zinc-300 font-medium">
                      {interview.candidate.name}
                    </strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick info badges */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/5 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400">
              <Clock size={14} className="text-indigo-400" />
              <span>
                {rawEvents.length} Events Recorded
              </span>
            </div>

            <select
              value={editorTheme}
              onChange={(e) => setEditorTheme(e.target.value)}
              className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="vs-dark">Dark Theme</option>
              <option value="light">Light Theme</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main replay workspace */}
      <div className="mx-auto flex flex-1 w-full max-w-[1900px] flex-col p-4 sm:p-6 gap-4">
        {rawEvents.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#12121a] p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4">
              <Film size={32} />
            </div>
            <h2 className="text-xl font-bold text-white">
              No Replay Events Available
            </h2>
            <p className="mt-2 max-w-md text-sm text-zinc-400">
              No keystroke or editor events were captured during this interview session, or recording was not initialized.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                to={`/interviews/${id}`}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition"
              >
                Back to Interview
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
            {/* Editor Container */}
            <div className="flex min-h-[500px] flex-col rounded-2xl border border-white/10 bg-[#12121a] overflow-hidden shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 bg-zinc-900/60 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-400" />
                  <span className="text-xs font-semibold uppercase text-zinc-300">
                    Reconstructed Code Viewer
                  </span>
                  <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-400 uppercase">
                    {currentDisplayState.language}
                  </span>
                </div>

                <div className="text-xs text-zinc-500">
                  Read-Only Mode
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <Editor
                  height="100%"
                  language={currentDisplayState.language}
                  value={currentDisplayState.code}
                  theme={editorTheme}
                  options={{
                    readOnly: true,
                    domReadOnly: true,
                    minimap: { enabled: true },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    renderLineHighlight: "all",
                    wordWrap: "on",
                  }}
                  onMount={(editor) => {
                    editorRef.current = editor;
                  }}
                />
              </div>
            </div>

            {/* Right Side Panel: Events, Submissions, Details */}
            <div className="flex min-h-[500px] flex-col rounded-2xl border border-white/10 bg-[#12121a] overflow-hidden shadow-xl">
              {/* Tab Navigation */}
              <div className="flex border-b border-white/5 bg-zinc-900/60 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("events")}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
                    activeTab === "events"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Events ({rawEvents.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("submissions")}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
                    activeTab === "submissions"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Submissions ({submissions.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("info")}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
                    activeTab === "info"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Session Info
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {activeTab === "events" && (
                  <ReplayEventList
                    events={reconstructedStates.map((s) => ({
                      ...s.event,
                      originalIndex: s.originalIndex,
                    }))}
                    currentEventIndex={currentEventIndex}
                    onSelectEvent={handleSelectEvent}
                  />
                )}

                {activeTab === "submissions" && (
                  <ReplaySubmissionsTab
                    submissions={submissions}
                    onSelectCode={(code) => {
                      // Optionally preview submitted code
                      if (editorRef.current) {
                        editorRef.current.setValue(code);
                      }
                      toast.success("Loaded submission code in viewer.");
                    }}
                  />
                )}

                {activeTab === "info" && (
                  <div className="p-5 space-y-4 text-xs overflow-y-auto">
                    <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-4 space-y-3">
                      <h4 className="font-semibold text-white text-sm">Session Statistics</h4>
                      <div className="grid grid-cols-2 gap-3 text-zinc-400">
                        <div>
                          <p className="text-[11px] text-zinc-500">Total Duration</p>
                          <p className="font-mono text-zinc-200 mt-0.5">
                            {Math.round(totalDurationMs / 1000)} seconds
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-zinc-500">Total Keystroke Events</p>
                          <p className="font-mono text-zinc-200 mt-0.5">{rawEvents.length}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-zinc-500">Initial Language</p>
                          <p className="capitalize text-zinc-200 mt-0.5">
                            {replaySession?.initialLanguage || "javascript"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-zinc-500">Status</p>
                          <p className="capitalize text-emerald-400 mt-0.5">
                            {replaySession?.status || "Completed"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-4 space-y-3">
                      <h4 className="font-semibold text-white text-sm">Keyboard Shortcuts</h4>
                      <div className="space-y-2 text-zinc-400">
                        <div className="flex items-center justify-between">
                          <span>Play / Pause</span>
                          <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] text-zinc-200">Space</kbd>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Rewind 5s</span>
                          <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] text-zinc-200">← Left</kbd>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Forward 5s</span>
                          <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] text-zinc-200">→ Right</kbd>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom player controls bar */}
        {rawEvents.length > 0 && (
          <ReplayControls
            isPlaying={isPlaying}
            currentTimeMs={currentTimeMs}
            totalDurationMs={totalDurationMs}
            currentEventIndex={currentEventIndex}
            totalEvents={rawEvents.length}
            currentLanguage={currentDisplayState.language}
            playbackSpeed={playbackSpeed}
            onPlayPause={handlePlayPause}
            onSeekTime={handleSeekTime}
            onPrevEvent={handlePrevEvent}
            onNextEvent={handleNextEvent}
            onSeekRelative={handleSeekRelative}
            onSpeedChange={setPlaybackSpeed}
            onReset={handleReset}
          />
        )}
      </div>
    </main>
  );
}

export default InterviewReplay;
