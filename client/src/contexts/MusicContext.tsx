import { createContext, useContext, type ReactNode } from 'react';
import { useMusic } from '@/hooks/useMusic';

type MusicContextType = ReturnType<typeof useMusic>;

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const music = useMusic();
  return (
    <MusicContext.Provider value={music}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusicContext() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusicContext must be used within MusicProvider');
  return ctx;
}
