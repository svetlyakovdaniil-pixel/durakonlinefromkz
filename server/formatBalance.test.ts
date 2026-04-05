import { describe, it, expect } from 'vitest';
import { formatBalance } from '../shared/formatBalance';

describe('formatBalance', () => {
  it('returns "0" for zero', () => {
    expect(formatBalance(0)).toBe('0');
  });

  it('returns number as-is for values under 1000', () => {
    expect(formatBalance(100)).toBe('100');
    expect(formatBalance(999)).toBe('999');
    expect(formatBalance(1)).toBe('1');
    expect(formatBalance(500)).toBe('500');
  });

  it('formats thousands with К suffix', () => {
    expect(formatBalance(1000)).toBe('1К');
    expect(formatBalance(5000)).toBe('5К');
    expect(formatBalance(10000)).toBe('10К');
    expect(formatBalance(999000)).toBe('999К');
  });

  it('formats thousands with decimal (comma separator)', () => {
    expect(formatBalance(1400)).toBe('1,4К');
    expect(formatBalance(1500)).toBe('1,5К');
    expect(formatBalance(2700)).toBe('2,7К');
    expect(formatBalance(15300)).toBe('15,3К');
  });

  it('formats millions with КК suffix', () => {
    expect(formatBalance(1000000)).toBe('1КК');
    expect(formatBalance(7000000)).toBe('7КК');
    expect(formatBalance(10000000)).toBe('10КК');
  });

  it('formats millions with decimal (comma separator)', () => {
    expect(formatBalance(1500000)).toBe('1,5КК');
    expect(formatBalance(2300000)).toBe('2,3КК');
  });

  it('handles edge cases at boundaries', () => {
    expect(formatBalance(999)).toBe('999');
    expect(formatBalance(1000)).toBe('1К');
    expect(formatBalance(999999)).toBe('1000К'); // rounds up
    expect(formatBalance(1000000)).toBe('1КК');
  });
});
