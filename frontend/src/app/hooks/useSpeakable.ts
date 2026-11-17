import { useCallback, useEffect, useRef } from "react";
import type { HTMLAttributes } from "react";
import { useSettings } from "../providers/SettingsProvider";
import { useSpeech } from "../providers/SpeechProvider";

/** Hover-to-speak with the reader's delay, plus optional click-to-speak. */
export type SpeakKind = "control" | "text" | "code" | "output" | "shell";

export function useSpeakable(
  label: string,
  kind: SpeakKind = "control",
): HTMLAttributes<HTMLElement> {
  const { settings } = useSettings();
  const { speak, cancel } = useSpeech();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allowed = () => {
    if (!settings.tts_enabled || settings.tts_hover_scope === "off") return false;
    if (kind === "control") return settings.tts_hover_scope !== "off";
    if (kind === "text") return settings.tts_hover_scope === "all";
    if (kind === "code") return settings.tts_hover_code;
    if (kind === "output") return settings.tts_hover_output;
    return settings.tts_hover_shell;
  };

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => clear, [clear]);

  return {
    onMouseEnter: () => {
      if (!allowed()) return;
      clear();
      timer.current = setTimeout(() => speak(label, kind), settings.tts_hover_delay);
    },
    onMouseLeave: () => { clear(); cancel(); },
    onFocus: () => {
      if (allowed()) speak(label, kind);
    },
    onBlur: () => cancel(),
    onClick: () => {
      if (settings.tts_click_to_speak && allowed()) speak(label, kind);
    },
  };
}
