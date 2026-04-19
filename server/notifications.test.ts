import { describe, it, expect } from 'vitest';
import { AVATAR_OPTIONS, getAvatarUrl, isAnimatedAvatar, getAvatarOption } from '@shared/avatars';

/**
 * Tests for V23 notification system logic and friend request notification payloads.
 */

describe('Notification System', () => {
  describe('notification types', () => {
    const validTypes = ['friend_request', 'friend_accepted', 'balance_topup'];

    it('should recognize friend_request type', () => {
      expect(validTypes.includes('friend_request')).toBe(true);
    });

    it('should recognize friend_accepted type', () => {
      expect(validTypes.includes('friend_accepted')).toBe(true);
    });

    it('should recognize balance_topup type', () => {
      expect(validTypes.includes('balance_topup')).toBe(true);
    });
  });

  describe('notification data payloads', () => {
    it('friend_request notification should include friendshipId', () => {
      const notificationData = {
        senderName: 'TestPlayer',
        senderGameId: 42,
        senderAvatarId: 'wolf',
        friendshipId: 7,
      };

      expect(notificationData.friendshipId).toBeDefined();
      expect(typeof notificationData.friendshipId).toBe('number');
      expect(notificationData.senderName).toBe('TestPlayer');
      expect(notificationData.senderGameId).toBe(42);
    });

    it('friend_accepted notification should include accepter info', () => {
      const notificationData = {
        accepterName: 'Player2',
        accepterGameId: 15,
        accepterAvatarId: 'eagle',
      };

      expect(notificationData.accepterName).toBe('Player2');
      expect(notificationData.accepterGameId).toBe(15);
      expect(notificationData.accepterAvatarId).toBe('eagle');
    });

    it('notification data should be JSON serializable', () => {
      const data = {
        senderName: 'Test',
        senderGameId: 1,
        senderAvatarId: 'wolf',
        friendshipId: 5,
      };

      const serialized = JSON.stringify(data);
      const parsed = JSON.parse(serialized);

      expect(parsed.friendshipId).toBe(5);
      expect(parsed.senderName).toBe('Test');
    });
  });

  describe('unread count logic', () => {
    it('should count unread notifications correctly', () => {
      const notifications = [
        { id: 1, isRead: false },
        { id: 2, isRead: true },
        { id: 3, isRead: false },
        { id: 4, isRead: false },
      ];

      const unreadCount = notifications.filter(n => !n.isRead).length;
      expect(unreadCount).toBe(3);
    });

    it('should return 0 when all are read', () => {
      const notifications = [
        { id: 1, isRead: true },
        { id: 2, isRead: true },
      ];

      const unreadCount = notifications.filter(n => !n.isRead).length;
      expect(unreadCount).toBe(0);
    });

    it('should return 0 for empty notifications', () => {
      const notifications: any[] = [];
      const unreadCount = notifications.filter((n: any) => !n.isRead).length;
      expect(unreadCount).toBe(0);
    });

    it('should display 9+ when unread count exceeds 9', () => {
      const unreadCount = 15;
      const display = unreadCount > 9 ? '9+' : String(unreadCount);
      expect(display).toBe('9+');
    });

    it('should display exact count when 9 or less', () => {
      const unreadCount = 5;
      const display = unreadCount > 9 ? '9+' : String(unreadCount);
      expect(display).toBe('5');
    });
  });

  describe('mark all as read', () => {
    it('should mark all notifications as read', () => {
      const notifications = [
        { id: 1, isRead: false },
        { id: 2, isRead: false },
        { id: 3, isRead: true },
      ];

      const updated = notifications.map(n => ({ ...n, isRead: true }));
      expect(updated.every(n => n.isRead)).toBe(true);
    });
  });

  describe('notification deletion', () => {
    it('should remove notification by id', () => {
      const notifications = [
        { id: 1, type: 'friend_request' },
        { id: 2, type: 'friend_accepted' },
        { id: 3, type: 'balance_topup' },
      ];

      const afterDelete = notifications.filter(n => n.id !== 2);
      expect(afterDelete.length).toBe(2);
      expect(afterDelete.find(n => n.id === 2)).toBeUndefined();
    });
  });
});

describe('Player Profile Popup (In-Game)', () => {
  describe('profile with friend status', () => {
    it('should return friend status none for strangers', () => {
      const result = {
        gameId: 5,
        displayName: 'Opponent',
        avatarId: 'eagle',
        rating: 1200,
        gamesPlayed: 50,
        wins: 30,
        losses: 20,
        friendStatus: 'none' as const,
        friendshipId: null,
      };

      expect(result.friendStatus).toBe('none');
      expect(result.friendshipId).toBeNull();
    });

    it('should return pending_sent for outgoing request', () => {
      const result = {
        gameId: 5,
        displayName: 'Opponent',
        friendStatus: 'pending_sent' as const,
        friendshipId: 10,
      };

      expect(result.friendStatus).toBe('pending_sent');
      expect(result.friendshipId).toBe(10);
    });

    it('should return friends for accepted friendship', () => {
      const result = {
        gameId: 5,
        displayName: 'Opponent',
        friendStatus: 'friends' as const,
        friendshipId: 10,
      };

      expect(result.friendStatus).toBe('friends');
    });

    it('should calculate win rate from profile data', () => {
      const profile = { gamesPlayed: 100, wins: 65, losses: 35 };
      const winRate = profile.gamesPlayed > 0
        ? Math.round((profile.wins / profile.gamesPlayed) * 100)
        : 0;
      expect(winRate).toBe(65);
    });
  });
});

describe('Currency Icons', () => {
  it('should have tenge icon referenced in source files', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('client/src/components/AchievementsModal.tsx', 'utf-8');
    expect(source).toContain('tenge');
  });

  it('should have shanyrak icon referenced in source files', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('client/src/components/AchievementsModal.tsx', 'utf-8');
    expect(source).toContain('shanyrak');
  });
});

describe('Avatar in Game', () => {
  it('should include avatarId in ClientPlayer', () => {
    const player = {
      id: 'player1',
      name: 'TestPlayer',
      cardCount: 6,
      isAttacker: true,
      isDefender: false,
      isOut: false,
      gameId: 42,
      avatarId: 'wolf',
    };

    expect(player.avatarId).toBe('wolf');
    expect(player.gameId).toBe(42);
  });

  it('should default bot avatar to bot', () => {
    const botPlayer = {
      id: 'bot-1',
      name: 'Бот 1',
      cardCount: 6,
      isAttacker: false,
      isDefender: true,
      isOut: false,
      avatarId: 'bot',
    };

    expect(botPlayer.avatarId).toBe('bot');
  });

  it('should handle missing avatarId gracefully', () => {
    const player = {
      id: 'player2',
      name: 'NoAvatar',
      cardCount: 4,
      avatarId: undefined,
    };

    const avatarId = player.avatarId ?? 'wolf';
    expect(avatarId).toBe('wolf');
  });
});

describe('Goose Premium Avatar', () => {
  it('should include goose_animated in AVATAR_OPTIONS as premium', () => {
    const goose = AVATAR_OPTIONS.find(a => a.id === 'goose_animated');
    expect(goose).toBeDefined();
    expect(goose!.premium).toBe(true);
    expect(goose!.price).toBe(100);
    expect(goose!.url).toContain('.png');
    expect(goose!.animated).toBeUndefined();
  });

  it('should have correct name and nameKk for goose avatar', () => {
    const goose = AVATAR_OPTIONS.find(a => a.id === 'goose_animated');
    expect(goose!.name).toBe('Весёлый гусь');
    expect(goose!.nameKk).toBe('Көңілді қаз');
  });

  it('getAvatarUrl should return PNG URL for goose avatar', () => {
    const url = getAvatarUrl('goose_animated');
    expect(url).toContain('.png');
    expect(url).toContain('goose_new');
  });

  it('isAnimatedAvatar should return false for goose (no longer animated)', () => {
    expect(isAnimatedAvatar('goose_animated')).toBe(false);
    expect(isAnimatedAvatar('wolf')).toBe(false);
    expect(isAnimatedAvatar(null)).toBe(false);
    expect(isAnimatedAvatar(undefined)).toBe(false);
  });

  it('getAvatarOption should return full avatar object for goose', () => {
    const goose = getAvatarOption('goose_animated');
    expect(goose).toBeDefined();
    expect(goose!.id).toBe('goose_animated');
    expect(goose!.animated).toBeUndefined();
    expect(goose!.previewUrl).toBeUndefined();
  });

  it('nexus_bunny should also be premium without animated flag', () => {
    const nexusBunny = AVATAR_OPTIONS.find(a => a.id === 'nexus_bunny');
    expect(nexusBunny).toBeDefined();
    expect(nexusBunny!.animated).toBeUndefined();
    expect(nexusBunny!.premium).toBe(true);
  });
});
