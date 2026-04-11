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
      // Deck 1 should be "Батыры великой степи" in all contexts
      expect(translations.lobby.deckClassic).toBe('Батыры великой степи');
      expect(translations.waitingRoom.deckN1).toBe('Батыры великой степи');
      // Deck 2 should be "Товарищ Мырза" in all contexts
      expect(translations.lobby.deckCustom).toBe('Товарищ Мырза');
      expect(translations.waitingRoom.deckN2).toBe('Товарищ Мырза');
    });

    it('should have renamed deck labels in kk translations', async () => {
      const { kk: translations } = await import('../client/src/i18n/kk');
      // Kazakh uses localized names
      expect(translations.lobby.deckClassic).toBe('ұлы даланың батырлары');
      expect(translations.waitingRoom.deckN1).toBe('ұлы даланың батырлары');
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

    it('ShopModal should pause/resume background music on preview', async () => {
      const fs = await import('fs');
      const source = fs.readFileSync('client/src/components/ShopModal.tsx', 'utf-8');
      expect(source).toContain('music.pauseMusic()');
      expect(source).toContain('wasMusicPlayingRef');
      expect(source).toContain('music.resumeMusic()');
    });
  });
});

describe('Playlist bug fixes (Batch 95)', () => {
  describe('No Rules house references', () => {
    it('SettingsSheet should not contain Rules house text', async () => {
      const fs = await import('fs');
      const source = fs.readFileSync('client/src/components/SettingsSheet.tsx', 'utf-8');
      expect(source).not.toContain('Rules house');
      expect(source).not.toContain('Relus house');
    });

    it('should have Классический as default playlist label in SettingsSheet', async () => {
      const fs = await import('fs');
      const source = fs.readFileSync('client/src/components/SettingsSheet.tsx', 'utf-8');
      expect(source).toContain('Классический');
      expect(source).toContain('Классикалық');
    });

    it('cleanupOldPlaylists function should exist in db.ts', async () => {
      const db = await import('./db');
      expect(typeof db.cleanupOldPlaylists).toBe('function');
    });
  });

  describe('Track format fix', () => {
    it('SettingsSheet should use tracks as string[] not map .url', async () => {
      const fs = await import('fs');
      const source = fs.readFileSync('client/src/components/SettingsSheet.tsx', 'utf-8');
      // Should NOT have the old .url mapping
      expect(source).not.toContain('.map((t: any) => typeof t');
      expect(source).not.toContain("t.url");
      // Should cast tracks as string[]
      expect(source).toContain('as string[]');
    });

    it('Home.tsx should use tracks as string[] not map .url', async () => {
      const fs = await import('fs');
      const source = fs.readFileSync('client/src/pages/Home.tsx', 'utf-8');
      // Should NOT have the old .url mapping
      expect(source).not.toContain('.map((t: any) => t.url');
      // Should cast tracks as string[]
      expect(source).toContain('as string[]');
    });
  });

  describe('ShopModal preview toggle', () => {
    it('should use togglePreview function instead of startPreview', async () => {
      const fs = await import('fs');
      const source = fs.readFileSync('client/src/components/ShopModal.tsx', 'utf-8');
      expect(source).toContain('togglePreview');
      expect(source).not.toContain('startPreview');
    });

    it('should save wasMusicPlayingRef using isPlaying before pausing music', async () => {
      const fs = await import('fs');
      const source = fs.readFileSync('client/src/components/ShopModal.tsx', 'utf-8');
      // wasMusicPlayingRef should be set using music.isPlaying() before pauseMusic
      expect(source).toContain('wasMusicPlayingRef.current = music.isPlaying()');
      expect(source).toContain('music.pauseMusic()');
    });

    it('should resume music in stopPreview when wasMusicPlayingRef is true', async () => {
      const fs = await import('fs');
      const source = fs.readFileSync('client/src/components/ShopModal.tsx', 'utf-8');
      // In stopPreview, should check wasMusicPlayingRef and call resumeMusic
      expect(source).toContain('if (wasMusicPlayingRef.current)');
      expect(source).toContain('music.resumeMusic()');
    });
  });
});

describe('Batch 96 — Chinese URL fix & duplicate cleanup', () => {
  it('seedChinesePlaylist should use %2B in track URLs, not +', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('server/db.ts', 'utf-8');
    // Find the chineseTracks array within seedChinesePlaylist
    const tracksStart = source.indexOf("const chineseTracks = [");
    const tracksEnd = source.indexOf('];', tracksStart) + 2;
    const tracksArray = source.substring(tracksStart, tracksEnd);
    // All track URLs in the array should use %2B encoding
    expect(tracksArray).toContain('chill%2Bhiphop');
    // Track URLs should NOT contain raw + (the name field is separate)
    expect(tracksArray).not.toContain('chill+hiphop');
  });

  it('fixChinesePlaylistUrls function should exist in db.ts', async () => {
    const db = await import('./db');
    expect(typeof db.fixChinesePlaylistUrls).toBe('function');
  });

  it('cleanupOldPlaylists should handle duplicate Классический playlists', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('server/db.ts', 'utf-8');
    const cleanupSection = source.substring(source.indexOf('cleanupOldPlaylists'));
    // Should check for duplicate Классический playlists
    expect(cleanupSection).toContain('Классический');
    expect(cleanupSection).toContain('defaults.length > 1');
  });

  it('seedDefaultPlaylist should check by name too, not just isDefault', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('server/db.ts', 'utf-8');
    const seedSection = source.substring(source.indexOf('seedDefaultPlaylist'));
    expect(seedSection).toContain('existingByName');
    expect(seedSection).toContain('Классический');
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
    it('should import useMusicContext and use pauseMusic/resumeMusic in preview', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('client/src/components/ShopModal.tsx', 'utf-8');
      expect(content).toContain('useMusicContext');
      expect(content).toContain('wasMusicPlayingRef');
      expect(content).toContain('music.pauseMusic()');
      expect(content).toContain('music.resumeMusic()');
    });
  });
});
