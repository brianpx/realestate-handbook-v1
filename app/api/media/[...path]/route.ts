import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { mediaOpen } from '@/lib/access/entitlement';
import { getViewer } from '@/lib/auth/dal';
import { MEDIA_DIR, mediaFor, parseRange } from '@/lib/media';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ path: string[] }> };

// The video and audio the handbook embeds (lib/media.ts). The static layer would hand these to anyone, so they sit
// outside public/ and this route checks who is asking and whether their plan opens the page the file belongs to (and meets the file's tier, if it has one).
// Range requests are honoured because <video> and <audio> seek with them.
const HEADERS = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex', 'Accept-Ranges': 'bytes' } as const;
const refuse = (status: number, error: string) => Response.json({ ok: false, error }, { status, headers: { 'Cache-Control': 'no-store' } });

async function serve(request: Request, { params }: Props, withBody: boolean): Promise<Response> {
  const found = mediaFor((await params).path);
  if (!found) return refuse(404, 'not_found');
  const viewer = await getViewer();
  if (!viewer) return refuse(401, 'unauthorized');
  if (!mediaOpen(viewer.entitlement, found.media)) return refuse(403, 'forbidden');

  const file = path.join(MEDIA_DIR, ...found.file.split('/'));
  const { size } = await stat(file);
  const range = parseRange(request.headers.get('range'), size);
  if (range === 'unsatisfiable') return new Response(null, { status: 416, headers: { ...HEADERS, 'Content-Range': `bytes */${size}` } });

  const headers: Record<string, string> = { ...HEADERS, 'Content-Type': found.media.type };
  let status = 200;
  let slice: { start: number; end: number } | undefined;
  if (range) {
    status = 206;
    slice = range;
    headers['Content-Range'] = `bytes ${range.start}-${range.end}/${size}`;
    headers['Content-Length'] = String(range.end - range.start + 1);
  } else {
    headers['Content-Length'] = String(size);
  }
  if (!withBody) return new Response(null, { status, headers });
  // Node's file stream as a web stream, so the file is never read into memory whole
  const body = Readable.toWeb(createReadStream(file, slice)) as ReadableStream;
  return new Response(body, { status, headers });
}

export const GET = (request: Request, props: Props) => serve(request, props, true);
export const HEAD = (request: Request, props: Props) => serve(request, props, false);
