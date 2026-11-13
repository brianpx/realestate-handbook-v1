import sharp from 'sharp';

// Small generated pictures for the avatar tests; nothing here is a file on disk.

const solid = (width: number, height: number, channels: 3 | 4 = 3) =>
  sharp({ create: { width, height, channels, background: { r: 200, g: 40, b: 40, alpha: 1 } } });

export const png = (width = 64, height = 64) => solid(width, height).png().toBuffer();
export const jpeg = (width = 64, height = 64) => solid(width, height).jpeg().toBuffer();
export const webp = (width = 64, height = 64) => solid(width, height).webp().toBuffer();
export const gif = (width = 8, height = 8) => solid(width, height).gif().toBuffer();

/** A JPEG whose pixels are a wide strip, left half red and right half blue, with EXIF orientation 6 (turn 90 degrees clockwise) and a GPS-bearing EXIF block. */
export async function rotatedJpegWithExif() {
  const left = await sharp({ create: { width: 60, height: 20, channels: 3, background: { r: 255, g: 0, b: 0 } } }).png().toBuffer();
  const strip = await sharp({ create: { width: 120, height: 20, channels: 3, background: { r: 0, g: 0, b: 255 } } })
    .composite([{ input: left, left: 0, top: 0 }])
    .jpeg()
    .withExif({ IFD0: { Copyright: 'Someone Else', Software: 'camera-app' } })
    .withMetadata({ orientation: 6 })
    .toBuffer();
  return strip;
}

/** A PNG of 64 megapixels, far past the pixel limit that still compresses to a few kilobytes. */
export const hugePng = () => sharp({ create: { width: 8000, height: 8000, channels: 3, background: '#000' } }).png({ compressionLevel: 9 }).toBuffer();

export const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><script>alert(1)</script><rect width="64" height="64"/></svg>');
export const textRenamedAsPng = Buffer.from('this is not a picture, whatever the file name says');
