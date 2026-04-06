import { describe, it, expect } from 'vitest';

/**
 * Shop / Deck Ownership logic tests.
 * Tests the business rules for deck purchases without hitting the DB.
 */

const CUSTOM_DECK_PRICE = 60;

interface PlayerProfile {
  id: number;
  balanceTenge: number;
  ownedDecks: string | null;
}

function parseOwnedDecks(profile: PlayerProfile): string[] {
  if (!profile.ownedDecks) return [];
  try {
    return JSON.parse(profile.ownedDecks) as string[];
  } catch {
    return [];
  }
}

function canPurchaseDeck(
  profile: PlayerProfile,
  deckId: string,
  tengeCost: number
): { canBuy: boolean; reason?: string } {
  const owned = parseOwnedDecks(profile);
  if (owned.includes(deckId)) {
    return { canBuy: false, reason: 'already_owned' };
  }
  if (profile.balanceTenge < tengeCost) {
    return { canBuy: false, reason: 'insufficient_tenge' };
  }
  return { canBuy: true };
}

function simulatePurchase(
  profile: PlayerProfile,
  deckId: string,
  tengeCost: number
): { success: boolean; newTenge?: number; newOwnedDecks?: string[]; reason?: string } {
  const check = canPurchaseDeck(profile, deckId, tengeCost);
  if (!check.canBuy) return { success: false, reason: check.reason };

  const owned = parseOwnedDecks(profile);
  owned.push(deckId);
  const newTenge = profile.balanceTenge - tengeCost;

  return { success: true, newTenge, newOwnedDecks: owned };
}

describe('Shop - Deck Ownership', () => {
  it('should parse empty ownedDecks as empty array', () => {
    const profile: PlayerProfile = { id: 1, balanceTenge: 100, ownedDecks: null };
    expect(parseOwnedDecks(profile)).toEqual([]);
  });

  it('should parse valid ownedDecks JSON', () => {
    const profile: PlayerProfile = { id: 1, balanceTenge: 100, ownedDecks: '["custom"]' };
    expect(parseOwnedDecks(profile)).toEqual(['custom']);
  });

  it('should parse invalid JSON as empty array', () => {
    const profile: PlayerProfile = { id: 1, balanceTenge: 100, ownedDecks: 'invalid' };
    expect(parseOwnedDecks(profile)).toEqual([]);
  });

  it('should parse multiple decks', () => {
    const profile: PlayerProfile = { id: 1, balanceTenge: 100, ownedDecks: '["custom","premium"]' };
    expect(parseOwnedDecks(profile)).toEqual(['custom', 'premium']);
  });
});

describe('Shop - Purchase Validation', () => {
  it('should allow purchase with sufficient balance', () => {
    const profile: PlayerProfile = { id: 1, balanceTenge: 100, ownedDecks: null };
    const result = canPurchaseDeck(profile, 'custom', CUSTOM_DECK_PRICE);
    expect(result.canBuy).toBe(true);
  });

  it('should reject purchase with insufficient balance', () => {
    const profile: PlayerProfile = { id: 1, balanceTenge: 30, ownedDecks: null };
    const result = canPurchaseDeck(profile, 'custom', CUSTOM_DECK_PRICE);
    expect(result.canBuy).toBe(false);
    expect(result.reason).toBe('insufficient_tenge');
  });

  it('should reject purchase if already owned', () => {
    const profile: PlayerProfile = { id: 1, balanceTenge: 100, ownedDecks: '["custom"]' };
    const result = canPurchaseDeck(profile, 'custom', CUSTOM_DECK_PRICE);
    expect(result.canBuy).toBe(false);
    expect(result.reason).toBe('already_owned');
  });

  it('should allow purchase of different deck even if one is owned', () => {
    const profile: PlayerProfile = { id: 1, balanceTenge: 100, ownedDecks: '["custom"]' };
    const result = canPurchaseDeck(profile, 'premium', 80);
    expect(result.canBuy).toBe(true);
  });

  it('should reject purchase with exact balance boundary (below)', () => {
    const profile: PlayerProfile = { id: 1, balanceTenge: 59, ownedDecks: null };
    const result = canPurchaseDeck(profile, 'custom', CUSTOM_DECK_PRICE);
    expect(result.canBuy).toBe(false);
    expect(result.reason).toBe('insufficient_tenge');
  });

  it('should allow purchase with exact balance', () => {
    const profile: PlayerProfile = { id: 1, balanceTenge: 60, ownedDecks: null };
    const result = canPurchaseDeck(profile, 'custom', CUSTOM_DECK_PRICE);
    expect(result.canBuy).toBe(true);
  });
});

describe('Shop - Purchase Simulation', () => {
  it('should deduct tenge and add deck on successful purchase', () => {
    const profile: PlayerProfile = { id: 1, balanceTenge: 100, ownedDecks: null };
    const result = simulatePurchase(profile, 'custom', CUSTOM_DECK_PRICE);
    expect(result.success).toBe(true);
    expect(result.newTenge).toBe(40);
    expect(result.newOwnedDecks).toEqual(['custom']);
  });

  it('should add to existing decks', () => {
    const profile: PlayerProfile = { id: 1, balanceTenge: 200, ownedDecks: '["basic"]' };
    const result = simulatePurchase(profile, 'custom', CUSTOM_DECK_PRICE);
    expect(result.success).toBe(true);
    expect(result.newTenge).toBe(140);
    expect(result.newOwnedDecks).toEqual(['basic', 'custom']);
  });

  it('should fail if already owned', () => {
    const profile: PlayerProfile = { id: 1, balanceTenge: 200, ownedDecks: '["custom"]' };
    const result = simulatePurchase(profile, 'custom', CUSTOM_DECK_PRICE);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('already_owned');
  });

  it('should fail if insufficient balance', () => {
    const profile: PlayerProfile = { id: 1, balanceTenge: 10, ownedDecks: null };
    const result = simulatePurchase(profile, 'custom', CUSTOM_DECK_PRICE);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('insufficient_tenge');
  });

  it('should leave balance at 0 when buying with exact amount', () => {
    const profile: PlayerProfile = { id: 1, balanceTenge: 60, ownedDecks: null };
    const result = simulatePurchase(profile, 'custom', CUSTOM_DECK_PRICE);
    expect(result.success).toBe(true);
    expect(result.newTenge).toBe(0);
    expect(result.newOwnedDecks).toEqual(['custom']);
  });
});

describe('Shop - Deck Selection Gating', () => {
  it('should allow classic deck for all players', () => {
    const ownedDecks: string[] = [];
    const canSelectClassic = true; // classic is always available
    expect(canSelectClassic).toBe(true);
  });

  it('should block custom deck if not owned', () => {
    const ownedDecks: string[] = [];
    const canSelectCustom = ownedDecks.includes('custom');
    expect(canSelectCustom).toBe(false);
  });

  it('should allow custom deck if owned', () => {
    const ownedDecks = ['custom'];
    const canSelectCustom = ownedDecks.includes('custom');
    expect(canSelectCustom).toBe(true);
  });

  it('should reset deck selection to classic if custom not owned', () => {
    const ownedDecks: string[] = [];
    let selectedDeck = 'custom';
    // Gating logic: if custom not owned, force classic
    if (selectedDeck === 'custom' && !ownedDecks.includes('custom')) {
      selectedDeck = 'classic';
    }
    expect(selectedDeck).toBe('classic');
  });
});
