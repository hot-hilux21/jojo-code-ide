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
import { SpeakButton } from "./SpeakButton";

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

function saveToComputer(code: string): void {
  const blob = new Blob([code], { type: "text/x-python" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "my_code.py";
  link.click();
  URL.revokeObjectURL(link.href);
}

/** Top toolbar: one row, stable targets, every control speaks its own label. */
export function TopBar({ workspace, openModal, showTrace, onToggleTrace }: TopBarProps) {
  const { settings, update } = useSettings();
  const focusOn = settings.focus_mode !== "off";

  return (
    <header className="top-bar" role="banner">
      <SpeakButton label="Run code" className={buttonClass} onClick={() => void workspace.run()} disabled={workspace.running}>
        <Play aria-hidden="true" size={18} />
        <span className="app-btn-label">Run</span>
      </SpeakButton>
      <SpeakButton label="Stop the running program" className={buttonClass} onClick={() => void workspace.stop()} disabled={!workspace.running}>
        <Square aria-hidden="true" size={18} />
        <span className="app-btn-label">Stop</span>
      </SpeakButton>
      <SpeakButton label="Clear the output" className={buttonClass} onClick={workspace.clearOutput}>
        <Eraser aria-hidden="true" size={18} />
        <span className="app-btn-label">Clear</span>
      </SpeakButton>
      <SpeakButton label="Open the dictionary" className={buttonClass} onClick={() => openModal("dictionary")}>
        <BookOpen aria-hidden="true" size={18} />
        <span className="app-btn-label">Dictionary</span>
      </SpeakButton>

      <div className="ml-auto flex flex-wrap items-center gap-2" role="group" aria-label="Files and tools">
        <SpeakButton label="Open my files" className={buttonClass} onClick={() => openModal("files")}>
          <FolderOpen aria-hidden="true" size={18} />
          <span className="app-btn-label">My files</span>
        </SpeakButton>
        <SpeakButton label="Save the code to this computer" className={buttonClass} onClick={() => saveToComputer(workspace.code)}>
          <Save aria-hidden="true" size={18} />
          <span className="app-btn-label">Save</span>
        </SpeakButton>
        <SpeakButton label="Open the Python shell" className={buttonClass} onClick={() => void workspace.openShell()} disabled={!!workspace.shellSession}>
          <Terminal aria-hidden="true" size={18} />
          <span className="app-btn-label">Shell</span>
        </SpeakButton>
        {focusOn ? (
          <SpeakButton label="Exit focus mode" className={buttonClass} onClick={() => void update({ focus_mode: "off" })}>
            <X aria-hidden="true" size={18} />
            <span className="app-btn-label">Exit focus</span>
          </SpeakButton>
        ) : null}
        <SpeakButton label="Switch back to the classic interface" className={buttonClass} onClick={() => void update({ ui_backend: "flask" })}>
          <span className="app-btn-label">Classic UI</span>
        </SpeakButton>
        <SpeakButton label="Send feedback" className={buttonClass} onClick={() => openModal("feedback")}>
          <MessageSquare aria-hidden="true" size={18} />
          <span className="app-btn-label">Feedback</span>
        </SpeakButton>
        <SpeakButton label="Open settings" className={buttonClass} onClick={() => openModal("settings")}>
          <SettingsIcon aria-hidden="true" size={18} />
          <span className="app-btn-label">Settings</span>
        </SpeakButton>
        <SpeakButton label="Open account settings" className={buttonClass} onClick={() => openModal("account")}>
          <UserRound aria-hidden="true" size={18} />
          <span className="app-btn-label">Account</span>
        </SpeakButton>
        <SpeakButton
          label="Toggle the variable trace table"
          className={buttonClass}
          onClick={onToggleTrace}
          disabled={!workspace.result.trace?.rows?.length}
          pressed={showTrace}
        >
          <Table2 aria-hidden="true" size={18} />
          <span className="app-btn-label">Trace</span>
        </SpeakButton>
      </div>
    </header>
  );
}
