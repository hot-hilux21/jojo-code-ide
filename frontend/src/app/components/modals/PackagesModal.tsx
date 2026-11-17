import { useEffect, useState } from "react";
import { useFlaskApi } from "../../hooks/useFlaskApi";
import { ModalFrame } from "./ModalFrame";

interface PackageReply {
  packages?: string[];
  error?: string;
}

export function PackagesModal({ onClose }: { onClose: () => void }) {
  const { get, post } = useFlaskApi();
  const [packages, setPackages] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");

  const load = () => {
    void get<PackageReply>("/api/packages/list")
      .then((data) => setPackages(data.packages || []))
      .catch(() => setStatus("Could not list packages."));
  };

  useEffect(load, [get]);

  return (
    <ModalFrame title="Packages" description="Extra Python packages for the desktop app." onClose={onClose}>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void post<PackageReply>("/api/packages/install", { name })
            .then((data) => {
              setStatus(data.error || `Installed ${name}.`);
              setName("");
              load();
            })
            .catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Install failed."));
        }}
      >
        <label className="sr-only" htmlFor="package-name">Package name</label>
        <input
          id="package-name"
          className="min-h-11 flex-1 rounded-md border border-panel-border bg-background px-2 text-foreground"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button type="submit" className="min-h-11 rounded-md border border-panel-border bg-panel px-3 text-foreground">
          Install
        </button>
      </form>
      <p role="status">{status}</p>
      <ul className="space-y-1">
        {packages.map((item) => <li key={item}>{item}</li>)}
        {!packages.length ? <li>No packages installed yet.</li> : null}
      </ul>
    </ModalFrame>
  );
}
