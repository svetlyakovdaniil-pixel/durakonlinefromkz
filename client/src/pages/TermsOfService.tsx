import { useTranslation } from '../i18n';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function TermsOfService() {
  const { t, locale } = useTranslation();
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border safe-top">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocation('/')}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">{t('terms.title')}</h1>
        </div>
      </div>
      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="prose prose-invert prose-sm max-w-none space-y-6">
          {locale === 'kk' ? <TermsContentKk /> : locale === 'en' ? <TermsContentEn /> : <TermsContentRu />}
        </div>
        {/* Last updated */}
        <p className="text-xs text-muted-foreground mt-10 text-center">
          {t('privacy.lastUpdated')}: 2025-01-01
        </p>
      </div>
    </div>
  );
}

function TermsContentRu() {
  return (
    <>
      <h2 className="text-xl font-bold text-foreground">Пользовательское соглашение</h2>
      <p className="text-muted-foreground text-sm">Дата вступления в силу: 1 января 2025 года</p>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">1. Принятие условий</h3>
        <p>Используя приложение «Дурак онлайн from KZ» («Приложение»), вы соглашаетесь с настоящим Пользовательским соглашением. Если вы не согласны с условиями, пожалуйста, не используйте Приложение.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">2. Описание сервиса</h3>
        <p>«Дурак онлайн from KZ» — это онлайн-карточная игра, основанная на традиционной казахской версии игры «Дурак». Приложение предоставляет игровую платформу, включая мультиплеер, внутриигровую валюту (Шаныраки и Тенге) и косметические предметы.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">3. Учётная запись</h3>
        <p>Для использования Приложения необходима регистрация через электронную почту, учётную запись Google или Apple. Вы несёте ответственность за сохранность данных своей учётной записи. Запрещается создавать несколько учётных записей для обхода ограничений или злоупотребления системой.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">4. Внутриигровые покупки</h3>
        <p>Приложение предлагает покупку внутриигровой валюты (Тенге) за реальные деньги через официальные магазины приложений (App Store, Google Play). Все покупки являются окончательными и не подлежат возврату, за исключением случаев, предусмотренных законодательством или политикой соответствующего магазина. Внутриигровая валюта не имеет реальной денежной стоимости и не может быть обменяна на реальные деньги.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">5. Реклама</h3>
        <p>Приложение может показывать рекламу, в том числе рекламу с вознаграждением (за просмотр которой начисляется внутриигровая валюта). Реклама предоставляется третьими сторонами (Google AdMob). Мы не несём ответственности за содержание рекламы третьих сторон.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">6. Правила поведения</h3>
        <p>Запрещается: использовать читы, боты или иные средства автоматизации; оскорблять других игроков; пытаться взломать или нарушить работу серверов; использовать Приложение в коммерческих целях без разрешения.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">7. Интеллектуальная собственность</h3>
        <p>Все права на Приложение, включая графику, звуки, код и торговые марки, принадлежат разработчикам. Запрещается копировать, модифицировать или распространять материалы Приложения без письменного разрешения.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">8. Ограничение ответственности</h3>
        <p>Приложение предоставляется «как есть». Мы не гарантируем бесперебойную работу сервиса. В максимально допустимой законом мере мы не несём ответственности за косвенные убытки, потерю данных или прерывание игрового прогресса.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">9. Изменения условий</h3>
        <p>Мы оставляем за собой право изменять настоящее соглашение. Продолжение использования Приложения после публикации изменений означает ваше согласие с новыми условиями.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">10. Контакты</h3>
        <p>По вопросам, связанным с настоящим соглашением, обращайтесь через форму обратной связи в настройках Приложения.</p>
      </section>
    </>
  );
}

function TermsContentEn() {
  return (
    <>
      <h2 className="text-xl font-bold text-foreground">Terms of Service</h2>
      <p className="text-muted-foreground text-sm">Effective date: January 1, 2025</p>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">1. Acceptance of Terms</h3>
        <p>By using the "Durak Online from KZ" application ("App"), you agree to these Terms of Service. If you do not agree, please do not use the App.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">2. Description of Service</h3>
        <p>"Durak Online from KZ" is an online card game based on the traditional Kazakh version of the card game "Durak." The App provides a gaming platform including multiplayer, in-game currency (Shanyraks and Tenge), and cosmetic items.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">3. Account</h3>
        <p>You must register using an email address, Google account, or Apple account to use the App. You are responsible for maintaining the security of your account. Creating multiple accounts to circumvent restrictions or abuse the system is prohibited.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">4. In-App Purchases</h3>
        <p>The App offers the purchase of in-game currency (Tenge) for real money through official app stores (App Store, Google Play). All purchases are final and non-refundable, except as required by applicable law or the relevant store's policy. In-game currency has no real monetary value and cannot be exchanged for real money.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">5. Advertising</h3>
        <p>The App may display advertisements, including rewarded ads (which grant in-game currency upon viewing). Ads are provided by third parties (Google AdMob). We are not responsible for the content of third-party advertisements.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">6. Code of Conduct</h3>
        <p>You agree not to: use cheats, bots, or other automation tools; harass other players; attempt to hack or disrupt the servers; use the App for commercial purposes without permission.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">7. Intellectual Property</h3>
        <p>All rights to the App, including graphics, sounds, code, and trademarks, belong to the developers. Copying, modifying, or distributing App materials without written permission is prohibited.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">8. Limitation of Liability</h3>
        <p>The App is provided "as is." We do not guarantee uninterrupted service. To the maximum extent permitted by law, we are not liable for indirect damages, data loss, or interruption of game progress.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">9. Changes to Terms</h3>
        <p>We reserve the right to modify these Terms. Continued use of the App after changes are posted constitutes your acceptance of the new terms.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">10. Contact</h3>
        <p>For questions regarding these Terms, please contact us via the feedback form in the App's settings.</p>
      </section>
    </>
  );
}

function TermsContentKk() {
  return (
    <>
      <h2 className="text-xl font-bold text-foreground">Пайдаланушы келісімі</h2>
      <p className="text-muted-foreground text-sm">Күшіне ену күні: 2025 жылғы 1 қаңтар</p>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">1. Шарттарды қабылдау</h3>
        <p>«Дурак Онлайн from KZ» қосымшасын («Қосымша») пайдалана отырып, сіз осы Пайдаланушы келісімімен келісесіз. Егер сіз шарттармен келіспесеңіз, Қосымшаны пайдаланбаңыз.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">2. Қызметтің сипаттамасы</h3>
        <p>«Дурак Онлайн from KZ» — «Дурак» карта ойынының дәстүрлі қазақ нұсқасына негізделген онлайн карта ойыны. Қосымша ойын алаңын қамтамасыз етеді: мультиплеер, ойын ішіндегі валюта (Шаңырақтар мен Теңге) және косметикалық заттар.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">3. Есептік жазба</h3>
        <p>Қосымшаны пайдалану үшін электрондық пошта, Google немесе Apple есептік жазбасы арқылы тіркелу қажет. Есептік жазбаңыздың қауіпсіздігін сақтау сіздің жауапкершілігіңізде. Шектеулерді айналып өту немесе жүйені теріс пайдалану мақсатында бірнеше есептік жазба жасауға тыйым салынады.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">4. Ойын ішіндегі сатып алулар</h3>
        <p>Қосымша ресми қолданбалар дүкендері (App Store, Google Play) арқылы нақты ақшаға ойын ішіндегі валютаны (Теңге) сатып алуды ұсынады. Барлық сатып алулар түпкілікті болып табылады және қайтарылмайды, тиісті заңнама немесе дүкен саясаты талап еткен жағдайларды қоспағанда. Ойын ішіндегі валютаның нақты ақшалай құны жоқ және нақты ақшаға айырбасталмайды.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">5. Жарнама</h3>
        <p>Қосымша жарнамаларды, соның ішінде сыйақылы жарнамаларды (көргені үшін ойын ішіндегі валюта есептеледі) көрсетуі мүмкін. Жарнамалар үшінші тараптар (Google AdMob) тарапынан ұсынылады. Біз үшінші тарап жарнамаларының мазмұны үшін жауапты емеспіз.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">6. Мінез-құлық ережелері</h3>
        <p>Тыйым салынады: алдамшылықтар, боттар немесе басқа автоматтандыру құралдарын пайдалану; басқа ойыншыларды қорлау; серверлерді бұзуға немесе бұзуға әрекет ету; рұқсатсыз Қосымшаны коммерциялық мақсатта пайдалану.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">7. Зияткерлік меншік</h3>
        <p>Графика, дыбыстар, код және сауда белгілерін қоса алғандағы Қосымшаға барлық құқықтар әзірлеушілерге тиесілі. Жазбаша рұқсатсыз Қосымша материалдарын көшіруге, өзгертуге немесе таратуға тыйым салынады.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">8. Жауапкершілікті шектеу</h3>
        <p>Қосымша «сол күйінде» ұсынылады. Біз қызметтің үздіксіз жұмысына кепілдік бермейміз. Заңмен рұқсат етілген ең жоғары шамада, біз жанама залалдар, деректердің жоғалуы немесе ойын үдерісінің үзілуі үшін жауапты емеспіз.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">9. Шарттарды өзгерту</h3>
        <p>Біз осы келісімді өзгерту құқығын сақтаймыз. Өзгерістер жарияланғаннан кейін Қосымшаны пайдалануды жалғастыру жаңа шарттармен келісімді білдіреді.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground mb-2">10. Байланыс</h3>
        <p>Осы келісімге қатысты сұрақтар бойынша Қосымшаның параметрлеріндегі кері байланыс формасы арқылы бізге хабарласыңыз.</p>
      </section>
    </>
  );
}
