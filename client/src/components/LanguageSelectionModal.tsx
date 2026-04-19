import { Globe } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from '@/i18n';
/**
 * Full-screen language selection modal shown on first visit.
 * After the user picks a language, `hasChosenLanguage` is set to true
 * and this modal never appears again.
 */
export default function LanguageSelectionModal() {
  const { setLanguage, setHasChosenLanguage } = useSettings();
  const { setLocale } = useTranslation();
  const pick = (lang: 'ru' | 'kk' | 'en' | 'uk' | 'ka' | 'az') => {
    setLanguage(lang);
    setLocale(lang);
    setHasChosenLanguage(true);
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-[#1a2d45] to-[#0f1f33] border border-amber-700/40 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-black/60">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-amber-600/20 border border-amber-500/30 flex items-center justify-center">
            <Globe className="w-7 h-7 text-amber-400" />
          </div>
        </div>
        {/* Multilingual title */}
        <h2 className="text-amber-100 text-xl font-bold text-center mb-1">
          Тілді таңдаңыз
        </h2>
        <p className="text-amber-200/50 text-sm text-center mb-8">
          Выберите язык / Choose language / Виберіть мову / ენის არჩევა / Dil seçin
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          {/* Russian */}
          <button
            onClick={() => pick('ru')}
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-amber-600/40 bg-amber-900/20 hover:bg-amber-900/40 hover:border-amber-500/60 transition-all cursor-pointer group w-32"
          >
            <span className="text-3xl">🇷🇺</span>
            <span className="text-amber-200 text-sm font-medium">Русский</span>
          </button>
          {/* Kazakh */}
          <button
            onClick={() => pick('kk')}
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-amber-600/40 bg-amber-900/20 hover:bg-amber-900/40 hover:border-amber-500/60 transition-all cursor-pointer group w-32"
          >
            <span className="text-3xl">🇰🇿</span>
            <span className="text-amber-200 text-sm font-medium">Қазақша</span>
          </button>
          {/* English */}
          <button
            onClick={() => pick('en')}
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-amber-600/40 bg-amber-900/20 hover:bg-amber-900/40 hover:border-amber-500/60 transition-all cursor-pointer group w-32"
          >
            <span className="text-3xl">🇬🇧</span>
            <span className="text-amber-200 text-sm font-medium">ENG</span>
          </button>
          {/* Ukrainian */}
          <button
            onClick={() => pick('uk')}
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-amber-600/40 bg-amber-900/20 hover:bg-amber-900/40 hover:border-amber-500/60 transition-all cursor-pointer group w-32"
          >
            <span className="text-3xl">🇺🇦</span>
            <span className="text-amber-200 text-sm font-medium">Українська</span>
          </button>
          {/* Georgian */}
          <button
            onClick={() => pick('ka')}
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-amber-600/40 bg-amber-900/20 hover:bg-amber-900/40 hover:border-amber-500/60 transition-all cursor-pointer group w-32"
          >
            <span className="text-3xl">🇬🇪</span>
            <span className="text-amber-200 text-sm font-medium">ქართული</span>
          </button>
          {/* Azerbaijani */}
          <button
            onClick={() => pick('az')}
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-amber-600/40 bg-amber-900/20 hover:bg-amber-900/40 hover:border-amber-500/60 transition-all cursor-pointer group w-32"
          >
            <span className="text-3xl">🇦🇿</span>
            <span className="text-amber-200 text-sm font-medium">Azərbaycanca</span>
          </button>
        </div>
      </div>
    </div>
  );
}
