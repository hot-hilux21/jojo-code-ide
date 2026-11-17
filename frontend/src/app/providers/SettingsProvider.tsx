import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useThemeSync } from "../hooks/useThemeSync";
import { ACCESS_CODE_KEY } from "../settings/settings.defaults";
import {
  applyPatch,
  coerceSettings,
  loadCachedSettings,
  saveCachedSettings,
} from "../settings/settings.persistence";
import type {
  FontMap,
  Settings,
  SettingsPatch,
  ThemeMap,
} from "../settings/settings.types";

interface SettingsContextValue {
  settings: Settings;
  themes: ThemeMap;
  fonts: FontMap;
  ready: boolean;
  status: string;
  setAccessCode: (code: string) => void;
  update: (patch: SettingsPatch) => Promise<boolean>;
  reset: () => Promise<boolean>;
  reload: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function readCode(): string {
  try {
    return localStorage.getItem(ACCESS_CODE_KEY) || "";
  } catch {
    return "";
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadCachedSettings);
  const [themes, setThemes] = useState<ThemeMap>({});
  const [fonts, setFonts] = useState<FontMap>({});
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  const [accessCode, setAccessCodeState] = useState(readCode);

  useThemeSync(settings, themes, fonts);

  const setAccessCode = useCallback((code: string) => {
    setAccessCodeState(code);
    try {
      if (code) localStorage.setItem(ACCESS_CODE_KEY, code);
      else localStorage.removeItem(ACCESS_CODE_KEY);
    } catch {
      // The code still works for this session if storage is blocked.
    }
  }, []);

  const reload = useCallback(async () => {
    const [configResponse, themeResponse, fontResponse] = await Promise.all([
      fetch("/api/config"),
      fetch("/api/themes"),
      fetch("/api/fonts"),
    ]);
    if (!configResponse.ok || !themeResponse.ok || !fontResponse.ok) {
      throw new Error("Could not load settings from the server.");
    }
    const [serverConfig, themeMap, fontMap] = await Promise.all([
      configResponse.json() as Promise<unknown>,
      themeResponse.json() as Promise<ThemeMap>,
      fontResponse.json() as Promise<FontMap>,
    ]);
    const merged = coerceSettings({
      ...loadCachedSettings(),
      ...(serverConfig as Record<string, unknown>),
    });
    setSettings(merged);
    setThemes(themeMap || {});
    setFonts(fontMap || {});
    saveCachedSettings(merged);
  }, []);

  useEffect(() => {
    let active = true;
    reload()
      .then(() => {
        if (active) {
          setReady(true);
          setStatus("");
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setReady(true);
        setStatus(error instanceof Error ? error.message : "Could not load settings.");
      });
    return () => {
      active = false;
    };
  }, [reload]);

  const update = useCallback(
    async (patch: SettingsPatch): Promise<boolean> => {
      const next = applyPatch(settings, patch);
      setSettings(next);
      saveCachedSettings(next);
      try {
        const response = await fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...patch, access_code: accessCode }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as {
            code_required?: boolean;
            error?: string;
          };
          setStatus(body.error || "Settings were kept in this browser only.");
          return false;
        }
        setStatus("");
        return true;
      } catch {
        setStatus("Settings were kept in this browser only.");
        return false;
      }
    },
    [settings, accessCode],
  );

  const reset = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/config/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_code: accessCode }),
      });
      const body = (await response.json()) as {
        success?: boolean;
        config?: unknown;
        error?: string;
      };
      if (!response.ok || !body.success || !body.config) {
        setStatus(body.error || "Could not reset settings.");
        return false;
      }
      const next = coerceSettings(body.config);
      setSettings(next);
      saveCachedSettings(next);
      setStatus("");
      return true;
    } catch {
      setStatus("Could not reset settings.");
      return false;
    }
  }, [accessCode]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      themes,
      fonts,
      ready,
      status,
      setAccessCode,
      update,
      reset,
      reload,
    }),
    [settings, themes, fonts, ready, status, setAccessCode, update, reset, reload],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettings must be used inside SettingsProvider");
  return value;
}
