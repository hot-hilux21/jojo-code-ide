import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "./settings.defaults";
import type { Settings, SettingsPatch } from "./settings.types";

type UnknownRecord = Record<string, unknown>;

/** Forget keys the server no longer knows; keep the type of the ones it does. */
export function coerceSettings(value: unknown): Settings {
  const result = { ...DEFAULT_SETTINGS };
  if (!value || typeof value !== "object") return result;
  for (const [key, fallback] of Object.entries(DEFAULT_SETTINGS)) {
    const given = (value as UnknownRecord)[key];
    if (given === undefined || given === null) continue;
    if (typeof fallback === "boolean" && typeof given === "boolean") {
      (result as UnknownRecord)[key] = given;
    } else if (typeof fallback === "number" && typeof given === "number") {
      (result as UnknownRecord)[key] = given;
    } else if (typeof fallback === "string" && typeof given === "string") {
      (result as UnknownRecord)[key] = given;
    }
  }
  // reduce_motion is deliberately tri-state: unset follows the OS setting.
  const motion = (value as UnknownRecord).reduce_motion;
  if (motion === true || motion === false) result.reduce_motion = motion;
  return result;
}

export function loadCachedSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return coerceSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveCachedSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // A blocked store must never stop the app from drawing.
  }
}

export function applyPatch(settings: Settings, patch: SettingsPatch): Settings {
  return coerceSettings({ ...settings, ...patch });
}
