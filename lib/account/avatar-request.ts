import { sessionIdFrom } from '@/lib/auth/env';
import { BodyTooLarge, MAX_REQUEST_BYTES, type AvatarRequest } from './avatar-handler';

/** Reads the multipart body a chunk at a time and stops at the cap, whatever Content-Length said. */
async function boundedForm(request: Request): Promise<FormData> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('no body');
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (let next = await reader.read(); !next.done; next = await reader.read()) {
    total += next.value.byteLength;
    if (total > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new BodyTooLarge();
    }
    chunks.push(next.value);
  }
  return new Response(new Blob(chunks as BlobPart[]), { headers: { 'Content-Type': request.headers.get('content-type') ?? '' } }).formData();
}

export function avatarRequestFrom(request: Request): AvatarRequest {
  const declared = request.headers.get('content-length');
  return {
    origin: request.headers.get('origin'),
    sessionId: sessionIdFrom(request),
    contentLength: declared !== null && /^\d+$/.test(declared) ? Number(declared) : null,
    form: () => boundedForm(request),
  };
}
