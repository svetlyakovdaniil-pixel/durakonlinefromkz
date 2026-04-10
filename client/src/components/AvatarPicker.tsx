import { useState } from 'react';
import { AVATAR_OPTIONS, getAvatarUrl } from '../../../shared/avatars';
import { Button } from '@/components/ui/button';
import { Check, X, Lock } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { trpc } from '@/lib/trpc';

interface AvatarPickerProps {
  currentAvatarId: string | null | undefined;
  onSelect: (avatarId: string) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function AvatarPicker({ currentAvatarId, onSelect, onClose, loading }: AvatarPickerProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(currentAvatarId || 'wolf');
  const { data: ownedAvatars = [] } = trpc.shop.ownedAvatars.useQuery();

  const canSelectAvatar = (avatarId: string) => {
    const avatar = AVATAR_OPTIONS.find(a => a.id === avatarId);
    if (!avatar) return false;
    if (!avatar.premium) return true;
    return ownedAvatars.includes(avatarId);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1a2d45] border border-amber-700/40 rounded-2xl p-4 sm:p-6 max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-amber-100">{t('avatarPicker.title')}</h3>
          <button onClick={onClose} className="text-amber-200/50 hover:text-amber-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current avatar preview */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-amber-500 shadow-lg shadow-amber-500/20">
            <img
              src={getAvatarUrl(selected)}
              alt="Selected avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Avatar grid */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {AVATAR_OPTIONS.filter(avatar => avatar.id !== 'bot').map((avatar) => {
            const isLocked = avatar.premium && !ownedAvatars.includes(avatar.id);
            return (
              <button
                key={avatar.id}
                onClick={() => {
                  if (!isLocked) setSelected(avatar.id);
                }}
                className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 aspect-square ${
                  isLocked
                    ? 'border-gray-600/50 opacity-60 cursor-not-allowed'
                    : selected === avatar.id
                      ? 'border-amber-500 shadow-lg shadow-amber-500/30 scale-105'
                      : 'border-amber-700/30 hover:border-amber-600/50 hover:scale-102'
                }`}
              >
                <img
                  src={avatar.url}
                  alt={avatar.name}
                  className={`w-full h-full object-cover ${isLocked ? 'grayscale' : ''}`}
                  loading="lazy"
                />
                {selected === avatar.id && !isLocked && (
                  <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                {isLocked && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-gray-300" />
                  </div>
                )}
                {avatar.premium && !isLocked && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-bl-md">
                    PRO
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm"
            onClick={onClose}
          >
            {t('avatarPicker.cancel')}
          </Button>
          <Button
            className="flex-1 bg-amber-700 hover:bg-amber-600 text-white text-sm"
            onClick={() => onSelect(selected)}
            disabled={loading || selected === currentAvatarId || !canSelectAvatar(selected)}
          >
            {loading ? t('avatarPicker.saving') : t('avatarPicker.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
