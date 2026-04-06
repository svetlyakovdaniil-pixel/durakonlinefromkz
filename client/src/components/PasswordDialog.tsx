import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Loader2 } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomName: string;
  onSubmit: (password: string) => Promise<boolean>;
}

export default function PasswordDialog({ open, onOpenChange, roomName, onSubmit }: PasswordDialogProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError(t('passwordDialog.empty'));
      return;
    }
    setLoading(true);
    setError('');
    const ok = await onSubmit(password);
    setLoading(false);
    if (!ok) {
      setError(t('passwordDialog.wrong'));
      setPassword('');
    } else {
      setPassword('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a2d45] border-amber-700/30 text-amber-100 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-amber-100 flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            {t('passwordDialog.title')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-amber-200/60 text-sm">
            {t('passwordDialog.description').replace('{room}', roomName)}
          </p>
          <Input
            type="password"
            placeholder={t('passwordDialog.placeholder')}
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="bg-[#0f2035] border-amber-700/30 text-amber-100"
            autoFocus
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <Button
            className="w-full bg-amber-600 hover:bg-amber-500 text-white"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {t('passwordDialog.join')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
