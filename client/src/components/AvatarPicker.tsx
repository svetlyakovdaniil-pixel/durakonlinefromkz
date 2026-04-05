import { useState } from 'react';
import { AVATAR_OPTIONS, getAvatarUrl } from '../../../shared/avatars';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface AvatarPickerProps {
  currentAvatarId: string | null | undefined;
  onSelect: (avatarId: string) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function AvatarPicker({ currentAvatarId, onSelect, onClose, loading }: AvatarPickerProps) {
  const [selected, setSelected] = useState(currentAvatarId || 'wolf');

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1a2d45] border border-amber-700/40 rounded-2xl p-4 sm:p-6 max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-amber-100">Выберите аватар</h3>
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
          {AVATAR_OPTIONS.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => setSelected(avatar.id)}
              className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 aspect-square ${
                selected === avatar.id
                  ? 'border-amber-500 shadow-lg shadow-amber-500/30 scale-105'
                  : 'border-amber-700/30 hover:border-amber-600/50 hover:scale-102'
              }`}
            >
              <img
                src={avatar.url}
                alt={avatar.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {selected === avatar.id && (
                <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-black/60 py-0.5 text-center">
                <span className="text-[9px] sm:text-[10px] text-amber-200/80 font-medium">{avatar.name}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm"
            onClick={onClose}
          >
            Отмена
          </Button>
          <Button
            className="flex-1 bg-amber-700 hover:bg-amber-600 text-white text-sm"
            onClick={() => onSelect(selected)}
            disabled={loading || selected === currentAvatarId}
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
