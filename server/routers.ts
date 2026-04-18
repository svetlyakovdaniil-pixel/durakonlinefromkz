import { COOKIE_NAME, RESERVED_NAME_ERR_MSG } from "@shared/const";
import { containsProfanity, PROFANITY_ERR_MSG } from "../shared/profanityFilter";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, gmProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
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
  purchaseAvatar,
  getOwnedAvatars,
  completeTutorial,
  adminGetPlayers,
  adminUpdateBalance,
  adminBanPlayer,
  adminUnbanPlayer,
  adminResetStats,
  adminGetTransactions,
  adminGetGlobalStats,
  adminGetPlayerDetail,
  adminUpdateRole,
  adminGetPlayerTransactions,
  adminGetPlayerGameHistory,
  adminRevokePlayerPurchase,
  adminGetPlayerPurchases,
  adminRemovePlayerItem,
  adminGetPlayerItems,
  adminResetPlayerAccount,
  logAdminAction,
  getAuditLog,
  adminBanPlayerWithDuration,
  checkAndAutoUnban,
  detectAbnormalWinRate,
  detectSuspiciousTransactions,
  detectRapidBalanceGrowth,
  sendMassNotification,
  getMassNotificationHistory,
  getShopPriceOverrides,
  upsertShopPriceOverride,
  getShopItemPrice,
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  getComplaintStats,
  getAllPlaylists,
  getOwnedPlaylistIds,
  purchasePlaylist,
  setActivePlaylist,
  getPlaylistById,
  createContactMessage,
  getContactMessages,
  updateContactMessageStatus,
  creditTengeIAP,
  getTotalTengeSpentByProfile,
  getWinsLeaderboard,
  getShanyraqLeaderboard,
  getAllAvatarOffsets,
  upsertAvatarOffset,
  getSeasonTestState,
  upsertSeasonTestState,
  getOrCreateReferralCode,
  activateReferralCode,
  getReferralStats,
  adminForceRenamePlayer,
  adminSetPlayerName,
  getCustomProfanityWords,
  setCustomProfanityWords,
  getMaintenanceStatus,
  setMaintenanceStatus,
  purchaseEmotionPack,
  setActiveEmotionPack,
  getOwnedEmotionPacks,
} from "./db";
import { getAchievementsForProfile, incrementAchievementProgress, claimAchievementReward, getUnclaimedAchievementCount, forceRecalculateManyFaces, retroactiveRecalcAllAchievements } from "./achievementsDb";
import { getOrCreateSeasonRating, getSeasonLeaderboard, getPlayerSeasonRating, processSeasonEnd, getUnclaimedSeasonRewards, claimSeasonReward } from "./db.season";
import { getCurrentSeasonKey, getSeasonInfo, getSeasonBounds, getSeasonRank, SEASON_RANKS, SEASONS } from "../shared/seasons";
import { processDonatorAchievement, processTutorialAchievements, processCollectorAchievements, processAchievementCountAchievements } from "./achievementsTriggers";
import { getTodayQuestsWithDefs, claimDailyQuestReward, getUnclaimedDailyQuestCount, swapDailyQuest, incrementDailyQuestProgress } from "./dailyQuestsDb";
import { getPremiumStatus, buyPremium, getPremiumStats, getDailyQuestSwapsRemaining, useDailyQuestSwap } from "./premiumDb";
import { emitNotificationToProfile, getAdminOnlineStats, adminKickPlayer, updatePlayerDisplayName } from "./socketServer";

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
          botGamesPlayed: profile.botGamesPlayed,
          botWins: profile.botWins,
          botLosses: profile.botLosses,
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
        // Block forbidden names for non-admin users
        if (ctx.user.role !== 'admin') {
          const normalized = input.displayName.toLowerCase().replace(/[\s._\-]/g, '');
          const forbidden = [
            'admin', 'administrator', 'администратор', 'админ', 'админка',
            'gm', 'gamemaster', 'gamemstr', 'геймастер', 'геймастер',
            'moderator', 'модератор', 'модер', 'moder',
            'owner', 'system', 'support', 'staff',
          ];
          if (forbidden.some(f => normalized.includes(f))) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: RESERVED_NAME_ERR_MSG });
          }
          // Block profanity in display names
          if (containsProfanity(input.displayName)) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: PROFANITY_ERR_MSG });
          }
          // Block custom profanity words added by admins
          const customWords = await getCustomProfanityWords();
          if (customWords.length > 0) {
            const normalizedInput = input.displayName.toLowerCase().replace(/[\s._\-]/g, '');
            if (customWords.some((w: string) => normalizedInput.includes(w.toLowerCase().replace(/[\s._\-]/g, '')))) {
              throw new TRPCError({ code: 'BAD_REQUEST', message: PROFANITY_ERR_MSG });
            }
          }
        }
        await updateProfileDisplayName(ctx.user.id, input.displayName);
        // Also update the in-memory socket maps so disconnect/reconnect uses the new name
        if (ctx.user.openId) {
          updatePlayerDisplayName(ctx.user.openId, input.displayName);
        }
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
          // Daily quest "Братишка" — both players get credit when friendship is accepted
          await incrementDailyQuestProgress(myProfile.id, 'friend_added', 1).catch(() => {});
          await incrementDailyQuestProgress(friendship.senderId, 'friend_added', 1).catch(() => {});
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
          const hasCooldownNotif = existingNotifs.some((n: typeof existingNotifs[number]) => {
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
      return rows.map((r: typeof rows[number]) => ({
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
        // Block deletion of unclaimed season_reward notifications
        const db = await (await import('./db')).getDb();
        if (db) {
          const { notifications: notifTable } = await import('../drizzle/schema');
          const { eq, and } = await import('drizzle-orm');
          const [notif] = await db.select().from(notifTable)
            .where(and(eq(notifTable.id, input.notificationId), eq(notifTable.profileId, profile.id)))
            .limit(1);
          if (notif?.type === 'season_reward') {
            // Check if the reward has been claimed
            const { seasonRewards } = await import('../drizzle/schema');
            const data = notif.data ? JSON.parse(notif.data) : {};
            const seasonKey = data.seasonKey;
            if (seasonKey) {
              const [reward] = await db.select({ claimed: seasonRewards.claimed })
                .from(seasonRewards)
                .where(and(eq(seasonRewards.profileId, profile.id), eq(seasonRewards.seasonKey, seasonKey)))
                .limit(1);
              if (!reward || !reward.claimed) {
                return { success: false, blocked: true };
              }
            }
          }
        }
        const ok = await deleteNotification(input.notificationId, profile.id);
        return { success: ok };
      }),

    /** Delete all notifications */
    deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return { success: false };
      // Delete all except unclaimed season_reward notifications
      const db = await (await import('./db')).getDb();
      if (db) {
        const { notifications: notifTable, seasonRewards } = await import('../drizzle/schema');
        const { eq, and, ne, inArray } = await import('drizzle-orm');
        // Find unclaimed season_reward notification IDs to exclude
        const seasonNotifs = await db.select({ id: notifTable.id, data: notifTable.data })
          .from(notifTable)
          .where(and(eq(notifTable.profileId, profile.id), eq(notifTable.type, 'season_reward')));
        const blockedIds: number[] = [];
        for (const sn of seasonNotifs) {
          const data = sn.data ? JSON.parse(sn.data) : {};
          if (data.seasonKey) {
            const [reward] = await db.select({ claimed: seasonRewards.claimed })
              .from(seasonRewards)
              .where(and(eq(seasonRewards.profileId, profile.id), eq(seasonRewards.seasonKey, data.seasonKey)))
              .limit(1);
            if (!reward || !reward.claimed) blockedIds.push(sn.id);
          }
        }
        if (blockedIds.length > 0) {
          // Delete all except blocked
          const allNotifs = await db.select({ id: notifTable.id })
            .from(notifTable).where(eq(notifTable.profileId, profile.id));
          const toDelete = allNotifs.map((n: typeof allNotifs[number]) => n.id).filter((id: number) => !blockedIds.includes(id));
          if (toDelete.length > 0) {
            await db.delete(notifTable).where(inArray(notifTable.id, toDelete));
          }
          return { success: true };
        }
      }
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
    /** Complete tutorial and receive 2000 shanyrak reward (one-time) */
    completeTutorial: protectedProcedure.mutation(async ({ ctx }) => {
      const result = await completeTutorial(ctx.user.id);
      // Trigger tutorial achievements
      const profile = await getProfileByUserId(ctx.user.id);
      if (profile) {
        processTutorialAchievements(profile.id).catch(() => {});
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
      .input(z.object({ limit: z.number().min(1).max(100).optional(), currency: z.enum(['tenge', 'shanyrak']).optional() }).optional())
      .query(async ({ ctx, input }) => {
        const profile = await getProfileByUserId(ctx.user.id);
        if (!profile) return [];
        const transactions = await getMyTransactions(profile.id, input?.limit ?? 50);
        if (input?.currency) {
          return transactions.filter((t: typeof transactions[number]) => t.currency === input.currency);
        }
        return transactions;
      }),

    /** Get current tenge + shanyrak balance */
    myBalance: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return { tenge: 0, shanyrak: 0 };
      return { tenge: profile.balanceTenge, shanyrak: profile.balanceShanyrak };
    }),

    /**
     * Credit tenge after a successful RevenueCat In-App Purchase.
     * Validates productId, deduplicates by transactionId, and credits the player.
     */
    creditTengeIAP: protectedProcedure
      .input(z.object({
        productId: z.enum(['durak_tenge_100', 'durak_tenge_500', 'durak_tenge_1000', 'durak_tenge_5000']),
        transactionId: z.string().min(1).max(255),
        platform: z.enum(['ios', 'android']),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await creditTengeIAP(
          ctx.user.id,
          input.productId,
          input.transactionId,
          input.platform,
        );
        if (!result.success) {
          if (result.reason === 'duplicate') {
            // Idempotent — already credited, return success
            return { credited: 0, alreadyCredited: true };
          }
          throw new TRPCError({ code: 'BAD_REQUEST', message: result.reason ?? 'iap_failed' });
        }
        return { credited: result.credited ?? 0, alreadyCredited: false };
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
        if (result.success) {
          const profile = await getProfileByUserId(ctx.user.id);
          if (profile) {
            if (input.tengeCost > 0) {
              const totalSpent = await getTotalTengeSpentByProfile(profile.id);
              processDonatorAchievement(profile.id, totalSpent).catch(() => {});
            }
            processCollectorAchievements(profile.id).catch(() => {});
          }
        }
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
        if (result.success && input.tengeCost > 0) {
          const profile = await getProfileByUserId(ctx.user.id);
          if (profile) {
            const totalSpent = await getTotalTengeSpentByProfile(profile.id);
            processDonatorAchievement(profile.id, totalSpent).catch(() => {});
          }
        }
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
        if (result.success) {
          const profile = await getProfileByUserId(ctx.user.id);
          if (profile) {
            if (input.tengeCost > 0) {
              const totalSpent = await getTotalTengeSpentByProfile(profile.id);
              processDonatorAchievement(profile.id, totalSpent).catch(() => {});
            }
            processCollectorAchievements(profile.id).catch(() => {});
          }
        }
        return result;
      }),

    /** Equip or unequip a frame */
    equipFrame: protectedProcedure
      .input(z.object({ frameId: z.string().nullable() }))
      .mutation(async ({ ctx, input }) => {
        // Season-only frames (e.g. great_khan) can only be equipped if owned.
        // getOwnedFrames expects profileId (not userId), so we look up the profile first.
        const SEASON_ONLY_BASE_FRAMES = ['great_khan', 'obsidian_neon'];
        if (input.frameId) {
          // Strip season suffix to get base frame ID (e.g. 'obsidian_neon_2026Q3' → 'obsidian_neon')
          const baseFrameId = input.frameId.replace(/_\d{4}Q[1-4]$/, '');
          if (SEASON_ONLY_BASE_FRAMES.includes(baseFrameId)) {
            const profile = await getProfileByUserId(ctx.user.id);
            if (!profile) throw new TRPCError({ code: 'UNAUTHORIZED' });
            const owned = await getOwnedFrames(profile.id);
            if (!owned.includes(input.frameId)) {
              throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'This frame can only be equipped after earning the Obsidian rank at season end.',
              });
            }
          }
        }
        const result = await equipFrame(ctx.user.id, input.frameId);
        return result;
      }),

     /** Get owned premium avatar IDs for the current user */
    ownedAvatars: protectedProcedure.query(async ({ ctx }) => {
      return getOwnedAvatars(ctx.user.id);
    }),
    /** Purchase a premium avatar */
    purchaseAvatar: protectedProcedure
      .input(z.object({ avatarId: z.string(), tengeCost: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await purchaseAvatar(ctx.user.id, input.avatarId, input.tengeCost);
        if (result.success) {
          const profile = await getProfileByUserId(ctx.user.id);
          if (profile) {
            if (input.tengeCost > 0) {
              const totalSpent = await getTotalTengeSpentByProfile(profile.id);
              processDonatorAchievement(profile.id, totalSpent).catch(() => {});
            }
            processCollectorAchievements(profile.id).catch(() => {});
          }
        }
        return result;
      }),
    /** Get owned emotion pack IDs for the current user */
    ownedEmotionPacks: protectedProcedure.query(async ({ ctx }) => {
      return getOwnedEmotionPacks(ctx.user.id);
    }),
    /** Get active emotion pack for the current user */
    activeEmotionPack: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      return profile?.activeEmotionPack ?? 'hamster';
    }),
    /** Purchase an emotion pack */
    purchaseEmotionPack: protectedProcedure
      .input(z.object({ packId: z.string(), tengeCost: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await purchaseEmotionPack(ctx.user.id, input.packId, input.tengeCost);
        if (result.success && input.tengeCost > 0) {
          const profile = await getProfileByUserId(ctx.user.id);
          if (profile) {
            const totalSpent = await getTotalTengeSpentByProfile(profile.id);
            processDonatorAchievement(profile.id, totalSpent).catch(() => {});
          }
        }
        return result;
      }),
    /** Set active emotion pack */
    setActiveEmotionPack: protectedProcedure
      .input(z.object({ packId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return setActiveEmotionPack(ctx.user.id, input.packId);
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

    /** Get top players by wins (human games only) */
    winsLeaderboard: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).optional() }).optional())
      .query(async ({ input }) => {
        return getWinsLeaderboard(input?.limit ?? 50);
      }),

    /** Get top players by shanyrak balance */
    shanyraqLeaderboard: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).optional() }).optional())
      .query(async ({ input }) => {
        return getShanyraqLeaderboard(input?.limit ?? 50);
      }),

    /** Check and award leaderboard position achievements for the current user */
    checkLeaderboardAchievements: protectedProcedure.mutation(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return { position: null };
      const leaderboard = await getLeaderboard(100);
      const position = leaderboard.findIndex((p: any) => p.id === profile.id) + 1;
      if (position > 0 && position <= 3) {
        const { processLeaderboardAchievements } = await import('./achievementsTriggers');
        await processLeaderboardAchievements(profile.id, position);
      }
      return { position: position > 0 ? position : null };
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

  // ============================================================
  // ADMIN PANEL
  // ============================================================
  admin: router({
    /** Get global stats summary */
    globalStats: adminProcedure.query(async () => {
      return adminGetGlobalStats();
    }),

    /** Get online monitoring stats */
    onlineStats: adminProcedure.query(async () => {
      return getAdminOnlineStats();
    }),

    /** Get players list with search/pagination */
    players: gmProcedure
      .input(z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional())
      .query(async ({ input }) => {
        return adminGetPlayers({
          search: input?.search,
          limit: input?.limit ?? 20,
          offset: input?.offset ?? 0,
        });
      }),

    /** Update player balance */
    updateBalance: adminProcedure
      .input(z.object({
        profileId: z.number(),
        currency: z.enum(['tenge', 'shanyrak']),
        amount: z.number(),
        description: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await adminUpdateBalance(input.profileId, input.currency, input.amount, input.description);
        if (result.success) {
          await logAdminAction({
            adminId: ctx.user.id,
            adminName: ctx.user.name ?? null,
            action: 'update_balance',
            targetProfileId: input.profileId,
            details: { currency: input.currency, amount: input.amount, description: input.description },
          });
        }
        return result;
      }),

    /** Ban a player (with optional duration) */
    banPlayer: gmProcedure
      .input(z.object({
        profileId: z.number(),
        reason: z.string().min(1),
        durationMs: z.number().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const durationMs = input.durationMs ?? null;
        const result = await adminBanPlayerWithDuration(input.profileId, input.reason, durationMs);
        if (result.success) {
          const actionType = durationMs ? 'temp_ban' as const : 'ban' as const;
          await logAdminAction({
            adminId: ctx.user.id,
            adminName: ctx.user.name ?? null,
            action: actionType,
            targetProfileId: input.profileId,
            details: { reason: input.reason, durationMs, bannedUntil: result.bannedUntil },
          });
          // Send ban notification to the player
          const banDurationText = durationMs
            ? `${Math.round(durationMs / (1000 * 60 * 60))} ч.`
            : 'навсегда';
          await createNotification(input.profileId, 'account_banned', {
            reason: input.reason,
            duration: banDurationText,
            bannedUntil: result.bannedUntil ?? null,
          });
        }
        return result;
      }),

    /** Unban a player */
    unbanPlayer: gmProcedure
      .input(z.object({ profileId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await adminUnbanPlayer(input.profileId);
        if (result.success) {
          await logAdminAction({
            adminId: ctx.user.id,
            adminName: ctx.user.name ?? null,
            action: 'unban',
            targetProfileId: input.profileId,
          });
        }
        return result;
      }),

    /** Reset player stats */
    resetStats: adminProcedure
      .input(z.object({ profileId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await adminResetStats(input.profileId);
        if (result.success) {
          await logAdminAction({
            adminId: ctx.user.id,
            adminName: ctx.user.name ?? null,
            action: 'reset_stats',
            targetProfileId: input.profileId,
          });
        }
        return result;
      }),

    /** Get transaction history */
    transactions: adminProcedure
      .input(z.object({
        profileId: z.number().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional())
      .query(async ({ input }) => {
        return adminGetTransactions({
          profileId: input?.profileId,
          limit: input?.limit ?? 50,
          offset: input?.offset ?? 0,
        });
      }),

    /** Get full player detail */
    playerDetail: gmProcedure
      .input(z.object({ profileId: z.number() }))
      .query(async ({ ctx, input }) => {
        const detail = await adminGetPlayerDetail(input.profileId);
        // GM cannot see email
        if (ctx.user.role === 'gm' && detail) {
          return { ...detail, email: null };
        }
        return detail;
      }),

    /** Update player role (admin only) */
    updateRole: adminProcedure
      .input(z.object({
        profileId: z.number(),
        role: z.enum(['admin', 'user', 'gm']),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await adminUpdateRole(input.profileId, input.role);
        if (result.success) {
          await logAdminAction({
            adminId: ctx.user.id,
            adminName: ctx.user.name ?? null,
            action: 'change_role',
            targetProfileId: input.profileId,
            details: { newRole: input.role },
          });
        }
        return result;
      }),

    /** Get player transactions with sorting */
    playerTransactions: gmProcedure
      .input(z.object({
        profileId: z.number(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
        sortBy: z.enum(['date', 'amount']).optional(),
        sortDir: z.enum(['asc', 'desc']).optional(),
      }))
      .query(async ({ input }) => {
        return adminGetPlayerTransactions(input);
      }),

    /** Get player game history */
    playerGameHistory: gmProcedure
      .input(z.object({
        profileId: z.number(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }))
      .query(async ({ input }) => {
        return adminGetPlayerGameHistory(input);
      }),

    /** Get all shop purchases for a player */
    getPlayerPurchases: adminProcedure
      .input(z.object({ profileId: z.number() }))
      .query(async ({ input }) => {
        return adminGetPlayerPurchases(input.profileId);
      }),

    /** Revoke a specific purchase from a player (refund + remove item) */
    revokePlayerPurchase: adminProcedure
      .input(z.object({
        profileId: z.number(),
        transactionId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await adminRevokePlayerPurchase({
          profileId: input.profileId,
          transactionId: input.transactionId,
          adminId: ctx.user.id,
        });
        return result;
      }),

    /** Kick a player (disconnect their socket) */
    kickPlayer: adminProcedure
      .input(z.object({ openId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const kicked = adminKickPlayer(input.openId);
        if (kicked) {
          await logAdminAction({
            adminId: ctx.user.id,
            adminName: ctx.user.name ?? null,
            action: 'kick',
            details: { openId: input.openId },
          });
        }
        return { success: kicked };
      }),

    /** Force-rename a player (for inappropriate name complaints) */
    forceRenamePlayer: gmProcedure
      .input(z.object({ profileId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await adminForceRenamePlayer(input.profileId);
        if (!result.success) {
          throw new TRPCError({ code: 'NOT_FOUND', message: result.reason ?? 'Player not found' });
        }
        // Also update in-memory socket name map if player is online
        const playerDetail = await adminGetPlayerDetail(input.profileId);
        if (playerDetail?.openId && result.newName) {
          updatePlayerDisplayName(playerDetail.openId, result.newName);
        }
        await logAdminAction({
          adminId: ctx.user.id,
          adminName: ctx.user.name ?? null,
          action: 'force_rename',
          details: { profileId: input.profileId, newName: result.newName },
        });
        return { success: true, newName: result.newName };
      }),

    // ── Set player name (admin/gm) ──
    setPlayerName: gmProcedure
      .input(z.object({ profileId: z.number(), newName: z.string().min(1).max(32) }))
      .mutation(async ({ ctx, input }) => {
        const result = await adminSetPlayerName(input.profileId, input.newName.trim());
        if (!result.success) {
          throw new TRPCError({ code: 'NOT_FOUND', message: result.reason ?? 'Player not found' });
        }
        // Update in-memory socket name map if player is online
        const playerDetail = await adminGetPlayerDetail(input.profileId);
        if (playerDetail?.openId && result.newName) {
          updatePlayerDisplayName(playerDetail.openId, result.newName);
        }
        await logAdminAction({
          adminId: ctx.user.id,
          adminName: ctx.user.name ?? null,
          action: 'force_rename',
          details: { profileId: input.profileId, newName: result.newName },
        });
        return { success: true, newName: result.newName };
      }),

    // ── Custom profanity words ──
    getCustomProfanityWords: adminProcedure
      .query(async () => {
        return getCustomProfanityWords();
      }),

    setCustomProfanityWords: adminProcedure
      .input(z.object({ words: z.array(z.string().min(1).max(64)) }))
      .mutation(async ({ ctx, input }) => {
        await setCustomProfanityWords(input.words);
        await logAdminAction({
          adminId: ctx.user.id,
          adminName: ctx.user.name ?? null,
          action: 'force_rename',
          details: { action: 'update_profanity_filter', wordCount: input.words.length },
        });
        return { success: true };
      }),

    // ── Audit Log ──
    auditLog: adminProcedure
      .input(z.object({
        actionFilter: z.string().optional(),
        adminId: z.number().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional())
      .query(async ({ input }) => {
        return getAuditLog({
          actionFilter: input?.actionFilter,
          adminId: input?.adminId,
          limit: input?.limit ?? 50,
          offset: input?.offset ?? 0,
        });
      }),

    // ── Anti-Fraud ──
    antifraudWinRate: gmProcedure
      .input(z.object({
        minGames: z.number().optional(),
        minWinRate: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return detectAbnormalWinRate(input?.minGames ?? 20, input?.minWinRate ?? 80);
      }),

    antifraudTransactions: gmProcedure
      .input(z.object({
        minAmount: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return detectSuspiciousTransactions(input?.minAmount ?? 10000);
      }),

    antifraudBalanceGrowth: gmProcedure
      .input(z.object({
        threshold: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return detectRapidBalanceGrowth(input?.threshold ?? 50000);
      }),

    // ── Mass Notifications ──
    sendMassNotification: adminProcedure
      .input(z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1).max(2000),
        segment: z.enum(['all', 'inactive_7d', 'top_100', 'newbies']),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await sendMassNotification({
          adminId: ctx.user.id,
          adminName: ctx.user.name ?? null,
          title: input.title,
          content: input.content,
          segment: input.segment,
        });
        await logAdminAction({
          adminId: ctx.user.id,
          adminName: ctx.user.name ?? null,
          action: 'mass_notify',
          details: { title: input.title, segment: input.segment, sentCount: result.sentCount },
        });
        return result;
      }),

    massNotificationHistory: adminProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional())
      .query(async ({ input }) => {
        return getMassNotificationHistory({
          limit: input?.limit ?? 20,
          offset: input?.offset ?? 0,
        });
      }),

    // ── Shop Management ──
    shopItems: adminProcedure.query(async () => {
      return getShopPriceOverrides();
    }),

    updateShopPrice: adminProcedure
      .input(z.object({
        itemType: z.enum(['deck', 'table', 'frame', 'avatar', 'playlist']),
        itemId: z.string().min(1),
        priceTenge: z.number().min(0).nullable(),
        isAvailable: z.boolean(),
        discountPercent: z.number().min(0).max(100).nullable().optional(),
        discountExpiresAt: z.date().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await upsertShopPriceOverride({
          itemType: input.itemType,
          itemId: input.itemId,
          priceTenge: input.priceTenge,
          isAvailable: input.isAvailable,
          discountPercent: input.discountPercent ?? null,
          discountExpiresAt: input.discountExpiresAt ?? null,
          updatedBy: ctx.user.id,
        });
        if (result.success) {
          await logAdminAction({
            adminId: ctx.user.id,
            adminName: ctx.user.name ?? null,
            action: 'update_shop_item',
            details: { itemType: input.itemType, itemId: input.itemId, priceTenge: input.priceTenge, isAvailable: input.isAvailable, discountPercent: input.discountPercent },
          });
        }
        return result;
      }),

    saveAvatarOffsets: adminProcedure
      .input(z.object({
        avatarId: z.string(),
        offsetX: z.number(),
        offsetY: z.number(),
        imgScale: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertAvatarOffset(input.avatarId, input.offsetX, input.offsetY, input.imgScale);
        await logAdminAction({
          adminId: ctx.user.id,
          adminName: ctx.user.name ?? null,
          action: 'update_avatar_offsets',
          details: { avatarId: input.avatarId, offsetX: input.offsetX, offsetY: input.offsetY, imgScale: input.imgScale },
        });
        return { success: true };
      }),

    /** Get all items (avatars + frames) owned by a player */
    getPlayerItems: adminProcedure
      .input(z.object({ profileId: z.number() }))
      .query(async ({ input }) => {
        return adminGetPlayerItems(input.profileId);
      }),

    /** Remove a specific item (avatar or frame) from a player's inventory without refund */
    removePlayerItem: adminProcedure
      .input(z.object({
        profileId: z.number(),
        itemType: z.enum(['avatar', 'frame']),
        itemId: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await adminRemovePlayerItem({
          profileId: input.profileId,
          itemType: input.itemType,
          itemId: input.itemId,
        });
        if (result.success) {
          await logAdminAction({
            adminId: ctx.user.id,
            adminName: ctx.user.name ?? null,
            action: 'remove_item',
            targetProfileId: input.profileId,
            details: { itemType: input.itemType, itemId: input.itemId },
          });
        }
        return result;
      }),

    /**
     * Fully reset a player account to fresh-registration state.
     * Clears all balances, owned items, stats, premium, season data, transactions, achievements, daily quests.
     * Admin-only.
     */
    resetPlayerAccount: adminProcedure
      .input(z.object({ profileId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await adminResetPlayerAccount(input.profileId);
        if (result.success) {
          await logAdminAction({
            adminId: ctx.user.id,
            adminName: ctx.user.name ?? null,
            action: 'reset_account',
            targetProfileId: input.profileId,
            details: { note: 'Full account reset to fresh-registration state' },
          });
        }
        return result;
      }),
    /**
     * Force-recalculate the many_faces achievement for a player.
     * Bypasses the "already unlocked" guard — useful for fixing players
     * who had the avatar_collector key bug before it was renamed to many_faces.
     * Admin-only.
     */
    recalculateManyFaces: adminProcedure
      .input(z.object({ profileId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await forceRecalculateManyFaces(input.profileId);
        await logAdminAction({
          adminId: ctx.user.id,
          adminName: ctx.user.name ?? null,
          action: 'give_item',
          targetProfileId: input.profileId,
          details: { note: `Force-recalculated many_faces achievement: progress=${result.progress}, unlocked=${result.unlocked}, justUnlocked=${result.justUnlocked}` },
        });
        return result;
      }),
    /**
     * Retroactively recalculate ALL static-data achievements for ALL players.
     * Useful after fixing bugs in achievement logic.
     * Admin-only. This operation may take a while for large player bases.
     */
    retroactiveRecalcAll: adminProcedure
      .mutation(async ({ ctx }) => {
        const result = await retroactiveRecalcAllAchievements();
        await logAdminAction({
          adminId: ctx.user.id,
          adminName: ctx.user.name ?? null,
          action: 'give_item',
          targetProfileId: null,
          details: {
            note: `Retroactive achievement recalc: ${result.processedPlayers}/${result.totalPlayers} players, ${result.totalRecalculated} recalculated, ${result.totalNewlyUnlocked} newly unlocked, ${result.errors} errors`,
          },
        });
        return result;
      }),
  }),

  // ── Public: Avatar offsets (for frontend to get DB overrides) ──
  avatarOffsets: router({
    getAll: publicProcedure.query(async () => {
      return getAllAvatarOffsets();
    }),
  }),

  // ── Public: Shop prices (for frontend to get overrides) ──
  shopPrices: router({
    overrides: publicProcedure.query(async () => {
      return getShopPriceOverrides();
    }),
  }),

  // ---- Player Complaints ----
  complaints: router({
    /** Submit a complaint against another player */
    submit: protectedProcedure
      .input(z.object({
        targetGameId: z.number(),
        reason: z.enum(['cheating', 'toxic_behavior', 'inappropriate_name', 'afk_abuse', 'other']),
        description: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getProfileByUserId(ctx.user!.id);
        if (!profile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Профиль не найден' });

        const targetProfile = await getProfileByGameId(input.targetGameId);
        if (!targetProfile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Игрок не найден' });

        if (profile.id === targetProfile.id) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Нельзя пожаловаться на себя' });
        }

        const result = await createComplaint({
          reporterProfileId: profile.id,
          targetProfileId: targetProfile.id,
          reason: input.reason,
          description: input.description || null,
        });

        if (!result.success) {
          if (result.reason === 'duplicate_complaint') {
            throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Вы уже подавали жалобу на этого игрока в течение 24 часов' });
          }
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Ошибка при создании жалобы' });
        }

        return { success: true, id: result.id };
      }),
  }),

  // ---- Admin Moderation (complaints) ----
  moderation: router({
    /** Get complaint stats */
    stats: gmProcedure.query(async () => {
      return getComplaintStats();
    }),

    /** List complaints with optional status filter */
    list: gmProcedure
      .input(z.object({
        status: z.string().optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return getComplaints(input);
      }),

    /** Get single complaint detail */
    detail: gmProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const complaint = await getComplaintById(input.id);
        if (!complaint) throw new TRPCError({ code: 'NOT_FOUND', message: 'Жалоба не найдена' });

        // Fetch reporter and target profiles
        const db = (await import('./db'));
        const [reporterProfile, targetProfile] = await Promise.all([
          db.adminGetPlayerDetail(complaint.reporterProfileId),
          db.adminGetPlayerDetail(complaint.targetProfileId),
        ]);

        return { complaint, reporterProfile, targetProfile };
      }),

    /** Update complaint status (resolve/dismiss) */
    resolve: gmProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['reviewed', 'resolved', 'dismissed']),
        adminNote: z.string().max(500).optional(),
        actionTaken: z.enum(['none', 'warning', 'temp_ban', 'permanent_ban']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const success = await updateComplaintStatus(input.id, {
          status: input.status,
          reviewedBy: ctx.user!.id,
          adminNote: input.adminNote,
          actionTaken: input.actionTaken,
        });

        if (!success) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Ошибка при обновлении жалобы' });
        }

        // Log admin action
        await logAdminAction({
          adminId: ctx.user!.id,
          adminName: ctx.user!.name || 'Admin',
          action: 'ban', // reuse existing action type for audit
          targetProfileId: null,
          details: {
            type: 'complaint_resolution',
            complaintId: input.id,
            status: input.status,
            actionTaken: input.actionTaken || 'none',
            adminNote: input.adminNote,
          },
        });

        return { success: true };
      }),
  }),

  // ============================================================
  // MUSIC PLAYLISTS
  // ============================================================
  playlists: router({
    /** Get all available playlists */
    list: publicProcedure.query(async () => {
      return getAllPlaylists();
    }),

    /** Get owned playlist IDs for current player */
    owned: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return [];
      // Default playlists are always owned
      const allPlaylists = await getAllPlaylists();
      const defaultIds = allPlaylists.filter((p: typeof allPlaylists[number]) => p.isDefault).map((p: typeof allPlaylists[number]) => p.id);
      const ownedIds = await getOwnedPlaylistIds(profile.id);
      return Array.from(new Set([...defaultIds, ...ownedIds]));
    }),

    /** Get active playlist ID for current player */
    active: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return null;
      return profile.activePlaylistId ?? null;
    }),

    /** Purchase a playlist */
    purchase: protectedProcedure
      .input(z.object({ playlistId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getProfileByUserId(ctx.user.id);
        if (!profile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });

        const playlist = await getPlaylistById(input.playlistId);
        if (!playlist) throw new TRPCError({ code: 'NOT_FOUND', message: 'Playlist not found' });

        if (playlist.isDefault) return { success: false, reason: 'already_owned' };

        const result = await purchasePlaylist(profile.id, input.playlistId, playlist.priceShanyrak);
        if (result.success) {
          processCollectorAchievements(profile.id).catch(() => {});
        }
        return result;
      }),

    /** Set active playlist */
    setActive: protectedProcedure
      .input(z.object({ playlistId: z.number().nullable() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getProfileByUserId(ctx.user.id);
        if (!profile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });

        if (input.playlistId !== null) {
          // Verify the player owns this playlist or it's default
          const playlist = await getPlaylistById(input.playlistId);
          if (!playlist) throw new TRPCError({ code: 'NOT_FOUND', message: 'Playlist not found' });
          if (!playlist.isDefault) {
            const owned = await getOwnedPlaylistIds(profile.id);
            if (!owned.includes(input.playlistId)) {
              throw new TRPCError({ code: 'FORBIDDEN', message: 'Playlist not owned' });
            }
          }
        }

        await setActivePlaylist(profile.id, input.playlistId);
        return { success: true };
      }),

    /** Get tracks for a specific playlist (for preview or playback) */
    tracks: publicProcedure
      .input(z.object({ playlistId: z.number() }))
      .query(async ({ input }) => {
        const playlist = await getPlaylistById(input.playlistId);
        if (!playlist) return null;
        return {
          id: playlist.id,
          name: playlist.name,
          nameKk: playlist.nameKk,
          tracks: playlist.tracks,
        };
      }),
  }),

  contact: router({
    /** Send a message to administration */
    send: protectedProcedure
      .input(z.object({
        replyEmail: z.string().email({ message: 'Invalid email' }),
        message: z.string().min(10, 'Message too short').max(2000, 'Message too long'),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getProfileByUserId(ctx.user.id);
        if (!profile) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const result = await createContactMessage({
          profileId: profile.id,
          senderName: profile.displayName || ctx.user.name || 'Unknown',
          replyEmail: input.replyEmail,
          message: input.message,
        });
        if (!result) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to send message' });
        return { success: true };
      }),

    /** Admin: get all contact messages */
    adminList: adminProcedure
      .input(z.object({
        status: z.enum(['all', 'new', 'read', 'replied']).default('all'),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        return getContactMessages({ status: input.status, limit: input.limit, offset: input.offset });
      }),

    /** Admin: update message status */
    adminUpdateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['new', 'read', 'replied']),
        adminNote: z.string().max(1000).optional(),
      }))
      .mutation(async ({ input }) => {
        const ok = await updateContactMessageStatus(input.id, input.status, input.adminNote);
        if (!ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        return { success: true };
      }),
  }),

  // ============================================================
  // ACHIEVEMENTS
  // ============================================================
  achievements: router({
    /** Get all achievements with progress for the current player */
    list: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: 'UNAUTHORIZED' });
      return getAchievementsForProfile(profile.id);
    }),

    /** Get count of unclaimed (unlocked but not claimed) achievements */
    unclaimedCount: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return 0;
      return getUnclaimedAchievementCount(profile.id);
    }),

    /** Claim the reward for an unlocked achievement */
    claim: protectedProcedure
      .input(z.object({ achievementKey: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getProfileByUserId(ctx.user.id);
        if (!profile) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const result = await claimAchievementReward(profile.id, input.achievementKey);
        if (!result.success) throw new TRPCError({ code: 'BAD_REQUEST', message: result.reason });
        return result;
      }),
  }),

  // ============================================================
  // DAILY QUESTS
  // ============================================================
  dailyQuests: router({
    /** Get today's 4 quests with definitions and progress */
    today: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: 'UNAUTHORIZED' });
      return getTodayQuestsWithDefs(profile.id);
    }),

    /** Get count of unclaimed completed quests for today */
    unclaimedCount: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return 0;
      return getUnclaimedDailyQuestCount(profile.id);
    }),

    /** Claim reward for a completed daily quest */
    claim: protectedProcedure
      .input(z.object({ questKey: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getProfileByUserId(ctx.user.id);
        if (!profile) throw new TRPCError({ code: 'UNAUTHORIZED' });
        try {
          const result = await claimDailyQuestReward(profile.id, input.questKey);
          return { success: true, ...result };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Unknown error';
          throw new TRPCError({ code: 'BAD_REQUEST', message: msg });
        }
      }),
  }),

  // ============================================================
  // PREMIUM
  // ============================================================
  premium: router({
    /** Get current user's premium status */
    status: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const status = await getPremiumStatus(profile.id);
      const swapsRemaining = await getDailyQuestSwapsRemaining(profile.id);
      return { ...status, swapsRemaining };
    }),

    /** Buy premium subscription for 1000 tenge */
    buy: protectedProcedure.mutation(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const result = await buyPremium(profile.id);
      if (!result.success) {
        const msg =
          result.error === 'insufficient_tenge' ? 'Недостаточно тенге' :
          result.error === 'already_active' ? 'Премиум уже активен' :
          result.error ?? 'Ошибка покупки';
        throw new TRPCError({ code: 'BAD_REQUEST', message: msg });
      }
      // Trigger premium achievements
      const premiumStats = await getPremiumStats(profile.id);
      if (premiumStats) {
        const count = premiumStats.premiumPurchaseCount;
        const streak = premiumStats.premiumConsecutiveMonths;
        // premium_player: first purchase (set to 1 absolute)
        await incrementAchievementProgress(profile.id, 'premium_player', 0, 1).catch(() => {});
        // legendary_player: 2 consecutive months
        await incrementAchievementProgress(profile.id, 'legendary_player', 0, Math.min(streak, 2)).catch(() => {});
        // admin_pryanik: 3 consecutive months
        await incrementAchievementProgress(profile.id, 'admin_pryanik', 0, Math.min(streak, 3)).catch(() => {});
        // kazakhstan_pride: 6 consecutive months
        await incrementAchievementProgress(profile.id, 'kazakhstan_pride', 0, Math.min(streak, 6)).catch(() => {});
        // elbasy: 10 total purchases
        await incrementAchievementProgress(profile.id, 'elbasy', 0, Math.min(count, 10)).catch(() => {});
      }
      return result;
    }),

    /** Swap a daily quest (premium only, max 3/day) */
    swapQuest: protectedProcedure
      .input(z.object({ questKey: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getProfileByUserId(ctx.user.id);
        if (!profile) throw new TRPCError({ code: 'UNAUTHORIZED' });
        if (!profile.isPremium) throw new TRPCError({ code: 'FORBIDDEN', message: 'Premium required' });
        const swapResult = await useDailyQuestSwap(profile.id);
        if (!swapResult.success) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No swaps remaining today' });
        }
        const newQuests = await swapDailyQuest(profile.id, input.questKey);
        return { success: true, remaining: swapResult.remaining, quests: newQuests };
      }),
  }),

  // ============================================================
  // SEASON SYSTEM
  // ============================================================
  season: router({
    /** Get current season info + player's season rating */
    current: protectedProcedure
      .input(z.object({ seasonKey: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const profile = await getProfileByUserId(ctx.user.id);
        if (!profile) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const seasonKey = input.seasonKey ?? getCurrentSeasonKey();
        const seasonInfo = getSeasonInfo(seasonKey);
        const bounds = getSeasonBounds(seasonKey);
        const seasonRating = await getPlayerSeasonRating(profile.id, seasonKey);
        const rank = getSeasonRank(seasonRating?.seasonRating ?? 0);
        return {
          seasonKey,
          seasonInfo,
          startDate: bounds.start,
          endDate: bounds.end,
          seasonRating: seasonRating?.seasonRating ?? 0,
          gamesPlayed: seasonRating?.gamesPlayed ?? 0,
          wins: seasonRating?.wins ?? 0,
          losses: seasonRating?.losses ?? 0,
          rank,
          allRanks: SEASON_RANKS,
        };
      }),

    /** Get active test season key from DB (null if no test active) — public so Season.tsx can read it */
    activeTestKey: publicProcedure
      .query(async () => {
        const state = await getSeasonTestState();
        if (!state || !state.isActive) return { testSeasonKey: null };
        return { testSeasonKey: state.seasonKey };
      }),

    /** Get season leaderboard */
    leaderboard: publicProcedure
      .input(z.object({ seasonKey: z.string().optional() }))
      .query(async ({ input }) => {
        const seasonKey = input.seasonKey ?? getCurrentSeasonKey();
        const entries = await getSeasonLeaderboard(seasonKey, 100);
        return { seasonKey, entries };
      }),

    /** Get all season names (for display) */
    allSeasons: publicProcedure.query(() => {
      return SEASONS;
    }),

    /** Admin: manually trigger season end processing */
    adminProcessSeasonEnd: adminProcedure
      .input(z.object({ seasonKey: z.string() }))
      .mutation(async ({ input }) => {
        const result = await processSeasonEnd(input.seasonKey);
        return result;
      }),

    /** Get unclaimed season rewards for current player */
    unclaimedRewards: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: 'UNAUTHORIZED' });
      return getUnclaimedSeasonRewards(profile.id);
    }),

    /** Claim a season reward — grants avatar/frame ownership, marks claimed, deletes notification */
    claimReward: protectedProcedure
      .input(z.object({ seasonKey: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getProfileByUserId(ctx.user.id);
        if (!profile) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const result = await claimSeasonReward(profile.id, input.seasonKey);
        if (!result.success) throw new TRPCError({ code: 'BAD_REQUEST', message: result.reason });
        return { success: true };
      }),

    // ─── Season Test Tools (admin only) ────────────────────────────────────────

    /** Admin test: get all admin/gm profiles with their current season ratings */
    testGetAdminProfiles: adminProcedure
      .input(z.object({ seasonKey: z.string().optional() }))
      .query(async ({ input }) => {
      const db = await (await import('./db')).getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { users, playerProfiles, seasonRatings, seasonRewards } = await import('../drizzle/schema');
      const { eq, sql, and, inArray } = await import('drizzle-orm');
      const seasonKey = input.seasonKey ?? getCurrentSeasonKey();

      const adminUsers = await db
        .select({
          userId: users.id,
          role: users.role,
          profileId: playerProfiles.id,
          gameId: playerProfiles.gameId,
          displayName: playerProfiles.displayName,
          balanceShanyrak: playerProfiles.balanceShanyrak,
          balanceTenge: playerProfiles.balanceTenge,
          seasonRating: sql<number>`COALESCE(${seasonRatings.seasonRating}, 0)`,
          hasReward: sql<number>`CASE WHEN ${seasonRewards.id} IS NOT NULL THEN 1 ELSE 0 END`,
          rewardRankKey: seasonRewards.rankKey,
          rewardClaimed: seasonRewards.claimed,
        })
        .from(users)
        .innerJoin(playerProfiles, eq(playerProfiles.userId, users.id))
        .leftJoin(seasonRatings, and(
          eq(seasonRatings.profileId, playerProfiles.id),
          eq(seasonRatings.seasonKey, seasonKey),
        ))
        .leftJoin(seasonRewards, and(
          eq(seasonRewards.profileId, playerProfiles.id),
          eq(seasonRewards.seasonKey, seasonKey),
        ))
        .where(inArray(users.role, ['admin', 'gm']));

      return { profiles: adminUsers, seasonKey };
    }),

    /** Admin test: set season rating for all admin/gm users to a specific value */
    testSetAdminRatings: adminProcedure
      .input(z.object({ rating: z.number().min(0).max(99999), seasonKey: z.string().optional() }))
      .mutation(async ({ input }) => {
        const db = await (await import('./db')).getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { users, playerProfiles, seasonRatings } = await import('../drizzle/schema');
        const { eq, sql, and, inArray } = await import('drizzle-orm');
        const seasonKey = input.seasonKey ?? getCurrentSeasonKey();

        // Get all admin/gm profiles
        const adminProfiles = await db
          .select({ profileId: playerProfiles.id, displayName: playerProfiles.displayName })
          .from(users)
          .innerJoin(playerProfiles, eq(playerProfiles.userId, users.id))
          .where(inArray(users.role, ['admin', 'gm']));

        for (const p of adminProfiles) {
          // Upsert season rating
          const existing = await db
            .select({ id: seasonRatings.id })
            .from(seasonRatings)
            .where(and(eq(seasonRatings.profileId, p.profileId), eq(seasonRatings.seasonKey, seasonKey)))
            .limit(1);

          if (existing.length > 0) {
            await db.update(seasonRatings)
              .set({ seasonRating: input.rating, gamesPlayed: 50, wins: 30, losses: 10 })
              .where(and(eq(seasonRatings.profileId, p.profileId), eq(seasonRatings.seasonKey, seasonKey)));
          } else {
            await db.insert(seasonRatings).values({
              profileId: p.profileId,
              seasonKey,
              seasonRating: input.rating,
              gamesPlayed: 50,
              wins: 30,
              losses: 10,
            });
          }
        }

        return { updated: adminProfiles.length, rating: input.rating, seasonKey };
      }),

    /** Get the persisted season test state from DB */
    testGetState: adminProcedure
      .query(async () => {
        const state = await getSeasonTestState();
        return state ?? { seasonKey: getCurrentSeasonKey(), step: 'idle', isActive: false };
      }),

    /** Admin test: simulate season end — create rewards + notifications + credit balances */
    testSimulateSeasonEnd: adminProcedure
      .input(z.object({ seasonKey: z.string().optional() }))
      .mutation(async ({ input }) => {
      const db = await (await import('./db')).getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const seasonKey = input.seasonKey ?? getCurrentSeasonKey();
      const result = await processSeasonEnd(seasonKey);
      // Persist state to DB so it survives page reloads
      await upsertSeasonTestState({ seasonKey, step: 'simulated', isActive: true });
      return { ...result, seasonKey };
    }),

    /** Admin test: rollback — delete season_rewards + season_ratings + subtract credited balances + delete notifications */
    testRollbackSeason: adminProcedure
      .input(z.object({ seasonKey: z.string().optional() }))
      .mutation(async ({ input }) => {
      const db = await (await import('./db')).getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { users, playerProfiles, seasonRatings, seasonRewards, notifications } = await import('../drizzle/schema');
      const { eq, sql, and, inArray } = await import('drizzle-orm');
      const seasonKey = input.seasonKey ?? getCurrentSeasonKey();

      // Get all admin/gm profiles
      const adminProfiles = await db
        .select({ profileId: playerProfiles.id, displayName: playerProfiles.displayName })
        .from(users)
        .innerJoin(playerProfiles, eq(playerProfiles.userId, users.id))
        .where(inArray(users.role, ['admin', 'gm']));

      let rolledBack = 0;
      for (const p of adminProfiles) {
        // Get reward to know how much to subtract
        const rewards = await db
          .select()
          .from(seasonRewards)
          .where(and(eq(seasonRewards.profileId, p.profileId), eq(seasonRewards.seasonKey, seasonKey)))
          .limit(1);

        if (rewards.length > 0) {
          const reward = rewards[0];
          // Subtract credited balances
          if (reward.shanyraksAwarded > 0) {
            await db.update(playerProfiles)
              .set({ balanceShanyrak: sql`GREATEST(0, ${playerProfiles.balanceShanyrak} - ${reward.shanyraksAwarded})` })
              .where(eq(playerProfiles.id, p.profileId));
          }
          if (reward.tengeAwarded > 0) {
            await db.update(playerProfiles)
              .set({ balanceTenge: sql`GREATEST(0, ${playerProfiles.balanceTenge} - ${reward.tengeAwarded})` })
              .where(eq(playerProfiles.id, p.profileId));
          }
          // Delete reward record
          await db.delete(seasonRewards)
            .where(and(eq(seasonRewards.profileId, p.profileId), eq(seasonRewards.seasonKey, seasonKey)));
          rolledBack++;
        }

        // Delete season rating
        await db.delete(seasonRatings)
          .where(and(eq(seasonRatings.profileId, p.profileId), eq(seasonRatings.seasonKey, seasonKey)));

        // Delete season_reward notifications for this season
        const allNotifs = await db
          .select({ id: notifications.id, data: notifications.data })
          .from(notifications)
          .where(and(eq(notifications.profileId, p.profileId), eq(notifications.type, 'season_reward')));

        for (const n of allNotifs) {
          try {
            const d = JSON.parse(n.data ?? '{}');
            if (d.seasonKey === seasonKey) {
              await db.delete(notifications).where(eq(notifications.id, n.id));
            }
          } catch {}
        }
      }

        // Reset persisted test state
      await upsertSeasonTestState({ seasonKey, step: 'rolled_back', isActive: false });
       return { rolledBack, seasonKey };
    }),
  }),

  // ============================================================
  // REFERRAL SYSTEM
  // ============================================================
  referral: router({
    /** Get or generate a referral code for the current player, plus stats */
    myCode: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: 'NOT_FOUND' });
      const code = await getOrCreateReferralCode(profile.id);
      const stats = await getReferralStats(profile.id);
      return { code, totalReferrals: stats.totalReferrals, rewardLevel: stats.rewardLevel };
    }),

    /** Activate a referral code (new player uses someone else's code) */
    activate: protectedProcedure
      .input(z.object({ code: z.string().min(6).max(10) }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getProfileByUserId(ctx.user.id);
        if (!profile) throw new TRPCError({ code: 'NOT_FOUND' });
        const result = await activateReferralCode(profile.id, input.code);
        return result;
      }),
  }),

  // ============================================================
  // MAINTENANCE MODE
  // ============================================================
  maintenance: router({
    /** Get current maintenance status (public) */
    status: publicProcedure.query(async () => {
      return getMaintenanceStatus();
    }),

    /** Set maintenance mode (admin only) */
    set: adminProcedure
      .input(z.object({
        enabled: z.boolean(),
        endTime: z.string().nullable(),
        message: z.string().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        await setMaintenanceStatus({
          enabled: input.enabled,
          endTime: input.endTime,
          message: input.message,
        });
        await logAdminAction({
          adminId: ctx.user.id,
          adminName: ctx.user.name ?? null,
          action: 'set_maintenance_mode',
          details: { enabled: input.enabled, endTime: input.endTime },
        });
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
