import { useEffect, useState } from "react";
import { useFlaskApi } from "../../hooks/useFlaskApi";
import { ModalFrame } from "./ModalFrame";

export function FeedbackModal({ onClose }: { onClose: () => void }) {
  const { get, post } = useFlaskApi();
  const [signedIn, setSignedIn] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [positive, setPositive] = useState("");
  const [negative, setNegative] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    void get<{ email?: string }>("/api/auth/me")
      .then((data) => setSignedIn(!!data.email))
      .catch(() => setSignedIn(false));
  }, [get]);

  const field = "min-h-11 w-full rounded-md border border-panel-border bg-background px-2 text-foreground";

  return (
    <ModalFrame
      title="Feedback"
      description={signedIn ? "Sent from your account." : undefined}
      onClose={onClose}
    >
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void post("/api/feedback", {
            name: signedIn ? undefined : name,
            email: signedIn ? undefined : email,
            rating, positive, negative,
          })
            .then(() => { setStatus("Thank you. Your feedback was saved."); setPositive(""); setNegative(""); })
            .catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Could not save feedback."));
        }}
      >
        {!signedIn ? (
          <>
            <label className="block"><span className="block text-sm">Name</span>
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label className="block"><span className="block text-sm">Email</span>
              <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          </>
        ) : null}
        <label className="block">
          <span className="block text-sm">Rating</span>
          <select className={field} value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{"★".repeat(value)}</option>)}
          </select>
        </label>
        <label className="block"><span className="block text-sm">What did you like?</span>
          <textarea className={field} rows={4} value={positive} onChange={(e) => setPositive(e.target.value)} /></label>
        <label className="block"><span className="block text-sm">What would you improve?</span>
          <textarea className={field} rows={4} value={negative} onChange={(e) => setNegative(e.target.value)} /></label>
        <button type="submit" className="btn">
          Send feedback
        </button>
        <p role="status">{status}</p>
      </form>
    </ModalFrame>
  );
}
