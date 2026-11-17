import { useState } from "react";
import { useSettings } from "../providers/SettingsProvider";
import type { Settings } from "../settings/settings.types";

/** Always-available focus controls; a small left tab opens the drawer. */
export function FocusDrawer() {
  const { settings, update } = useSettings();
  const [open, setOpen] = useState(false);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    void update({ [key]: value } as Pick<Settings, K>);
  };

  const field = "min-h-11 w-full rounded-md border border-panel-border bg-background px-2 text-foreground";

  return (
    <>
      <button
        type="button"
        className="focus-tab"
        aria-expanded={open}
        aria-label="Open focus controls"
        onClick={() => setOpen(true)}
        hidden={open}
      >
        Focus
      </button>
      {open ? (
        <aside className="focus-panel" aria-label="Focus controls">
          <header className="flex items-center justify-between border-b border-panel-border p-3">
            <h2 className="font-semibold">Focus controls</h2>
            <button
              type="button"
              className="btn btn-small"
              aria-label="Close focus controls"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </header>
          <div className="space-y-3 p-3">
            <label className="block">
              <span className="block text-sm">Focus mode</span>
              <select className={field} value={settings.focus_mode} onChange={(e) => set("focus_mode", e.target.value)}>
                {["off", "lines", "fade", "gutter"].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            {(["blur_intensity", "fade_output", "fade_shell", "fade_settings"] as const).map((key) => (
              <label key={key} className="block">
                <span className="block text-sm">{key.replace(/_/g, " ")}</span>
                <input className="w-full" type="range" min="0" max="1" step="0.05" value={settings[key]}
                  onChange={(e) => set(key, Number(e.target.value))} />
              </label>
            ))}
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={settings.reading_ruler} onChange={(e) => set("reading_ruler", e.target.checked)} />
              Reading ruler
            </label>
            <button type="button" className={field} onClick={() => { set("focus_mode", "off"); setOpen(false); }}>
              Exit focus mode
            </button>
          </div>
        </aside>
      ) : null}
    </>
  );
}
