import { describe, it, expect } from 'vitest';
import { EMOTION_PACKS, HAMSTER_PACK, MONKEY_PACK, getEmotionPack } from '../shared/emotionPacks';

describe('emotionPacks', () => {
  it('should have two packs: hamster and monkey', () => {
    expect(EMOTION_PACKS).toHaveLength(2);
    expect(EMOTION_PACKS[0].id).toBe('hamster');
    expect(EMOTION_PACKS[1].id).toBe('monkey');
  });

  it('hamster pack should be free (price 0)', () => {
    expect(HAMSTER_PACK.price).toBe(0);
  });

  it('monkey pack should be free (price 0)', () => {
    expect(MONKEY_PACK.price).toBe(0);
  });

  it('both packs should have exactly 10 emotions', () => {
    expect(HAMSTER_PACK.emotions).toHaveLength(10);
    expect(MONKEY_PACK.emotions).toHaveLength(10);
  });

  it('both packs should have the same emotion IDs', () => {
    const hamsterIds = HAMSTER_PACK.emotions.map(e => e.id).sort();
    const monkeyIds = MONKEY_PACK.emotions.map(e => e.id).sort();
    expect(hamsterIds).toEqual(monkeyIds);
  });

  it('monkey pack emotions should have CDN URLs', () => {
    for (const emotion of MONKEY_PACK.emotions) {
      expect(emotion.url).toMatch(/^https:\/\//);
    }
  });

  it('hamster pack emotions should have /assets/static/ URLs', () => {
    for (const emotion of HAMSTER_PACK.emotions) {
      expect(emotion.url).toMatch(/^\/assets\/static\//);
    }
  });

  it('getEmotionPack should return hamster pack for unknown id', () => {
    const pack = getEmotionPack('unknown_pack');
    expect(pack.id).toBe('hamster');
  });

  it('getEmotionPack should return monkey pack for monkey id', () => {
    const pack = getEmotionPack('monkey');
    expect(pack.id).toBe('monkey');
  });

  it('getEmotionPack should return hamster pack for hamster id', () => {
    const pack = getEmotionPack('hamster');
    expect(pack.id).toBe('hamster');
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
