import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Settings, Volume2, Music, Smartphone, Globe, LogOut, Pencil, Check, X } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useMusicContext } from '@/contexts/MusicContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface SettingsSheetProps {
  onLogout: () => void;
  currentName: string;
  onNameChanged?: () => void;
  children?: React.ReactNode;
}

export default function SettingsSheet({ onLogout, currentName, onNameChanged, children }: SettingsSheetProps) {
  const { settings, setSoundEnabled, setMusicEnabled, setVibrationEnabled } = useSettings();
  const music = useMusicContext();
  const utils = trpc.useUtils();

  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(currentName);
  const [langOpen, setLangOpen] = useState(false);

  const updateNameMutation = trpc.profile.updateName.useMutation({
    onSuccess: () => {
      toast.success('Имя изменено');
      utils.profile.me.invalidate();
      setEditingName(false);
      onNameChanged?.();
    },
    onError: (err) => {
      toast.error(err.message || 'Ошибка при смене имени');
    },
  });

  const handleSaveName = () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed.length < 1) {
      toast.error('Имя не может быть пустым');
      return;
    }
    if (trimmed.length > 50) {
      toast.error('Имя слишком длинное (макс. 50 символов)');
      return;
    }
    updateNameMutation.mutate({ displayName: trimmed });
  };

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
      <SheetContent side="right" className="bg-[#0f2035] border-l border-amber-700/30 text-amber-100 w-[320px] sm:w-[380px]">
        <SheetHeader>
          <SheetTitle className="text-amber-100 text-xl flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            Настройки
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* 1. Change name */}
          <div className="bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-amber-200/80 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-400" />
                Имя игрока
              </span>
              {!editingName && (
                <button
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  onClick={() => { setNewName(currentName); setEditingName(true); }}
                >
                  Изменить
                </button>
              )}
            </div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="bg-[#0a1628] border-amber-700/30 text-amber-100 h-9 text-sm flex-1"
                  placeholder="Введите новое имя"
                  maxLength={50}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                />
                <button
                  className="text-green-400 hover:text-green-300 p-1"
                  onClick={handleSaveName}
                  disabled={updateNameMutation.isPending}
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  className="text-red-400 hover:text-red-300 p-1"
                  onClick={() => setEditingName(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <p className="text-amber-100 text-sm">{currentName}</p>
            )}
          </div>

          {/* 2. Sound effects */}
          <label className="flex items-center justify-between bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20 cursor-pointer">
            <span className="text-sm font-semibold text-amber-200/80 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              Звуки
            </span>
            <Checkbox
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => handleSoundToggle(checked === true)}
              className="border-amber-700/40 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
            />
          </label>

          {/* 3. Background music */}
          <label className="flex items-center justify-between bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20 cursor-pointer">
            <span className="text-sm font-semibold text-amber-200/80 flex items-center gap-2">
              <Music className="w-4 h-4 text-amber-400" />
              Фоновая музыка
            </span>
            <Checkbox
              checked={settings.musicEnabled}
              onCheckedChange={(checked) => handleMusicToggle(checked === true)}
              className="border-amber-700/40 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
            />
          </label>

          {/* 4. Vibration */}
          <label className="flex items-center justify-between bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20 cursor-pointer">
            <span className="text-sm font-semibold text-amber-200/80 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400" />
              Вибрация
            </span>
            <Checkbox
              checked={settings.vibrationEnabled}
              onCheckedChange={(checked) => handleVibrationToggle(checked === true)}
              className="border-amber-700/40 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
            />
          </label>

          {/* 5. Language */}
          <div className="flex items-center justify-between bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20">
            <span className="text-sm font-semibold text-amber-200/80 flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              Язык
            </span>
            <Popover open={langOpen} onOpenChange={setLangOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 text-sm text-amber-100 hover:text-amber-300 transition-colors bg-[#0a1628] px-3 py-1.5 rounded-lg border border-amber-700/30">
                  <span className="text-base">🇷🇺</span>
                  Русский
                </button>
              </PopoverTrigger>
              <PopoverContent className="bg-[#1a2d45] border-amber-700/30 w-48 p-2" align="end">
                <button
                  className="flex items-center gap-2 w-full text-sm text-amber-100 hover:bg-amber-700/20 px-3 py-2 rounded-lg transition-colors"
                  onClick={() => setLangOpen(false)}
                >
                  <span className="text-base">🇷🇺</span>
                  Русский
                  <Check className="w-4 h-4 text-green-400 ml-auto" />
                </button>
              </PopoverContent>
            </Popover>
          </div>

          {/* 6. Logout */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold flex items-center gap-2 h-11">
                <LogOut className="w-4 h-4" />
                Выйти из аккаунта
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#1a2d45] border-amber-700/30 text-amber-100 max-w-[calc(100vw-2rem)] sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-amber-100">Выход из аккаунта</AlertDialogTitle>
                <AlertDialogDescription className="text-amber-200/60">
                  Вы точно хотите выйти из аккаунта?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-[#0a1628] border-amber-700/30 text-amber-200 hover:bg-[#1a2d45] hover:text-amber-100">
                  Нет
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-700 hover:bg-red-600 text-white"
                  onClick={() => {
                    setOpen(false);
                    onLogout();
                  }}
                >
                  Да
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}
