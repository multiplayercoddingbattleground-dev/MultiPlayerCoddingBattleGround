import Editor from "@monaco-editor/react";
import { useState } from "react";

function CodeEditor() {

  const [code, setCode] = useState(
`def twoSum(nums, target):
    seen = {}

    for i, num in enumerate(nums):
        complement = target - num

        if complement in seen:
            return [seen[complement], i]

        seen[num] = i

    return []
`
  );

  return (
    <div className="code-editor">
      <Editor
        height="100%"
        defaultLanguage="python"
        value={code}
        onChange={(value) => setCode(value || "")}
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