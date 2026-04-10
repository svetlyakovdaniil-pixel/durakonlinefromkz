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

  describe('Batch 94 — Settings playlist selector', () => {
    it('should have playlist translation keys in ru', async () => {
      const { ru } = await import('../client/src/i18n/ru');
      expect(ru.settings.playlist).toBe('Плейлист');
      expect(ru.settings.selectPlaylist).toBe('Выберите плейлист');
    });

    it('should have playlist translation keys in kk', async () => {
      const { kk } = await import('../client/src/i18n/kk');
      expect(kk.settings.playlist).toBe('Плейлист');
      expect(kk.settings.selectPlaylist).toBe('Плейлистті таңдаңыз');
    });

    it('GameSettingsSheet should NOT have playlist imports', async () => {
      // Read the GameSettingsSheet source to confirm no playlist selector
      const fs = await import('fs');
      const source = fs.readFileSync('client/src/components/GameSettingsSheet.tsx', 'utf-8');
      expect(source).not.toContain('playlists.list');
      expect(source).not.toContain('playlists.owned');
      expect(source).not.toContain('SelectItem');
      expect(source).not.toContain('personalPlaylistId');
    });

    it('SettingsSheet should have playlist selector code', async () => {
      const fs = await import('fs');
      const source = fs.readFileSync('client/src/components/SettingsSheet.tsx', 'utf-8');
      expect(source).toContain('playlists.list');
      expect(source).toContain('playlists.owned');
      expect(source).toContain('personalPlaylistId');
      expect(source).toContain('handlePlaylistChange');
    });

    it('ShopModal should stop background music on preview', async () => {
      const fs = await import('fs');
      const source = fs.readFileSync('client/src/components/ShopModal.tsx', 'utf-8');
      expect(source).toContain('music.stopMusic()');
      expect(source).toContain('wasMusicPlayingRef');
      expect(source).toContain('music.startMusic()');
    });
  });
});

describe('Playlist features (Batch 94)', () => {
  describe('GameSettingsSheet has no playlist selector', () => {
    it('should not import any playlist-related components', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('client/src/components/GameSettingsSheet.tsx', 'utf-8');
      expect(content).not.toContain('playlist');
      expect(content).not.toContain('Playlist');
      expect(content).not.toContain('SelectItem');
    });
  });

  describe('SettingsSheet has playlist selector', () => {
    it('should import Select components and playlist-related hooks', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('client/src/components/SettingsSheet.tsx', 'utf-8');
      expect(content).toContain('SelectItem');
      expect(content).toContain('playlists.list');
      expect(content).toContain('playlists.owned');
      expect(content).toContain('personalPlaylistId');
    });
  });

  describe('ShopModal stops background music during preview', () => {
    it('should import useMusicContext and use it in preview', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('client/src/components/ShopModal.tsx', 'utf-8');
      expect(content).toContain('useMusicContext');
      expect(content).toContain('wasMusicPlayingRef');
      expect(content).toContain('music.stopMusic()');
      expect(content).toContain('music.startMusic()');
    });
  });
});
