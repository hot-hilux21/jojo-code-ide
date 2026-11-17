import type { Workspace } from "../hooks/useWorkspace";

export function PythonShell({ workspace }: { workspace: Workspace }) {
  if (!workspace.shellSession) return null;
  return (
    <section className="workspace-pane" aria-labelledby="shell-heading">
      <header id="shell-heading" className="font-semibold">
        Python shell
      </header>
      <div className="pane-scroll" role="log" aria-live="polite">
        {workspace.shellOutput}
      </div>
      <form
        className="flex gap-2 border-t border-panel-border p-2"
        onSubmit={(event) => {
          event.preventDefault();
          void workspace.execShell();
        }}
      >
        <label className="sr-only" htmlFor="shell-command">
          Shell command
        </label>
        <input
          id="shell-command"
          className="min-h-11 flex-1 rounded-md border border-panel-border bg-background px-2 font-mono text-foreground"
          value={workspace.shellInput}
          onChange={(event) => workspace.setShellInput(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          disabled={workspace.shellBusy}
        />
        <button
          type="submit"
          className="min-h-11 rounded-md border border-panel-border bg-panel px-3 text-foreground"
          disabled={workspace.shellBusy}
        >
          Run
        </button>
        <button
          type="button"
          className="min-h-11 rounded-md border border-panel-border bg-panel px-3 text-foreground"
          onClick={() => void workspace.resetShell()}
        >
          Reset
        </button>
        <button
          type="button"
          className="min-h-11 rounded-md border border-panel-border bg-panel px-3 text-foreground"
          onClick={() => void workspace.closeShell()}
        >
          Close
        </button>
      </form>
    </section>
  );
}
