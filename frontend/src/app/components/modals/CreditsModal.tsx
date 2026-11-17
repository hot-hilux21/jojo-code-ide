import { useEffect, useState } from "react";
import { useFlaskApi } from "../../hooks/useFlaskApi";
import { ModalFrame } from "./ModalFrame";

export function CreditsModal({ onClose }: { onClose: () => void }) {
  const { get } = useFlaskApi();
  const [credits, setCredits] = useState<string[]>([]);

  useEffect(() => {
    void get<string[]>("/api/credits").then(setCredits).catch(() => setCredits([]));
  }, [get]);

  return (
    <ModalFrame title="Credits" onClose={onClose}>
      <ul className="space-y-2">
        {credits.map((credit, index) => (
          <li key={index}>{credit}</li>
        ))}
      </ul>
    </ModalFrame>
  );
}
