import { COOKIE_NAME, RESERVED_NAME_ERR_MSG } from "@shared/const";
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
} from "./db";
import { getAchievementsForProfile, incrementAchievementProgress, claimAchievementReward, getUnclaimedAchievementCount } from "./achievementsDb";
import { getTodayQuestsWithDefs, claimDailyQuestReward, getUnclaimedDailyQuestCount } from "./dailyQuestsDb";
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
    /** Complete tutorial and receive 2000 shanyrak reward (one-time) */
    completeTutorial: protectedProcedure.mutation(async ({ ctx }) => {
      return completeTutorial(ctx.user.id);
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
          return transactions.filter(t => t.currency === input.currency);
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

    /** Get owned premium avatar IDs for the current user */
    ownedAvatars: protectedProcedure.query(async ({ ctx }) => {
      return getOwnedAvatars(ctx.user.id);
    }),

    /** Purchase a premium avatar */
    purchaseAvatar: protectedProcedure
      .input(z.object({ avatarId: z.string(), tengeCost: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await purchaseAvatar(ctx.user.id, input.avatarId, input.tengeCost);
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
        itemType: z.enum(['deck', 'table', 'frame', 'avatar']),
        itemId: z.string().min(1),
        priceTenge: z.number().min(0).nullable(),
        isAvailable: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await upsertShopPriceOverride({
          itemType: input.itemType,
          itemId: input.itemId,
          priceTenge: input.priceTenge,
          isAvailable: input.isAvailable,
          updatedBy: ctx.user.id,
        });
        if (result.success) {
          await logAdminAction({
            adminId: ctx.user.id,
            adminName: ctx.user.name ?? null,
            action: 'update_shop_item',
            details: { itemType: input.itemType, itemId: input.itemId, priceTenge: input.priceTenge, isAvailable: input.isAvailable },
          });
        }
        return result;
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
      const defaultIds = allPlaylists.filter(p => p.isDefault).map(p => p.id);
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

        return purchasePlaylist(profile.id, input.playlistId, playlist.priceShanyrak);
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
});

export type AppRouter = typeof appRouter;
