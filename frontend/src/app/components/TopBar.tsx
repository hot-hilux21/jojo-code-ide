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
import { AppButton } from "./AppButton";

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

function saveToComputer(code: string): void {
  const blob = new Blob([code], { type: "text/x-python" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "my_code.py";
  link.click();
  URL.revokeObjectURL(link.href);
}

/** Top toolbar: one button family, one speech hook, stable 44px targets. */
export function TopBar({ workspace, openModal, showTrace, onToggleTrace }: TopBarProps) {
  const { settings, update } = useSettings();
  const focusOn = settings.focus_mode !== "off";

  return (
    <header className="top-bar" role="banner">
      <AppButton label="Run code" variant="primary" icon={<Play />} onClick={() => void workspace.run()} disabled={workspace.running}>Run</AppButton>
      <AppButton label="Stop the running program" icon={<Square />} onClick={() => void workspace.stop()} disabled={!workspace.running}>Stop</AppButton>
      <AppButton label="Clear the output" icon={<Eraser />} onClick={workspace.clearOutput}>Clear</AppButton>
      <AppButton label="Open the dictionary" icon={<BookOpen />} onClick={() => openModal("dictionary")}>Dictionary</AppButton>

      <div className="ml-auto flex flex-wrap items-center gap-2" role="group" aria-label="Files and tools">
        <AppButton label="Open my files" variant="small" icon={<FolderOpen />} onClick={() => openModal("files")}>My files</AppButton>
        <AppButton label="Save the code to this computer" variant="small" icon={<Save />} onClick={() => saveToComputer(workspace.code)}>Save</AppButton>
        <AppButton label="Open the Python shell" variant="small" icon={<Terminal />} onClick={() => void workspace.openShell()} disabled={!!workspace.shellSession}>Shell</AppButton>
        {focusOn ? (
          <AppButton label="Exit focus mode" variant="small" icon={<X />} onClick={() => void update({ focus_mode: "off" })}>Exit focus</AppButton>
        ) : null}
        <AppButton
          label="Switch back to the classic interface"
          variant="small"
          onClick={() => void update({ ui_backend: "flask", setup_complete: true })}
        >
          Classic UI
        </AppButton>
        <AppButton label="Send feedback" variant="small" icon={<MessageSquare />} onClick={() => openModal("feedback")}>Feedback</AppButton>
        <AppButton label="Open settings" variant="small" icon={<SettingsIcon />} onClick={() => openModal("settings")}>Settings</AppButton>
        <AppButton label="Open account settings" variant="small" icon={<UserRound />} onClick={() => openModal("account")}>Account</AppButton>
        <AppButton
          label="Toggle the variable trace table"
          variant="toggle"
          icon={<Table2 />}
          onClick={onToggleTrace}
          disabled={!workspace.result.trace?.rows?.length}
          pressed={showTrace}
        >
          Trace
        </AppButton>
      </div>
    </header>
  );
}
