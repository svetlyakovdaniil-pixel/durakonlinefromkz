import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Settings, Volume2, Music, Smartphone, Globe, LogOut, Pencil, Check, X, MousePointerClick, GripHorizontal, MessageSquare, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from '@/contexts/SettingsContext';
import { useMusicContext } from '@/contexts/MusicContext';
import { useSoundContext } from '@/contexts/SoundContext';
import { useTranslation } from '@/i18n';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface SettingsSheetProps {
  onLogout: () => void;
  currentName: string;
  onNameChanged?: () => void;
  children?: React.ReactNode;
}

export default function SettingsSheet({ onLogout, currentName, onNameChanged, children }: SettingsSheetProps) {
  const { settings, setSoundEnabled, setMusicEnabled, setVibrationEnabled, setCardControlMode } = useSettings();
  const { t, locale, setLocale } = useTranslation();
  const music = useMusicContext();
  const sound = useSoundContext();
  const utils = trpc.useUtils();

  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(currentName);
  const [langOpen, setLangOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const sendContactMutation = trpc.contact.send.useMutation({
    onSuccess: () => {
      toast.success(locale === 'kk' ? 'Хабарламаңыз жіберілді!' : locale === 'en' ? 'Message sent!' : 'Сообщение отправлено!');
      setContactEmail('');
      setContactMessage('');
      setContactOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || (locale === 'kk' ? 'Қате орын алды' : locale === 'en' ? 'Error sending message' : 'Ошибка при отправке'));
    },
  });

  const handleSendContact = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      toast.error(locale === 'kk' ? 'Жарамды email енгізіңіз' : locale === 'en' ? 'Enter a valid email' : 'Введите корректный email');
      return;
    }
    if (contactMessage.trim().length < 10) {
      toast.error(locale === 'kk' ? 'Хабарлама тым қысқа (мин. 10 таңба)' : locale === 'en' ? 'Message too short (min. 10 characters)' : 'Сообщение слишком короткое (мин. 10 символов)');
      return;
    }
    sendContactMutation.mutate({ replyEmail: contactEmail, message: contactMessage.trim() });
  };

  // Playlist data
  const { data: allPlaylists = [] } = trpc.playlists.list.useQuery(undefined, { enabled: open });
  const { data: ownedPlaylistIds = [] } = trpc.playlists.owned.useQuery(undefined, { enabled: open });

  // Personal playlist selection (stored in localStorage)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(() => {
    try {
      const raw = localStorage.getItem('kazakh-durak-settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.personalPlaylistId !== undefined && parsed.personalPlaylistId !== null) {
          return String(parsed.personalPlaylistId);
        }
      }
    } catch {}
    return 'default';
  });

  // Fetch tracks for the selected playlist to switch music
  const numericPlaylistId = selectedPlaylistId !== 'default' ? parseInt(selectedPlaylistId) : null;
  const { data: selectedPlaylistData } = trpc.playlists.tracks.useQuery(
    { playlistId: numericPlaylistId! },
    { enabled: !!numericPlaylistId }
  );

  const updateNameMutation = trpc.profile.updateName.useMutation({
    onSuccess: () => {
      toast.success(t('settings.nameChanged'));
      utils.profile.me.invalidate();
      setEditingName(false);
      onNameChanged?.();
    },
    onError: (err) => {
      if (err.message === 'NAME_RESERVED_10003') {
        toast.error(t('settings.nameReserved'));
      } else {
        toast.error(err.message || t('settings.nameError'));
      }
    },
  });

  const handleSaveName = () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed.length < 1) {
      toast.error(t('settings.nameEmpty'));
      return;
    }
    if (trimmed.length > 12) {
      toast.error(t('settings.nameTooLong'));
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
    // Also update the sound context to sync the enabledRef
    if (checked !== sound.enabled) {
      sound.toggle();
    }
  };

  const handleVibrationToggle = (checked: boolean) => {
    setVibrationEnabled(checked);
  };

  const handlePlaylistChange = (value: string) => {
    setSelectedPlaylistId(value);
    // Persist to localStorage
    try {
      const raw = localStorage.getItem('kazakh-durak-settings');
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.personalPlaylistId = value === 'default' ? null : parseInt(value);
      localStorage.setItem('kazakh-durak-settings', JSON.stringify(parsed));
    } catch {}
  };

  // Default tracks (same as useMusic hook)
  const DEFAULT_TRACKS = [
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№1_fd1382d6.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№2_97b3c0a9.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№3_9c1cf3b0.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№4_3882b329.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№5_79e63061.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№6_2a64f936.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№7_48c4f68c.mp3',
  ];

  // When playlist data loads or changes, switch the music tracks and apply volume multiplier
  useEffect(() => {
    if (selectedPlaylistId === 'default') {
      // Reset to default tracks (Классический) with normal volume
      music.setTracks(DEFAULT_TRACKS);
      music.setVolume(music.volume); // reset to user's volume (multiplier 1.0)
    } else if (selectedPlaylistData?.tracks?.length) {
      // tracks from backend are already string URLs
      music.setTracks(selectedPlaylistData.tracks as string[]);
      // Apply volume multiplier if playlist has one (e.g. Chinese playlist is 20% quieter)
      const multiplier = (selectedPlaylistData as any).volumeMultiplier ?? 1.0;
      if (multiplier < 1.0) {
        music.setVolume(music.volume * multiplier);
      }
    }
  }, [selectedPlaylistId, selectedPlaylistData]);

  // Filter to only owned playlists, excluding the default one (already shown as hardcoded "Классический" option)
  const ownedPlaylists = allPlaylists.filter((p: any) => ownedPlaylistIds.includes(p.id) && !p.isDefault);

  return (
    <>
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
          {/* 1. Change name */}
          <div className="bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-amber-200/80 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-400" />
                {t('settings.playerName')}
              </span>
              {!editingName && (
                <button
                  className="text-amber-400 hover:text-amber-300 p-1"
                  onClick={() => setEditingName(true)}
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            {editingName ? (
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={12}
                  className="bg-[#0a1628] border-amber-700/30 text-amber-100 placeholder-amber-200/30"
                  placeholder={t('settings.enterName')}
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

          {/* 3. Background music + Playlist selector */}
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

            {/* Playlist selector — always visible when music section is shown */}
            {ownedPlaylists.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-amber-200/50 mb-1.5 block">
                  {locale === 'kk' ? 'Плейлист' : locale === 'en' ? 'Playlist' : 'Плейлист'}
                </span>
                <Select value={selectedPlaylistId} onValueChange={handlePlaylistChange}>
                  <SelectTrigger className="bg-[#0a1628] border-amber-700/30 text-amber-100 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                    <SelectItem value="default" className="text-amber-100 text-sm">
                      {locale === 'kk' ? 'Классикалық' : locale === 'en' ? 'Classic' : 'Классический'}
                    </SelectItem>
                    {ownedPlaylists.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)} className="text-amber-100 text-sm">
                        {locale === 'kk' && p.nameKk ? p.nameKk : p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* 4. Vibration */}
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

          {/* 5. Card control mode */}
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

          {/* 6. Language */}
          <div className="flex items-center justify-between bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20">
            <span className="text-sm font-semibold text-amber-200/80 flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              {t('settings.language')}
            </span>
            <Popover open={langOpen} onOpenChange={setLangOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 text-sm text-amber-100 hover:text-amber-300 transition-colors bg-[#0a1628] px-3 py-1.5 rounded-lg border border-amber-700/30">
                  <span className="text-base">{locale === 'kk' ? '🇰🇿' : locale === 'en' ? '🇬🇧' : '🇷🇺'}</span>
                  {locale === 'kk' ? 'Қазақша' : locale === 'en' ? 'English' : 'Русский'}
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
                <button
                  className="flex items-center gap-2 w-full text-sm text-amber-100 hover:bg-amber-700/20 px-3 py-2 rounded-lg transition-colors"
                  onClick={() => { setLocale('en'); setLangOpen(false); }}
                >
                  <span className="text-base">🇬🇧</span>
                  English
                  {locale === 'en' && <Check className="w-4 h-4 text-green-400 ml-auto" />}
                </button>
              </PopoverContent>
            </Popover>
          </div>

          {/* 7. Contact admin */}
          <button
            onClick={() => setContactOpen(true)}
            className="w-full flex items-center gap-3 bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20 hover:border-amber-500/40 transition-colors text-left"
          >
            <MessageSquare className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-200/80">
                {locale === 'kk' ? 'Әкімшілікпен байланыс' : locale === 'en' ? 'Contact Administration' : 'Связь с администрацией'}
              </p>
              <p className="text-xs text-amber-200/40 mt-0.5">
                {locale === 'kk' ? 'Сұрақ немесе ұсыныс жіберіңіз' : locale === 'en' ? 'Ask a question or leave a suggestion' : 'Задать вопрос или оставить предложение'}
              </p>
            </div>
          </button>

          {/* 8. Privacy Policy */}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20 hover:border-amber-500/40 transition-colors text-left"
          >
            <Shield className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-200/80">
                {locale === 'kk' ? 'Күпіялылық саясаты' : locale === 'en' ? 'Privacy Policy' : 'Политика конфиденциальности'}
              </p>
              <p className="text-xs text-amber-200/40 mt-0.5">
                {locale === 'kk' ? 'Деректерді оқу' : locale === 'en' ? 'Read our privacy policy' : 'Ознакомиться с политикой'}
              </p>
            </div>
          </a>

          {/* 9. Logout */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold flex items-center gap-2 h-11">
                <LogOut className="w-4 h-4" />
                {t('settings.logout')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#1a2d45] border-amber-700/30 text-amber-100 max-w-[calc(100vw-2rem)] sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-amber-100">{t('settings.logoutConfirm')}</AlertDialogTitle>
                <AlertDialogDescription className="text-amber-200/60">
                  {t('settings.logoutDesc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-[#0a1628] border-amber-700/30 text-amber-200 hover:bg-[#1a2d45] hover:text-amber-100">
                  {t('common.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-700 hover:bg-red-600 text-white"
                  onClick={onLogout}
                >
                  {t('common.yes')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>

    {/* Contact Admin Dialog */}
    <Dialog open={contactOpen} onOpenChange={setContactOpen}>
      <DialogContent className="bg-[#0f2035] border border-amber-700/30 text-amber-100 max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            {locale === 'kk' ? 'Әкімшілікпен байланыс' : locale === 'en' ? 'Contact Administration' : 'Связь с администрацией'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs text-amber-200/60 mb-1.5 block">
              {locale === 'kk' ? 'Жауап електрондық пошта (email)' : locale === 'en' ? 'Your reply email' : 'Ваш email для обратной связи'}
              <span className="text-red-400 ml-1">*</span>
            </label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder={locale === 'kk' ? 'example@mail.com' : 'example@mail.com'}
              className="bg-[#0a1628] border-amber-700/30 text-amber-100 placeholder-amber-200/30"
            />
          </div>
          <div>
            <label className="text-xs text-amber-200/60 mb-1.5 block">
              {locale === 'kk' ? 'Хабарлама' : locale === 'en' ? 'Message' : 'Сообщение'}
              <span className="text-red-400 ml-1">*</span>
            </label>
            <Textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder={locale === 'kk' ? 'Сұрақтарыңызды немесе ұсыныстарыңызды жазыңыз...' : locale === 'en' ? 'Describe your question or suggestion...' : 'Опишите ваш вопрос или предложение...'}
              rows={5}
              maxLength={2000}
              className="bg-[#0a1628] border-amber-700/30 text-amber-100 placeholder-amber-200/30 resize-none"
            />
            <p className="text-xs text-amber-200/30 text-right mt-1">{contactMessage.length}/2000</p>
          </div>
        </div>
        <DialogFooter className="mt-2 gap-2">
          <Button
            variant="outline"
            onClick={() => setContactOpen(false)}
            className="border-amber-700/30 text-amber-200 hover:bg-[#1a2d45] hover:text-amber-100 bg-transparent"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSendContact}
            disabled={sendContactMutation.isPending}
            className="bg-amber-600 hover:bg-amber-500 text-white"
          >
            {sendContactMutation.isPending
              ? (locale === 'kk' ? 'Жіберілуде...' : locale === 'en' ? 'Sending...' : 'Отправка...')
              : (locale === 'kk' ? 'Жіберу' : locale === 'en' ? 'Send' : 'Отправить')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
