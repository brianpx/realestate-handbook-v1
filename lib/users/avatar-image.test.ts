import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { AVATAR_SIZE, MAX_AVATAR_BYTES } from './avatar';
import { processAvatar } from './avatar-image';
import { gif, hugePng, jpeg, png, rotatedJpegWithExif, svg, textRenamedAsPng, webp } from './avatar-fixtures';

async function accepted(input: Uint8Array) {
  const result = await processAvatar(input);
  if (!result.ok) throw new Error(`refused: ${result.reason}`);
  return result.webp;
}

describe('processAvatar', () => {
  it.each([['PNG', png], ['JPEG', jpeg], ['WebP', webp]])('turns a %s of any shape into a 256 x 256 WebP', async (_name, make) => {
    for (const [w, h] of [[64, 64], [400, 100], [90, 700]] as const) {
      const out = await accepted(await make(w, h));
      expect(await sharp(out).metadata()).toMatchObject({ format: 'webp', width: AVATAR_SIZE, height: AVATAR_SIZE });
    }
  });
  it('crops around the middle rather than squashing', async () => {
    const strip = await sharp({ create: { width: 300, height: 100, channels: 3, background: '#00f' } })
      .composite([{ input: await sharp({ create: { width: 100, height: 100, channels: 3, background: '#f00' } }).png().toBuffer(), left: 100, top: 0 }])
      .png().toBuffer();
    const { data, info } = await sharp(await accepted(strip)).raw().toBuffer({ resolveWithObject: true });
    const at = (x: number, y: number) => [...data.subarray((y * info.width + x) * info.channels, (y * info.width + x) * info.channels + 3)];
    expect(at(128, 128)[0]).toBeGreaterThan(200);
    expect(at(128, 128)[2]).toBeLessThan(60);
  });
  it('turns the picture upright by its EXIF orientation and keeps no metadata at all', async () => {
    const input = await rotatedJpegWithExif();
    const before = await sharp(input).metadata();
    expect(before.orientation).toBe(6);
    expect(input.includes(Buffer.from('Someone Else'))).toBe(true);
    const out = await accepted(input);
    const after = await sharp(out).metadata();
    expect(after.exif).toBeUndefined();
    expect(after.icc).toBeUndefined();
    expect(after.xmp).toBeUndefined();
    expect(after.orientation).toBeUndefined();
    expect(out.includes(Buffer.from('Someone Else'))).toBe(false);
    // the strip was 120 wide and 20 tall with the red part on the left; turned 90 degrees clockwise it is tall, red on top
    const { data, info } = await sharp(out).raw().toBuffer({ resolveWithObject: true });
    const px = (x: number, y: number) => data[(y * info.width + x) * info.channels]!;
    expect(px(128, 10)).toBeGreaterThan(200);
    expect(px(128, 245)).toBeLessThan(60);
  });
  it('refuses SVG, GIF and text with a picture name, by their bytes', async () => {
    expect(await processAvatar(svg)).toEqual({ ok: false, reason: 'unsupported_type' });
    expect(await processAvatar(await gif())).toEqual({ ok: false, reason: 'unsupported_type' });
    expect(await processAvatar(textRenamedAsPng)).toEqual({ ok: false, reason: 'unsupported_type' });
    expect(await processAvatar(new Uint8Array())).toEqual({ ok: false, reason: 'unsupported_type' });
  });
  it('refuses a file with a picture signature that does not decode, and one whose body is another format', async () => {
    const whole = await png(32, 32);
    expect(await processAvatar(whole.subarray(0, 40))).toEqual({ ok: false, reason: 'unreadable' });
    expect(await processAvatar(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('garbage that is not a png')]))).toEqual({ ok: false, reason: 'unreadable' });
    const jpegBody = await jpeg(32, 32);
    const disguised = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), jpegBody]);
    expect(await processAvatar(disguised)).toEqual({ ok: false, reason: 'unreadable' });
  });
  it('refuses more than 2 MB without decoding it', async () => {
    const big = Buffer.concat([await png(), Buffer.alloc(MAX_AVATAR_BYTES)]);
    expect(await processAvatar(big)).toEqual({ ok: false, reason: 'too_large' });
    const atLimit = Buffer.concat([await png(), Buffer.alloc(MAX_AVATAR_BYTES)]).subarray(0, MAX_AVATAR_BYTES);
    expect((await processAvatar(atLimit)).ok).toBe(true);
  });
  it('refuses a small file that declares far more pixels than the limit before decoding them', async () => {
    const bomb = await hugePng();
    expect(bomb.byteLength).toBeLessThan(MAX_AVATAR_BYTES);
    expect(await processAvatar(bomb)).toEqual({ ok: false, reason: 'unreadable' });
  });
});
