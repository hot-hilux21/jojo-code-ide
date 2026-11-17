import { useSpeakable } from "../hooks/useSpeakable";
import type { TraceRow } from "../hooks/useWorkspace";

export function TraceTable({ rows }: { rows: TraceRow[] }) {
  const tableSpeech = useSpeakable("Variable trace table", "text");
  if (!rows.length) return null;
  const columns = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row))),
  );
  return (
    <section className="workspace-pane" aria-labelledby="trace-heading" tabIndex={0} {...tableSpeech}>
      <header id="trace-heading" className="font-semibold">
        Variable trace
      </header>
      <div className="pane-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col">{column.replace(/_/g, " ")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column}>{String(row[column] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
