import { useState } from "react";
import { FocusDrawer } from "./components/FocusDrawer";
import { MainWorkspace } from "./components/MainWorkspace";
import { ModalHost } from "./components/modals/ModalHost";
import { TopBar } from "./components/TopBar";
import type { ModalName } from "./components/TopBar";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useWorkspace } from "./hooks/useWorkspace";
import { useSettings } from "./providers/SettingsProvider";

/** Phase 2 shell: locked to the viewport, with independently scrolling panes. */
export function AppShell() {
  const { settings, ready } = useSettings();
  const workspace = useWorkspace();
  const [showTrace, setShowTrace] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalName>(null);

  useKeyboardShortcuts(
    settings.run_key,
    settings.stop_key,
    () => void workspace.run(),
    () => void workspace.stop(),
    ready && activeModal === null,
  );

  return (
    <div className="app-shell">
      <TopBar
        workspace={workspace}
        openModal={setActiveModal}
        showTrace={showTrace}
        onToggleTrace={() => setShowTrace((value) => !value)}
      />
      <FocusDrawer />
      <MainWorkspace workspace={workspace} showTrace={showTrace} />
      <ModalHost
        active={activeModal}
        onClose={() => setActiveModal(null)}
        openModal={setActiveModal}
        workspace={workspace}
      />
    </div>
  );
}
