import { useSpeakable } from "../hooks/useSpeakable";
import type { Workspace } from "../hooks/useWorkspace";

export function OutputPane({ workspace }: { workspace: Workspace }) {
  const { result, answer, setAnswer, answerQuestion, status } = workspace;
  const outputSpeech = useSpeakable("Program output", "output");
  const answerSpeech = useSpeakable("Answer the program's question");
  return (
    <section className="workspace-pane" aria-labelledby="output-heading" aria-label="Program output" tabIndex={0} {...outputSpeech}>
      <header id="output-heading" className="font-semibold">
        Output
      </header>
      <div className="pane-scroll" role="log" aria-live="polite">
        <div>{result.output || (result.stopped ? "Stopped." : "")}</div>
        {result.error ? <div className="error-text">{result.error}</div> : null}
        {status ? <div className="error-text">{status}</div> : null}
        {result.awaiting_answer ? (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void answerQuestion();
            }}
          >
            <label className="sr-only" htmlFor="answer-input" {...answerSpeech}>
              Answer the program's question
            </label>
            <input
              id="answer-input"
              className="min-h-11 flex-1 rounded-md border border-panel-border bg-background px-2 text-foreground"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              autoComplete="off"
            />
            <button
              type="submit"
              className="btn btn-small"
            >
              Send
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
