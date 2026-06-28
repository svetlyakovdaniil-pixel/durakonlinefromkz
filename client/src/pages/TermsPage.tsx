/**
 * TermsPage — полноэкранная страница пользовательского соглашения.
 * Открывается как route /terms. Кнопка «Назад» возвращает на предыдущую страницу.
 */
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function TermsPage({ backPath = '/' }: { backPath?: string }) {
  const [, navigate] = useLocation();
  const { locale } = useTranslation();

  const headingCls = "text-base font-bold text-amber-200 mb-2 mt-4 first:mt-0";
  const textCls = "text-amber-100/70 leading-relaxed text-sm";

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
        <h1 className="text-lg font-semibold text-amber-100">
          {locale === 'kk' ? 'Пайдаланушы келісімі' : locale === 'en' ? 'Terms of Service' : 'Пользовательское соглашение'}
        </h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
        {locale === 'kk' ? (
          <>
            <h2 className={headingCls}>Пайдаланушы келісімі</h2>
            <p className={textCls}>Күшіне ену күні: 2025 жылдың 1 қаңтары</p>
            <section><h3 className={headingCls}>1. Шарттарды қабылдау</h3><p className={textCls}>«Дурак онлайн from KZ» қосымшасын пайдалана отырып, сіз осы Пайдаланушы келісімімен келісесіз.</p></section>
            <section><h3 className={headingCls}>2. Қызметтің сипаттамасы</h3><p className={textCls}>«Дурак онлайн from KZ» — дәстүрлі қазақ «Дурак» ойынына негізделген онлайн карта ойыны. Қосымша мультиплеер, ойын ішіндегі валюта (Шаныраки мен Тенге) және косметикалық заттарды қамтитын ойын платформасын ұсынады.</p></section>
            <section><h3 className={headingCls}>3. Ойын ішіндегі сатып алулар</h3><p className={textCls}>Қосымша ресми қосымшалар дүкендері арқылы нақты ақшаға ойын ішіндегі валютаны (Тенге) сатып алуды ұсынады. Барлық сатып алулар түпкілікті болып табылады. Ойын ішіндегі валютаның нақты ақшалай құны жоқ.</p></section>
            <section><h3 className={headingCls}>4. Мінез-құлық ережелері</h3><p className={textCls}>Тыйым салынады: чит-кодтарды, боттарды немесе автоматтандыру құралдарын пайдалану; басқа ойыншыларды қорлау; серверлерді бұзуға немесе бұзуға әрекет жасау.</p></section>
            <section><h3 className={headingCls}>5. Байланыс</h3><p className={textCls}>Осы келісімге қатысты мәселелер бойынша қосымшаның параметрлеріндегі кері байланыс формасы арқылы хабарласыңыз.</p></section>
          </>
        ) : locale === 'en' ? (
          <>
            <h2 className={headingCls}>Terms of Service</h2>
            <p className={textCls}>Effective date: January 1, 2025</p>
            <section><h3 className={headingCls}>1. Acceptance of Terms</h3><p className={textCls}>By using the "Durak Online from KZ" application, you agree to these Terms of Service. If you do not agree, please do not use the Application.</p></section>
            <section><h3 className={headingCls}>2. Service Description</h3><p className={textCls}>"Durak Online from KZ" is an online card game based on the traditional Kazakh version of the "Durak" game. The Application provides a gaming platform including multiplayer, in-game currency (Shanyraks and Tenge), and cosmetic items.</p></section>
            <section><h3 className={headingCls}>3. In-App Purchases</h3><p className={textCls}>The Application offers the purchase of in-game currency (Tenge) for real money through official app stores. All purchases are final and non-refundable. In-game currency has no real monetary value.</p></section>
            <section><h3 className={headingCls}>4. Advertising</h3><p className={textCls}>The Application may display advertisements, including rewarded ads (for which in-game currency is awarded). Advertising is provided by third parties (Google AdMob).</p></section>
            <section><h3 className={headingCls}>5. Rules of Conduct</h3><p className={textCls}>Prohibited: using cheats, bots, or automation tools; insulting other players; attempting to hack or disrupt servers; using the Application for commercial purposes without permission.</p></section>
            <section><h3 className={headingCls}>6. Contact</h3><p className={textCls}>For questions related to these terms, contact us through the feedback form in the Application settings.</p></section>
          </>
        ) : (
          <>
            <h2 className={headingCls}>Пользовательское соглашение</h2>
            <p className={textCls}>Дата вступления в силу: 1 января 2025 года</p>
            <section><h3 className={headingCls}>1. Принятие условий</h3><p className={textCls}>Используя приложение «Дурак онлайн from KZ», вы соглашаетесь с настоящим Пользовательским соглашением. Если вы не согласны с условиями, пожалуйста, не используйте Приложение.</p></section>
            <section><h3 className={headingCls}>2. Описание сервиса</h3><p className={textCls}>«Дурак онлайн from KZ» — это онлайн-карточная игра, основанная на традиционной казахской версии игры «Дурак». Приложение предоставляет игровую платформу, включая мультиплеер, внутриигровую валюту (Шаныраки и Тенге) и косметические предметы.</p></section>
            <section><h3 className={headingCls}>3. Учётная запись</h3><p className={textCls}>Для использования Приложения необходима регистрация. Вы несёте ответственность за сохранность данных своей учётной записи. Запрещается создавать несколько учётных записей для обхода ограничений.</p></section>
            <section><h3 className={headingCls}>4. Внутриигровые покупки</h3><p className={textCls}>Приложение предлагает покупку внутриигровой валюты (Тенге) за реальные деньги через официальные магазины приложений. Все покупки являются окончательными и не подлежат возврату. Внутриигровая валюта не имеет реальной денежной стоимости.</p></section>
            <section><h3 className={headingCls}>5. Реклама</h3><p className={textCls}>Приложение может показывать рекламу, в том числе рекламу с вознаграждением. Реклама предоставляется третьими сторонами (Google AdMob).</p></section>
            <section><h3 className={headingCls}>6. Правила поведения</h3><p className={textCls}>Запрещается: использовать читы, боты или иные средства автоматизации; оскорблять других игроков; пытаться взломать или нарушить работу серверов; использовать Приложение в коммерческих целях без разрешения.</p></section>
            <section><h3 className={headingCls}>7. Интеллектуальная собственность</h3><p className={textCls}>Все права на Приложение принадлежат разработчикам. Запрещается копировать, модифицировать или распространять материалы Приложения без письменного разрешения.</p></section>
            <section><h3 className={headingCls}>8. Ограничение ответственности</h3><p className={textCls}>Приложение предоставляется «как есть». Мы не гарантируем бесперебойную работу сервиса.</p></section>
            <section><h3 className={headingCls}>9. Контакты</h3><p className={textCls}>По вопросам, связанным с настоящим соглашением, обращайтесь через форму обратной связи в настройках Приложения.</p></section>
          </>
        )}
      </div>
    </div>
  );
}
