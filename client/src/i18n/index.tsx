import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { ru } from './ru';
import { kk } from './kk';
import { en } from './en';

export type Locale = 'ru' | 'kk' | 'en';

// Flatten nested object keys with dot notation
type FlattenKeys<T, Prefix extends string = ''> = T extends Record<string, unknown>
  ? { [K in keyof T & string]: T[K] extends Record<string, unknown>
      ? FlattenKeys<T[K], `${Prefix}${K}.`>
      : `${Prefix}${K}`
    }[keyof T & string]
  : never;

export type TranslationKey = FlattenKeys<typeof ru>;

const translations: Record<Locale, Record<string, unknown>> = { ru, kk, en };

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // fallback to key
    }
  }
  return typeof current === 'string' ? current : path;
}

interface I18nContextType {
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { settings, setLanguage } = useSettings();
  const locale = (['ru', 'kk', 'en'].includes(settings.language) ? settings.language : 'ru') as Locale;

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = getNestedValue(translations[locale] as Record<string, unknown>, key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return text;
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLanguage(newLocale);
  }, [setLanguage]);

  return (
    <I18nContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}
