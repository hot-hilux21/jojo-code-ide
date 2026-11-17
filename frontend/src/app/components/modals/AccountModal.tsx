import { useEffect, useState } from "react";
import { useFlaskApi } from "../../hooks/useFlaskApi";
import { ModalFrame } from "./ModalFrame";
import type { ModalName } from "../TopBar";

interface Progress {
  xp?: number;
  level?: number;
  label?: string;
  percent?: number;
  streak?: { current?: number; best?: number };
  optin?: boolean;
}

interface AchievementReply {
  earned?: string[];
  all?: string[];
}

interface LeaderboardReply {
  rows?: Array<{ username: string; label: string; xp: number }>;
}

export function AccountModal({
  onClose,
  openModal,
}: {
  onClose: () => void;
  openModal: (name: ModalName) => void;
}) {
  const { get, post } = useFlaskApi();
  const [signedIn, setSignedIn] = useState(false);
  const [progress, setProgress] = useState<Progress>({});
  const [achievements, setAchievements] = useState<AchievementReply>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardReply>({});
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");

  const load = () => {
    void get<{ email?: string }>("/api/auth/me")
      .then((data) => {
        setSignedIn(!!data.email);
        if (data.email) {
          void get<Progress>("/api/progress").then(setProgress).catch(() => setProgress({}));
          void get<AchievementReply>("/api/achievements").then(setAchievements).catch(() => setAchievements({}));
          void get<LeaderboardReply>("/api/leaderboard").then(setLeaderboard).catch(() => setLeaderboard({}));
        }
      })
      .catch(() => setSignedIn(false));
  };

  useEffect(load, [get]);

  const field = "min-h-11 w-full rounded-md border border-panel-border bg-background px-2 text-foreground";

  return (
    <ModalFrame title="Account" onClose={onClose} wide>
      {!signedIn ? (
        <div className="space-y-3">
          <p>Sign in to keep your code, themes and progress with you.</p>
          <button type="button" className="min-h-11 rounded-md border border-panel-border bg-panel px-4" onClick={() => openModal("login")}>Log in or create account</button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="space-y-2" aria-labelledby="account-progress">
            <h3 id="account-progress" className="font-semibold">Rank</h3>
            <p>{progress.label || "Bronze I"} — level {progress.level || 1}</p>
            <p>{progress.xp || 0} XP</p>
            <p>Day streak: {progress.streak?.current || 0} (best {progress.streak?.best || 0})</p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!progress.optin}
                onChange={(event) => {
                  void post("/api/leaderboard/optin", { on: event.target.checked }).then(load);
                }}
              />
              Show me on the leaderboard
            </label>
            <h3 className="font-semibold">Badges</h3>
            <ul className="flex flex-wrap gap-2">
              {(achievements.all || []).map((key) => (
                <li key={key} className="rounded-md border border-panel-border px-2 py-1">
                  {(achievements.earned || []).includes(key) ? key : `${key} (locked)`}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2" aria-labelledby="account-settings">
            <h3 id="account-settings" className="font-semibold">Account settings</h3>
            <form className="space-y-2" onSubmit={(event) => {
              event.preventDefault();
              void post("/api/auth/username", { username })
                .then(() => { setStatus("Username saved."); load(); })
                .catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Could not save."));
            }}>
              <label className="block"><span className="block text-sm">Username</span>
                <input className={field} value={username} onChange={(e) => setUsername(e.target.value)} /></label>
              <button type="submit" className="min-h-11 rounded-md border border-panel-border bg-panel px-3">Save username</button>
            </form>
            <form className="space-y-2" onSubmit={(event) => {
              event.preventDefault();
              void post("/api/auth/change-password", { current: currentPassword, new: newPassword })
                .then(() => { setStatus("Password changed."); setCurrentPassword(""); setNewPassword(""); })
                .catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Could not change password."));
            }}>
              <label className="block"><span className="block text-sm">Current password</span>
                <input className={field} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></label>
              <label className="block"><span className="block text-sm">New password</span>
                <input className={field} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></label>
              <button type="submit" className="min-h-11 rounded-md border border-panel-border bg-panel px-3">Change password</button>
            </form>
            <form className="space-y-2" onSubmit={(event) => {
              event.preventDefault();
              void post("/api/auth/email/request", { email })
                .then(() => setStatus("Check your email for the code."))
                .catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Could not send code."));
            }}>
              <label className="block"><span className="block text-sm">Add or change email</span>
                <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
              <button type="submit" className="min-h-11 rounded-md border border-panel-border bg-panel px-3">Send code</button>
            </form>
            <form className="space-y-2" onSubmit={(event) => {
              event.preventDefault();
              void post("/api/auth/email/confirm", { email, code })
                .then(() => { setStatus("Email verified."); load(); })
                .catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Could not verify."));
            }}>
              <label className="block"><span className="block text-sm">Email code</span>
                <input className={field} inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} /></label>
              <button type="submit" className="min-h-11 rounded-md border border-panel-border bg-panel px-3">Verify email</button>
            </form>
            <label
              htmlFor="avatar-upload"
              className="flex cursor-pointer flex-col items-center rounded-lg border border-dashed border-panel-border bg-background p-4 text-foreground"
            >
              <span className="mt-2 font-medium">Choose profile picture</span>
              <span className="mt-2 inline-block min-h-11 rounded-md border border-panel-border bg-panel px-3 py-2 text-sm">
                Browse files
              </span>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  void post("/api/user/avatar", { avatar: reader.result }).then(load);
                };
                reader.readAsDataURL(file);
              }}
              />
            </label>
            <button
              type="button"
              className="min-h-11 rounded-md border border-panel-border bg-panel px-3"
              onClick={() => void post("/api/auth/disconnect").then(() => { onClose(); load(); })}
            >
              Sign out
            </button>
          </section>

          <section className="md:col-span-2" aria-labelledby="account-leaderboard">
            <h3 id="account-leaderboard" className="font-semibold">Leaderboard</h3>
            <ol className="space-y-1">
              {(leaderboard.rows || []).map((row, index) => (
                <li key={row.username}>{index + 1}. {row.username} — {row.label}, {row.xp} XP</li>
              ))}
              {!leaderboard.rows?.length ? <li>Nobody has joined yet.</li> : null}
            </ol>
          </section>
        </div>
      )}
      <p role="status">{status}</p>
    </ModalFrame>
  );
}
