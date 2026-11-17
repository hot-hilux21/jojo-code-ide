import type { Workspace } from "../../hooks/useWorkspace";
import type { ModalName } from "../TopBar";
import { AccountModal } from "./AccountModal";
import { AuthModal } from "./AuthModal";
import { CreditsModal } from "./CreditsModal";
import { DictionaryModal } from "./DictionaryModal";
import { FeedbackModal } from "./FeedbackModal";
import { MyFilesModal } from "./MyFilesModal";
import { PackagesModal } from "./PackagesModal";
import { QuitConfirmModal } from "./QuitConfirmModal";
import { SettingsModal } from "./SettingsModal";

interface ModalHostProps {
  active: ModalName;
  onClose: () => void;
  openModal: (name: ModalName) => void;
  workspace: Workspace;
}

/** Only the active dialog is mounted; Radix supplies focus trap and Escape. */
export function ModalHost({ active, onClose, openModal, workspace }: ModalHostProps) {
  switch (active) {
    case "settings": return <SettingsModal onClose={onClose} />;
    case "dictionary": return <DictionaryModal onClose={onClose} />;
    case "credits": return <CreditsModal onClose={onClose} />;
    case "feedback": return <FeedbackModal onClose={onClose} />;
    case "packages": return <PackagesModal onClose={onClose} />;
    case "files": return <MyFilesModal onClose={onClose} workspace={workspace} />;
    case "account": return <AccountModal onClose={onClose} openModal={openModal} />;
    case "login": return <AuthModal onClose={onClose} />;
    case "quit": return <QuitConfirmModal onClose={onClose} />;
    case null: return null;
  }
}
