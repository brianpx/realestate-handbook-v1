import { labelParts } from '@/lib/pages';

/**
 * A page's label for a menu row: the chapter number or appendix letter in its own column, then the title. The
 * pieces that are not drawn keep the row's text, and so a link's name, the whole label ("5. Nurturing Leads",
 * "App D: Glossary"). They are .undrawn, not .visually-hidden: that one is absolutely placed, which splits the name
 * around it ("5 . Nurturing Leads").
 */
export function PageLabel({ label }: { label: string }) {
  const parts = labelParts(label);
  if (!parts) return <span className="page-title">{label}</span>;
  return (
    <>
      <span className="page-mark">
        {parts.before && <span className="undrawn">{parts.before}</span>}
        {parts.mark}
        <span className="undrawn">{parts.after}</span>
      </span>
      <span className="page-title">{parts.title}</span>
    </>
  );
}
