import { useState } from "react";
import { useFlaskApi } from "../../hooks/useFlaskApi";
import { ModalFrame } from "./ModalFrame";

export function QuitConfirmModal({ onClose }: { onClose: () => void }) {
  const { post } = useFlaskApi();
  const [status, setStatus] = useState("");

  return (
    <ModalFrame title="Quit Jojo Code?" description="Any unsaved code stays in the editor draft." onClose={onClose}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn"
          onClick={() => {
            void post("/api/shutdown")
              .then(() => setStatus("Closing the app."))
              .catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Could not quit."));
          }}
        >
          Quit
        </button>
        <button type="button" className="btn" onClick={onClose}>
          Stay
        </button>
      </div>
      <p role="status">{status}</p>
    </ModalFrame>
  );
}
