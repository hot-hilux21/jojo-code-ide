import { useCallback, useState } from "react";
import { useFlaskApi } from "./useFlaskApi";

export interface TraceRow {
  line?: number;
  variable?: string;
  value?: string;
  [key: string]: unknown;
}

export interface RunResult {
  output: string;
  error: string;
  error_line?: number | null;
  awaiting_answer: boolean;
  stopped?: boolean;
  trace?: { rows?: TraceRow[] } | null;
}

const IDLE_RUN: RunResult = {
  output: "",
  error: "",
  awaiting_answer: false,
  trace: null,
};

/** All workspace state lives here; no component reaches into the page. */
export function useWorkspace() {
  const { post } = useFlaskApi();
  const [code, setCode] = useState("# Write Python here\n");
  const [result, setResult] = useState<RunResult>(IDLE_RUN);
  const [answers, setAnswers] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [shellSession, setShellSession] = useState<string | null>(null);
  const [shellOutput, setShellOutput] = useState("");
  const [shellInput, setShellInput] = useState("");
  const [shellBusy, setShellBusy] = useState(false);

  const run = useCallback(async (replay: string[] = []) => {
    setRunning(true);
    setStatus("");
    try {
      const data = await post<RunResult>("/api/run", { code, answers: replay });
      setResult(data);
      setAnswers(replay);
      if (data.awaiting_answer) setAnswer("");
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Could not run the code.");
    } finally {
      setRunning(false);
    }
  }, [code, post]);

  const stop = useCallback(async () => {
    try {
      await post("/api/run/stop");
      setResult((previous) => ({ ...previous, output: previous.output, stopped: true }));
      setRunning(false);
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Could not stop the run.");
    }
  }, [post]);

  const answerQuestion = useCallback(async () => {
    const next = [...answers, answer];
    setAnswer("");
    await run(next);
  }, [answers, answer, run]);

  const clearOutput = useCallback(() => {
    setResult(IDLE_RUN);
    setAnswers([]);
    setAnswer("");
    setStatus("");
  }, []);

  const openShell = useCallback(async () => {
    try {
      const data = (await post("/api/shell/start")) as { session?: string };
      setShellSession(data.session || null);
      setShellOutput("");
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Could not open the shell.");
    }
  }, [post]);

  const closeShell = useCallback(async () => {
    if (!shellSession) return;
    try {
      await post("/api/shell/stop", { session: shellSession });
    } catch {
      // The session may already be gone; the UI still closes.
    }
    setShellSession(null);
    setShellOutput("");
  }, [post, shellSession]);

  const execShell = useCallback(async () => {
    const command = shellInput.trim();
    if (!command || !shellSession || shellBusy) return;
    setShellOutput((previous) => previous + "> " + command + "\n");
    setShellInput("");
    setShellBusy(true);
    try {
      const data = (await post("/api/shell/exec", {
        session: shellSession,
        code: command,
      })) as { output?: string; error?: string };
      setShellOutput((previous) => previous + (data.output || data.error || "") + "\n");
    } catch (error: unknown) {
      setShellOutput((previous) => previous +
        (error instanceof Error ? error.message : "Shell command failed.") + "\n");
    } finally {
      setShellBusy(false);
    }
  }, [shellInput, shellSession, shellBusy, post]);

  const resetShell = useCallback(async () => {
    if (!shellSession) return;
    await post("/api/shell/reset", { session: shellSession });
    setShellOutput("");
  }, [post, shellSession]);

  return {
    code, setCode,
    result, running, status,
    answers, answer, setAnswer, answerQuestion,
    run, stop, clearOutput,
    shellSession, shellOutput, shellInput, setShellInput,
    shellBusy, openShell, closeShell, execShell, resetShell,
  };
}

export type Workspace = ReturnType<typeof useWorkspace>;
