import LegacyApp from "../App";
import { AppShell } from "./AppShell";
import { useSettings } from "./providers/SettingsProvider";
import { SpeechProvider } from "./providers/SpeechProvider";

/** Keeps the classic UI working while the new shell is being rebuilt. */
export function AppRouter() {
  const { settings, ready } = useSettings();
  if (!ready) {
    return <div className="p-6 text-foreground">Loading your settings…</div>;
  }
  return settings.ui_backend === "react" ? (
    <SpeechProvider>
      <AppShell />
    </SpeechProvider>
  ) : (
    <LegacyApp />
  );
}
