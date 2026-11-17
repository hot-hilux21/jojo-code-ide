import { useEffect, useState } from "react";
import { useFlaskApi } from "../../hooks/useFlaskApi";
import type { Workspace } from "../../hooks/useWorkspace";
import { ModalFrame } from "./ModalFrame";

interface SavedFile {
  name: string;
  size?: number;
  modified?: number;
}

interface FileReply {
  success?: boolean;
  files?: SavedFile[];
  code?: string;
  error?: string;
}

export function MyFilesModal({
  onClose,
  workspace,
}: {
  onClose: () => void;
  workspace: Workspace;
}) {
  const { get, post } = useFlaskApi();
  const [files, setFiles] = useState<SavedFile[]>([]);
  const [name, setName] = useState("autosave.py");
  const [status, setStatus] = useState("");

  const load = () => {
    void get<FileReply>("/api/user/files")
      .then((data) => setFiles(data.files || []))
      .catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Could not list files."));
  };

  useEffect(load, [get]);

  return (
    <ModalFrame title="My files" description="Code kept with your account." onClose={onClose}>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void post<FileReply>("/api/user/files", { name, code: workspace.code })
            .then((data) => {
              setStatus(data.error || `Saved ${name}.`);
              load();
            })
            .catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Could not save."));
        }}
      >
        <label className="sr-only" htmlFor="file-name">File name</label>
        <input
          id="file-name"
          className="min-h-11 flex-1 rounded-md border border-panel-border bg-background px-2 text-foreground"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button type="submit" className="btn btn-small">
          Save current code
        </button>
      </form>
      <p role="status">{status}</p>
      <ul className="space-y-2">
        {files.map((file) => (
          <li key={file.name} className="flex flex-wrap items-center gap-2">
            <span className="flex-1">{file.name}</span>
            <button
              type="button"
              className="btn btn-small"
              onClick={() => {
                void get<FileReply>(`/api/user/files/${encodeURIComponent(file.name)}`)
                  .then((data) => { if (data.code !== undefined) workspace.setCode(data.code); })
                  .catch(() => setStatus("Could not open that file."));
              }}
            >
              Open
            </button>
            <button
              type="button"
              className="btn btn-small"
              onClick={() => {
                void fetch(`/api/user/files/${encodeURIComponent(file.name)}`, { method: "DELETE" })
                  .then(load)
                  .catch(() => setStatus("Could not delete that file."));
              }}
            >
              Delete
            </button>
          </li>
        ))}
        {!files.length ? <li>No saved files yet.</li> : null}
      </ul>
    </ModalFrame>
  );
}
