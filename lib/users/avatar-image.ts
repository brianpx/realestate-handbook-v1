import sharp from 'sharp';
import { AVATAR_SIZE, MAX_AVATAR_BYTES, sniffAvatarFormat } from './avatar';

// 16 megapixels (4608 x 3456) covers any phone photo a reader would crop to a face; anything larger is refused before
// it is decoded, so a small file that declares enormous dimensions cannot exhaust memory.
const MAX_INPUT_PIXELS = 16_000_000;

export type ProcessedAvatar = { ok: true; webp: Buffer } | { ok: false; reason: 'too_large' | 'unsupported_type' | 'unreadable' };

/**
 * Turns an upload into the stored picture: a 256 x 256 WebP, cropped square around the middle, turned upright by its
 * EXIF orientation, with every piece of metadata (EXIF, GPS, ICC, XMP) dropped by the re-encode. The bytes decide the
 * type, not the name or content type the client sent. A file that does not decode cleanly is refused, not repaired.
 */
export async function processAvatar(bytes: Uint8Array): Promise<ProcessedAvatar> {
  if (bytes.byteLength > MAX_AVATAR_BYTES) return { ok: false, reason: 'too_large' };
  const format = sniffAvatarFormat(bytes);
  if (!format) return { ok: false, reason: 'unsupported_type' };
  try {
    const input = sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' });
    // a PNG header on a JPEG body, or the reverse, is not a picture we know how to vouch for
    if ((await input.metadata()).format !== format) return { ok: false, reason: 'unreadable' };
    const webp = await input.rotate().resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', position: 'centre' }).webp({ quality: 85 }).toBuffer();
    return { ok: true, webp };
  } catch {
    return { ok: false, reason: 'unreadable' };
  }
}
