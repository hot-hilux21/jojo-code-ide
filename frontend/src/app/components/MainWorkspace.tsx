import { useSpeakable } from "../hooks/useSpeakable";
import { CodeEditor } from "./CodeEditor";
import { OutputPane } from "./OutputPane";
import { PythonShell } from "./PythonShell";
import { TraceTable } from "./TraceTable";
import type { Workspace } from "../hooks/useWorkspace";

interface MainWorkspaceProps {
  workspace: Workspace;
  showTrace: boolean;
}

export function MainWorkspace({ workspace, showTrace }: MainWorkspaceProps) {
  const rows = workspace.result.trace?.rows || [];
  const editorSpeech = useSpeakable("Python code editor", "code");
  return (
    <main className="workspace" aria-label="Coding workspace">
      <section className="workspace-pane editor-pane" aria-label="Code editor" tabIndex={0} {...editorSpeech}>
        <header className="font-semibold">Editor</header>
        <div className="pane-scroll">
          <CodeEditor workspace={workspace} />
        </div>
      </section>
      <div className="right-column">
        <OutputPane workspace={workspace} />
        <PythonShell workspace={workspace} />
        {showTrace ? <TraceTable rows={rows} /> : null}
      </div>
    </main>
  );
}
