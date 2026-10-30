// The plain-HTML version of a tool, for readers without JavaScript. It sits in <noscript>, so it is gone the
// moment the interactive version can run and the page never shows both. `html` is trusted repo content.
export function StaticFallback({ html }: { html: string }) {
  return <noscript dangerouslySetInnerHTML={{ __html: html }} />;
}
