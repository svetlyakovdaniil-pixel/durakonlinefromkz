import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * Hook that auto-creates a player profile on first login and provides profile data.
 * Also returns a registerWithSocket function to register gameId with the socket server.
 */
export function useProfile(isAuthenticated: boolean) {
  const profileQuery = trpc.profile.me.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  return {
    profile: profileQuery.data ?? null,
    profileLoading: profileQuery.isLoading,
    profileError: profileQuery.error,
    refetchProfile: profileQuery.refetch,
  };
}
