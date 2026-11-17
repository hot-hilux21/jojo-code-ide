import { ThemeProvider } from "next-themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppRouter } from "./app/AppRouter";
import { SettingsProvider } from "./app/providers/SettingsProvider";
import "./app/styles/shell.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <AppRouter />
      </SettingsProvider>
    </ThemeProvider>
  </StrictMode>,
);
