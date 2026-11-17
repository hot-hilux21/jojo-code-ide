import { useEffect, useMemo, useState } from "react";
import { useFlaskApi } from "../../hooks/useFlaskApi";
import { ModalFrame } from "./ModalFrame";

interface Entry {
  term?: string;
  word?: string;
  meaning?: string;
  definition?: string;
  [key: string]: unknown;
}

export function DictionaryModal({ onClose }: { onClose: () => void }) {
  const { get } = useFlaskApi();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void get<Entry[]>("/api/glossary").then(setEntries).catch(() => setEntries([]));
  }, [get]);

  const visible = useMemo(() => {
    if (!query.trim()) return entries;
    const needle = query.toLowerCase();
    return entries.filter((entry) =>
      JSON.stringify(entry).toLowerCase().includes(needle));
  }, [entries, query]);

  return (
    <ModalFrame title="Dictionary" onClose={onClose} wide>
      <label className="mb-3 block">
        <span className="block text-sm">Search the dictionary</span>
        <input
          className="min-h-11 w-full rounded-md border border-panel-border bg-background px-2 text-foreground"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <ul className="space-y-2">
        {visible.map((entry, index) => (
          <li key={index} className="rounded-md border border-panel-border p-2">
            <strong>{entry.term || entry.word || "Entry"}</strong>
            <p>{entry.meaning || entry.definition || JSON.stringify(entry)}</p>
          </li>
        ))}
        {!visible.length ? <li>No entries found.</li> : null}
      </ul>
    </ModalFrame>
  );
}
