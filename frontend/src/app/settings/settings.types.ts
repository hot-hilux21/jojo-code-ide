/** The Settings panel, in one place. Mirrors routes.DEFAULT_CONFIG. */
export interface Settings {
  font: string;
  font_in_code: boolean;
  font_in_output: boolean;
  font_in_shell: boolean;
  font_in_ui: boolean;
  font_size: number;
  font_weight: number;
  locale: string;
  setup_complete: boolean;
  setup_step: number;
  highlight_color: string;
  line_height: number;
  letter_spacing: number;
  word_spacing: number;
  run_key: string;
  stop_key: string;
  theme: string;
  icon_only: boolean;
  show_shortcut_label: boolean;
  reading_ruler: boolean;
  focus_mode: string;
  blur_intensity: number;
  error_type: string;
  fade_output: number;
  fade_shell: number;
  fade_settings: number;
  contrast: string;
  reduce_motion: boolean | null;
  sound_enabled: boolean;
  glass_material: string;
  glass_tint: string;
  theme_custom_bg: string;
  theme_custom_fg: string;
  theme_custom_page: string;
  theme_custom_selection: string;
  theme_custom_keyword: string;
  theme_custom_string: string;
  theme_custom_comment: string;
  theme_custom_number: string;
  theme_custom_function: string;
  theme_custom_error: string;
  theme_gradient: boolean;
  tts_enabled: boolean;
  tts_engine: string;
  tts_voice: string;
  tts_rate: number;
  tts_hover_scope: string;
  tts_hover_delay: number;
  tts_hover_code: boolean;
  tts_hover_output: boolean;
  tts_hover_shell: boolean;
  tts_click_to_speak: boolean;
  tts_voice_gender: string;
  auto_update: boolean;
  update_channel: string;
  ui_backend: string;
}

export type SettingsPatch = Partial<Settings>;

export interface ThemeInfo {
  name: string;
  bg: string;
  fg: string;
  selection: string;
  highlight: string;
  cursor: string;
  gutter_bg: string;
  gutter_fg: string;
  keyword: string;
  string: string;
  comment: string;
  number: string;
  function: string;
  variable: string;
  operator: string;
  punctuation: string;
  [key: string]: string;
}

export type ThemeMap = Record<string, ThemeInfo>;

export interface FontInfo {
  name: string;
  family: string;
}

export type FontMap = Record<string, FontInfo>;
