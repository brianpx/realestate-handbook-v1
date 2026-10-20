import { htmlText } from '@/lib/html-text';
import { ScriptBox } from './ScriptBox';

// Wraps one `.box.script` from the page HTML. Server side it only splits the title from the script text, so the
// client component gets plain strings. The title text is the saved-practice key, as it was on the static site.
export function ScriptPractice({ id, html }: { id: string; html?: string }) {
  if (html === undefined) throw new Error(`${id}: script-practice must wrap the script box's HTML`);
  const m = /^\s*<div class="box-title">([\s\S]*?)<\/div>([\s\S]*)$/.exec(html);
  if (!m) throw new Error(`${id}: script-practice expects a .box-title first`);
  return <ScriptBox titleHtml={m[1]!} bodyHtml={m[2]!} storageKey={htmlText(m[1]!)} />;
}
