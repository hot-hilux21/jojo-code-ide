import { useEffect } from "react";
import type { FontMap, Settings, ThemeMap } from "../settings/settings.types";

const FALLBACK_UI =
  '"Atkinson Hyperlegible", "Segoe UI", "Helvetica Neue", sans-serif';
const FALLBACK_MONO =
  '"Consolas", "Cascadia Mono", ui-monospace, monospace';

const RTL_LOCALES = new Set(["ar", "hj"]);

function familyOf(fonts: FontMap, key: string, fallback: string): string {
  return fonts[key]?.family || fallback;
}

/**
 * The single bridge from saved settings to the stylesheet.
 * It writes custom properties on :root; components read them through
 * Tailwind/CSS tokens and never build visual styles inline.
 */
export function useThemeSync(
  settings: Settings,
  themes: ThemeMap,
  fonts: FontMap,
): void {
  useEffect(() => {
    const root = document.documentElement;
    const theme = themes[settings.theme] || themes["high-contrast"];
    const bg = theme?.bg || "#0b0b0b";
    const fg = theme?.fg || "#ffffff";
    const face = familyOf(fonts, settings.font, FALLBACK_UI);
    const mono = FALLBACK_MONO;

    const vars: Record<string, string> = {
      "--font-family": face,
      "--font-ui": settings.font_in_ui ? face : FALLBACK_UI,
      "--font-code": settings.font_in_code ? face : mono,
      "--font-output": settings.font_in_output ? face : mono,
      "--font-shell": settings.font_in_shell ? face : mono,
      "--font-size": `${settings.font_size}px`,
      "--font-weight": String(settings.font_weight),
      "--line-height": String(settings.line_height),
      "--letter-spacing": `${settings.letter_spacing}px`,
      "--word-spacing": `${settings.word_spacing}px`,
      "--bg": bg,
      "--fg": fg,
      "--background": bg,
      "--foreground": fg,
      "--card": bg,
      "--card-foreground": fg,
      "--popover": bg,
      "--popover-foreground": fg,
      "--primary": fg,
      "--primary-foreground": bg,
      "--secondary": `color-mix(in srgb, ${fg} 12%, ${bg})`,
      "--secondary-foreground": fg,
      "--muted": `color-mix(in srgb, ${fg} 70%, ${bg})`,
      "--muted-foreground": `color-mix(in srgb, ${fg} 70%, ${bg})`,
      "--accent": theme?.cursor || fg,
      "--accent-foreground": bg,
      "--border": `color-mix(in srgb, ${fg} 25%, ${bg})`,
      "--input": `color-mix(in srgb, ${fg} 25%, ${bg})`,
      "--ring": theme?.cursor || fg,
      "--panel-bg": `color-mix(in srgb, ${bg} 88%, ${fg})`,
      "--panel-border": `color-mix(in srgb, ${fg} 25%, ${bg})`,
      "--selection": theme?.selection || `color-mix(in srgb, ${fg} 25%, ${bg})`,
      "--highlight": theme?.highlight || bg,
      "--cursor": theme?.cursor || fg,
      "--gutter-bg": theme?.gutter_bg || bg,
      "--gutter-fg": theme?.gutter_fg || fg,
      "--syntax-keyword": theme?.keyword || fg,
      "--syntax-string": theme?.string || fg,
      "--syntax-comment": theme?.comment || fg,
      "--syntax-number": theme?.number || fg,
      "--syntax-function": theme?.function || fg,
      "--syntax-variable": theme?.variable || fg,
      "--syntax-operator": theme?.operator || fg,
      "--syntax-punctuation": theme?.punctuation || fg,
      "--blur-intensity": String(settings.blur_intensity),
      "--fade-output": String(settings.fade_output),
      "--fade-shell": String(settings.fade_shell),
      "--fade-settings": String(settings.fade_settings),
      "--theme-gradient": settings.theme_gradient ? "1" : "0",
      "--glass-tint": settings.glass_tint,
      "--reading-ruler-opacity": settings.reading_ruler ? "1" : "0",
      "--shortcut-label-opacity": settings.show_shortcut_label ? "1" : "0",
      "--btn-label-display": settings.icon_only ? "none" : "inline",
    };

    if (settings.highlight_color) vars["--active-line"] = settings.highlight_color;
    else delete vars["--active-line"];
    if (settings.contrast === "extra") vars["--contrast-boost"] = "1";
    else delete vars["--contrast-boost"];

    for (const [name, value] of Object.entries(vars)) {
      root.style.setProperty(name, value);
    }

    const prefersReduced =
      typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reduced = settings.reduce_motion === null ? prefersReduced : settings.reduce_motion;
    root.dataset.reduceMotion = reduced ? "true" : "false";
    root.dataset.theme = settings.theme;
    root.dataset.contrast = settings.contrast;
    root.dataset.focusMode = settings.focus_mode;
    root.dataset.glassMaterial = settings.glass_material;
    root.dataset.errorType = settings.error_type;
    root.lang = settings.locale;
    root.dir = RTL_LOCALES.has(settings.locale) ? "rtl" : "ltr";
  }, [settings, themes, fonts]);
}
