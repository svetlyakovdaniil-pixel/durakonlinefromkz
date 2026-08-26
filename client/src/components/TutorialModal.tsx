import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, SkipForward } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
  onStartTutorial: () => void;
  isLoading?: boolean;
  /** When true, the Cancel button is hidden and the dialog cannot be dismissed (mandatory first-time tutorial) */
  isMandatory?: boolean;
  /** Called when user explicitly skips the tutorial (only shown in mandatory mode) */
  onSkip?: () => void;
}

export function TutorialModal({ open, onClose, onStartTutorial, isLoading = false, isMandatory = false, onSkip }: TutorialModalProps) {
  const { locale } = useTranslation();

  const content = {
    ru: {
      title: isMandatory ? '👋 Добро пожаловать!' : 'Добро пожаловать в обучение!',
      subtitle: isMandatory ? 'Перед игрой пройдите короткое обучение' : undefined,
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
      skip: 'Пропустить обучение',
      start: 'Начать обучение',
      loading: 'Загрузка...',
    },
    kk: {
      title: isMandatory ? '👋 Қош келдіңіз!' : 'Оқытуға қош келдіңіз!',
      subtitle: isMandatory ? 'Ойынға кіру алдында қысқа оқытудан өтіңіз' : undefined,
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
      skip: 'Оқытуды өткізіп жіберу',
      start: 'Оқытуды бастау',
      loading: 'Жүктелуде...',
    },
    en: {
      title: isMandatory ? '👋 Welcome!' : 'Welcome to the Tutorial!',
      subtitle: isMandatory ? 'Please complete a short tutorial before playing' : undefined,
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
      skip: 'Skip tutorial',
      start: 'Start Tutorial',
      loading: 'Loading...',
    },
    uk: {
      title: isMandatory ? '👋 Ласкаво просимо!' : 'Ласкаво просимо до навчання!',
      subtitle: isMandatory ? 'Пройдіть коротке навчання перед грою' : undefined,
      whatAwaits: 'Що на вас чекає:',
      items: [
        '✓ Повне пояснення правил гри',
        '✓ Навчання всім механікам',
        '✓ Практика з ботом',
        '✓ Без ризику втратити шаниряки',
        '✓ 2000 шаниряків за перше проходження',
      ],
      description: 'Ми створимо спеціальну навчальну кімнату, де ви зможете вивчити всі нові механіки та правила нашої версії Дурня. Навчання займе близько 5-10 хвилин.',
      cancel: 'Скасувати',
      skip: 'Пропустити навчання',
      start: 'Почати навчання',
      loading: 'Завантаження...',
    },
    ka: {
      title: isMandatory ? '👋 კეთილი იყოს!' : 'კეთილი იყოს სწავლებაში!',
      subtitle: isMandatory ? 'თამაშის დაწყებამდე გაიარეთ მოკლე სწავლება' : undefined,
      whatAwaits: 'რა გელოდებათ:',
      items: [
        '✓ თამაშის წესების სრული ახსნა',
        '✓ ყველა მექანიკის შესწავლა',
        '✓ ბოტთან ვარჯიში',
        '✓ შანირაკის დაკარგვის რისკის გარეშე',
        '✓ 2000 შანირაკი პირველი გავლისთვის',
      ],
      description: 'შევქმნით სპეციალურ სასწავლო ოთახს, სადაც შეგიძლიათ დურაკის ჩვენი ვერსიის ყველა ახალი მექანიკა და წესები. სწავლება დაახლოებით 5-10 წუთს გაგრძელდება.',
      cancel: 'გაუქმება',
      skip: 'სწავლების გამოტოვება',
      start: 'სწავლების დაწყება',
      loading: 'იტვირთება...',
    },
    az: {
      title: isMandatory ? '👋 Xoş gəldiniz!' : 'Dərsə xoş gəldiniz!',
      subtitle: isMandatory ? 'Oynamadan əvvəl qısa dərs keçin' : undefined,
      whatAwaits: 'Sizi nə gözləyir:',
      items: [
        '✓ Oyun qaydalarının tam izahı',
        '✓ Bütün mexanikaları öyrənmək',
        '✓ Botla məşq',
        '✓ Şanyrak itirmə riski yoxdur',
        '✓ İlk tamamlama üçün 2000 şanyrak',
      ],
      description: 'Durakın versiyamızın bütün yeni mexanikalarını və qaydalarını öyrənə biləcəyiniz xüsusi bir təlim otağı yaradacağıq. Dərs təxminən 5-10 dəqiqə çəkəcək.',
      cancel: 'Ləğv et',
      skip: 'Dərsi keç',
      start: 'Dərsi başlat',
      loading: 'Yüklənir...',
    },
    uz: {
      title: isMandatory ? '👋 Xush kelibsiz!' : "O'qitishga xush kelibsiz!",
      subtitle: isMandatory ? "O'ynashdan oldin qisqa o'qitishdan o'ting" : undefined,
      whatAwaits: 'Sizni nima kutmoqda:',
      items: [
        "✓ O'yin qoidalarining to'liq tushuntirishi",
        "✓ Barcha mexanikalarni o'rganish",
        '✓ Bot bilan mashq qilish',
        "✓ Shanyrak yo'qotish xavfi yo'q",
        "✓ Birinchi o'tish uchun 2000 shanyrak",
      ],
      description: "Biz Durak versiyamizning barcha yangi mexanika va qoidalarini o'rganishingiz mumkin bo'lgan maxsus o'quv xonasini yaratamiz. O'qitish taxminan 5-10 daqiqa davom etadi.",
      cancel: 'Bekor qilish',
      skip: "O'qitishni o'tkazib yuborish",
      start: "O'qitishni boshlash",
      loading: 'Yuklanmoqda...',
    },
    pl: {
      title: isMandatory ? '👋 Witamy!' : 'Witamy w samouczku!',
      subtitle: isMandatory ? 'Przed grą przejdź krótki samouczek' : undefined,
      whatAwaits: 'Co cię czeka:',
      items: [
        '✓ Pełne wyjaśnienie zasad gry',
        '✓ Nauka wszystkich mechanik',
        '✓ Ćwiczenia z botem',
        '✓ Bez ryzyka utraty szaniraków',
        '✓ 2000 szaniraków za pierwsze ukończenie',
      ],
      description: 'Stworzymy specjalny pokój treningowy, w którym możesz poznać wszystkie nowe mechaniki i zasady naszej wersji Duraka. Samouczek zajmie około 5-10 minut.',
      cancel: 'Anuluj',
      skip: 'Pomiń samouczek',
      start: 'Rozpocznij samouczek',
      loading: 'Ładowanie...',
    },
  };

  const c = content[locale as keyof typeof content] || content.ru;

  // The close icon must work even for the first-time tutorial. The parent still
  // controls whether the tutorial is shown again for users who skip it.
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-amber-100">{c.title}</DialogTitle>
          {c.subtitle && (
            <p className="text-amber-300/70 text-sm mt-1">{c.subtitle}</p>
          )}
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

          <div className="flex flex-col gap-2">
            <Button
              onClick={onStartTutorial}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white"
              disabled={isLoading}
            >
              {isLoading ? c.loading : c.start}
            </Button>

            {/* In mandatory mode: show Skip button; in optional mode: show Cancel */}
            {isMandatory ? (
              onSkip && (
                <Button
                  variant="ghost"
                  onClick={onSkip}
                  className="w-full text-amber-200/40 hover:text-amber-200/60 text-xs"
                  disabled={isLoading}
                >
                  <SkipForward className="w-3 h-3 mr-1" />
                  {c.skip}
                </Button>
              )
            ) : (
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full"
                disabled={isLoading}
              >
                {c.cancel}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
