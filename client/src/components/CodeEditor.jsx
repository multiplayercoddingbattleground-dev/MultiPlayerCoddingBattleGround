import Editor from "@monaco-editor/react";

// Minimal stdin-reading boilerplate per language — problems are graded by
// comparing trimmed stdout against an expected value, so solutions need to
// read from stdin and print to stdout themselves.
const DEFAULT_SNIPPETS = {
  javascript:
    "const input = require(\"fs\").readFileSync(0, \"utf8\").trim();\n\n// TODO: solve, then print the answer\nconsole.log(input);\n",
  python:
    "import sys\n\ninput_data = sys.stdin.read().strip()\n\n# TODO: solve, then print the answer\nprint(input_data)\n",
  java:
    "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // TODO: solve, then print the answer\n    }\n}\n",
  cpp:
    "#include <iostream>\nusing namespace std;\n\nint main() {\n    // TODO: solve, then print the answer\n    return 0;\n}\n",
};

function CodeEditor({ language = "javascript", value, onChange }) {
  return (
    <div className="code-editor">
      <Editor
        height="100%"
        language={language}
        value={value ?? DEFAULT_SNIPPETS[language] ?? ""}
        onChange={(newValue) => onChange?.(newValue || "")}
        theme="vs-dark"
        options={{
          fontSize: 14,
          minimap: {
            enabled: false
          },
          automaticLayout: true
        }}
      />
    </div>
  );
}

export default CodeEditor;
