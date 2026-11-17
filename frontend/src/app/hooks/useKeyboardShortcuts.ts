import { useEffect, useRef } from "react";

function chordOf(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) parts.push("Ctrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  const key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
  parts.push(key);
  return parts.join("+");
}

function normalise(chord: string): string {
  return chord
    .split("+")
    .map((part) => {
      const name = part.trim().toLowerCase();
      if (name === "control" || name === "cmd" || name === "meta") return "ctrl";
      if (name === "esc") return "escape";
      return name;
    })
    .sort()
    .join("+");
}

/** Customisable Run and Stop chords. Escape Escape is a two-tap sequence. */
export function useKeyboardShortcuts(
  runKey: string,
  stopKey: string,
  onRun: () => void,
  onStop: () => void,
  enabled = true,
): void {
  const lastEscape = useRef(0);
  const handlers = useRef({ onRun, onStop });

  useEffect(() => {
    handlers.current = { onRun, onStop };
  }, [onRun, onStop]);

  useEffect(() => {
    if (!enabled) return;
    const listener = (event: KeyboardEvent) => {
      const chord = normalise(chordOf(event));
      if (chord === normalise(runKey)) {
        event.preventDefault();
        handlers.current.onRun();
        return;
      }
      if (normalise(stopKey) === "escape+escape") {
        if (event.key === "Escape") {
          const now = Date.now();
          if (now - lastEscape.current < 700) {
            event.preventDefault();
            handlers.current.onStop();
            lastEscape.current = 0;
          } else {
            lastEscape.current = now;
          }
        }
        return;
      }
      if (chord === normalise(stopKey)) {
        event.preventDefault();
        handlers.current.onStop();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [runKey, stopKey, enabled]);
}
