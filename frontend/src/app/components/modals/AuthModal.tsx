import { useState } from "react";
import { useFlaskApi } from "../../hooks/useFlaskApi";
import { ModalFrame } from "./ModalFrame";

type Mode = "login" | "signup" | "confirm" | "reset" | "reset-confirm";

export function AuthModal({ onClose }: { onClose: () => void }) {
  const { post } = useFlaskApi();
  const [mode, setMode] = useState<Mode>("login");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");

  const field = "min-h-11 w-full rounded-md border border-panel-border bg-background px-2 text-foreground";

  const send = (path: string, body: Record<string, unknown>, done: (data: any) => void) => {
    void post(path, body)
      .then((data: any) => {
        setStatus(data.error || "");
        if (data.success) done(data);
      })
      .catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Request failed."));
  };

  return (
    <ModalFrame title="Account" onClose={onClose}>
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Account actions">
        <button type="button" className="min-h-11 rounded-md border border-panel-border bg-panel px-3" onClick={() => setMode("login")}>Log in</button>
        <button type="button" className="min-h-11 rounded-md border border-panel-border bg-panel px-3" onClick={() => setMode("signup")}>Create account</button>
        <button type="button" className="min-h-11 rounded-md border border-panel-border bg-panel px-3" onClick={() => setMode("reset")}>Reset password</button>
      </div>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (mode === "login") {
            send("/api/auth/login", { username: identifier, password }, () => { setStatus("Logged in."); onClose(); });
          } else if (mode === "signup") {
            send("/api/auth/register", { email, password }, () => { setMode("confirm"); setStatus("Check your email for the code."); });
          } else if (mode === "confirm") {
            send("/api/auth/register/confirm", { email, code }, () => { setStatus("Account created."); onClose(); });
          } else if (mode === "reset") {
            send("/api/auth/reset/request", { username: identifier }, () => { setMode("reset-confirm"); setStatus("Check your email for the code."); });
          } else {
            send("/api/auth/reset/confirm", { username: identifier, code, new_password: password }, () => { setStatus("Password changed."); setMode("login"); });
          }
        }}
      >
        {mode === "signup" || mode === "confirm" ? (
          <label className="block"><span className="block text-sm">Email</span>
            <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        ) : (
          <label className="block"><span className="block text-sm">Username or email</span>
            <input className={field} value={identifier} onChange={(e) => setIdentifier(e.target.value)} /></label>
        )}
        {mode !== "confirm" && mode !== "reset" ? (
          <label className="block"><span className="block text-sm">Password</span>
            <input className={field} type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        ) : null}
        {mode === "confirm" || mode === "reset-confirm" ? (
          <label className="block"><span className="block text-sm">Code from email</span>
            <input className={field} inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} /></label>
        ) : null}
        <button type="submit" className="min-h-11 rounded-md border border-panel-border bg-panel px-4 text-foreground">Continue</button>
        <p role="status">{status}</p>
      </form>
    </ModalFrame>
  );
}
