import path from 'node:path';
import type { PaidTier } from './access/types';
import type { PageId } from './pages';

// The files the handbook embeds that are not public (decision OD-17): they live in media/ at the repo root, outside
// public/, and are served by app/api/media/[...path]/route.ts to a signed-in reader whose plan opens the page the
// file belongs to. Only paths listed here are served, so the route never maps a request onto the file system.
export const MEDIA_ROUTE = '/api/media';
export const MEDIA_DIR = path.join(process.cwd(), 'media');

// `tier`: the lowest paid plan that gets the file, on top of opening `page`. Absent means any reader who opens the page.
export type MediaFile = { page: PageId; type: string; tier?: PaidTier };
export const MEDIA: Readonly<Record<string, MediaFile>> = {
  'downloads/The_Blueprint_for_New_Real_Estate_Agents.mp4': { page: 'pref', type: 'video/mp4' },
  'downloads/The_Blueprint_for_New_Real_Estate_Agents.en.vtt': { page: 'pref', type: 'text/vtt; charset=utf-8' },
  'downloads/Finding-Nurturing-and-Keeping-Clients.pdf': { page: 'pref', type: 'application/pdf', tier: 'pro' },
  'audio/objection-just-looking-role-play.mp3': { page: 'ch6', type: 'audio/mpeg' },
};

/** The URL a page or tool uses for a listed file. Throws at build time for a path that is not in the manifest. */
export function mediaUrl(file: string): string {
  if (!(file in MEDIA)) throw new Error(`${file} is not in the media manifest (lib/media.ts)`);
  return `${MEDIA_ROUTE}/${file}`;
}

/** The manifest entry for the path segments of a request, or null (unknown, or anything that is not a plain relative path). */
export function mediaFor(segments: readonly string[]): { file: string; media: MediaFile } | null {
  if (segments.length === 0 || segments.some(s => s === '' || s === '.' || s === '..' || s.includes('/') || s.includes('\\'))) return null;
  const file = segments.join('/');
  const media = MEDIA[file];
  return media ? { file, media } : null;
}

export type ByteRange = { start: number; end: number };

/**
 * The one Range form browsers send for media, `bytes=start-end` with either end optional, against a file of `size`
 * bytes. Null means no (or no usable) range header: send the whole file. 'unsatisfiable' is a start past the end,
 * which gets a 416. Multiple ranges are not supported and are treated as no range.
 */
export function parseRange(header: string | null, size: number): ByteRange | null | 'unsatisfiable' {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === '' && m[2] === '')) return null;
  if (m[1] === '') {
    // a suffix: the last n bytes
    const n = Number(m[2]);
    if (n === 0) return 'unsatisfiable';
    return { start: Math.max(0, size - n), end: size - 1 };
  }
  const start = Number(m[1]);
  if (start >= size) return 'unsatisfiable';
  const end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  if (end < start) return null;
  return { start, end };
}
