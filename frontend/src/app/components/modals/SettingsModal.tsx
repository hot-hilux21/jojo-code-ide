import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useSettings } from "../../providers/SettingsProvider";
import { useFlaskApi } from "../../hooks/useFlaskApi";
import type { Settings } from "../../settings/settings.types";
import { ModalFrame } from "./ModalFrame";

const SECTIONS = [
  "Language", "Font", "Reading", "Colours & Contrast", "Try it out", "Focus",
  "Motion", "Sound", "Controls", "Keyboard", "Reading Aloud", "Updates",
  "Backup", "Interface", "Reset", "About",
] as const;

type Section = (typeof SECTIONS)[number];

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-wrap items-center justify-between gap-3 border-b border-panel-border py-2">
      <span>{label}</span>
      {children}
    </label>
  );
}

function fieldClass(): string {
  return "min-h-11 rounded-md border border-panel-border bg-background px-2 text-foreground";
}

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, themes, fonts, update, reset, status } = useSettings();
  const { post } = useFlaskApi();
  const [section, setSection] = useState<Section>("Language");
  const [version, setVersion] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");
  const [importStatus, setImportStatus] = useState("");

  useEffect(() => {
    void post<{ version?: string }>("/api/version")
      .then((data) => setVersion(data.version || ""))
      .catch(() => setVersion(""));
  }, [post]);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    void update({ [key]: value } as Pick<Settings, K>);
  };

  const renderSection = (): ReactNode => {
    switch (section) {
      case "Language":
        return <Row label="Language">
          <select className={fieldClass()} value={settings.locale} onChange={(e) => set("locale", e.target.value)}>
            {["en", "hi", "fr", "es", "pt", "ru", "ko", "ja", "zh", "el", "ar", "hj", "uk"].map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </Row>;
      case "Font":
        return <>
          <Row label="Reading font">
            <select className={fieldClass()} value={settings.font} onChange={(e) => set("font", e.target.value)}>
              {Object.entries(fonts).map(([key, font]) => <option key={key} value={key}>{font.name}</option>)}
            </select>
          </Row>
          {(["font_in_ui", "font_in_code", "font_in_output", "font_in_shell"] as const).map((key) => (
            <Row key={key} label={key.replace("font_in_", "Use in ")}>
              <input type="checkbox" checked={settings[key]} onChange={(e) => set(key, e.target.checked)} />
            </Row>
          ))}
        </>;
      case "Reading":
        return <>
          {([
            ["font_size", 12, 32, 1], ["font_weight", 300, 700, 50],
            ["line_height", 1, 2.5, 0.1], ["letter_spacing", 0, 4, 0.1],
            ["word_spacing", 0, 8, 0.1],
          ] as const).map(([key, min, max, step]) => (
            <Row key={key} label={key.replace(/_/g, " ")}>
              <input type="range" min={min} max={max} step={step} value={settings[key] as number}
                onChange={(e) => set(key, Number(e.target.value) as never)} />
              <output>{String(settings[key])}</output>
            </Row>
          ))}
        </>;
      case "Colours & Contrast":
        return <>
          <Row label="Theme">
            <select className={fieldClass()} value={settings.theme} onChange={(e) => set("theme", e.target.value)}>
              {Object.entries(themes).map(([key, theme]) => <option key={key} value={key}>{theme.name}</option>)}
            </select>
          </Row>
          <Row label="Contrast">
            <select className={fieldClass()} value={settings.contrast} onChange={(e) => set("contrast", e.target.value)}>
              <option value="normal">Normal</option>
              <option value="extra">Extra high contrast</option>
            </select>
          </Row>
          <Row label="Highlight colour">
            <input type="color" value={settings.highlight_color || "#4d4300"} onChange={(e) => set("highlight_color", e.target.value)} />
          </Row>
          <Row label="Background wash"><input type="checkbox" checked={settings.theme_gradient} onChange={(e) => set("theme_gradient", e.target.checked)} /></Row>
          <Row label="Panel material">
            <select className={fieldClass()} value={settings.glass_material} onChange={(e) => set("glass_material", e.target.value)}>
              {["off", "frosted", "acrylic", "mica", "glass"].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Row>
          <Row label="Panel tint">
            <input type="color" value={settings.glass_tint || "#ffffff"} onChange={(e) => set("glass_tint", e.target.value)} />
          </Row>
        </>;
      case "Try it out":
        return <p className="reading-sample rounded-md border border-panel-border p-3">
          The quick brown fox jumps over the lazy dog. 0123456789
        </p>;
      case "Focus":
        return <>
          <Row label="Focus mode">
            <select className={fieldClass()} value={settings.focus_mode} onChange={(e) => set("focus_mode", e.target.value)}>
              {["off", "lines", "fade", "gutter"].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Row>
          {(["blur_intensity", "fade_output", "fade_shell", "fade_settings"] as const).map((key) => (
            <Row key={key} label={key.replace(/_/g, " ")}>
              <input type="range" min="0" max="1" step="0.05" value={settings[key]}
                onChange={(e) => set(key, Number(e.target.value))} />
            </Row>
          ))}
          <Row label="Reading ruler"><input type="checkbox" checked={settings.reading_ruler} onChange={(e) => set("reading_ruler", e.target.checked)} /></Row>
          <Row label="Icons only"><input type="checkbox" checked={settings.icon_only} onChange={(e) => set("icon_only", e.target.checked)} /></Row>
          <Row label="Show shortcut labels"><input type="checkbox" checked={settings.show_shortcut_label} onChange={(e) => set("show_shortcut_label", e.target.checked)} /></Row>
        </>;
      case "Motion":
        return <Row label="Reduced motion">
          <select className={fieldClass()} value={settings.reduce_motion === null ? "system" : String(settings.reduce_motion)}
            onChange={(e) => set("reduce_motion", e.target.value === "system" ? null : e.target.value === "true")}>
            <option value="system">Follow system</option><option value="true">Reduce</option><option value="false">Full motion</option>
          </select>
        </Row>;
      case "Sound":
        return <Row label="Sounds"><input type="checkbox" checked={settings.sound_enabled} onChange={(e) => set("sound_enabled", e.target.checked)} /></Row>;
      case "Controls":
        return <Row label="Error messages">
          <select className={fieldClass()} value={settings.error_type} onChange={(e) => set("error_type", e.target.value)}>
            <option value="custom">Plain English</option><option value="system">Python's own words</option>
          </select>
        </Row>;
      case "Keyboard":
        return <>
          <Row label="Run key"><output>{settings.run_key}</output></Row>
          <Row label="Stop key"><output>{settings.stop_key}</output></Row>
        </>;
      case "Reading Aloud":
        return <>
          <Row label="Reading aloud on"><input type="checkbox" checked={settings.tts_enabled} onChange={(e) => set("tts_enabled", e.target.checked)} /></Row>
          <Row label="Hover scope">
            <select className={fieldClass()} value={settings.tts_hover_scope} onChange={(e) => set("tts_hover_scope", e.target.value)}>
              {["off", "controls", "all"].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Row>
          <Row label="Hover delay (ms)">
            <input type="number" min="0" max="3000" value={settings.tts_hover_delay} onChange={(e) => set("tts_hover_delay", Number(e.target.value))} />
          </Row>
          <Row label="Speaking rate">
            <input type="range" min="0.5" max="1.5" step="0.1" value={settings.tts_rate} onChange={(e) => set("tts_rate", Number(e.target.value))} />
          </Row>
          <Row label="Click to speak"><input type="checkbox" checked={settings.tts_click_to_speak} onChange={(e) => set("tts_click_to_speak", e.target.checked)} /></Row>
          {(["tts_hover_code", "tts_hover_output", "tts_hover_shell"] as const).map((key) => (
            <Row key={key} label={key.replace("tts_hover_", "Read ")}>
              <input type="checkbox" checked={settings[key]} onChange={(e) => set(key, e.target.checked)} />
            </Row>
          ))}
        </>;
      case "Updates":
        return <>
          <Row label="Check automatically"><input type="checkbox" checked={settings.auto_update} onChange={(e) => set("auto_update", e.target.checked)} /></Row>
          <Row label="Channel">
            <select className={fieldClass()} value={settings.update_channel} onChange={(e) => set("update_channel", e.target.value)}>
              <option value="beta">Beta</option><option value="stable">Stable</option>
            </select>
          </Row>
          <button type="button" className="min-h-11 rounded-md border border-panel-border bg-panel px-3"
            onClick={() => void post<{ version?: string }>("/api/update/check").then((data) => setUpdateStatus(data.version || "Checked.")).catch(() => setUpdateStatus("Check failed."))}>
            Check now
          </button>
          <p role="status">{updateStatus}</p>
        </>;
      case "Backup":
        return <>
          <p>Export or import settings through the Flask API.</p>
          <a className="underline" href="/api/config/export">Download settings</a>
          <label className="block">Import settings
            <input type="file" accept="application/json,.json" className="mt-1"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                void post("/api/config/import", { json: file }).catch(() => setImportStatus("Import failed."));
              }} />
          </label>
          <p role="status">{importStatus}</p>
        </>;
      case "Interface":
        return <>
          <Row label="Interface">
            <select className={fieldClass()} value={settings.ui_backend} onChange={(e) => set("ui_backend", e.target.value)}>
              <option value="flask">Classic</option><option value="react">New UI</option>
            </select>
          </Row>
          <Row label="Show setup again"><input type="checkbox" checked={!settings.setup_complete} onChange={(e) => set("setup_complete", !e.target.checked)} /></Row>
        </>;
      case "Reset":
        return <>
          <p>Put every setting back to its default.</p>
          <button type="button" className="min-h-11 rounded-md border border-panel-border bg-panel px-4" onClick={() => void reset()}>Reset settings</button>
        </>;
      case "About":
        return <>
          <p>Jojo Code — an accessible editor for dyslexic and neurodivergent learners.</p>
          <p>Version: {version || "unknown"}</p>
          <a className="underline" href="/faq">Frequently asked questions</a>
        </>;
      default:
        return null;
    }
  };

  return (
    <ModalFrame title="Settings" onClose={onClose} wide>
      <div className="grid gap-4 md:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="space-y-1">
          {SECTIONS.map((name) => (
            <button key={name} type="button" aria-current={section === name ? "page" : undefined}
              className="min-h-11 w-full rounded-md border border-panel-border bg-background px-3 text-left text-foreground"
              onClick={() => setSection(name)}>
              {name}
            </button>
          ))}
        </nav>
        <section aria-label={section} className="min-w-0">
          <h3 className="mb-3 text-lg font-semibold">{section}</h3>
          {renderSection()}
        </section>
      </div>
      <p role="status">{status}</p>
    </ModalFrame>
  );
}
