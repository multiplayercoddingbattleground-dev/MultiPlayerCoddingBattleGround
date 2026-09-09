import Editor from "@monaco-editor/react";

function CodeEditor({
  language = "python",
  value = "",
  onChange = () => {},
}) {
  return (
    <div className="code-editor">
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={(newValue) => {
          onChange(newValue || "");
        }}
        theme="vs-dark"
        options={{
          fontSize: 14,
          minimap: {
            enabled: false,
          },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 4,
          insertSpaces: true,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          renderWhitespace: "selection",
          padding: {
            top: 12,
            bottom: 12,
          },
        }}
      />
    </div>
  );
}

export default CodeEditor;