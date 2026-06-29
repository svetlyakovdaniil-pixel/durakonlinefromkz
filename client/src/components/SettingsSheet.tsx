import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { getAssetUrl } from '@/lib/assetUrl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { Settings, Volume2, Music, Smartphone, Globe, LogOut, Pencil, Check, X, Sparkles, MessageSquare, Shield, FileText, Bell } from 'lucide-react';
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
  const { settings, setSoundEnabled, setMusicEnabled, setVibrationEnabled, setAnimationsEnabled } = useSettings();
  const { t, locale, setLocale } = useTranslation();
  const music = useMusicContext();
  const sound = useSoundContext();
  const utils = trpc.useUtils();

  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(currentName);
  const [langOpen, setLangOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Push notification settings
  const { data: pushSettings, refetch: refetchPushSettings } = trpc.push.getSettings.useQuery(undefined, { enabled: open });
  const updatePushSettingMutation = trpc.push.updateSetting.useMutation({
    onSuccess: () => { refetchPushSettings(); },
    onError: (err) => { toast.error(err.message); },
  });

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
      } else if (err.message === 'NAME_PROFANITY_10004') {
        toast.error(t('settings.nameProfanity'));
      } else {
        toast.error(t('settings.nameError'));
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
    getAssetUrl('/assets/static/1_fd1382d6.mp3'),
    getAssetUrl('/assets/static/2_97b3c0a9.mp3'),
    getAssetUrl('/assets/static/3_9c1cf3b0.mp3'),
    getAssetUrl('/assets/static/4_3882b329.mp3'),
    getAssetUrl('/assets/static/5_79e63061.mp3'),
    getAssetUrl('/assets/static/6_2a64f936.mp3'),
    getAssetUrl('/assets/static/7_48c4f68c.mp3'),
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
      {/* Trigger */}
      <div onClick={() => setOpen(true)} style={{ display: 'contents' }}>
        {children || (
          <button className="text-amber-200/50 hover:text-amber-100 transition-colors p-1.5 rounded">
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Modal overlay */}
      {open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              background: '#0f2035',
              paddingTop: 'env(safe-area-inset-top, 0px)',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-amber-700/20 shrink-0">
              <span className="text-amber-100 font-semibold text-xl flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                {t('settings.title')}
              </span>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-amber-200/70 hover:text-amber-100 hover:bg-black/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)' }}>
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
                  {t('settings.playlist')}
                </span>
                <Select value={selectedPlaylistId} onValueChange={handlePlaylistChange}>
                  <SelectTrigger className="bg-[#0a1628] border-amber-700/30 text-amber-100 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                    <SelectItem value="default" className="text-amber-100 text-sm">
                      {t('settings.classicMusic')} {/* RU: Классический, KK: Классикалық */}
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

          {/* 5. Animations */}
          <label className="flex items-center justify-between bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20 cursor-pointer">
            <span className="text-sm font-semibold text-amber-200/80 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {t('settings.animations')}
            </span>
            <Checkbox
              checked={settings.animationsEnabled}
              onCheckedChange={(checked) => setAnimationsEnabled(checked === true)}
              className="border-amber-700/40 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
            />
          </label>

          {/* 6. Language */}
          <div className="bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setLangOpen(v => !v)}
            >
              <span className="text-sm font-semibold text-amber-200/80 flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                {t('settings.language')}
              </span>
              <span className="flex items-center gap-2 text-sm text-amber-100 bg-[#0a1628] px-3 py-1.5 rounded-lg border border-amber-700/30">
                <span className="text-base">{t('settings.langFlag')}</span>
                {t('settings.langName')}
              </span>
            </button>
            {langOpen && (
              <div className="mt-3 rounded-xl overflow-hidden border border-amber-700/20">
                {([
                  { code: 'ru', flag: '🇷🇺', name: 'Русский' },
                  { code: 'kk', flag: '🇰🇿', name: 'Қазақша' },
                  { code: 'en', flag: '🇬🇧', name: 'English' },
                  { code: 'uk', flag: '🇺🇦', name: 'Українська' },
                  { code: 'ka', flag: '🇬🇪', name: 'ქართული' },
                  { code: 'az', flag: '🇦🇿', name: 'Azərbaycanca' },
                  { code: 'uz', flag: '🇺🇿', name: "O'zbekcha" },
                  { code: 'pl', flag: '🇵🇱', name: 'Polski' },
                ] as const).map(({ code, flag, name }) => (
                  <button
                    key={code}
                    className="flex items-center gap-3 w-full text-sm text-amber-100 hover:bg-amber-700/20 px-4 py-3 transition-colors border-b border-amber-700/10 last:border-b-0"
                    onClick={() => { setLocale(code); setLangOpen(false); }}
                  >
                    <span className="text-base">{flag}</span>
                    <span className="flex-1 text-left">{name}</span>
                    {locale === code && <Check className="w-4 h-4 text-green-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 7. Contact admin */}
          <button
            onClick={() => { setOpen(false); navigate('/contact'); }}
            className="w-full flex items-center gap-3 bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20 hover:border-amber-500/40 transition-colors text-left"
          >
            <MessageSquare className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-200/80">
                {t('settings.contactButtonLabel')}
              </p>
              <p className="text-xs text-amber-200/40 mt-0.5">
                {t('settings.contactButtonDesc')}
              </p>
            </div>
          </button>

          {/* 8. Privacy Policy */}
          <button
            onClick={() => { setOpen(false); navigate('/privacy'); }}
            className="w-full flex items-center gap-3 bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20 hover:border-amber-500/40 transition-colors text-left"
          >
            <Shield className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-200/80">
                {t('settings.privacyPolicy')}
              </p>
              <p className="text-xs text-amber-200/40 mt-0.5">
                {t('settings.privacyPolicyDesc')}
              </p>
            </div>
          </button>

          {/* 9. Terms of Service */}
          <button
            onClick={() => { setOpen(false); navigate('/terms'); }}
            className="w-full flex items-center gap-3 bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20 hover:border-amber-500/40 transition-colors text-left"
          >
            <FileText className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-200/80">
                {t('terms.title')}
              </p>
              <p className="text-xs text-amber-200/40 mt-0.5">
                {t('settings.privacyPolicyDesc')}
              </p>
            </div>
          </button>

          {/* 9b. Push Notification Settings — shown only on native iOS/Android */}
          {typeof window !== 'undefined' && !!(window as any)?.Capacitor?.isNativePlatform?.() && (
            <div className="bg-[#1a2d45]/60 rounded-xl p-4 border border-amber-700/20">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-200/80">{t('settings.pushNotifications')}</span>
              </div>
              <div className="space-y-2.5">
                {([
                  { key: 'your_turn' as const, labelKey: 'settings.pushYourTurn' as const },
                  { key: 'friend_request' as const, labelKey: 'settings.pushFriendRequest' as const },
                  { key: 'shanyrak_refill' as const, labelKey: 'settings.pushShanyrakRefill' as const },
                  { key: 'room_invite' as const, labelKey: 'settings.pushRoomInvite' as const },
                  { key: 'daily_quest' as const, labelKey: 'settings.pushDailyQuest' as const },
                  { key: 'season_ending' as const, labelKey: 'settings.pushSeasonEnding' as const },
                  { key: 'reward_received' as const, labelKey: 'settings.pushRewardReceived' as const },
                  { key: 'new_update' as const, labelKey: 'settings.pushNewUpdate' as const },
                ]).map(({ key, labelKey }) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-amber-200/60">{t(labelKey)}</span>
                    <Checkbox
                      checked={pushSettings?.[key] ?? true}
                      onCheckedChange={(checked) => {
                        updatePushSettingMutation.mutate({ notifType: key, enabled: !!checked });
                      }}
                      className="border-amber-700/50 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 10. Logout */}
          {!logoutConfirmOpen ? (
            <Button
              className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold flex items-center gap-2 h-12 mb-2"
              onClick={() => setLogoutConfirmOpen(true)}
            >
              <LogOut className="w-4 h-4" />
              {t('settings.logout')}
            </Button>
          ) : (
            <div className="bg-[#1a2d45] rounded-xl p-4 border border-red-700/40 mb-2">
              <p className="text-amber-100 font-semibold text-sm mb-1">{t('settings.logoutConfirm')}</p>
              <p className="text-amber-200/60 text-xs mb-4">{t('settings.logoutDesc')}</p>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-[#0a1628] border border-amber-700/30 text-amber-200 hover:bg-[#1a2d45] hover:text-amber-100"
                  variant="outline"
                  onClick={() => setLogoutConfirmOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  className="flex-1 bg-red-700 hover:bg-red-600 text-white"
                  onClick={() => { setLogoutConfirmOpen(false); onLogout(); }}
                >
                  {t('common.yes')}
                </Button>
              </div>
            </div>
          )}
        </div>

            {/* Close button at bottom */}
            <div
              className="shrink-0 px-4 pt-3 border-t border-amber-700/20"
              style={{ paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))' }}
            >
              <button
                onClick={() => setOpen(false)}
                className="w-full py-3 rounded-xl font-semibold text-sm"
                style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}
              >
                {t('season.closeButton')}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

// ─── Inline content components for Privacy Policy and Terms of Service ───────
// These render the relevant content based on locale, shown inside in-app dialogs.

function PrivacyPolicyContent({ locale }: { locale: string }) {
  const headingCls = "text-base font-bold text-amber-200 mb-2 mt-4 first:mt-0";
  const textCls = "text-amber-100/70 leading-relaxed text-sm";
  const listCls = "list-disc pl-5 text-amber-100/70 space-y-1 text-sm";

  if (locale === 'kk') return (
    <>
      <section><h2 className={headingCls}>1. Жалпы ережелер</h2><p className={textCls}>Осы Құпиялылық саясаты «Дурак онлайн from KZ» мобильді қосымшасы пайдаланушыларының жеке деректерін өңдеу және қорғау тәртібін белгілейді. Қосымшаны пайдалана отырып, сіз осы Саясаттың шарттарымен келісесіз.</p></section>
      <section><h2 className={headingCls}>2. Біз қандай деректер жинаймыз</h2><ul className={listCls}><li>Аккаунт деректері: электрондық пошта, лақап ат, аватар</li><li>Ойын деректері: статистика, баланс, сатып алынған заттар</li><li>Техникалық деректер: құрылғы түрі, ОЖ нұсқасы, IP-мекенжай</li><li>Өзара әрекет деректері: достар тізімі, шағымдар тарихы</li></ul></section>
      <section><h2 className={headingCls}>3. Деректерді пайдалану</h2><p className={textCls}>Жиналған деректер қосымшаның жұмысын қамтамасыз ету, пайдаланушыны сәйкестендіру, ойын статистикасын жүргізу және қауіпсіздікті қамтамасыз ету үшін пайдаланылады.</p></section>
      <section><h2 className={headingCls}>4. Деректерді сақтау және қорғау</h2><p className={textCls}>Деректер шифрлаумен қорғалған серверлерде сақталады. Рұқсатсыз қол жеткізуден қорғау үшін барлық қажетті шаралар қолданылады.</p></section>
      <section><h2 className={headingCls}>5. Үшінші тараптарға деректер беру</h2><p className={textCls}>Біз жеке деректерді үшінші тараптарға сатпаймыз, алмастырмаймыз немесе бермейміз, заңда белгіленген жағдайлардан немесе қызметтер көрсету үшін қажет болған жағдайлардан басқа.</p></section>
      <section><h2 className={headingCls}>6. Пайдаланушы құқықтары</h2><ul className={listCls}><li>Сақталған жеке деректер туралы ақпарат алу</li><li>Дұрыс емес деректерді түзетуді сұрау</li><li>Аккаунтыңызды және барлық байланысты деректерді жоюды сұрау</li><li>Жеке деректерді өңдеуге берілген келісімді кері қайтарып алу</li></ul></section>
      <section><h2 className={headingCls}>7. Кәмелетке толмағандардың деректері</h2><p className={textCls}>Қосымша 13 жасқа толмаған балаларға арналмаған. Егер бала деректерін берген болса, оларды жою үшін бізге хабарласыңыз.</p></section>
      <section><h2 className={headingCls}>8. Байланыс</h2><p className={textCls}>Жеке деректерді өңдеуге қатысты мәселелер бойынша: <a href="mailto:durakonlinefromkz@gmail.com" className="text-amber-400 underline">durakonlinefromkz@gmail.com</a></p></section>
    </>
  );

  if (locale === 'en') return (
    <>
      <section><h2 className={headingCls}>1. General Provisions</h2><p className={textCls}>This Privacy Policy defines the procedure for processing and protecting personal data of users of the "Durak Online from KZ" mobile application. By using the Application, you agree to the terms of this Policy.</p></section>
      <section><h2 className={headingCls}>2. Data We Collect</h2><ul className={listCls}><li>Account data: email address, display name (nickname), avatar</li><li>Game data: game statistics (wins, losses), game balance (tenge), purchased items</li><li>Technical data: device type, OS version, IP address, session ID</li><li>Interaction data: friends list, complaint history</li></ul></section>
      <section><h2 className={headingCls}>3. How We Use Data</h2><p className={textCls}>Collected data is used to ensure the Application's operation, identify users, maintain game statistics and ratings, ensure security, and improve the Application.</p></section>
      <section><h2 className={headingCls}>4. Data Storage and Protection</h2><p className={textCls}>We take all necessary measures to protect personal data from unauthorized access. Data is stored on secure servers using encryption.</p></section>
      <section><h2 className={headingCls}>5. Third-Party Data Sharing</h2><p className={textCls}>We do not sell, trade, or transfer your personal data to third parties, except as required by law or necessary for providing services.</p></section>
      <section><h2 className={headingCls}>6. User Rights</h2><ul className={listCls}><li>Obtain information about stored personal data</li><li>Request correction of inaccurate data</li><li>Request deletion of your account and all related data</li><li>Withdraw consent for personal data processing</li></ul></section>
      <section><h2 className={headingCls}>7. Children's Data</h2><p className={textCls}>The Application is not intended for children under 13. If you discover a child has provided us their data, contact us for deletion.</p></section>
      <section><h2 className={headingCls}>8. Contact</h2><p className={textCls}>For questions about personal data processing: <a href="mailto:durakonlinefromkz@gmail.com" className="text-amber-400 underline">durakonlinefromkz@gmail.com</a></p></section>
    </>
  );

  // Default: Russian (also used for uk, ka, az, uz, pl)
  return (
    <>
      <section><h2 className={headingCls}>1. Общие положения</h2><p className={textCls}>Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей мобильного приложения «Дурак онлайн from KZ». Используя Приложение, вы соглашаетесь с условиями данной Политики.</p></section>
      <section><h2 className={headingCls}>2. Какие данные мы собираем</h2><ul className={listCls}><li><strong>Данные аккаунта:</strong> адрес электронной почты, отображаемое имя (никнейм), аватар</li><li><strong>Игровые данные:</strong> статистика игр (победы, поражения), игровой баланс (тенге), приобретённые предметы</li><li><strong>Технические данные:</strong> тип устройства, версия операционной системы, IP-адрес, идентификатор сессии</li><li><strong>Данные взаимодействия:</strong> список друзей, история жалоб</li></ul></section>
      <section><h2 className={headingCls}>3. Как мы используем данные</h2><ul className={listCls}><li>Обеспечения работы Приложения и предоставления игровых функций</li><li>Идентификации пользователя и управления аккаунтом</li><li>Ведения игровой статистики и рейтингов</li><li>Обеспечения безопасности и предотвращения мошенничества</li><li>Улучшения качества Приложения и пользовательского опыта</li></ul></section>
      <section><h2 className={headingCls}>4. Хранение и защита данных</h2><p className={textCls}>Мы принимаем все необходимые меры для защиты персональных данных от несанкционированного доступа. Данные хранятся на защищённых серверах с использованием шифрования.</p></section>
      <section><h2 className={headingCls}>5. Передача данных третьим лицам</h2><p className={textCls}>Мы не продаём, не обмениваем и не передаём ваши персональные данные третьим лицам, за исключением случаев, предусмотренных применимым законодательством или необходимых для предоставления услуг.</p></section>
      <section><h2 className={headingCls}>6. Права пользователя</h2><ul className={listCls}><li>Получить информацию о хранимых персональных данных</li><li>Запросить исправление неточных данных</li><li>Запросить удаление вашего аккаунта и всех связанных данных</li><li>Отозвать согласие на обработку персональных данных</li></ul></section>
      <section><h2 className={headingCls}>7. Данные несовершеннолетних</h2><p className={textCls}>Приложение не предназначено для детей младше 13 лет. Если вы обнаружили, что ребёнок предоставил нам свои данные, свяжитесь с нами для их удаления.</p></section>
      <section><h2 className={headingCls}>8. Файлы cookie и аналитика</h2><p className={textCls}>Приложение использует сессионные cookie для поддержания авторизации. Мы можем использовать анонимную аналитику для улучшения качества обслуживания.</p></section>
      <section><h2 className={headingCls}>9. Изменения в Политике</h2><p className={textCls}>Мы оставляем за собой право вносить изменения в настоящую Политику конфиденциальности. Продолжение использования Приложения после внесения изменений означает ваше согласие с обновлённой Политикой.</p></section>
      <section><h2 className={headingCls}>10. Контакты</h2><p className={textCls}>По всем вопросам: <a href="mailto:durakonlinefromkz@gmail.com" className="text-amber-400 underline">durakonlinefromkz@gmail.com</a></p></section>
    </>
  );
}

function TermsOfServiceContent({ locale }: { locale: string }) {
  const headingCls = "text-base font-bold text-amber-200 mb-2 mt-4 first:mt-0";
  const textCls = "text-amber-100/70 leading-relaxed text-sm";

  if (locale === 'kk') return (
    <>
      <h2 className={headingCls}>Пайдаланушы келісімі</h2>
      <p className={textCls}>Күшіне ену күні: 2025 жылдың 1 қаңтары</p>
      <section><h3 className={headingCls}>1. Шарттарды қабылдау</h3><p className={textCls}>«Дурак онлайн from KZ» қосымшасын пайдалана отырып, сіз осы Пайдаланушы келісімімен келісесіз.</p></section>
      <section><h3 className={headingCls}>2. Қызметтің сипаттамасы</h3><p className={textCls}>«Дурак онлайн from KZ» — дәстүрлі қазақ «Дурак» ойынына негізделген онлайн карта ойыны. Қосымша мультиплеер, ойын ішіндегі валюта (Шаныраки мен Тенге) және косметикалық заттарды қамтитын ойын платформасын ұсынады.</p></section>
      <section><h3 className={headingCls}>3. Ойын ішіндегі сатып алулар</h3><p className={textCls}>Қосымша ресми қосымшалар дүкендері арқылы нақты ақшаға ойын ішіндегі валютаны (Тенге) сатып алуды ұсынады. Барлық сатып алулар түпкілікті болып табылады. Ойын ішіндегі валютаның нақты ақшалай құны жоқ.</p></section>
      <section><h3 className={headingCls}>4. Мінез-құлық ережелері</h3><p className={textCls}>Тыйым салынады: чит-кодтарды, боттарды немесе автоматтандыру құралдарын пайдалану; басқа ойыншыларды қорлау; серверлерді бұзуға немесе бұзуға әрекет жасау.</p></section>
      <section><h3 className={headingCls}>5. Байланыс</h3><p className={textCls}>Осы келісімге қатысты мәселелер бойынша қосымшаның параметрлеріндегі кері байланыс формасы арқылы хабарласыңыз.</p></section>
    </>
  );

  if (locale === 'en') return (
    <>
      <h2 className={headingCls}>Terms of Service</h2>
      <p className={textCls}>Effective date: January 1, 2025</p>
      <section><h3 className={headingCls}>1. Acceptance of Terms</h3><p className={textCls}>By using the "Durak Online from KZ" application, you agree to these Terms of Service. If you do not agree, please do not use the Application.</p></section>
      <section><h3 className={headingCls}>2. Service Description</h3><p className={textCls}>"Durak Online from KZ" is an online card game based on the traditional Kazakh version of the "Durak" game. The Application provides a gaming platform including multiplayer, in-game currency (Shanyraks and Tenge), and cosmetic items.</p></section>
      <section><h3 className={headingCls}>3. In-App Purchases</h3><p className={textCls}>The Application offers the purchase of in-game currency (Tenge) for real money through official app stores. All purchases are final and non-refundable. In-game currency has no real monetary value.</p></section>
      <section><h3 className={headingCls}>4. Advertising</h3><p className={textCls}>The Application may display advertisements, including rewarded ads (for which in-game currency is awarded). Advertising is provided by third parties (Google AdMob).</p></section>
      <section><h3 className={headingCls}>5. Rules of Conduct</h3><p className={textCls}>Prohibited: using cheats, bots, or automation tools; insulting other players; attempting to hack or disrupt servers; using the Application for commercial purposes without permission.</p></section>
      <section><h3 className={headingCls}>6. Contact</h3><p className={textCls}>For questions related to these terms, contact us through the feedback form in the Application settings.</p></section>
    </>
  );

  // Default: Russian
  return (
    <>
      <h2 className={headingCls}>Пользовательское соглашение</h2>
      <p className={textCls}>Дата вступления в силу: 1 января 2025 года</p>
      <section><h3 className={headingCls}>1. Принятие условий</h3><p className={textCls}>Используя приложение «Дурак онлайн from KZ», вы соглашаетесь с настоящим Пользовательским соглашением. Если вы не согласны с условиями, пожалуйста, не используйте Приложение.</p></section>
      <section><h3 className={headingCls}>2. Описание сервиса</h3><p className={textCls}>«Дурак онлайн from KZ» — это онлайн-карточная игра, основанная на традиционной казахской версии игры «Дурак». Приложение предоставляет игровую платформу, включая мультиплеер, внутриигровую валюту (Шаныраки и Тенге) и косметические предметы.</p></section>
      <section><h3 className={headingCls}>3. Учётная запись</h3><p className={textCls}>Для использования Приложения необходима регистрация. Вы несёте ответственность за сохранность данных своей учётной записи. Запрещается создавать несколько учётных записей для обхода ограничений.</p></section>
      <section><h3 className={headingCls}>4. Внутриигровые покупки</h3><p className={textCls}>Приложение предлагает покупку внутриигровой валюты (Тенге) за реальные деньги через официальные магазины приложений. Все покупки являются окончательными и не подлежат возврату. Внутриигровая валюта не имеет реальной денежной стоимости.</p></section>
      <section><h3 className={headingCls}>5. Реклама</h3><p className={textCls}>Приложение может показывать рекламу, в том числе рекламу с вознаграждением. Реклама предоставляется третьими сторонами (Google AdMob).</p></section>
      <section><h3 className={headingCls}>6. Правила поведения</h3><p className={textCls}>Запрещается: использовать читы, боты или иные средства автоматизации; оскорблять других игроков; пытаться взломать или нарушить работу серверов; использовать Приложение в коммерческих целях без разрешения.</p></section>
      <section><h3 className={headingCls}>7. Интеллектуальная собственность</h3><p className={textCls}>Все права на Приложение принадлежат разработчикам. Запрещается копировать, модифицировать или распространять материалы Приложения без письменного разрешения.</p></section>
      <section><h3 className={headingCls}>8. Ограничение ответственности</h3><p className={textCls}>Приложение предоставляется «как есть». Мы не гарантируем бесперебойную работу сервиса.</p></section>
      <section><h3 className={headingCls}>9. Контакты</h3><p className={textCls}>По вопросам, связанным с настоящим соглашением, обращайтесь через форму обратной связи в настройках Приложения.</p></section>
    </>
  );
}
