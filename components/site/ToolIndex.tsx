import { pageTableRows } from '@/lib/page-html';

// Table E.1 from Appendix E, read from the chapter itself so the sales pages cannot drift from the handbook. It is a
// feature list, not teaching, so it is free to show (docs/_archive/free-sample-decision.md).
export async function ToolIndex() {
  const rows = await pageTableRows('app-e', 'TOOL');
  if (rows.length < 15) throw new Error(`Appendix E lists ${rows.length} tools; the index on the sales pages expects the full table`);
  return (
    <details className="pub-details pub-tool-index">
      <summary>Every interactive tool ({rows.length})</summary>
      <div className="pub-details-body">
        <table>
          <thead>
            <tr><th scope="col">Tool</th><th scope="col">Where</th><th scope="col">What you practice</th></tr>
          </thead>
          <tbody>
            {rows.map(([name, , where, what]) => (
              <tr key={name}><th scope="row">{name}</th><td>{where}</td><td>{what}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
