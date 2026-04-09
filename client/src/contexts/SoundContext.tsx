import { createContext, useContext, type ReactNode } from 'react';
import { useSound } from '@/hooks/useSound';

type SoundContextType = ReturnType<typeof useSound>;

const SoundContext = createContext<SoundContextType | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const sound = useSound();
  return (
    <SoundContext.Provider value={sound}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundContext() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSoundContext must be used within SoundProvider');
  return ctx;
}
