import { useState } from "react";
import { MainWorkspace } from "./components/MainWorkspace";
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
      <MainWorkspace workspace={workspace} showTrace={showTrace} />
      {activeModal ? (
        <div role="dialog" aria-modal="true" aria-label={activeModal}>
          <p>{activeModal} dialog arrives in Phase 3.</p>
          <button type="button" onClick={() => setActiveModal(null)}>
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
