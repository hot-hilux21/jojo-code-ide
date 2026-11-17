import {
  BookOpen,
  Eraser,
  FolderOpen,
  MessageSquare,
  Play,
  Save,
  Settings as SettingsIcon,
  Square,
  Table2,
  Terminal,
  UserRound,
  X,
} from "lucide-react";
import type { Workspace } from "../hooks/useWorkspace";
import { useSettings } from "../providers/SettingsProvider";

export type ModalName =
  | "settings"
  | "dictionary"
  | "credits"
  | "feedback"
  | "packages"
  | "files"
  | "account"
  | "login"
  | "quit"
  | null;

interface TopBarProps {
  workspace: Workspace;
  openModal: (name: ModalName) => void;
  showTrace: boolean;
  onToggleTrace: () => void;
}

const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-panel-border bg-panel px-3 text-sm text-foreground hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60";

export function TopBar({ workspace, openModal, showTrace, onToggleTrace }: TopBarProps) {
  const { settings, update } = useSettings();
  const focusOn = settings.focus_mode !== "off";

  return (
    <header className="top-bar" role="banner">
      <button
        type="button"
        className={buttonClass}
        onClick={() => void workspace.run()}
        disabled={workspace.running}
        aria-label="Run code"
      >
        <Play aria-hidden="true" size={18} />
        <span className="app-btn-label">Run</span>
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => void workspace.stop()}
        disabled={!workspace.running}
        aria-label="Stop the running program"
      >
        <Square aria-hidden="true" size={18} />
        <span className="app-btn-label">Stop</span>
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={workspace.clearOutput}
        aria-label="Clear the output"
      >
        <Eraser aria-hidden="true" size={18} />
        <span className="app-btn-label">Clear</span>
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => openModal("dictionary")}
        aria-label="Open the dictionary"
      >
        <BookOpen aria-hidden="true" size={18} />
        <span className="app-btn-label">Dictionary</span>
      </button>

      <div className="ml-auto flex flex-wrap items-center gap-2" role="group" aria-label="Files and tools">
        <button
          type="button"
          className={buttonClass}
          onClick={() => openModal("files")}
          aria-label="Open my files"
        >
          <FolderOpen aria-hidden="true" size={18} />
          <span className="app-btn-label">My files</span>
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            const blob = new Blob([workspace.code], { type: "text/x-python" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "my_code.py";
            link.click();
            URL.revokeObjectURL(link.href);
          }}
          aria-label="Save the code to this computer"
        >
          <Save aria-hidden="true" size={18} />
          <span className="app-btn-label">Save</span>
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => void workspace.openShell()}
          disabled={!!workspace.shellSession}
          aria-label="Open the Python shell"
        >
          <Terminal aria-hidden="true" size={18} />
          <span className="app-btn-label">Shell</span>
        </button>
        {focusOn ? (
          <button
            type="button"
            className={buttonClass}
            onClick={() => void update({ focus_mode: "off" })}
            aria-label="Exit focus mode"
          >
            <X aria-hidden="true" size={18} />
            <span className="app-btn-label">Exit focus</span>
          </button>
        ) : null}
        <button
          type="button"
          className={buttonClass}
          onClick={() => void update({ ui_backend: "flask" })}
          aria-label="Switch back to the classic interface"
        >
          <span className="app-btn-label">Classic UI</span>
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => openModal("feedback")}
          aria-label="Send feedback"
        >
          <MessageSquare aria-hidden="true" size={18} />
          <span className="app-btn-label">Feedback</span>
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => openModal("settings")}
          aria-label="Open settings"
        >
          <SettingsIcon aria-hidden="true" size={18} />
          <span className="app-btn-label">Settings</span>
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => openModal("account")}
          aria-label="Open account settings"
        >
          <UserRound aria-hidden="true" size={18} />
          <span className="app-btn-label">Account</span>
        </button>
        <button
          type="button"
          className={buttonClass}
          aria-pressed={showTrace}
          aria-label="Toggle the variable trace table"
          disabled={!workspace.result.trace?.rows?.length}
          onClick={onToggleTrace}
        >
          <Table2 aria-hidden="true" size={18} />
          <span className="app-btn-label">Trace</span>
        </button>
      </div>
    </header>
  );
}
