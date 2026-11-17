import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useSettings } from "./SettingsProvider";

interface SpeechContextValue {
  speak: (label: string, kind?: "control" | "text") => void;
  cancel: () => void;
  playSound: (name: string) => void;
  playLoop: (name: string) => void;
  stopLoop: () => void;
  voices: SpeechSynthesisVoice[];
}

const SpeechContext = createContext<SpeechContextValue | null>(null);

const SFX_ROOT = "/static/sfx/";

/** Central Web Speech and sound engine. No page-wide mouse listeners. */
export function SpeechProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const loop = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const cancel = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const speak = useCallback((label: string, kind: "control" | "text" = "control") => {
    if (!settings.tts_enabled) return;
    if (settings.tts_hover_scope === "off") return;
    if (settings.tts_hover_scope === "controls" && kind !== "control") return;
    if (!label || !("speechSynthesis" in window)) return;
    cancel();
    const utterance = new SpeechSynthesisUtterance(label);
    utterance.lang = settings.locale;
    utterance.rate = settings.tts_rate;
    const chosen = voices.find((voice) => voice.voiceURI === settings.tts_voice)
      || voices.find((voice) => voice.lang.startsWith(settings.locale)
        && (settings.tts_voice_gender === "any"
          || voice.name.toLowerCase().includes(settings.tts_voice_gender)));
    if (chosen) utterance.voice = chosen;
    window.speechSynthesis.speak(utterance);
  }, [settings, voices, cancel]);

  const playSound = useCallback((name: string) => {
    if (!settings.sound_enabled || settings.reduce_motion === true) return;
    const audio = new Audio(SFX_ROOT + name + ".wav");
    void audio.play().catch(() => {});
  }, [settings]);

  const stopLoop = useCallback(() => {
    if (!loop.current) return;
    loop.current.pause();
    loop.current.currentTime = 0;
    loop.current = null;
  }, []);

  const playLoop = useCallback((name: string) => {
    stopLoop();
    if (!settings.sound_enabled) return;
    const audio = new Audio(SFX_ROOT + name + ".wav");
    audio.loop = true;
    loop.current = audio;
    void audio.play().catch(() => {});
  }, [stopLoop, settings.sound_enabled]);

  useEffect(() => stopLoop, [stopLoop]);

  const value = useMemo<SpeechContextValue>(
    () => ({ speak, cancel, playSound, playLoop, stopLoop, voices }),
    [speak, cancel, playSound, playLoop, stopLoop, voices],
  );

  return <SpeechContext.Provider value={value}>{children}</SpeechContext.Provider>;
}

export function useSpeech(): SpeechContextValue {
  const value = useContext(SpeechContext);
  if (!value) throw new Error("useSpeech must be used inside SpeechProvider");
  return value;
}
