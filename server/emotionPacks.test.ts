import { describe, it, expect } from 'vitest';
import { EMOTION_PACKS, KHAN_PACK, HAMSTER_PACK, MONKEY_PACK, DEVIL_PACK, getEmotionPack, DEFAULT_EMOTION_PACK_ID } from '../shared/emotionPacks';

describe('emotionPacks', () => {
  it('should have four packs: khan, hamster, monkey, and devil', () => {
    expect(EMOTION_PACKS).toHaveLength(4);
    expect(EMOTION_PACKS[0].id).toBe('khan');
    expect(EMOTION_PACKS[1].id).toBe('hamster');
    expect(EMOTION_PACKS[2].id).toBe('monkey');
    expect(EMOTION_PACKS[3].id).toBe('devil');
  });

  it('khan pack should be free (price 0) and is the default', () => {
    expect(KHAN_PACK.price).toBe(0);
    expect(DEFAULT_EMOTION_PACK_ID).toBe('khan');
  });

  it('hamster pack should have price 150 tenge', () => {
    expect(HAMSTER_PACK.price).toBe(150);
  });

  it('monkey pack should have price 150 tenge', () => {
    expect(MONKEY_PACK.price).toBe(150);
  });

  it('devil pack should have price 150 tenge', () => {
    expect(DEVIL_PACK.price).toBe(150);
  });

  it('all packs should have exactly 10 emotions', () => {
    expect(KHAN_PACK.emotions).toHaveLength(10);
    expect(HAMSTER_PACK.emotions).toHaveLength(10);
    expect(MONKEY_PACK.emotions).toHaveLength(10);
    expect(DEVIL_PACK.emotions).toHaveLength(10);
  });

  it('all packs should have the same emotion IDs', () => {
    const khanIds = KHAN_PACK.emotions.map(e => e.id).sort();
    const hamsterIds = HAMSTER_PACK.emotions.map(e => e.id).sort();
    const monkeyIds = MONKEY_PACK.emotions.map(e => e.id).sort();
    const devilIds = DEVIL_PACK.emotions.map(e => e.id).sort();
    expect(khanIds).toEqual(hamsterIds);
    expect(khanIds).toEqual(monkeyIds);
    expect(khanIds).toEqual(devilIds);
  });

  it('khan pack emotions should have CDN URLs', () => {
    for (const emotion of KHAN_PACK.emotions) {
      expect(emotion.url).toMatch(/^https:\/\//);
    }
  });

  it('monkey pack emotions should have CDN URLs', () => {
    for (const emotion of MONKEY_PACK.emotions) {
      expect(emotion.url).toMatch(/^https:\/\//);
    }
  });

  it('devil pack emotions should have CDN URLs', () => {
    for (const emotion of DEVIL_PACK.emotions) {
      expect(emotion.url).toMatch(/^https:\/\//);
    }
  });

  it('hamster pack emotions should have /assets/static/ URLs', () => {
    for (const emotion of HAMSTER_PACK.emotions) {
      expect(emotion.url).toMatch(/^\/assets\/static\//);
    }
  });

  it('getEmotionPack should return khan pack for unknown id (default)', () => {
    const pack = getEmotionPack('unknown_pack');
    expect(pack.id).toBe('khan');
  });

  it('getEmotionPack should return khan pack for khan id', () => {
    const pack = getEmotionPack('khan');
    expect(pack.id).toBe('khan');
  });

  it('getEmotionPack should return hamster pack for hamster id', () => {
    const pack = getEmotionPack('hamster');
    expect(pack.id).toBe('hamster');
  });

  it('getEmotionPack should return monkey pack for monkey id', () => {
    const pack = getEmotionPack('monkey');
    expect(pack.id).toBe('monkey');
  });

  it('getEmotionPack should return devil pack for devil id', () => {
    const pack = getEmotionPack('devil');
    expect(pack.id).toBe('devil');
  });

  it('all emotion IDs should be valid', () => {
    const validIds = ['laugh', 'cool', 'angry', 'sad', 'think', 'wow', 'heart', 'hurry', 'win', 'sleep'];
    for (const pack of EMOTION_PACKS) {
      for (const emotion of pack.emotions) {
        expect(validIds).toContain(emotion.id);
      }
    }
  });
});
