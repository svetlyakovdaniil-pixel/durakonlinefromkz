import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getOrCreateProfile,
  getProfileByUserId,
  getProfileByGameId,
  updateProfileDisplayName,
  updateProfileAvatar,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
  getLeaderboard,
  getPlayerGameHistory,
  createNotification,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  getPlayerProfileWithFriendStatus,
  getFriendshipById,
  freeShanyrakTopup,
  buyShanyrakWithTenge,
  getFreeTopupStatus,
  recordTransaction,
  getMyTransactions,
  testAddShanyrak,
  testAddTenge,
  getOwnedDecks,
  purchaseDeck,
  getOwnedTables,
  purchaseTable,
  getOwnedFrames,
  purchaseFrame,
  equipFrame,
} from "./db";
import { emitNotificationToProfile } from "./socketServer";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================================
  // PLAYER PROFILE
  // ============================================================
  profile: router({
    /** Get or create the current user's profile (auto-assigns gameId on first call) */
    me: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getOrCreateProfile(ctx.user.id, ctx.user.name);
      return profile;
    }),

    /** Get a player's public profile by their gameId */
    byGameId: publicProcedure
      .input(z.object({ gameId: z.number() }))
      .query(async ({ input }) => {
        const profile = await getProfileByGameId(input.gameId);
        if (!profile) return null;
        return {
          gameId: profile.gameId,
          displayName: profile.displayName,
          avatarId: profile.avatarId,
          equippedFrame: profile.equippedFrame,
          rating: profile.rating,
          gamesPlayed: profile.gamesPlayed,
          wins: profile.wins,
          losses: profile.losses,
          createdAt: profile.createdAt,
        };
      }),

    /** Get a player's profile with friendship status (for in-game popup) */
    withFriendStatus: protectedProcedure
      .input(z.object({ targetGameId: z.number() }))
      .query(async ({ ctx, input }) => {
        const myProfile = await getProfileByUserId(ctx.user.id);
        if (!myProfile) return null;
        return getPlayerProfileWithFriendStatus(input.targetGameId, myProfile.id);
      }),

    /** Update display name */
    updateName: protectedProcedure
      .input(z.object({ displayName: z.string().min(1).max(12) }))
      .mutation(async ({ ctx, input }) => {
        await updateProfileDisplayName(ctx.user.id, input.displayName);
        return { success: true };
      }),

    /** Update avatar */
    updateAvatar: protectedProcedure
      .input(z.object({ avatarId: z.string().min(1).max(32) }))
      .mutation(async ({ ctx, input }) => {
        await updateProfileAvatar(ctx.user.id, input.avatarId);
        return { success: true };
      }),
  }),

  // ============================================================
  // FRIENDS
  // ============================================================
  friends: router({
    /** Get all accepted friends */
    list: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getFriends(profile.id);
    }),

    /** Get pending friend requests */
    pendingRequests: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getPendingRequests(profile.id);
    }),

    /** Send friend request by gameId */
    sendRequest: protectedProcedure
      .input(z.object({ targetGameId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const myProfile = await getProfileByUserId(ctx.user.id);
        if (!myProfile) return { result: 'not_found' as const };

        const targetProfile = await getProfileByGameId(input.targetGameId);
        if (!targetProfile) return { result: 'not_found' as const };

        const { result, friendshipId } = await sendFriendRequest(myProfile.id, targetProfile.id);

        // Create notification for receiver
        if (result === 'sent' && friendshipId) {
          await createNotification(targetProfile.id, 'friend_request', {
            senderName: myProfile.displayName ?? 'Unknown',
            senderGameId: myProfile.gameId,
            senderAvatarId: myProfile.avatarId ?? 'wolf',
            friendshipId,
          });
          // Emit real-time notification
          emitNotificationToProfile(targetProfile.id, 'friend_request');
        }

        return { result };
      }),

    /** Accept a friend request */
    acceptRequest: protectedProcedure
      .input(z.object({ friendshipId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Get the friendship before accepting to know the sender
        const friendship = await getFriendshipById(input.friendshipId);
        const myProfile = await getProfileByUserId(ctx.user.id);
        if (!myProfile) return { success: false };
        const ok = await acceptFriendRequest(input.friendshipId, myProfile.id);

        // Notify the sender that their request was accepted
        if (ok && friendship) {
          await createNotification(friendship.senderId, 'friend_accepted', {
            accepterName: myProfile.displayName ?? 'Unknown',
            accepterGameId: myProfile.gameId,
            accepterAvatarId: myProfile.avatarId ?? 'wolf',
          });
          // Emit real-time notification
          emitNotificationToProfile(friendship.senderId, 'friend_accepted');
        }

        return { success: ok };
      }),

    /** Reject a friend request */
    rejectRequest: protectedProcedure
      .input(z.object({ friendshipId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const myProfile = await getProfileByUserId(ctx.user.id);
        if (!myProfile) return { success: false };
        const ok = await rejectFriendRequest(input.friendshipId, myProfile.id);
        return { success: ok };
      }),

    /** Remove a friend */
    remove: protectedProcedure
      .input(z.object({ friendProfileId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const myProfile = await getProfileByUserId(ctx.user.id);
        if (!myProfile) return { success: false };
        const ok = await removeFriend(myProfile.id, input.friendProfileId);
        return { success: ok };
      }),
  }),

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  notifications: router({
    /** Get all notifications for current user */
    list: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return [];

      // Auto-generate cooldown_expired notification if 12h has passed since lastFreeTopup
      // and there's no recent unread cooldown_expired notification
      if (profile.lastFreeTopup) {
        const cooldownEnd = new Date(profile.lastFreeTopup.getTime() + 12 * 60 * 60 * 1000);
        const now = new Date();
        if (now >= cooldownEnd) {
          // Check if we already have an unread cooldown_expired notification after the cooldown ended
          const existingNotifs = await getNotifications(profile.id, 10);
          const hasCooldownNotif = existingNotifs.some(n => {
            if (n.type !== 'cooldown_expired') return false;
            // Only consider notifications created after the cooldown end
            return n.createdAt >= cooldownEnd;
          });
          if (!hasCooldownNotif) {
            await createNotification(profile.id, 'cooldown_expired', {
              message: 'Вы снова можете добить баланс шаныраков до 2000!',
            });
          }
        }
      }

      const rows = await getNotifications(profile.id);
      return rows.map(r => ({
        ...r,
        data: r.data ? JSON.parse(r.data) : null,
      }));
    }),

    /** Get unread count */
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return 0;
      return getUnreadNotificationCount(profile.id);
    }),

    /** Mark all as read */
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return { success: false };
      await markNotificationsRead(profile.id);
      return { success: true };
    }),

    /** Delete a notification */
    delete: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getProfileByUserId(ctx.user.id);
        if (!profile) return { success: false };
        const ok = await deleteNotification(input.notificationId, profile.id);
        return { success: ok };
      }),

    /** Delete all notifications */
    deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return { success: false };
      const ok = await deleteAllNotifications(profile.id);
      return { success: ok };
    }),
  }),

  // ============================================================
  // BALANCE / SHOP
  // ============================================================
  balance: router({
    /** Get free topup cooldown status */
    freeTopupStatus: protectedProcedure.query(async ({ ctx }) => {
      return getFreeTopupStatus(ctx.user.id);
    }),

    /** Free top-up: set shanyrak to 2000 (12h cooldown) */
    freeShanyrakTopup: protectedProcedure.mutation(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      const result = await freeShanyrakTopup(ctx.user.id);
      if (result.success && profile && result.added && result.newBalance !== undefined) {
        await recordTransaction({
          profileId: profile.id,
          type: 'free_topup',
          amount: result.added,
          currency: 'shanyrak',
          description: `Добить баланс до 2000 (+${result.added} шаныраков)`,
          balanceAfter: result.newBalance,
        });
      }
      return result;
    }),

    /** Buy shanyrak with tenge */
    buyShanyrak: protectedProcedure
      .input(z.object({
        tier: z.enum(['10k', '50k', '100k', '500k']),
      }))
      .mutation(async ({ ctx, input }) => {
        const tiers: Record<string, { shanyrak: number; tenge: number }> = {
          '10k': { shanyrak: 10000, tenge: 50 },
          '50k': { shanyrak: 50000, tenge: 220 },
          '100k': { shanyrak: 100000, tenge: 400 },
          '500k': { shanyrak: 500000, tenge: 1500 },
        };
        const t = tiers[input.tier];
        if (!t) return { success: false, reason: 'invalid_tier' as const };
        const result = await buyShanyrakWithTenge(ctx.user.id, t.shanyrak, t.tenge);
        if (result.success) {
          const profile = await getProfileByUserId(ctx.user.id);
          if (profile) {
            // Record shanyrak gain
            await recordTransaction({
              profileId: profile.id,
              type: 'buy_shanyrak',
              amount: t.shanyrak,
              currency: 'shanyrak',
              description: `Куплено ${(t.shanyrak / 1000)}K шаныраков за ${t.tenge} тенге`,
              balanceAfter: result.newShanyrak ?? 0,
            });
            // Record tenge spend
            await recordTransaction({
              profileId: profile.id,
              type: 'buy_shanyrak',
              amount: -t.tenge,
              currency: 'tenge',
              description: `Оплата за ${(t.shanyrak / 1000)}K шаныраков`,
              balanceAfter: result.newTenge ?? 0,
            });
          }
        }
        return result;
      }),
    /** [TEST] Add 10K shanyraks */
    testAddShanyrak: protectedProcedure.mutation(async ({ ctx }) => {
      const result = await testAddShanyrak(ctx.user.id);
      return result;
    }),

    /** [TEST] Add 10K tenge */
    testAddTenge: protectedProcedure.mutation(async ({ ctx }) => {
      const result = await testAddTenge(ctx.user.id);
      return result;
    }),

    /** Get my transaction history (private, only own) */
    myTransactions: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).optional() }).optional())
      .query(async ({ ctx, input }) => {
        const profile = await getProfileByUserId(ctx.user.id);
        if (!profile) return [];
        return getMyTransactions(profile.id, input?.limit ?? 50);
      }),
  }),

  // ============================================================
  // SHOP
  // ============================================================
  shop: router({
    /** Get owned deck IDs for the current user */
    ownedDecks: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getOwnedDecks(profile.id);
    }),

    /** Purchase a deck */
    purchaseDeck: protectedProcedure
      .input(z.object({ deckId: z.string(), tengeCost: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await purchaseDeck(ctx.user.id, input.deckId, input.tengeCost);
        return result;
      }),

    /** Get owned table style IDs for the current user */
    ownedTables: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getOwnedTables(profile.id);
    }),

    /** Purchase a table style */
    purchaseTable: protectedProcedure
      .input(z.object({ tableId: z.string(), tengeCost: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await purchaseTable(ctx.user.id, input.tableId, input.tengeCost);
        return result;
      }),

    /** Get owned frame IDs for the current user */
    ownedFrames: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getOwnedFrames(profile.id);
    }),

    /** Purchase a frame */
    purchaseFrame: protectedProcedure
      .input(z.object({ frameId: z.string(), tengeCost: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await purchaseFrame(ctx.user.id, input.frameId, input.tengeCost);
        return result;
      }),

    /** Equip or unequip a frame */
    equipFrame: protectedProcedure
      .input(z.object({ frameId: z.string().nullable() }))
      .mutation(async ({ ctx, input }) => {
        const result = await equipFrame(ctx.user.id, input.frameId);
        return result;
      }),
  }),

  // ============================================================
  // LEADERBOARD & STATS
  // ============================================================
  stats: router({
    /** Get top players leaderboard */
    leaderboard: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).optional() }).optional())
      .query(async ({ input }) => {
        return getLeaderboard(input?.limit ?? 50);
      }),

  }),

  gameHistory: router({
    /** Get game history for current user */
    myHistory: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).optional() }).optional())
      .query(async ({ ctx, input }) => {
        const profile = await getProfileByUserId(ctx.user.id);
        if (!profile) return [];
        return getPlayerGameHistory(profile.id, input?.limit ?? 20);
      }),
  }),
});

export type AppRouter = typeof appRouter;
