import { describe, expect, it } from 'vitest';
import { avatarUrlFor, isAvatarKey, newAvatarKey, sniffAvatarFormat } from './avatar';
import { gif, jpeg, png, svg, textRenamedAsPng, webp } from './avatar-fixtures';

const USER = '0b9f5f0e-3f43-4d7f-9a53-6f4f2a1c7e11';

describe('sniffAvatarFormat', () => {
  it('names PNG, JPEG and WebP from their first bytes', async () => {
    expect(sniffAvatarFormat(await png())).toBe('png');
    expect(sniffAvatarFormat(await jpeg())).toBe('jpeg');
    expect(sniffAvatarFormat(await webp())).toBe('webp');
  });
  it('knows nothing else: SVG, GIF, text, RIFF that is not WebP, and too little to tell', async () => {
    expect(sniffAvatarFormat(svg)).toBeNull();
    expect(sniffAvatarFormat(await gif())).toBeNull();
    expect(sniffAvatarFormat(textRenamedAsPng)).toBeNull();
    expect(sniffAvatarFormat(Buffer.from('RIFF\0\0\0\0WAVEfmt '))).toBeNull();
    expect(sniffAvatarFormat(new Uint8Array([0x89, 0x50]))).toBeNull();
    expect(sniffAvatarFormat(new Uint8Array())).toBeNull();
  });
});

describe('avatar keys', () => {
  it('are made from the user id and fresh random bits, and recognised only in that shape', () => {
    const a = newAvatarKey(USER);
    expect(a).toMatch(new RegExp(`^avatars/${USER}/[0-9a-f]{32}\\.webp$`));
    expect(newAvatarKey(USER)).not.toBe(a);
    expect(isAvatarKey(a)).toBe(true);
    for (const bad of ['', '../avatars/x.webp', `avatars/${USER}/../../etc/passwd`, `avatars/${USER}/${'a'.repeat(32)}.png`, `avatars/${USER}/short.webp`, `/avatars/${USER}/${'a'.repeat(32)}.webp`]) {
      expect(isAvatarKey(bad), bad).toBe(false);
    }
  });
});

describe('avatarUrlFor', () => {
  it('versions the address by the time of the change, and is null without a picture', () => {
    const at = new Date('2026-11-08T12:00:00Z');
    expect(avatarUrlFor({ avatarKey: 'k', avatarUpdatedAt: at })).toBe(`/api/account/avatar?v=${at.getTime()}`);
    expect(avatarUrlFor({ avatarKey: null, avatarUpdatedAt: null })).toBeNull();
    expect(avatarUrlFor({})).toBeNull();
  });
});
