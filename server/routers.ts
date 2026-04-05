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
  getPlayerProfileWithFriendStatus,
  getFriendshipById,
} from "./db";

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
      .input(z.object({ displayName: z.string().min(1).max(50) }))
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
