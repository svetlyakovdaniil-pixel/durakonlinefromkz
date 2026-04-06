import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, X } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface InviteModalProps {
  invite: {
    roomId: string;
    roomName: string;
    fromName: string;
    fromGameId: number;
  } | null;
  onAccept: (roomId: string) => void;
  onDecline: (roomId: string, fromGameId: number) => void;
}

export default function InviteModal({ invite, onAccept, onDecline }: InviteModalProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [currentInvite, setCurrentInvite] = useState(invite);

  useEffect(() => {
    if (invite) {
      setCurrentInvite(invite);
      setVisible(true);
    }
  }, [invite]);

  const handleAccept = () => {
    if (currentInvite) {
      onAccept(currentInvite.roomId);
    }
    setVisible(false);
  };

  const handleDecline = () => {
    if (currentInvite) {
      onDecline(currentInvite.roomId, currentInvite.fromGameId);
    }
    setVisible(false);
  };

  if (!visible || !currentInvite) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-gradient-to-b from-[#1a2d45] to-[#0f2035] border border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-900/30 p-6 sm:p-8 max-w-sm w-[90vw] animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={handleDecline}
          className="absolute top-3 right-3 text-amber-200/40 hover:text-amber-200/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-amber-600/20 border border-amber-500/30 flex items-center justify-center">
            <Users className="w-7 h-7 text-amber-400" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-center text-lg font-bold text-amber-100 mb-2">
          {t('invite.inviteTitle')}
        </h3>

        {/* Description */}
        <p className="text-center text-amber-200/70 text-sm mb-6">
          <span className="font-semibold text-amber-200">{currentInvite.fromName}</span>
          <span className="text-amber-200/50"> (#{currentInvite.fromGameId})</span>
          {' '}{t('invite.invitesYou')}{' '}
          <span className="font-semibold text-amber-200">«{currentInvite.roomName}»</span>
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleDecline}
            variant="outline"
            className="flex-1 h-11 text-sm border-amber-700/40 text-amber-200/80 hover:bg-amber-900/30 hover:text-amber-100"
          >
            {t('invite.decline')}
          </Button>
          <Button
            onClick={handleAccept}
            className="flex-1 h-11 text-sm bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-lg shadow-amber-900/30"
          >
            {t('invite.accept')}
          </Button>
        </div>

        {/* Auto-dismiss timer */}
        <AutoDismissBar duration={30000} onExpire={handleDecline} />
      </div>
    </div>
  );
}

function AutoDismissBar({ duration, onExpire }: { duration: number; onExpire: () => void }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [duration, onExpire]);

  return (
    <div className="mt-4 h-1 bg-amber-900/30 rounded-full overflow-hidden">
      <div
        className="h-full bg-amber-500/60 rounded-full transition-all duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
