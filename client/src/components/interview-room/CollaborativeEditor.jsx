
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
} from "react";

import {
  Code2,
  Play,
  Settings2,
  LoaderCircle,
} from "lucide-react";

import toast from "react-hot-toast";

import problemService from "../../services/problemService";
import replayService from "../../services/replayService";

const Editor = lazy(() => import("@monaco-editor/react"));

const LANGUAGES = [
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "C++", value: "cpp" },
];

const EMPTY_PROBLEMS = [];

const DEFAULT_STARTER_CODE = {
  javascript: `// Welcome to CodeCollab

function solution() {
  // Write your solution here
}

solution();`,

  python: `# Welcome to CodeCollab

def solution():
    # Write your solution here
    pass

solution()`,

  java: `// Welcome to CodeCollab

public class Main {
    public static void main(String[] args) {
        // Write your solution here
    }
}`,

  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your solution here

    return 0;
}`,
};

const EDITOR_OPTIONS = {
  readOnly: false,
  domReadOnly: false,
  minimap: { enabled: false },
  fontSize: 14,
  fontFamily: "Consolas, 'Courier New', monospace",
  wordWrap: "on",
  automaticLayout: true,
  scrollBeyondLastLine: false,
  padding: {
    top: 18,
    bottom: 18,
  },
  smoothScrolling: true,
  cursorBlinking: "smooth",
  renderLineHighlight: "all",
  lineNumbers: "on",
  glyphMargin: true,
  tabSize: 2,
  insertSpaces: true,
  folding: true,
  scrollbar: {
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8,
  },
};

// Extract a problem ID from supported response structures.
const getProblemId = (problem) => {
  if (typeof problem === "string") {
    return problem;
  }

  return String(problem?._id || problem?.id || "");
};

// Extract starter code for the selected language.
const getProblemStarterCode = (problem, language) => {
  if (!problem) {
    return DEFAULT_STARTER_CODE[language] || "";
  }

  const starterCode =
    problem.starterCode ||
    problem.starterCodes ||
    problem.codeTemplates ||
    problem.templates;

  if (typeof starterCode === "string") {
    return starterCode;
  }

  if (starterCode && typeof starterCode === "object") {
    const languageCode =
      starterCode[language] ||
      starterCode[language === "cpp" ? "c++" : language];

    if (typeof languageCode === "string") {
      return languageCode;
    }

    if (typeof languageCode?.code === "string") {
      return languageCode.code;
    }

    if (typeof languageCode?.template === "string") {
      return languageCode.template;
    }
  }

  return DEFAULT_STARTER_CODE[language] || "";
};

// Extract the actual problem object from API responses.
const extractProblemDetails = (response) => {
  const data = response?.data;

  return (
    data?.problem ||
    data?.data ||
    data ||
    response?.problem ||
    response
  );
};

function CollaborativeEditor({
  onRun,
  onSubmit,
  socket,
  joined,
  currentUser,
  interviewId,
  problems = EMPTY_PROBLEMS,
}) {
  // Monaco editor reference.
  const editorRef = useRef(null);

  // Latest props for event handlers.
  const socketRef = useRef(socket);
  const joinedRef = useRef(joined);
  const interviewIdRef = useRef(interviewId);
  const languageRef = useRef("javascript");

  // Synchronization references.
  const suppressRemoteChangeRef = useRef(false);
  const remoteDecorationsRef = useRef([]);
  const cursorListenerRef = useRef(null);
  const cursorEmitTimerRef = useRef(null);

  // Replay references.
  const replayDebounceRef = useRef(null);
  const changeCountRef = useRef(0);

  // Problem request protection.
  const problemRequestIdRef = useRef(0);

  // Component state.
  const [language, setLanguage] = useState("javascript");

  const [code, setCode] = useState(
    DEFAULT_STARTER_CODE.javascript
  );

  const [selectedProblemId, setSelectedProblemId] = useState(
    () => getProblemId(problems[0])
  );

  const [problemDetails, setProblemDetails] = useState(null);
  const [problemLoading, setProblemLoading] = useState(false);

  const userId = String(
    currentUser?._id || currentUser?.id || ""
  );

  // --------------------------------------------------
  // Keep latest props available to socket callbacks.
  // --------------------------------------------------

  useEffect(() => {
    socketRef.current = socket;
    joinedRef.current = joined;
    interviewIdRef.current = interviewId;
    languageRef.current = language;
  }, [socket, joined, interviewId, language]);

  // --------------------------------------------------
  // Keep selected problem valid when interview data changes.
  // --------------------------------------------------

  useEffect(() => {
  const timer = setTimeout(() => {
    if (problems.length === 0) {
      setSelectedProblemId("");
      setProblemDetails(null);
      setProblemLoading(false);
      setCode(DEFAULT_STARTER_CODE[languageRef.current]);
      return;
    }

    setSelectedProblemId((current) => {
      const currentExists = problems.some(
        (problem) => getProblemId(problem) === current
      );

      return currentExists
        ? current
        : getProblemId(problems[0]);
    });
  }, 0);

  return () => clearTimeout(timer);
}, [problems]);

  // --------------------------------------------------
  // Fetch full problem details.
  // --------------------------------------------------

  useEffect(() => {
    const requestId = ++problemRequestIdRef.current;

    if (!selectedProblemId) {
  const timer = setTimeout(() => {
    setProblemDetails(null);
    setProblemLoading(false);
  }, 0);

  return () => clearTimeout(timer);
}

    let cancelled = false;

    const fetchProblemDetails = async () => {
      setProblemLoading(true);
      setProblemDetails(null);

      try {
        const response =
          await problemService.getProblemById(selectedProblemId);

        if (
          cancelled ||
          requestId !== problemRequestIdRef.current
        ) {
          return;
        }

        if (response?.success === false) {
          throw new Error(
            response.message || "Unable to load problem details."
          );
        }

        const details = extractProblemDetails(response);

        if (!details || typeof details !== "object") {
          throw new Error("Invalid problem response.");
        }

        setProblemDetails(details);

        const starter = getProblemStarterCode(
          details,
          languageRef.current
        );

        setCode(starter);
      } catch (error) {
        if (
          cancelled ||
          requestId !== problemRequestIdRef.current
        ) {
          return;
        }

        console.error("Failed to fetch problem details:", error);

        setProblemDetails(null);
        setCode(DEFAULT_STARTER_CODE[languageRef.current]);

        toast.error(
          error.userMessage ||
            error.response?.data?.message ||
            error.message ||
            "Unable to load problem details."
        );
      } finally {
        if (
          !cancelled &&
          requestId === problemRequestIdRef.current
        ) {
          setProblemLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchProblemDetails, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedProblemId]);

  // --------------------------------------------------
  // Receive remote collaborative updates.
  // --------------------------------------------------

  useEffect(() => {
    if (!socket || !joined) {
      return;
    }

    const handleRemoteCode = (data = {}) => {
      if (
        data.updatedBy &&
        String(data.updatedBy) === userId
      ) {
        return;
      }

      if (typeof data.code !== "string") {
        return;
      }

      suppressRemoteChangeRef.current = true;

      setCode(data.code);

      if (editorRef.current) {
        editorRef.current.setValue(data.code);
      }

      // Monaco fires its content-change event synchronously.
      // Release suppression after the update has been processed.
      queueMicrotask(() => {
        suppressRemoteChangeRef.current = false;
      });
    };

    const handleRemoteLanguage = (data = {}) => {
      if (
        data.updatedBy &&
        String(data.updatedBy) === userId
      ) {
        return;
      }

      const validLanguage = LANGUAGES.some(
        (item) => item.value === data.language
      );

      if (!validLanguage) {
        return;
      }

      setLanguage(data.language);
    };

    const handleRemoteCursor = (data = {}) => {
      if (String(data.userId) === userId) {
        return;
      }

      if (!editorRef.current || !data.position) {
        return;
      }

      const editor = editorRef.current;
      const model = editor.getModel();

      if (!model) {
        return;
      }

      const { lineNumber, column } = data.position;

      if (
        !Number.isInteger(lineNumber) ||
        !Number.isInteger(column) ||
        lineNumber < 1 ||
        lineNumber > model.getLineCount() ||
        column < 1
      ) {
        return;
      }

      const safeColumn = Math.min(
        column,
        model.getLineMaxColumn(lineNumber)
      );

      remoteDecorationsRef.current = editor.deltaDecorations(
        remoteDecorationsRef.current,
        [
          {
            range: {
              startLineNumber: lineNumber,
              startColumn: safeColumn,
              endLineNumber: lineNumber,
              endColumn: safeColumn,
            },
            options: {
              className: "remote-cursor-decoration",
              hoverMessage: {
                value: `${data.name || "Participant"}'s cursor`,
              },
              overviewRuler: {
                color: "#a78bfa",
                position: 2,
              },
            },
          },
        ]
      );
    };

    socket.on("editor:change", handleRemoteCode);
    socket.on("editor:language", handleRemoteLanguage);
    socket.on("editor:cursor", handleRemoteCursor);

    return () => {
      socket.off("editor:change", handleRemoteCode);
      socket.off("editor:language", handleRemoteLanguage);
      socket.off("editor:cursor", handleRemoteCursor);

      if (editorRef.current) {
        remoteDecorationsRef.current =
          editorRef.current.deltaDecorations(
            remoteDecorationsRef.current,
            []
          );
      }
    };
  }, [socket, joined, userId]);

  // --------------------------------------------------
  // Monaco editor initialization.
  // --------------------------------------------------

  const handleEditorMount = useCallback((editor) => {
    editorRef.current = editor;

    editor.focus();

    cursorListenerRef.current?.dispose();

    cursorListenerRef.current =
      editor.onDidChangeCursorPosition((event) => {
        // Throttle cursor updates.
        if (cursorEmitTimerRef.current) {
          return;
        }

        const position = {
          lineNumber: event.position.lineNumber,
          column: event.position.column,
        };

        cursorEmitTimerRef.current = setTimeout(() => {
          cursorEmitTimerRef.current = null;

          const activeSocket = socketRef.current;
          const activeInterviewId = interviewIdRef.current;

          if (
            !activeSocket ||
            !joinedRef.current ||
            !activeSocket.connected ||
            !activeInterviewId
          ) {
            return;
          }

          activeSocket.emit("editor:cursor", {
            interviewId: activeInterviewId,
            position,
          });
        }, 50);
      });
  }, []);

  // --------------------------------------------------
  // Synchronize local code changes.
  // --------------------------------------------------

  const handleCodeChange = useCallback(
    (value) => {
      const nextCode = value ?? "";

      setCode(nextCode);

      // Don't broadcast changes received from another participant.
      if (suppressRemoteChangeRef.current) {
        return;
      }

      const activeSocket = socketRef.current;
      const activeInterviewId = interviewIdRef.current;
      const activeLanguage = languageRef.current;

      if (
        activeSocket &&
        joinedRef.current &&
        activeSocket.connected &&
        activeInterviewId
      ) {
        activeSocket.emit(
          "editor:change",
          {
            interviewId: activeInterviewId,
            code: nextCode,
            language: activeLanguage,
          },
          (response) => {
            if (response && !response.success) {
              console.error(
                "Code synchronization failed:",
                response.message
              );
            }
          }
        );
      }

      // Debounced replay recording.
      if (replayDebounceRef.current) {
        clearTimeout(replayDebounceRef.current);
      }

      if (!activeInterviewId) {
        return;
      }

      replayDebounceRef.current = setTimeout(() => {
        changeCountRef.current += 1;

        const replayPayload = {
          code: nextCode,
          language: activeLanguage,
        };

        if (changeCountRef.current % 25 === 0) {
          replayService
            .createSnapshot(activeInterviewId, replayPayload)
            .catch((error) => {
              console.error("Replay snapshot failed:", error);
            });
        } else {
          replayService
            .recordCodeChange(activeInterviewId, replayPayload)
            .catch((error) => {
              console.error("Replay recording failed:", error);
            });
        }

        replayDebounceRef.current = null;
      }, 1500);
    },
    []
  );

  // --------------------------------------------------
  // Synchronize language changes.
  // --------------------------------------------------

  const handleLanguageChange = useCallback(
    (event) => {
      const nextLanguage = event.target.value;

      if (
        !LANGUAGES.some((item) => item.value === nextLanguage)
      ) {
        return;
      }

      const nextCode = getProblemStarterCode(
        problemDetails,
        nextLanguage
      );

      // Cancel pending replay event from the previous language.
      if (replayDebounceRef.current) {
        clearTimeout(replayDebounceRef.current);
        replayDebounceRef.current = null;
      }

      languageRef.current = nextLanguage;

      setLanguage(nextLanguage);
      setCode(nextCode);

      const activeSocket = socketRef.current;
      const activeInterviewId = interviewIdRef.current;

      if (
        activeSocket &&
        joinedRef.current &&
        activeSocket.connected &&
        activeInterviewId
      ) {
        activeSocket.emit("editor:language", {
          interviewId: activeInterviewId,
          language: nextLanguage,
        });

        activeSocket.emit("editor:change", {
          interviewId: activeInterviewId,
          code: nextCode,
          language: nextLanguage,
        });

        replayService
          .recordLanguageChange(activeInterviewId, {
            language: nextLanguage,
          })
          .catch((error) => {
            console.error("Language replay recording failed:", error);
          });

        replayService
          .recordCodeChange(activeInterviewId, {
            code: nextCode,
            language: nextLanguage,
          })
          .catch((error) => {
            console.error("Code replay recording failed:", error);
          });
      }
    },
    [problemDetails]
  );

  // --------------------------------------------------
  // Run code.
  // --------------------------------------------------

  const handleRun = useCallback(() => {
    if (!selectedProblemId) {
      toast.error("No interview problem selected.");
      return;
    }

    onRun?.({
      code,
      language,
      problemId: selectedProblemId,
    });
  }, [code, language, selectedProblemId, onRun]);

  // --------------------------------------------------
  // Submit solution.
  // --------------------------------------------------

  const handleSubmit = useCallback(() => {
    if (!selectedProblemId) {
      toast.error("No interview problem selected.");
      return;
    }

    if (!joined) {
      toast.error("Join the interview before submitting.");
      return;
    }

    onSubmit?.({
      code,
      language,
      problemId: selectedProblemId,
    });
  }, [code, language, selectedProblemId, joined, onSubmit]);

  // --------------------------------------------------
  // Cleanup editor listeners and pending timers.
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      problemRequestIdRef.current += 1;

      if (replayDebounceRef.current) {
        clearTimeout(replayDebounceRef.current);
        replayDebounceRef.current = null;
      }

      if (cursorEmitTimerRef.current) {
        clearTimeout(cursorEmitTimerRef.current);
        cursorEmitTimerRef.current = null;
      }

      cursorListenerRef.current?.dispose();
      cursorListenerRef.current = null;

      if (editorRef.current) {
        editorRef.current.deltaDecorations(
          remoteDecorationsRef.current,
          []
        );

        editorRef.current = null;
      }
    };
  }, []);

  // --------------------------------------------------
  // Render.
  // --------------------------------------------------

  return (
    <section className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#14141d]">

      {/* Editor toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">

        <div className="flex items-center gap-2">
          <Code2 size={18} className="text-indigo-400" />

          <span className="text-sm font-semibold text-white">
            Code Editor
          </span>

          <span
            className={`rounded-md px-2 py-1 text-[10px] ${
              joined
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-yellow-500/10 text-yellow-400"
            }`}
          >
            {joined ? "Collaborative" : "Connecting"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">

          {/* Language selector */}
          <select
            value={language}
            onChange={handleLanguageChange}
            className="rounded-lg border border-white/10 bg-[#20202c] px-3 py-2 text-xs text-zinc-300 outline-none focus:border-indigo-500"
          >
            {LANGUAGES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          {/* Editor settings */}
          <button
            type="button"
            disabled
            title="Editor settings coming soon"
            className="rounded-lg border border-white/10 p-2 text-zinc-500"
          >
            <Settings2 size={16} />
          </button>

          {/* Problem selector */}
          <select
            value={selectedProblemId}
            onChange={(event) =>
              setSelectedProblemId(event.target.value)
            }
            disabled={problems.length === 0 || problemLoading}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {problems.length === 0 && (
              <option value="">No assigned problems</option>
            )}

            {problems.map((problem) => {
              const problemId = getProblemId(problem);

              const problemTitle =
                typeof problem === "string"
                  ? "Problem"
                  : problem.title;

              return (
                <option key={problemId} value={problemId}>
                  {problemTitle || "Untitled problem"}
                </option>
              );
            })}
          </select>

          {problemLoading && (
            <LoaderCircle
              size={16}
              className="animate-spin text-indigo-400"
            />
          )}
        </div>
      </div>

      {/* Selected problem information */}
      {problemDetails && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 bg-[#191923] px-4 py-2">
          <span className="text-sm font-medium text-zinc-200">
            {problemDetails.title || "Selected problem"}
          </span>

          {problemDetails.difficulty && (
            <span className="rounded-md bg-indigo-500/10 px-2 py-1 text-xs text-indigo-300">
              {problemDetails.difficulty}
            </span>
          )}
        </div>
      )}

      {/* Monaco editor */}
      <div className="w-full bg-[#1e1e1e]">
        <Suspense
          fallback={
            <div className="flex h-[480px] items-center justify-center bg-[#1e1e1e]">
              <div className="flex flex-col items-center gap-3">
                <LoaderCircle
                  size={28}
                  className="animate-spin text-indigo-400"
                />

                <p className="text-sm text-zinc-400">
                  Loading code editor...
                </p>
              </div>
            </div>
          }
        >
          <Editor
            height="480px"
            width="100%"
            language={language}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={EDITOR_OPTIONS}
          />
        </Suspense>
      </div>

      {/* Editor footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">

        <p className="text-xs text-zinc-500">
          {language.toUpperCase()} · {code.split("\n").length} lines
        </p>

        <div className="flex flex-wrap items-center gap-2">

          <button
            type="button"
            onClick={handleRun}
            disabled={!selectedProblemId || problemLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play size={15} fill="currentColor" />
            Run Code
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              !selectedProblemId ||
              !joined ||
              problemLoading
            }
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit Solution
          </button>

        </div>
      </div>
    </section>
  );
}

export default memo(CollaborativeEditor);
