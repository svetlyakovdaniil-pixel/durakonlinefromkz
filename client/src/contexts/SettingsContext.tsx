import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'kazakh-durak-settings';

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  language: string;
}

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: false,
  vibrationEnabled: true,
  language: 'ru',
};

interface SettingsContextType {
  settings: GameSettings;
  updateSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
  setSoundEnabled: (v: boolean) => void;
  setMusicEnabled: (v: boolean) => void;
  setVibrationEnabled: (v: boolean) => void;
  setLanguage: (v: string) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(s: GameSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GameSettings>(loadSettings);

  // Also sync the legacy sound key for useSound hook
  useEffect(() => {
    try {
      localStorage.setItem('kazakh-durak-sound-enabled', String(settings.soundEnabled));
    } catch {}
  }, [settings.soundEnabled]);

  const updateSetting = useCallback(<K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
  }, []);

  const setSoundEnabled = useCallback((v: boolean) => updateSetting('soundEnabled', v), [updateSetting]);
  const setMusicEnabled = useCallback((v: boolean) => updateSetting('musicEnabled', v), [updateSetting]);
  const setVibrationEnabled = useCallback((v: boolean) => updateSetting('vibrationEnabled', v), [updateSetting]);
  const setLanguage = useCallback((v: string) => updateSetting('language', v), [updateSetting]);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, setSoundEnabled, setMusicEnabled, setVibrationEnabled, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
