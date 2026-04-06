import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface RoomInviteToastProps {
  roomName: string;
  fromName: string;
  fromGameId: number;
  onAccept: () => void;
  onDecline: () => void;
}

export default function RoomInviteToast({ roomName, fromName, fromGameId, onAccept, onDecline }: RoomInviteToastProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-amber-400 shrink-0" />
        <div>
          <div className="text-sm font-medium text-amber-100">{t('invite.inviteTitle')}</div>
          <div className="text-xs text-amber-200/60">
            <span className="font-medium text-amber-200">{fromName}</span>
            <span className="text-amber-200/40"> (#{fromGameId})</span>
            {' '}{t('invite.invitesYou')}{' '}«{roomName}»
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 bg-amber-600 hover:bg-amber-500 text-white h-7 text-xs"
          onClick={onAccept}
        >
          {t('invite.accept')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 border-amber-700/40 text-amber-200 hover:bg-amber-900/30 h-7 text-xs"
          onClick={onDecline}
        >
          {t('invite.decline')}
        </Button>
      </div>
    </div>
  );
}
