import { useEffect, useRef } from "react";
import type { Workspace } from "../hooks/useWorkspace";
import { useSpeech } from "../providers/SpeechProvider";

/** The shell keeps its own transcript in state; no global DOM listeners. */
export function PythonShell({ workspace }: { workspace: Workspace }) {
  const { playLoop, stopLoop } = useSpeech();
  const chantTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (chantTimer.current) clearInterval(chantTimer.current);
    stopLoop();
  }, [stopLoop]);

  if (!workspace.shellSession) return null;

  const stopChant = () => {
    if (chantTimer.current) clearInterval(chantTimer.current);
    chantTimer.current = null;
    stopLoop();
  };

  const submit = () => {
    const command = workspace.shellInput.trim();
    if (!command || workspace.shellBusy) return;
    const lower = command.toLowerCase();
    if (lower === "ay") {
      workspace.setShellInput("");
      workspace.setShellOutput((previous) => previous + "# ay ay ay ay #\n");
      chantTimer.current = setInterval(() => {
        workspace.setShellOutput((previous) => previous + "# ay ay ay ay #\n");
      }, 450);
      playLoop("ay");
      return;
    }
    if (lower === "stop ay") {
      stopChant();
      workspace.setShellInput("");
      workspace.setShellOutput((previous) => previous + "\"ay ay ay ay\" is no longer \"ay ay ay ay-ing\".\n");
      return;
    }
    void workspace.execShell();
  };

  return (
    <section className="workspace-pane" aria-labelledby="shell-heading">
      <header id="shell-heading" className="font-semibold">Python shell</header>
      <div className="pane-scroll" role="log" aria-live="polite">{workspace.shellOutput}</div>
      <form
        className="flex gap-2 border-t border-panel-border p-2"
        onSubmit={(event) => { event.preventDefault(); submit(); }}
      >
        <label className="sr-only" htmlFor="shell-command">Shell command</label>
        <input
          id="shell-command"
          className="min-h-11 flex-1 rounded-md border border-panel-border bg-background px-2 font-mono text-foreground"
          value={workspace.shellInput}
          onChange={(event) => workspace.setShellInput(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          disabled={workspace.shellBusy}
        />
        <button type="submit" className="min-h-11 rounded-md border border-panel-border bg-panel px-3 text-foreground" disabled={workspace.shellBusy}>Run</button>
        <button type="button" className="min-h-11 rounded-md border border-panel-border bg-panel px-3 text-foreground" onClick={() => void workspace.resetShell()}>Reset</button>
        <button type="button" className="min-h-11 rounded-md border border-panel-border bg-panel px-3 text-foreground" onClick={() => { stopChant(); void workspace.closeShell(); }}>Close</button>
      </form>
    </section>
  );
}
