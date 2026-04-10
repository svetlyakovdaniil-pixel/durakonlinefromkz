import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
  onStartTutorial: () => void;
  isLoading?: boolean;
}

export function TutorialModal({ open, onClose, onStartTutorial, isLoading = false }: TutorialModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-100">Добро пожаловать в обучение!</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-slate-900/50 border border-amber-600/30 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200/80">
                <p className="font-semibold mb-2">Что вас ждёт:</p>
                <ul className="space-y-1 text-xs">
                  <li>✓ Полное объяснение правил игры</li>
                  <li>✓ Обучение всем механикам</li>
                  <li>✓ Практика с ботом</li>
                  <li>✓ Без риска потерять шаныраки</li>
                  <li>✓ 2000 шаныраков за первое прохождение</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-sm text-amber-200/70">
            Мы создадим специальную учебную комнату, где вы сможете изучить все новые механики и правила нашей версии Дурака. Обучение займёт около 5-10 минут.
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button
              onClick={onStartTutorial}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Загрузка...' : 'Начать обучение'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
