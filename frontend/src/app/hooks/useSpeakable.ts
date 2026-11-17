import { useCallback, useEffect, useRef } from "react";
import type { HTMLAttributes } from "react";
import { useSettings } from "../providers/SettingsProvider";
import { useSpeech } from "../providers/SpeechProvider";

/** Hover-to-speak with the reader's delay, plus optional click-to-speak. */
export function useSpeakable(
  label: string,
  kind: "control" | "text" = "control",
): HTMLAttributes<HTMLElement> {
  const { settings } = useSettings();
  const { speak, cancel } = useSpeech();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => clear, [clear]);

  return {
    onMouseEnter: () => {
      if (!settings.tts_enabled || settings.tts_hover_scope === "off") return;
      clear();
      timer.current = setTimeout(() => speak(label, kind), settings.tts_hover_delay);
    },
    onMouseLeave: () => { clear(); cancel(); },
    onFocus: () => {
      if (settings.tts_enabled) speak(label, kind);
    },
    onBlur: () => cancel(),
    onClick: () => {
      if (settings.tts_click_to_speak) speak(label, kind);
    },
  };
}
