import { describe, it, expect } from 'vitest';
import type { RoomSettings } from '../shared/gameTypes';

describe('Playlist features (Batch 93)', () => {
  describe('RoomSettings playlistId', () => {
    it('should accept playlistId as a number', () => {
      const settings: RoomSettings = {
        turnTimer: 30,
        withBots: false,
        botCount: 0,
        deckStyle: 'classic',
        betAmount: 100,
        playlistId: 2,
      };
      expect(settings.playlistId).toBe(2);
    });

    it('should accept playlistId as null', () => {
      const settings: RoomSettings = {
        turnTimer: 30,
        withBots: false,
        botCount: 0,
        deckStyle: 'classic',
        betAmount: 100,
        playlistId: null,
      };
      expect(settings.playlistId).toBeNull();
    });

    it('should accept playlistId as undefined (optional)', () => {
      const settings: RoomSettings = {
        turnTimer: 30,
        withBots: false,
        botCount: 0,
        deckStyle: 'classic',
        betAmount: 100,
      };
      expect(settings.playlistId).toBeUndefined();
    });
  });

  describe('Deck names', () => {
    it('should have renamed deck labels in ru translations', async () => {
      const { ru: translations } = await import('../client/src/i18n/ru');
      // Deck 1 should be "Стандартная" in all contexts
      expect(translations.lobby.deckClassic).toBe('Стандартная');
      expect(translations.waitingRoom.deckN1).toBe('Стандартная');
      // Deck 2 should be "Товарищ Мырза" in all contexts
      expect(translations.lobby.deckCustom).toBe('Товарищ Мырза');
      expect(translations.waitingRoom.deckN2).toBe('Товарищ Мырза');
    });

    it('should have renamed deck labels in kk translations', async () => {
      const { kk: translations } = await import('../client/src/i18n/kk');
      // Kazakh uses localized names
      expect(translations.lobby.deckClassic).toBe('Стандартты');
      expect(translations.waitingRoom.deckN1).toBe('Стандартты');
      expect(translations.lobby.deckCustom).toBe('Жолдас Мырза');
      expect(translations.waitingRoom.deckN2).toBe('Жолдас Мырза');
    });
  });

  describe('seedChinesePlaylist', () => {
    it('should export seedChinesePlaylist function from db', async () => {
      const db = await import('./db');
      expect(typeof db.seedChinesePlaylist).toBe('function');
    });
  });
});
