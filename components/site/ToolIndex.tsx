import { pageTableRows } from '@/lib/page-html';
import { OpenOnHash } from './OpenOnHash';

// Appendix E lists 20 tools; the build fails below this so a rewritten table cannot quietly shrink the index.
// e2e/site.spec.ts asserts the same floor on the rendered page.
export const TOOL_INDEX_MIN_ROWS = 18;

// The anchor the pricing table's "Every tool" cell points at; OpenOnHash opens the <details> when it is the URL hash.
export const TOOL_INDEX_ID = 'tool-index';

// Table E.1 from Appendix E, read from the chapter itself so the sales pages cannot drift from the handbook. It is a
// feature list, not teaching, so it is free to show (docs/_archive/free-sample-decision.md). The explicit roles keep
// the table semantics when site.css stacks each row on a phone.
export async function ToolIndex() {
  const rows = await pageTableRows('app-e', 'TOOL');
  if (rows.length < TOOL_INDEX_MIN_ROWS) throw new Error(`Appendix E lists ${rows.length} tools; the index on the sales pages expects at least ${TOOL_INDEX_MIN_ROWS}`);
  return (
    <>
      <OpenOnHash id={TOOL_INDEX_ID} />
      <details id={TOOL_INDEX_ID} className="pub-details pub-tool-index">
        <summary>Every interactive tool ({rows.length})</summary>
        <div className="pub-details-body">
          <table role="table">
            <thead role="rowgroup" className="visually-hidden-phone">
              <tr role="row"><th role="columnheader" scope="col">Tool</th><th role="columnheader" scope="col">Where</th><th role="columnheader" scope="col">What you practice</th></tr>
            </thead>
            <tbody role="rowgroup">
              {rows.map(([name, , where, what]) => (
                <tr role="row" key={name}><th role="rowheader" scope="row">{name}</th><td role="cell">{where}</td><td role="cell">{what}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
