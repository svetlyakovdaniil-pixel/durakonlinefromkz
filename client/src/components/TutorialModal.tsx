import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
  onStartTutorial: () => void;
  isLoading?: boolean;
}

export function TutorialModal({ open, onClose, onStartTutorial, isLoading = false }: TutorialModalProps) {
  const { locale } = useTranslation();

  const content = {
    ru: {
      title: 'Добро пожаловать в обучение!',
      whatAwaits: 'Что вас ждёт:',
      items: [
        '✓ Полное объяснение правил игры',
        '✓ Обучение всем механикам',
        '✓ Практика с ботом',
        '✓ Без риска потерять шаныраки',
        '✓ 2000 шаныраков за первое прохождение',
      ],
      description: 'Мы создадим специальную учебную комнату, где вы сможете изучить все новые механики и правила нашей версии Дурака. Обучение займёт около 5-10 минут.',
      cancel: 'Отмена',
      start: 'Начать обучение',
      loading: 'Загрузка...',
    },
    kk: {
      title: 'Оқытуға қош келдіңіз!',
      whatAwaits: 'Сізді не күтеді:',
      items: [
        '✓ Ойын ережелерінің толық түсіндірмесі',
        '✓ Барлық механикаларды үйрену',
        '✓ Бот-пен жаттығу',
        '✓ Шаныраксыз тәуекелсіз',
        '✓ Алғашқы өтуге 2000 шаңырақ',
      ],
      description: 'Біз арнайы оқу бөлмесін жасаймыз, онда сіз Дурактың жаңа механикалары мен ережелерін үйрене аласыз. Оқыту шамамен 5-10 минут алады.',
      cancel: 'Болдырмау',
      start: 'Оқытуды бастау',
      loading: 'Жүктелуде...',
    },
    en: {
      title: 'Welcome to the Tutorial!',
      whatAwaits: 'What awaits you:',
      items: [
        '✓ Full explanation of game rules',
        '✓ Learn all game mechanics',
        '✓ Practice with a bot',
        '✓ No risk of losing shanyrak',
        '✓ 2000 shanyrak for first completion',
      ],
      description: 'We will create a special training room where you can learn all the new mechanics and rules of our version of Durak. The tutorial takes about 5-10 minutes.',
      cancel: 'Cancel',
      start: 'Start Tutorial',
      loading: 'Loading...',
    },
  };

  const c = content[locale as keyof typeof content] || content.ru;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-100">{c.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-slate-900/50 border border-amber-600/30 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200/80">
                <p className="font-semibold mb-2">{c.whatAwaits}</p>
                <ul className="space-y-1 text-xs">
                  {c.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <p className="text-sm text-amber-200/70">
            {c.description}
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              {c.cancel}
            </Button>
            <Button
              onClick={onStartTutorial}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? c.loading : c.start}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
