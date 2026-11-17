import CodeMirror from "@uiw/react-codemirror";
import type { Workspace } from "../hooks/useWorkspace";

/** The editor consumes theme tokens through shell.css; no inline colours. */
export function CodeEditor({ workspace }: { workspace: Workspace }) {
  return (
    <CodeMirror
      className="h-full"
      height="100%"
      theme="none"
      value={workspace.code}
      basicSetup={{ lineNumbers: true, foldGutter: false }}
      aria-label="Python code editor"
      onChange={(value) => workspace.setCode(value)}
    />
  );
}
