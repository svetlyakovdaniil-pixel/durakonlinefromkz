/**
 * ContactPage — полноэкранная страница «Связь с администрацией».
 * Открывается как route /contact. Кнопка «Назад» возвращает на предыдущую страницу.
 */
import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useTranslation } from '@/i18n';

export default function ContactPage({ backPath = '/' }: { backPath?: string }) {
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const sendContactMutation = trpc.contact.send.useMutation({
    onSuccess: () => {
      toast.success(t('contact.successTitle'));
      setContactEmail('');
      setContactMessage('');
      navigate(backPath);
    },
    onError: (err) => {
      toast.error(err.message || t('contact.errorTitle'));
    },
  });

  const handleSend = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      toast.error(t('contact.validationEmail'));
      return;
    }
    if (contactMessage.trim().length < 10) {
      toast.error(t('contact.validationMessage'));
      return;
    }
    sendContactMutation.mutate({ replyEmail: contactEmail, message: contactMessage.trim() });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        background: '#0f1f35',
        color: '#fef3c7',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pb-3 border-b border-amber-700/30 bg-[#0f1f35] flex-shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <button
          onClick={() => navigate(backPath)}
          className="w-8 h-8 rounded-full bg-[#1a2d45] hover:bg-[#243d5a] flex items-center justify-center transition-colors flex-shrink-0"
          aria-label="Назад"
        >
          <ArrowLeft className="w-4 h-4 text-amber-200" />
        </button>
        <MessageSquare className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <h1 className="text-lg font-semibold text-amber-100">
          {t('contact.dialogTitle')}
        </h1>
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <p className="text-amber-100/60 text-sm mb-5">
          {t('contact.dialogDesc')}
        </p>

        {/* Email field */}
        <div className="mb-4">
          <label className="text-xs text-amber-200/60 mb-1.5 block">
            {t('contact.emailLabel')}
            <span className="text-red-400 ml-1">*</span>
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder={t('contact.emailPlaceholder')}
            className="w-full rounded-md px-3 py-2 text-sm bg-[#0a1628] border border-amber-700/30 text-amber-100 placeholder-amber-200/30 outline-none focus:border-amber-500/60 transition-colors"
          />
        </div>

        {/* Message field */}
        <div className="mb-6">
          <label className="text-xs text-amber-200/60 mb-1.5 block">
            {t('contact.messageLabel')}
            <span className="text-red-400 ml-1">*</span>
          </label>
          <textarea
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            placeholder={t('contact.messagePlaceholder')}
            rows={6}
            maxLength={2000}
            className="w-full rounded-md px-3 py-2 text-sm bg-[#0a1628] border border-amber-700/30 text-amber-100 placeholder-amber-200/30 outline-none focus:border-amber-500/60 transition-colors resize-none"
          />
          <p className="text-xs text-amber-200/30 text-right mt-1">{contactMessage.length}/2000</p>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sendContactMutation.isPending}
          className="w-full py-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
        >
          {sendContactMutation.isPending ? t('contact.sending') : t('contact.sendButton')}
        </button>
      </div>
    </div>
  );
}
