# New UI Repair — Phase 1 audit and architecture

## Current React code

| Item | Finding |
|---|---|
| Entry | `frontend/src/main.tsx`, `frontend/src/App.tsx` |
| `App.tsx` | 1,536 lines, one component, 39 `useState`, 4 `useEffect`, 0 `useRef` |
| Direct DOM | 0 `document.querySelector`, 0 `document.getElementById`, 0 `window.addEventListener` — the current React port is already state-driven for toggles |
| Theme sync | One `useEffect` in `App.tsx` writes `data-theme` on `body`, toggles `.dark`, and sets font/spacing variables on `body.style` |
| Modals | No Radix dialogs; `showGlossary`, `showTrace`, `screen` state switch whole screens; no `activeModal` union |
| Speech | No `speechSynthesis` use in `frontend/src` — Web Speech is still in the Flask `app.js` |
| Keyboard | Recording effect in `App.tsx` for run/stop keys; no reusable hook |
| UI kit | `@base-ui/react` primitives wrapped in `src/components/ui/*`, Tailwind 4, framer-motion, `@uiw/react-codemirror` |
| Build | `npm run build` passes; single ~995 kB JS chunk (warning only) |

## Flask API surface actually called by the React app

`/api/config`, `/api/config/reset`, `/api/credits`, `/api/fonts`,
`/api/fonts/delete`, `/api/fonts/upload`, `/api/glossary`, `/api/run`,
`/api/run/stop`, `/api/shell/exec`, `/api/shell/reset`, `/api/shell/start`,
`/api/shell/stop`, `/api/themes`, `/api/update/apply`, `/api/update/check`,
`/api/update/install`, `/api/version`.

Backend routes not used yet by React but required by the target UI:
`/api/auth/*`, `/api/user/*`, `/api/packages/*`, `/api/feedback`,
`/api/analytics`, `/api/achievements`, `/api/progress`, `/api/leaderboard`,
`/api/config/export`, `/api/config/import`, `/api/profile/apply`, `/admin/*`.

Keep the Flask API unchanged. React consumes it; it does not replace it.

## Proposed folder structure

```
frontend/src/
  app/
    AppShell.tsx              # 100dvh grid shell, overflow-hidden, pane scrolling
    TopBar.tsx                # run/stop/clear/trace/save/open/focus/tools
    MainWorkspace.tsx         # editor + output + shell + trace panes
    providers/
      SettingsProvider.tsx    # settings store (Context + localStorage + Flask config)
      SpeechProvider.tsx      # Web Speech, hover/click reading
      ModalProvider.tsx       # single activeModal state
    hooks/
      useThemeSync.ts         # ONE hook: settings -> :root CSS variables/data state
      useKeyboardShortcuts.ts # configurable run/stop chords
      useFlaskApi.ts          # typed fetch helpers
      useSpeakable.ts         # hover delay + click-to-speak
    settings/
      settings.types.ts       # all preferences, one Settings type
      settings.defaults.ts    # mirrors routes.DEFAULT_CONFIG
      settings.persistence.ts # localStorage load/save
    components/
      CodeEditor.tsx
      OutputPane.tsx
      PythonShell.tsx
      TraceTable.tsx
      FocusDrawer.tsx
      Speakable.tsx
      modals/
        ModalHost.tsx         # only activeModal mounts
        SettingsModal.tsx
        DictionaryModal.tsx
        CreditsModal.tsx
        FeedbackModal.tsx
        PackagesModal.tsx
        MyFilesModal.tsx
        AccountModal.tsx
        AuthModal.tsx
        QuitConfirmModal.tsx
    styles/
      tokens.css              # :root tokens consumed by Tailwind/CSS modules
      shell.css               # 100dvh grid, no global UI state classes
```

## Phase 1 decisions

- Use React Context + reducer, no new state dependency.
- Server config is authoritative on load; `localStorage` is the offline cache
  and immediate write-through. Patches POST to `/api/config` with the stored
  access code, never stored in the settings object.
- `useThemeSync` writes custom properties to `document.documentElement`
  only. Components never set inline visual styles from settings.
- Keep `App.tsx` working until Phase 2; Phase 1 adds the store and hook
  alongside it, then wraps the tree in `SettingsProvider`.

## Phase status

| Phase | State | Evidence |
|---|---|---|
| 1 Audit & state foundation | Done | `src/app/settings/*`, `useThemeSync.ts`, this audit |
| 2 App shell & workspace | Done | `AppShell.tsx`, `TopBar.tsx`, `MainWorkspace.tsx`, `useWorkspace.ts`, `shell.css` |
| 3 Radix modals | Done | `ModalHost.tsx` plus nine dialogs; `@radix-ui/react-dialog` installed |
| 4 Speech, sound, shortcuts, cleanup | Done | `SpeechProvider.tsx`, `useSpeakable.ts`, `useKeyboardShortcuts.ts` |

The classic UI remains the default through `ui_backend`. "Try the new UI"
switches to the React shell; "Classic UI" switches back. A reviewer can verify
each phase with `npm run build` and `npm run lint` in `frontend/`.

Rule checks over `frontend/src/app`: no `document.querySelector`,
`document.getElementById`, `getElementsBy`, or `style={{` overrides. Theme
changes go through the single `useThemeSync` hook to `:root` custom properties.

Tailwind work follows the component patterns in `https://hyperui.dev/llms.txt`:
the Settings sidebar uses the accessible side-menu pattern and the profile
picture picker uses the file-uploader pattern, both recoloured with the app's
CSS tokens so dark mode and custom themes still apply.

Browser QA against a local Flask server at `font-size: 24px`, `line-height: 2`,
`letter-spacing: 0.5px`, `word-spacing: 0.5px`:

- `.app-shell` height matched the 718px viewport; no page scroll.
- 14 toolbar buttons, zero outside the viewport.
- `:root` computed variables read back as 24px / 2 / 0.5px / 0.5px.
- Settings dialog opened with one Radix dialog; Keyboard showed editable Run
  and Stop keys with Record buttons; Reading Aloud showed Voice and Voice
  preference; Colours showed all ten custom colour wells.
- With speech enabled and a stubbed `speechSynthesis.speak`, hovering Run,
  the editor, output and shell produced the matching spoken labels.
