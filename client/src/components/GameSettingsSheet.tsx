import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Settings, Volume2, Music, Smartphone, Globe, LogOut, MousePointerClick, GripHorizontal, Check, Banknote } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useMusicContext } from '@/contexts/MusicContext';
import { useSoundContext } from '@/contexts/SoundContext';
import { useTranslation } from '@/i18n';

interface GameSettingsSheetProps {
  onLeaveGame: () => void;
  children?: React.ReactNode;
  roomPenalty?: number;
}

export default function GameSettingsSheet({ onLeaveGame, children, roomPenalty = 0 }: GameSettingsSheetProps) {
  const { settings, setSoundEnabled, setMusicEnabled, setVibrationEnabled, setCardControlMode } = useSettings();
  const { t, locale, setLocale } = useTranslation();
  const music = useMusicContext();
  const sound = useSoundContext();

  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  // Initialize volumes from hooks on mount
  useEffect(() => {
    // Music volume is already managed by music.volume
    // Sound volume is already managed by sound.volume
  }, []);

  const handleMusicToggle = (checked: boolean) => {
    setMusicEnabled(checked);
    if (checked) {
      music.startMusic();
    } else {
      music.stopMusic();
    }
  };

  const handleSoundToggle = (checked: boolean) => {
    setSoundEnabled(checked);
    // Also update the sound context to sync the enabledRef
    if (checked !== sound.enabled) {
      sound.toggle();
    }
  };

  const handleVibrationToggle = (checked: boolean) => {
    setVibrationEnabled(checked);
  };



  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
          <button className="text-amber-200/50 hover:text-amber-100 transition-colors p-1.5 rounded">
            <Settings className="w-5 h-5" />
          </button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="bg-[#0f2035] border-l border-amber-700/30 text-amber-100 w-[300px] sm:w-[380px] max-h-[95dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-amber-100 text-xl flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            {t('settings.title')}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* 1. Sound effects */}
          <div className="bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20">
            <label className="flex items-center justify-between cursor-pointer mb-3">
              <span className="text-sm font-semibold text-amber-200/80 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-400" />
                {t('settings.sounds')}
              </span>
              <Checkbox
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => handleSoundToggle(checked === true)}
                className="border-amber-700/40 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
              />
            </label>

          </div>

          {/* 2. Background music */}
          <div className="bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20">
            <label className="flex items-center justify-between cursor-pointer mb-3">
              <span className="text-sm font-semibold text-amber-200/80 flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-400" />
                {t('settings.music')}
              </span>
              <Checkbox
                checked={settings.musicEnabled}
                onCheckedChange={(checked) => handleMusicToggle(checked === true)}
                className="border-amber-700/40 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
              />
            </label>

          </div>

          {/* 3. Vibration */}
          <label className="flex items-center justify-between bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20 cursor-pointer">
            <span className="text-sm font-semibold text-amber-200/80 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400" />
              {t('settings.vibration')}
            </span>
            <Checkbox
              checked={settings.vibrationEnabled}
              onCheckedChange={(checked) => handleVibrationToggle(checked === true)}
              className="border-amber-700/40 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
            />
          </label>

          {/* 4. Card control mode */}
          <div className="bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20">
            <span className="text-sm font-semibold text-amber-200/80 flex items-center gap-2 mb-3">
              <MousePointerClick className="w-4 h-4 text-amber-400" />
              {t('settings.cardControl')}
            </span>
            <div className="flex gap-2">
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                  settings.cardControlMode === 'click'
                    ? 'bg-amber-600/80 text-white border-amber-500/60 shadow-lg'
                    : 'bg-[#0a1628] text-amber-200/60 border-amber-700/30 hover:bg-[#0a1628]/80 hover:text-amber-200'
                }`}
                onClick={() => setCardControlMode('click')}
              >
                <MousePointerClick className="w-4 h-4" />
                {t('settings.clickMode')}
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                  settings.cardControlMode === 'drag'
                    ? 'bg-amber-600/80 text-white border-amber-500/60 shadow-lg'
                    : 'bg-[#0a1628] text-amber-200/60 border-amber-700/30 hover:bg-[#0a1628]/80 hover:text-amber-200'
                }`}
                onClick={() => setCardControlMode('drag')}
              >
                <GripHorizontal className="w-4 h-4" />
                {t('settings.dragMode')}
              </button>
            </div>
            <p className="text-[11px] text-amber-200/40 mt-2">
              {settings.cardControlMode === 'click'
                ? t('settings.clickDesc')
                : t('settings.dragDesc')}
            </p>
          </div>

          {/* 5. Language */}
          <div className="flex items-center justify-between bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20">
            <span className="text-sm font-semibold text-amber-200/80 flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              {t('settings.language')}
            </span>
            <Popover open={langOpen} onOpenChange={setLangOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 text-sm text-amber-100 hover:text-amber-300 transition-colors bg-[#0a1628] px-3 py-1.5 rounded-lg border border-amber-700/30">
                  <span className="text-base">{locale === 'kk' ? '🇰🇿' : '🇷🇺'}</span>
                  {locale === 'kk' ? 'Қазақша' : 'Русский'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="bg-[#1a2d45] border-amber-700/30 w-48 p-2" align="end">
                <button
                  className="flex items-center gap-2 w-full text-sm text-amber-100 hover:bg-amber-700/20 px-3 py-2 rounded-lg transition-colors"
                  onClick={() => { setLocale('ru'); setLangOpen(false); }}
                >
                  <span className="text-base">🇷🇺</span>
                  Русский
                  {locale === 'ru' && <Check className="w-4 h-4 text-green-400 ml-auto" />}
                </button>
                <button
                  className="flex items-center gap-2 w-full text-sm text-amber-100 hover:bg-amber-700/20 px-3 py-2 rounded-lg transition-colors"
                  onClick={() => { setLocale('kk'); setLangOpen(false); }}
                >
                  <span className="text-base">🇰🇿</span>
                  Қазақша
                  {locale === 'kk' && <Check className="w-4 h-4 text-green-400 ml-auto" />}
                </button>
              </PopoverContent>
            </Popover>
          </div>

          {/* 6. Leave Game */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold flex items-center gap-2 h-11">
                <LogOut className="w-4 h-4" />
                {t('game.leaveGame') || 'Leave Game'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#1a2d45] border-amber-700/30 text-amber-100 max-w-[calc(100vw-2rem)] sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-amber-100">
                  Вы действительно хотите выйти?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-amber-200/60">
                  Если вы выберите "Да", то выйдите в лобби и потеряете {roomPenalty} <Banknote className="inline-block w-4 h-4 text-green-400" /> шаныраков.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-[#0a1628] border-amber-700/30 text-amber-200 hover:bg-[#1a2d45] hover:text-amber-100">
                  {t('common.no') || 'No'}
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-700 hover:bg-red-600 text-white"
                  onClick={() => {
                    setOpen(false);
                    onLeaveGame();
                  }}
                >
                  {t('common.yes') || 'Yes'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}
