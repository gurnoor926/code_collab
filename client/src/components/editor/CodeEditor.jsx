import { lazy, Suspense } from "react";
const Editor = lazy(() => import("@monaco-editor/react"));

const languageMap = {
  javascript: "javascript",
  python: "python",
  java: "java",
  cpp: "cpp",
};

function CodeEditor({
  language = "javascript",
  code,
  onChange,
  readOnly = false,
}) {
  return (
    <div className="h-full min-h-[450px] overflow-hidden rounded-xl border border-white/10">
      <Suspense
        fallback={
          <div className="flex h-[450px] items-center justify-center bg-[#1e1e1e] text-sm text-gray-400">
            Loading code editor...
          </div>
        }
      ></Suspense>
      <Editor
        height="100%"
        language={languageMap[language] || "plaintext"}
        value={code}
        onChange={(value) => onChange(value ?? "")}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "JetBrains Mono, Consolas, monospace",
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          padding: { top: 16 },
          smoothScrolling: true,
          cursorBlinking: "smooth",
          lineNumbers: "on",
          folding: true,
          renderLineHighlight: "all",
          suggestOnTriggerCharacters: true,
        }}
      />
    </div>
  );
}

export default CodeEditor;
