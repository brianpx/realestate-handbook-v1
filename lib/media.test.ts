import { access } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MEDIA, MEDIA_DIR, mediaFor, mediaUrl, parseRange } from './media';
import { isFreePage } from './pages';

describe('the media manifest', () => {
  it('names files that exist in media/, none of them under public/', async () => {
    for (const file of Object.keys(MEDIA)) {
      await expect(access(path.join(MEDIA_DIR, ...file.split('/')))).resolves.toBeUndefined();
      await expect(access(path.join(process.cwd(), 'public', ...file.split('/')))).rejects.toThrow();
    }
  });
  it('puts the overview video on a free page and the Chapter 6 recording on a member page', () => {
    expect(isFreePage(MEDIA['downloads/The_Blueprint_for_New_Real_Estate_Agents.mp4']!.page)).toBe(true);
    expect(isFreePage(MEDIA['audio/objection-just-looking-role-play.mp3']!.page)).toBe(false);
  });
  it('builds the route URL for a listed file and refuses one that is not listed', () => {
    expect(mediaUrl('audio/objection-just-looking-role-play.mp3')).toBe('/api/media/audio/objection-just-looking-role-play.mp3');
    expect(() => mediaUrl('audio/other.mp3')).toThrow(/manifest/);
  });
  it('resolves request segments only to listed files', () => {
    expect(mediaFor(['audio', 'objection-just-looking-role-play.mp3'])?.media.type).toBe('audio/mpeg');
    expect(mediaFor(['audio'])).toBeNull();
    expect(mediaFor([])).toBeNull();
    expect(mediaFor(['..', 'package.json'])).toBeNull();
    expect(mediaFor(['audio/objection-just-looking-role-play.mp3'])).toBeNull();
    expect(mediaFor(['downloads', 'missing.mp4'])).toBeNull();
  });
});

describe('parseRange', () => {
  it('reads the forms a media element sends, clamped to the file', () => {
    expect(parseRange(null, 100)).toBeNull();
    expect(parseRange('bytes=0-', 100)).toEqual({ start: 0, end: 99 });
    expect(parseRange('bytes=10-19', 100)).toEqual({ start: 10, end: 19 });
    expect(parseRange('bytes=90-500', 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange('bytes=-10', 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange('bytes=-500', 100)).toEqual({ start: 0, end: 99 });
  });
  it('is unsatisfiable past the end and ignores what it does not understand', () => {
    expect(parseRange('bytes=100-', 100)).toBe('unsatisfiable');
    expect(parseRange('bytes=-0', 100)).toBe('unsatisfiable');
    expect(parseRange('bytes=20-10', 100)).toBeNull();
    expect(parseRange('bytes=0-10,20-30', 100)).toBeNull();
    expect(parseRange('items=0-10', 100)).toBeNull();
    expect(parseRange('bytes=-', 100)).toBeNull();
  });
});
