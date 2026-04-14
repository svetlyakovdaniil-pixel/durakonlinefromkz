import { trpc } from '@/lib/trpc';
import { AVATAR_OPTIONS } from '../../../shared/avatars';

export interface AvatarOffsetValues {
  offsetX: number;
  offsetY: number;
  imgScale: number;
}

/**
 * Returns a function to get avatar offsets for a given avatarId.
 * DB overrides take priority over shared/avatars.ts defaults.
 * Falls back to static defaults from AVATAR_OPTIONS if no DB override exists.
 */
export function useAvatarOffsets() {
  const { data: dbOffsets = [] } = trpc.avatarOffsets.getAll.useQuery(undefined, {
    staleTime: 30_000, // cache for 30s — admin changes propagate quickly
    refetchOnWindowFocus: false,
  });

  function getOffsets(avatarId: string): AvatarOffsetValues {
    // DB override takes priority
    const dbEntry = dbOffsets.find(o => o.avatarId === avatarId);
    if (dbEntry) {
      return {
        offsetX: dbEntry.offsetX,
        offsetY: dbEntry.offsetY,
        imgScale: dbEntry.imgScale,
      };
    }
    // Fallback to static defaults in shared/avatars.ts
    const staticOpt = AVATAR_OPTIONS.find(a => a.id === avatarId);
    return {
      offsetX: staticOpt?.offsetX ?? 0,
      offsetY: staticOpt?.offsetY ?? 0,
      imgScale: staticOpt?.imgScale ?? 1,
    };
  }

  return { getOffsets, dbOffsets };
}
