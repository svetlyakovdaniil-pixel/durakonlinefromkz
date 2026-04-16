import { describe, it, expect } from 'vitest';
import { containsProfanity, PROFANITY_ERR_MSG } from '../shared/profanityFilter';

describe('profanityFilter — containsProfanity', () => {
  // ── Clean names ──────────────────────────────────────────────────────────
  it('allows normal Russian names', () => {
    expect(containsProfanity('Алмас')).toBe(false);
    expect(containsProfanity('Игрок123')).toBe(false);
    expect(containsProfanity('Казахстан')).toBe(false);
    expect(containsProfanity('Дурак')).toBe(false); // game name — not profanity
  });

  it('allows normal English names', () => {
    expect(containsProfanity('Player1')).toBe(false);
    expect(containsProfanity('GrandMaster')).toBe(false);
    expect(containsProfanity('Ace')).toBe(false);
  });

  it('allows normal Kazakh names', () => {
    expect(containsProfanity('Нұрлан')).toBe(false);
    expect(containsProfanity('Айгерім')).toBe(false);
    expect(containsProfanity('Болат')).toBe(false);
  });

  // ── Russian profanity ────────────────────────────────────────────────────
  it('blocks Russian root хуй', () => {
    expect(containsProfanity('хуй')).toBe(true);
    expect(containsProfanity('Хуйня')).toBe(true);
    expect(containsProfanity('нахуй')).toBe(true);
  });

  it('blocks Russian root пизд', () => {
    expect(containsProfanity('пизда')).toBe(true);
    expect(containsProfanity('Пиздец')).toBe(true);
  });

  it('blocks Russian root еб/ёб', () => {
    expect(containsProfanity('ёбаный')).toBe(true);
    expect(containsProfanity('еблан')).toBe(true);
  });

  it('blocks Russian блядь', () => {
    expect(containsProfanity('блядь')).toBe(true);
    expect(containsProfanity('Блядина')).toBe(true);
  });

  it('blocks Russian мудак', () => {
    expect(containsProfanity('мудак')).toBe(true);
  });

  // ── English profanity ────────────────────────────────────────────────────
  it('blocks English fuck', () => {
    expect(containsProfanity('fuck')).toBe(true);
    expect(containsProfanity('Fucker')).toBe(true);
  });

  it('blocks English shit', () => {
    expect(containsProfanity('shit')).toBe(true);
    expect(containsProfanity('bullshit')).toBe(true);
  });

  it('blocks English bitch', () => {
    expect(containsProfanity('bitch')).toBe(true);
    expect(containsProfanity('Bitch123')).toBe(true);
  });

  it('blocks English cunt', () => {
    expect(containsProfanity('cunt')).toBe(true);
  });

  // ── Obfuscation bypass attempts ──────────────────────────────────────────
  it('blocks profanity with dots/dashes as separators', () => {
    expect(containsProfanity('х.у.й')).toBe(true);
    expect(containsProfanity('х-у-й')).toBe(true);
    expect(containsProfanity('f.u.c.k')).toBe(true);
  });

  it('blocks profanity with spaces', () => {
    expect(containsProfanity('х у й')).toBe(true);
    expect(containsProfanity('f u c k')).toBe(true);
  });

  it('blocks mixed-case profanity', () => {
    expect(containsProfanity('FUCK')).toBe(true);
    expect(containsProfanity('FuCk')).toBe(true);
    expect(containsProfanity('ХУЙНЯ')).toBe(true);
  });

  it('blocks leet-speak substitutions (Latin chars for Cyrillic)', () => {
    // 'x' → 'х', 'y' → 'у' in our normalizer
    expect(containsProfanity('xуй')).toBe(true);
  });

  // ── Error message ────────────────────────────────────────────────────────
  it('exports a non-empty error message string', () => {
    expect(typeof PROFANITY_ERR_MSG).toBe('string');
    expect(PROFANITY_ERR_MSG.length).toBeGreaterThan(0);
  });
});
