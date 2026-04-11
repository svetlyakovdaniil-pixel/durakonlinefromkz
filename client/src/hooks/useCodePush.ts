import { useEffect, useState } from 'react';

// CodePush types (no @types package available)
interface CodePushUpdateCheckResult {
  isAvailable: boolean;
  isMandatory?: boolean;
  downloadUrl?: string;
  label?: string;
  packageSize?: number;
  description?: string;
}

interface CodePushSyncOptions {
  installMode?: number;
  mandatoryInstallMode?: number;
  checkFrequency?: number;
  updateDialog?: boolean;
}

const CodePush = (window as any).codePush;

export function useCodePush() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isMandatory, setIsMandatory] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!CodePush) {
      console.log('[CodePush] Not available in this environment');
      return;
    }

    // Check for updates on app start
    checkForUpdates();

    // Check for updates every 6 hours
    const interval = setInterval(checkForUpdates, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkForUpdates = async () => {
    if (!CodePush) return;

    try {
      setIsChecking(true);
      const result: CodePushUpdateCheckResult = await CodePush.checkUpdate();

      if (result.isAvailable) {
        setUpdateAvailable(true);
        setIsMandatory(result.isMandatory || false);
        console.log('[CodePush] Update available:', result);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.error('[CodePush] Check failed:', message);
    } finally {
      setIsChecking(false);
    }
  };

  const installUpdate = async () => {
    if (!CodePush) return;

    try {
      setIsChecking(true);
      const options: CodePushSyncOptions = {
        installMode: CodePush.InstallMode.ON_NEXT_RESTART,
        mandatoryInstallMode: CodePush.InstallMode.IMMEDIATE,
        updateDialog: true,
      };

      await CodePush.sync(options, (status: any) => {
        console.log('[CodePush] Sync status:', status);
      });

      setUpdateAvailable(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.error('[CodePush] Install failed:', message);
    } finally {
      setIsChecking(false);
    }
  };

  return {
    updateAvailable,
    isMandatory,
    isChecking,
    error,
    checkForUpdates,
    installUpdate,
  };
}
