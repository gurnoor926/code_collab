
import { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Code2,
  Play,
  Settings2,
  LoaderCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import problemService from "../../services/problemService";
import replayService from "../../services/replayService";

const languages = [
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "C++", value: "cpp" },
];

const defaultStarterCode = {
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

// Extract starter code from common API response structures.
const getProblemStarterCode = (problem, language) => {
  if (!problem) {
    return defaultStarterCode[language];
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

  return defaultStarterCode[language];
};

const getProblemId = (problem) => {
  return typeof problem === "string" ? problem : problem?._id;
};

function CollaborativeEditor({
  onRun,
  onSubmit,
  socket,
  joined,
  currentUser,
  interviewId,
  problems = [],
}) {
  const editorRef = useRef(null);
  const socketRef = useRef(socket);
  const joinedRef = useRef(joined);
  const interviewIdRef = useRef(interviewId);
  const suppressRemoteChange = useRef(false);
  const remoteDecorations = useRef([]);
  const cursorListenerRef = useRef(null);
  const replayDebounceRef = useRef(null);
  const changeCountRef = useRef(0);

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(defaultStarterCode.javascript);

  const [selectedProblemId, setSelectedProblemId] = useState(
    problems.length > 0 ? getProblemId(problems[0]) : ""
  );

  const [problemDetails, setProblemDetails] = useState(null);
  const [problemLoading, setProblemLoading] = useState(false);

  const userId = currentUser?._id || currentUser?.id;

  // Keep the selected problem synchronized with interview data.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (problems.length === 0) {
        setSelectedProblemId("");
        setProblemDetails(null);
        setCode(defaultStarterCode[language]);
        return;
      }

      const firstProblemId = getProblemId(problems[0]);

      setSelectedProblemId((current) => {
        const problemExists = problems.some(
          (problem) => getProblemId(problem) === current
        );

        return problemExists ? current : firstProblemId;
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [problems, language]);

  // Fetch full problem details whenever the selected problem changes.
  useEffect(() => {
    if (!selectedProblemId) {
      return;
    }

    let cancelled = false;

    const fetchProblemDetails = async () => {
      try {
        setProblemLoading(true);

        const response =
          await problemService.getProblemById(selectedProblemId);

        if (cancelled) return;

        // Support both { success, data } and direct data responses.
        const details =
          response?.data?.problem ||
          response?.data ||
          response?.problem ||
          response;

        setProblemDetails(details);

        const starter = getProblemStarterCode(details, language);

        setCode(starter);

        console.log("Loaded problem details:", details);
        console.log("Loaded starter code:", starter);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch problem details:", error);

          setProblemDetails(null);
          setCode(defaultStarterCode[language]);

          toast.error(
            error.response?.data?.message ||
              "Unable to load problem details."
          );
        }
      } finally {
        if (!cancelled) {
          setProblemLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchProblemDetails();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedProblemId, language]);

  // Keep refs synchronized with the latest props.
  useEffect(() => {
    socketRef.current = socket;
    joinedRef.current = joined;
    interviewIdRef.current = interviewId;
  }, [socket, joined, interviewId]);

  // Receive collaborative updates.
  useEffect(() => {
    if (!socket || !joined) return;

    const handleRemoteCode = (data = {}) => {
      if (
        data.updatedBy &&
        String(data.updatedBy) === String(userId)
      ) {
        return;
      }

      if (typeof data.code !== "string") return;

      suppressRemoteChange.current = true;

      setCode(data.code);

      if (editorRef.current) {
        editorRef.current.setValue(data.code);
      }

      suppressRemoteChange.current = false;
    };

    const handleRemoteLanguage = (data = {}) => {
      if (
        data.updatedBy &&
        String(data.updatedBy) === String(userId)
      ) {
        return;
      }

      if (!languages.some((item) => item.value === data.language)) {
        return;
      }

      setLanguage(data.language);
    };

    const handleRemoteCursor = (data = {}) => {
      if (String(data.userId) === String(userId)) return;
      if (!editorRef.current || !data.position) return;

      const editor = editorRef.current;
      const model = editor.getModel();

      if (!model) return;

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

      remoteDecorations.current = editor.deltaDecorations(
        remoteDecorations.current,
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
        remoteDecorations.current =
          editorRef.current.deltaDecorations(
            remoteDecorations.current,
            []
          );
      }
    };
  }, [socket, joined, userId]);

  // Send local cursor position to the other participant.
  const handleEditorMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.focus();

    cursorListenerRef.current?.dispose();

    cursorListenerRef.current =
      editor.onDidChangeCursorPosition((event) => {
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
          position: {
            lineNumber: event.position.lineNumber,
            column: event.position.column,
          },
        });
      });
  }, []);

  // Synchronize local code changes.
  const handleCodeChange = (value) => {
    const nextCode = value ?? "";

    setCode(nextCode);

    if (suppressRemoteChange.current) return;

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

    activeSocket.emit(
      "editor:change",
      {
        interviewId: activeInterviewId,
        code: nextCode,
        language,
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

    // Debounced replay recording
    if (replayDebounceRef.current) {
      clearTimeout(replayDebounceRef.current);
    }
    replayDebounceRef.current = setTimeout(() => {
      changeCountRef.current += 1;
      if (changeCountRef.current % 25 === 0) {
        replayService
          .createSnapshot(activeInterviewId, {
            code: nextCode,
            language,
          })
          .catch(() => {});
      } else {
        replayService
          .recordCodeChange(activeInterviewId, {
            code: nextCode,
            language,
          })
          .catch(() => {});
      }
    }, 1500);
  };

  // Synchronize language changes and load its starter code.
  const handleLanguageChange = (event) => {
    const nextLanguage = event.target.value;

    const nextCode = getProblemStarterCode(
      problemDetails,
      nextLanguage
    );

    setLanguage(nextLanguage);
    setCode(nextCode);

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
      .recordLanguageChange(activeInterviewId, { language: nextLanguage })
      .catch(() => {});
    replayService
      .recordCodeChange(activeInterviewId, {
        code: nextCode,
        language: nextLanguage,
      })
      .catch(() => {});
  };

  // Run code using the existing execution handler.
  const handleRun = () => {
    if (!selectedProblemId) {
      toast.error("No interview problem selected.");
      return;
    }

    onRun?.({
      code,
      language,
      problemId: selectedProblemId,
    });
  };

  // Submit solution using the existing submission handler.
  const handleSubmit = () => {
    if (!selectedProblemId) {
      toast.error("No interview problem selected.");
      return;
    }

    onSubmit?.({
      code,
      language,
      problemId: selectedProblemId,
    });
  };

  // Dispose Monaco listeners and timers when the component unmounts.
  useEffect(() => {
    return () => {
      if (replayDebounceRef.current) {
        clearTimeout(replayDebounceRef.current);
      }
      cursorListenerRef.current?.dispose();
      cursorListenerRef.current = null;
    };
  }, []);

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
            {languages.map((item) => (
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
        <Editor
          height="480px"
          width="100%"
          language={language}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            readOnly: false,
            domReadOnly: false,
            minimap: {
              enabled: false,
            },
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
          }}
        />
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
            disabled={!selectedProblemId || !joined || problemLoading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit Solution
          </button>
        </div>
      </div>
    </section>
  );
}

export default CollaborativeEditor;
