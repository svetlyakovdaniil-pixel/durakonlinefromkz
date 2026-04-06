import { Music, VolumeX } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface MusicChoiceDialogProps {
  onChoice: (enableMusic: boolean) => void;
}

export default function MusicChoiceDialog({ onChoice }: MusicChoiceDialogProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-[#1a2d45] to-[#0f1f33] border border-amber-700/40 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl shadow-black/60">
        <h2 className="text-amber-100 text-xl font-bold text-center mb-2">
          {t('musicChoice.title')}
        </h2>
        <p className="text-amber-200/50 text-sm text-center mb-8">
          {t('musicChoice.subtitle')}
        </p>

        <div className="flex gap-4 justify-center">
          {/* Enable music */}
          <button
            onClick={() => onChoice(true)}
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-amber-600/40 bg-amber-900/20 hover:bg-amber-900/40 hover:border-amber-500/60 transition-all cursor-pointer group w-36"
          >
            <div className="w-14 h-14 rounded-full bg-amber-600/30 flex items-center justify-center group-hover:bg-amber-600/50 transition-colors">
              <Music className="w-7 h-7 text-amber-400" />
            </div>
            <span className="text-amber-200 text-sm font-medium">{t('musicChoice.withMusic')}</span>
          </button>

          {/* Disable music */}
          <button
            onClick={() => onChoice(false)}
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-gray-600/30 bg-gray-900/20 hover:bg-gray-800/30 hover:border-gray-500/40 transition-all cursor-pointer group w-36"
          >
            <div className="w-14 h-14 rounded-full bg-gray-700/30 flex items-center justify-center group-hover:bg-gray-600/40 transition-colors">
              <VolumeX className="w-7 h-7 text-gray-400" />
            </div>
            <span className="text-gray-300 text-sm font-medium">{t('musicChoice.noMusic')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
