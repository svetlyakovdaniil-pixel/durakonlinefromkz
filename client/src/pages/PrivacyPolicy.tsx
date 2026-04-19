import { useTranslation } from '../i18n';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function PrivacyPolicy() {
  const { t, locale } = useTranslation();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocation('/')}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">{t('privacy.title')}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="prose prose-invert prose-sm max-w-none space-y-6">
          {locale === 'kk' ? <PrivacyContentKk /> : locale === 'en' ? <PrivacyContentEn /> : locale === 'uk' ? <PrivacyContentUk /> : locale === 'ka' ? <PrivacyContentKa /> : locale === 'az' ? <PrivacyContentAz /> : locale === 'uz' ? <PrivacyContentUz /> : locale === 'pl' ? <PrivacyContentPl /> : <PrivacyContentRu />}
        </div>

        {/* Last updated */}
        <div className="mt-12 pt-6 border-t border-border text-sm text-muted-foreground text-center">
          {t('privacy.lastUpdated')}: 11.04.2026
        </div>
      </div>
    </div>
  );
}

function PrivacyContentRu() {
  return (
    <>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">1. Общие положения</h2>
        <p className="text-muted-foreground leading-relaxed">
          Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей мобильного приложения «Дурак онлайн from KZ» (далее — «Приложение»). Используя Приложение, вы соглашаетесь с условиями данной Политики.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">2. Какие данные мы собираем</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          При использовании Приложения мы можем собирать следующие данные:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li><strong className="text-foreground">Данные аккаунта:</strong> адрес электронной почты, отображаемое имя (никнейм), аватар</li>
          <li><strong className="text-foreground">Игровые данные:</strong> статистика игр (победы, поражения), игровой баланс (тенге), приобретённые предметы (аватарки, рамки, колоды, столы)</li>
          <li><strong className="text-foreground">Технические данные:</strong> тип устройства, версия операционной системы, IP-адрес, идентификатор сессии</li>
          <li><strong className="text-foreground">Данные взаимодействия:</strong> список друзей, история жалоб</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">3. Как мы используем данные</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Собранные данные используются для:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Обеспечения работы Приложения и предоставления игровых функций</li>
          <li>Идентификации пользователя и управления аккаунтом</li>
          <li>Ведения игровой статистики и рейтингов</li>
          <li>Обеспечения безопасности и предотвращения мошенничества</li>
          <li>Рассмотрения жалоб и разрешения споров между игроками</li>
          <li>Улучшения качества Приложения и пользовательского опыта</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">4. Хранение и защита данных</h2>
        <p className="text-muted-foreground leading-relaxed">
          Мы принимаем все необходимые организационные и технические меры для защиты персональных данных от несанкционированного доступа, изменения, раскрытия или уничтожения. Данные хранятся на защищённых серверах с использованием шифрования. Пароли хранятся в хешированном виде и не могут быть восстановлены в исходном виде.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">5. Передача данных третьим лицам</h2>
        <p className="text-muted-foreground leading-relaxed">
          Мы не продаём, не обмениваем и не передаём ваши персональные данные третьим лицам, за исключением случаев, предусмотренных применимым законодательством, или когда это необходимо для предоставления услуг (например, хостинг-провайдеры, платёжные системы).
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">6. Права пользователя</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Вы имеете право:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Получить информацию о хранимых персональных данных</li>
          <li>Запросить исправление неточных данных</li>
          <li>Запросить удаление вашего аккаунта и всех связанных данных</li>
          <li>Отозвать согласие на обработку персональных данных</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">7. Данные несовершеннолетних</h2>
        <p className="text-muted-foreground leading-relaxed">
          Приложение не предназначено для детей младше 13 лет. Мы сознательно не собираем персональные данные детей младше 13 лет. Если вы обнаружили, что ребёнок предоставил нам свои данные, свяжитесь с нами для их удаления.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">8. Файлы cookie и аналитика</h2>
        <p className="text-muted-foreground leading-relaxed">
          Приложение использует сессионные cookie для поддержания авторизации. Мы можем использовать анонимную аналитику для улучшения качества обслуживания. Аналитические данные не содержат персональной информации.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">9. Изменения в Политике</h2>
        <p className="text-muted-foreground leading-relaxed">
          Мы оставляем за собой право вносить изменения в настоящую Политику конфиденциальности. При существенных изменениях мы уведомим пользователей через Приложение. Продолжение использования Приложения после внесения изменений означает ваше согласие с обновлённой Политикой.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">10. Контакты</h2>
        <p className="text-muted-foreground leading-relaxed">
          По всем вопросам, связанным с обработкой персональных данных, вы можете обратиться к нам через раздел «Связь с администрацией» в Приложении или по электронной почте:{' '}<a href="mailto:durakonlinefromkz@gmail.com" className="text-amber-400 hover:text-amber-300 underline">durakonlinefromkz@gmail.com</a>.
        </p>
      </section>
    </>
  );
}

function PrivacyContentUk() {
  return (
    <>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">1. Загальні положення</h2>
        <p className="text-muted-foreground leading-relaxed">
          Ця Політика конфіденційності визначає порядок обробки та захисту персональних даних користувачів мобільного додатку «Дурак онлайн from KZ» (далі — «Додаток»). Використовуючи Додаток, ви погоджуєтесь з умовами цієї Політики.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">2. Які дані ми збираємо</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          При використанні Додатку ми можемо збирати такі дані:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li><strong className="text-foreground">Дані акаунту:</strong> адреса електронної пошти, відображуване ім'я (нікнейм), аватар</li>
          <li><strong className="text-foreground">Ігрові дані:</strong> статистика ігор (перемоги, поразки), ігровий баланс (тенге), придбані предмети (аватарки, рамки, колоди, столи)</li>
          <li><strong className="text-foreground">Технічні дані:</strong> тип пристрою, версія операційної системи, IP-адреса, ідентифікатор сесії</li>
          <li><strong className="text-foreground">Дані взаємодії:</strong> список друзів, історія скарг</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">3. Як ми використовуємо дані</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Зібрані дані використовуються для:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Забезпечення роботи Додатку та надання ігрових функцій</li>
          <li>Ідентифікації користувача та управління акаунтом</li>
          <li>Ведення ігрової статистики та рейтингів</li>
          <li>Забезпечення безпеки та запобігання шахрайству</li>
          <li>Розгляду скарг та вирішення суперечок між гравцями</li>
          <li>Покращення якості Додатку та користувацького досвіду</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">4. Зберігання та захист даних</h2>
        <p className="text-muted-foreground leading-relaxed">
          Ми вживаємо всіх необхідних організаційних та технічних заходів для захисту персональних даних від несанкціонованого доступу, зміни, розкриття або знищення. Дані зберігаються на захищених серверах з використанням шифрування. Паролі зберігаються у хешованому вигляді та не можуть бути відновлені у вихідному вигляді.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">5. Передача даних третім особам</h2>
        <p className="text-muted-foreground leading-relaxed">
          Ми не продаємо, не обмінюємо та не передаємо ваші персональні дані третім особам, за винятком випадків, передбачених чинним законодавством, або коли це необхідно для надання послуг (наприклад, хостинг-провайдери, платіжні системи).
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">6. Права користувача</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Ви маєте право:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Отримати інформацію про збережені персональні дані</li>
          <li>Запросити виправлення неточних даних</li>
          <li>Запросити видалення вашого акаунту та всіх пов'язаних даних</li>
          <li>Відкликати згоду на обробку персональних даних</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">7. Дані неповнолітніх</h2>
        <p className="text-muted-foreground leading-relaxed">
          Додаток не призначений для дітей молодше 13 років. Ми свідомо не збираємо персональні дані дітей молодше 13 років. Якщо ви виявили, що дитина надала нам свої дані, зв'яжіться з нами для їх видалення.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">8. Файли cookie та аналітика</h2>
        <p className="text-muted-foreground leading-relaxed">
          Додаток використовує сесійні cookie для підтримки авторизації. Ми можемо використовувати анонімну аналітику для покращення якості обслуговування. Аналітичні дані не містять персональної інформації.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">9. Зміни в Політиці</h2>
        <p className="text-muted-foreground leading-relaxed">
          Ми залишаємо за собою право вносити зміни до цієї Політики конфіденційності. При суттєвих змінах ми повідомимо користувачів через Додаток. Продовження використання Додатку після внесення змін означає вашу згоду з оновленою Політикою.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">10. Контакти</h2>
        <p className="text-muted-foreground leading-relaxed">
          З усіх питань, пов'язаних з обробкою персональних даних, ви можете звернутися до нас через розділ «Зв'язок з адміністрацією» в Додатку або електронною поштою:{' '}<a href="mailto:durakonlinefromkz@gmail.com" className="text-amber-400 hover:text-amber-300 underline">durakonlinefromkz@gmail.com</a>.
        </p>
      </section>
    </>
  );
}

function PrivacyContentEn() {
  return (
    <>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">1. General Provisions</h2>
        <p className="text-muted-foreground leading-relaxed">
          This Privacy Policy defines the procedure for processing and protecting personal data of users of the mobile application «Durak Online from KZ» (hereinafter — the «Application»). By using the Application, you agree to the terms of this Policy.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">2. What Data We Collect</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          When using the Application, we may collect the following data:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li><strong className="text-foreground">Account data:</strong> email address, display name (nickname), avatar</li>
          <li><strong className="text-foreground">Game data:</strong> game statistics (wins, losses), game balance (tenge), purchased items (avatars, frames, card decks, tables)</li>
          <li><strong className="text-foreground">Technical data:</strong> device type, operating system version, IP address, session identifier</li>
          <li><strong className="text-foreground">Interaction data:</strong> friends list, complaint history</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">3. How We Use Data</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Collected data is used for:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Ensuring the Application operates and providing game features</li>
          <li>User identification and account management</li>
          <li>Maintaining game statistics and leaderboards</li>
          <li>Ensuring security and preventing fraud</li>
          <li>Reviewing complaints and resolving disputes between players</li>
          <li>Improving Application quality and user experience</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">4. Data Storage and Protection</h2>
        <p className="text-muted-foreground leading-relaxed">
          We take all necessary organizational and technical measures to protect personal data from unauthorized access, modification, disclosure, or destruction. Data is stored on secured servers using encryption. Passwords are stored in hashed form and cannot be restored to their original form.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">5. Transfer of Data to Third Parties</h2>
        <p className="text-muted-foreground leading-relaxed">
          We do not sell, exchange, or transfer your personal data to third parties, except as required by applicable law or when necessary to provide services (e.g., hosting providers, payment systems).
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">6. User Rights</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          You have the right to:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Obtain information about stored personal data</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and all associated data</li>
          <li>Withdraw consent to the processing of personal data</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">7. Data of Minors</h2>
        <p className="text-muted-foreground leading-relaxed">
          The Application is not intended for children under 13 years of age. We do not knowingly collect personal data from children under 13. If you discover that a child has provided us with their data, please contact us for its deletion.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">8. Cookies and Analytics</h2>
        <p className="text-muted-foreground leading-relaxed">
          The Application uses session cookies to maintain authorization. We may use anonymous analytics to improve service quality. Analytical data does not contain personal information.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">9. Changes to the Policy</h2>
        <p className="text-muted-foreground leading-relaxed">
          We reserve the right to make changes to this Privacy Policy. In case of significant changes, we will notify users through the Application. Continued use of the Application after changes are made constitutes your agreement with the updated Policy.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">10. Contact</h2>
        <p className="text-muted-foreground leading-relaxed">
          For all questions related to the processing of personal data, you can contact us through the «Contact Administration» section in the Application or by email:{' '}<a href="mailto:durakonlinefromkz@gmail.com" className="text-amber-400 hover:text-amber-300 underline">durakonlinefromkz@gmail.com</a>.
        </p>
      </section>
    </>
  );
}

function PrivacyContentKk() {
  return (
    <>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">1. Жалпы ережелер</h2>
        <p className="text-muted-foreground leading-relaxed">
          Осы Құпиялылық саясаты «Дурак онлайн from KZ» мобильді қосымшасының (бұдан әрі — «Қосымша») пайдаланушылардың жеке деректерін өңдеу және қорғау тәртібін анықтайды. Қосымшаны пайдалана отырып, сіз осы Саясаттың шарттарымен келісесіз.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">2. Қандай деректерді жинаймыз</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Қосымшаны пайдалану кезінде біз келесі деректерді жинай аламыз:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li><strong className="text-foreground">Аккаунт деректері:</strong> электрондық пошта мекенжайы, көрсетілетін аты (лақап аты), аватар</li>
          <li><strong className="text-foreground">Ойын деректері:</strong> ойын статистикасы (жеңістер, жеңілістер), ойын балансы (теңге), сатып алынған заттар (аватарлар, жақтаулар, карта десстері, үстелдер)</li>
          <li><strong className="text-foreground">Техникалық деректер:</strong> құрылғы түрі, операциялық жүйе нұсқасы, IP-мекенжай, сессия идентификаторы</li>
          <li><strong className="text-foreground">Өзара әрекеттесу деректері:</strong> достар тізімі, шағымдар тарихы</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">3. Деректерді қалай пайдаланамыз</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Жиналған деректер келесі мақсаттарда пайдаланылады:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Қосымшаның жұмысын қамтамасыз ету және ойын функцияларын ұсыну</li>
          <li>Пайдаланушыны сәйкестендіру және аккаунтты басқару</li>
          <li>Ойын статистикасы мен рейтингтерді жүргізу</li>
          <li>Қауіпсіздікті қамтамасыз ету және алаяқтықтың алдын алу</li>
          <li>Шағымдарды қарау және ойыншылар арасындағы дауларды шешу</li>
          <li>Қосымша сапасын және пайдаланушы тәжірибесін жақсарту</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">4. Деректерді сақтау және қорғау</h2>
        <p className="text-muted-foreground leading-relaxed">
          Біз дербес деректерді рұқсатсыз кіруден, өзгертуден, ашудан немесе жоюдан қорғау үшін барлық қажетті ұйымдастырушылық және техникалық шараларды қолданамыз. Деректер шифрлауды пайдалана отырып қорғалған серверлерде сақталады. Құпия сөздер хэштелген түрде сақталады және бастапқы түрінде қалпына келтірілмейді.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">5. Деректерді үшінші тараптарға беру</h2>
        <p className="text-muted-foreground leading-relaxed">
          Біз сіздің дербес деректеріңізді үшінші тараптарға сатпаймыз, алмастырмаймыз және бермейміз, қолданылатын заңнамамен көзделген жағдайларды немесе қызметтерді ұсыну үшін қажет болған жағдайларды (мысалы, хостинг-провайдерлер, төлем жүйелері) қоспағанда.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">6. Пайдаланушы құқықтары</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Сіздің құқықтарыңыз:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Сақталған дербес деректер туралы ақпарат алу</li>
          <li>Дәл емес деректерді түзетуді сұрау</li>
          <li>Аккаунтыңызды және барлық байланысты деректерді жоюды сұрау</li>
          <li>Дербес деректерді өңдеуге берілген келісімді кері қайтарып алу</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">7. Кәмелетке толмағандардың деректері</h2>
        <p className="text-muted-foreground leading-relaxed">
          Қосымша 13 жасқа толмаған балаларға арналмаған. Біз 13 жасқа толмаған балалардың дербес деректерін саналы түрде жинамаймыз. Егер бала бізге өз деректерін бергенін байқасаңыз, оларды жою үшін бізбен хабарласыңыз.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">8. Cookie файлдары және аналитика</h2>
        <p className="text-muted-foreground leading-relaxed">
          Қосымша авторизацияны қолдау үшін сессиялық cookie файлдарын пайдаланады. Біз қызмет көрсету сапасын жақсарту үшін анонимді аналитиканы пайдалана аламыз. Аналитикалық деректер жеке ақпаратты қамтымайды.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">9. Саясаттағы өзгерістер</h2>
        <p className="text-muted-foreground leading-relaxed">
          Біз осы Құпиялылық саясатына өзгерістер енгізу құқығын сақтаймыз. Маңызды өзгерістер болған жағдайда пайдаланушыларды Қосымша арқылы хабардар етеміз. Өзгерістер енгізілгеннен кейін Қосымшаны пайдалануды жалғастыру жаңартылған Саясатпен келісіміңізді білдіреді.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">10. Байланыс</h2>
        <p className="text-muted-foreground leading-relaxed">
          Дербес деректерді өңдеуге байланысты барлық сұрақтар бойынша Қосымшадағы «Администрациямен байланыс» бөлімі арқылы немесе электрондық пошта арқылы бізге хабарласа аласыз:{' '}<a href="mailto:durakonlinefromkz@gmail.com" className="text-amber-400 hover:text-amber-300 underline">durakonlinefromkz@gmail.com</a>.
        </p>
      </section>
    </>
  );
}

function PrivacyContentAz() {
  return (
    <>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">1. Ümumi müddəalar</h2>
        <p className="text-muted-foreground leading-relaxed">
          Bu Məxfilik Siyasəti (bundan sonra — «Siyasət») «Durak Online from KZ» mobil tətbiqinin (bundan sonra — «Tətbiq») istifadəçilərinin şəxsi məlumatlarının toplanması, istifadəsi və qorunması qaydalarını müəyyən edir. Tətbiqdən istifadə etməklə siz bu Siyasətin şərtlərinə razılıq verirsiniz.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">2. Hansı məlumatları toplayırıq</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Tətbiqdən istifadə zamanı aşağıdakı məlumatlar toplanıla bilər:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li><strong className="text-foreground">Hesab məlumatları:</strong> e-poçt ünvanı, görünən ad (ləqəb), avatar</li>
          <li><strong className="text-foreground">Oyun məlumatları:</strong> statistika (qalibiyyət, məğlubiyyət), oyun balansı (tenge), alınmış əşyalar (avatarlar, çərçivələr, kart dəstləri, masalar)</li>
          <li><strong className="text-foreground">Texniki məlumatlar:</strong> cihaz növü, əməliyyat sisteminin versiyası, IP-ünvan, sessiya identifikatoru</li>
          <li><strong className="text-foreground">Qarşılıqlı əlaqə məlumatları:</strong> dostlar siyahısı, şikayətlər tarixi</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">3. Məlumatların istifadəsi</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Toplanan məlumatlar aşağıdakı məqsədlər üçün istifadə olunur:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Tətbiqin funksionallığını və oyun imkanlarını təmin etmək</li>
          <li>İstifadəçinin identifikasiyası və hesabın idarə edilməsi</li>
          <li>Oyun statistikasının və liderler cədvəlinin aparılması</li>
          <li>Təhlükəsizliyin təmin edilməsi və fırıldaqçılığın qarşısının alınması</li>
          <li>Şikayətlərin baxılması və oyunçular arasındakı mübahisələrin həlli</li>
          <li>Tətbiqin keyfiyyətinin və istifadəçi təcrübəsinin yaxşılaşdırılması</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">4. Məlumatların saxlanması və qorunması</h2>
        <p className="text-muted-foreground leading-relaxed">
          Biz şəxsi məlumatların icazəsiz girişdən, dəyişdirilməsindən, açıqlanmasından və ya məhv edilməsindən qorunması üçün bütün lazımi təşkilati və texniki tədbirləri görürük. Məlumatlar şifrələmə ilə qorunan serverlərdə saxlanılır. Parollar hash edilmiş formada saxlanılır.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">5. Məlumatların üçüncü tərəflərə ötürülməsi</h2>
        <p className="text-muted-foreground leading-relaxed">
          Biz qanunvericiliyin tələb etdiyi hallar və ya xidmətin göstərilməsi üçün zəruri olan hallar (məs., hosting provayderləri, ödəniş sistemləri) istisna olmaqla, şəxsi məlumatlarınızı üçüncü tərəflərə satmır, dəyişmir və ötürmürük.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">6. İstifadəçinin hüquqları</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Sizin aşağıdakı hüquqlarınız var:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Saxlanılan şəxsi məlumatlar haqqında məlumat almaq</li>
          <li>Yanlış məlumatların düzəldilməsini tələb etmək</li>
          <li>Hesabınızın və bütün əlaqəli məlumatların silinməsini tələb etmək</li>
          <li>Şəxsi məlumatların işlənməsinə razılığı geri götürmək</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">7. Uşaqların məlumatları</h2>
        <p className="text-muted-foreground leading-relaxed">
          Tətbiq 13 yaşından kiçik uşaqlar üçün nəzərdə tutulmayıb. Biz bilərəkdən 13 yaşından kiçik uşaqların şəxsi məlumatlarını toplamırıq. Əgər uşağın bizə məlumat verdiyini öyrənsəniz, onları silmək üçün bizimlə əlaqə saxlayın.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">8. Kukilər və analitika</h2>
        <p className="text-muted-foreground leading-relaxed">
          Tətbiq avtorizasiyanı saxlamaq üçün sessiya kukilərindən istifadə edir. Xidmətin keyfiyyətini yaxşılaşdırmaq üçün anonim analitikadan istifadə edə bilərik. Analitik məlumatlar şəxsi məlumat ehtiva etmir.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">9. Siyasətin dəyişdirilməsi</h2>
        <p className="text-muted-foreground leading-relaxed">
          Biz bu Məxfilik Siyasətinə dəyişikliklər etmək hüququnu saxlayırıq. Əhəmiyyətli dəyişikliklər olduqda istifadəçilərə tətbiq vasitəsilə məlumat veriləcək. Dəyişikliklərdən sonra tətbiqdən istifadə yenilənmiş Siyasətin qəbul edilməsi deməkdir.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">10. Əlaqə</h2>
        <p className="text-muted-foreground leading-relaxed">
          Şəxsi məlumatların işlənməsi ilə bağlı bütün suallar üçün tətbiqin «Administrasiya ilə əlaqə» bölməsi vasitəsilə və ya e-poçt ünvanına müraciət edə bilərsiniz:{' '}<a href="mailto:durakonlinefromkz@gmail.com" className="text-amber-400 hover:text-amber-300 underline">durakonlinefromkz@gmail.com</a>.
        </p>
      </section>
    </>
  );
}

function PrivacyContentKa() {
  return (
    <>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">1. ზოგადი დებულებები</h2>
        <p className="text-muted-foreground leading-relaxed">
          წინამდებარე კონფიდენციალურობის პოლიტიკა (შემდგომ — «პოლიტიკა») განსაზღვრავს «Durak Online from KZ» მობილური აპლიკაციის (შემდგომ — «აპლიკაცია») მომხმარებელთა პერსონალური მონაცემების შეგროვების, გამოყენებისა და დაცვის წესებს.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">2. რა მონაცემებს ვაგროვებთ</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          აპლიკაციის გამოყენებისას შეიძლება შეგროვდეს შემდეგი მონაცემები:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li><strong className="text-foreground">ანგარიშის მონაცემები:</strong> ელ-ფოსტის მისამართი, სახელი (ნიქნეიმი), ავატარი</li>
          <li><strong className="text-foreground">სათამაშო მონაცემები:</strong> სტატისტიკა (გამარჯვება, წაგება), სათამაშო ბალანსი (ტენგე), შეძენილი ნივთები (ავატარები, ჩარჩოები, ბარათების კომპლექტები, მაგიდები)</li>
          <li><strong className="text-foreground">ტექნიკური მონაცემები:</strong> მოწყობილობის ტიპი, ოპერაციული სისტემის ვერსია, IP-მისამართი, სესიის იდენტიფიკატორი</li>
          <li><strong className="text-foreground">ინტერაქციის მონაცემები:</strong> მეგობრების სია, საჩივრების ისტორია</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">3. მონაცემების გამოყენება</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          შეგროვებული მონაცემები გამოიყენება:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>აპლიკაციის ფუნქციონირებისა და სათამაშო შესაძლებლობების უზრუნველსაყოფად</li>
          <li>მომხმარებლის იდენტიფიკაციისა და ანგარიშის მართვისთვის</li>
          <li>სათამაშო სტატისტიკისა და ლიდერბოარდის შენარჩუნებისთვის</li>
          <li>უსაფრთხოების უზრუნველყოფისა და თაღლითობის პრევენციისთვის</li>
          <li>საჩივრების განხილვისა და მოთამაშეებს შორის დავების გადაწყვეტისთვის</li>
          <li>აპლიკაციის ხარისხისა და მომხმარებლის გამოცდილების გასაუმჯობესებლად</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">4. მონაცემების შენახვა და დაცვა</h2>
        <p className="text-muted-foreground leading-relaxed">
          ჩვენ ვიღებთ ყველა საჭირო ორგანიზაციულ და ტექნიკურ ზომას პერსონალური მონაცემების არასანქცირებული წვდომის, შეცვლის, გამჟღავნებისა თუ განადგურებისგან დასაცავად. მონაცემები ინახება დაცულ სერვერებზე დაშიფვრის გამოყენებით. პაროლები ინახება ჰეშირებული სახით.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">5. მონაცემების გადაცემა მესამე პირებზე</h2>
        <p className="text-muted-foreground leading-relaxed">
          ჩვენ არ ვყიდით, არ ვცვლით და არ ვგზავნით თქვენს პერსონალურ მონაცემებს მესამე პირებზე, გარდა კანონმდებლობით გათვალისწინებული შემთხვევებისა ან სერვისის მიწოდებისათვის საჭირო შემთხვევებისა (მაგ., ჰოსტინგ-პროვაიდერები, გადახდის სისტემები).
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">6. მომხმარებლის უფლებები</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          თქვენ გაქვთ უფლება:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>მიიღოთ ინფორმაცია შენახული პერსონალური მონაცემების შესახებ</li>
          <li>მოითხოვოთ არასწორი მონაცემების გასწორება</li>
          <li>მოითხოვოთ თქვენი ანგარიშისა და ყველა დაკავშირებული მონაცემის წაშლა</li>
          <li>გააუქმოთ თანხმობა პერსონალური მონაცემების დამუშავებაზე</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">7. არასრულწლოვანთა მონაცემები</h2>
        <p className="text-muted-foreground leading-relaxed">
          აპლიკაცია არ არის განკუთვნილი 13 წლამდე ასაკის ბავშვებისთვის. ჩვენ შეგნებულად არ ვაგროვებთ 13 წლამდე ბავშვების პერსონალურ მონაცემებს. თუ გაიგეთ, რომ ბავშვმა მოგვაწოდა მონაცემები, გთხოვთ დაგვიკავშირდეთ მათი წასაშლელად.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">8. ქუქი-ფაილები და ანალიტიკა</h2>
        <p className="text-muted-foreground leading-relaxed">
          აპლიკაცია იყენებს სესიის ქუქი-ფაილებს ავტორიზაციის შესანარჩუნებლად. ჩვენ შეიძლება გამოვიყენოთ ანონიმური ანალიტიკა სერვისის ხარისხის გასაუმჯობესებლად. ანალიტიკური მონაცემები არ შეიცავს პერსონალურ ინფორმაციას.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">9. პოლიტიკის ცვლილებები</h2>
        <p className="text-muted-foreground leading-relaxed">
          ჩვენ ვიტოვებთ უფლებას შევიტანოთ ცვლილებები ამ კონფიდენციალურობის პოლიტიკაში. მნიშვნელოვანი ცვლილებების შემთხვევაში მომხმარებლებს ვაცნობებთ აპლიკაციის მეშვეობით. ცვლილებების შემდეგ აპლიკაციის გამოყენება ნიშნავს განახლებული პოლიტიკის მიღებას.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">10. კონტაქტი</h2>
        <p className="text-muted-foreground leading-relaxed">
          პერსონალური მონაცემების დამუშავებასთან დაკავშირებული ყველა კითხვისთვის შეგიძლიათ დაგვიკავშირდეთ აპლიკაციის «ადმინისტრაციასთან დაკავშირება» განყოფილების მეშვეობით ან ელ-ფოსტაზე:{' '}<a href="mailto:durakonlinefromkz@gmail.com" className="text-amber-400 hover:text-amber-300 underline">durakonlinefromkz@gmail.com</a>.
        </p>
      </section>
    </>
  );
}

function PrivacyContentUz() {
  return (
    <>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">1. Umumiy qoidalar</h2>
        <p className="text-muted-foreground leading-relaxed">
          Ushbu Maxfiylik Siyosati (keyingi oʻrinlarda — «Siyosat») «Durak Online from KZ» mobil ilovasi (keyingi oʻrinlarda — «Ilova») foydalanuvchilarining shaxsiy maʼlumotlarini yigʻish, foydalanish va himoya qilish tartibini belgilaydi. Ilovadan foydalanish orqali siz ushbu Siyosatning shartlariga rozilik bildirasiz.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">2. Qanday maʼlumotlar yigʻiladi</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Ilovadan foydalanish jarayonida quyidagi maʼlumotlar yigʻilishi mumkin:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li><strong className="text-foreground">Hisob maʼlumotlari:</strong> elektron pochta manzili, koʻrinadigan ism (taxallus), avatar</li>
          <li><strong className="text-foreground">Oʻyin maʼlumotlari:</strong> statistika (gʻalabalar, magʻlubiyatlar), oʻyin balansi (tenge), sotib olingan buyumlar (avatarlar, ramkalar, karta to'plamlari, stollar)</li>
          <li><strong className="text-foreground">Texnik maʼlumotlar:</strong> qurilma turi, operatsion tizim versiyasi, IP-manzil, sessiya identifikatori</li>
          <li><strong className="text-foreground">Oʻzaro aloqa maʼlumotlari:</strong> doʻstlar roʻyxati, shikoyatlar tarixi</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">3. Maʼlumotlardan foydalanish</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Yigʻilgan maʼlumotlar quyidagi maqsadlar uchun ishlatiladi:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Ilovaning funksionalligini va oʻyin imkoniyatlarini taʼminlash</li>
          <li>Foydalanuvchini identifikatsiya qilish va hisobni boshqarish</li>
          <li>Oʻyin statistikasi va liderlar jadvalini yuritish</li>
          <li>Xavfsizlikni taʼminlash va firibgarlikni oldini olish</li>
          <li>Shikoyatlarni koʻrib chiqish va oʻyinchilar oʻrtasidagi nizolarni hal qilish</li>
          <li>Ilova sifatini va foydalanuvchi tajribasini yaxshilash</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">4. Maʼlumotlarni saqlash va himoya qilish</h2>
        <p className="text-muted-foreground leading-relaxed">
          Biz shaxsiy maʼlumotlarni ruxsatsiz kirish, oʻzgartirish, oshkor qilish yoki yoʻq qilishdan himoya qilish uchun barcha zarur tashkiliy va texnik choralarni koʻramiz. Maʼlumotlar shifrlash bilan himoyalangan serverlarda saqlanadi. Parollar xeshlangan shaklda saqlanadi.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">5. Maʼlumotlarni uchinchi shaxslarga uzatish</h2>
        <p className="text-muted-foreground leading-relaxed">
          Biz qonun talabiga koʻra yoki xizmat koʻrsatish uchun zarur boʻlgan hollar (masalan, hosting provayderlari, toʻlov tizimlari) bundan mustasno, shaxsiy maʼlumotlaringizni uchinchi shaxslarga sotmaymiz, almashmaymiz va uzatmaymiz.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">6. Foydalanuvchi huquqlari</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Sizda quyidagi huquqlar mavjud:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Saqlangan shaxsiy maʼlumotlar haqida maʼlumot olish</li>
          <li>Notoʻgʻri maʼlumotlarni toʻgʻrilashni talab qilish</li>
          <li>Hisobingiz va barcha bogʻliq maʼlumotlarni oʻchirishni talab qilish</li>
          <li>Shaxsiy maʼlumotlarni qayta ishlashga rozilikni qaytarib olish</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">7. Bolalar maʼlumotlari</h2>
        <p className="text-muted-foreground leading-relaxed">
          Ilova 13 yoshdan kichik bolalar uchun moʻljallanmagan. Biz ataylab 13 yoshdan kichik bolalarning shaxsiy maʼlumotlarini yigʻmaymiz. Agar bola bizga maʼlumot berganini bilsangiz, ularni oʻchirish uchun biz bilan bogʻlaning.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">8. Cookie-fayllar va analitika</h2>
        <p className="text-muted-foreground leading-relaxed">
          Ilova avtorizatsiyani saqlash uchun sessiya cookie-fayllaridan foydalanadi. Xizmat sifatini yaxshilash uchun anonim analitikadan foydalanishimiz mumkin. Analitik maʼlumotlar shaxsiy maʼlumot oʻz ichiga olmaydi.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">9. Siyosatga oʻzgartirish kiritish</h2>
        <p className="text-muted-foreground leading-relaxed">
          Biz ushbu Maxfiylik Siyosatiga oʻzgartirish kiritish huquqini saqlaymiz. Muhim oʻzgartirishlar boʻlganda foydalanuvchilarga ilova orqali xabar beriladi. Oʻzgartirishlardan keyin ilovadan foydalanish yangilangan Siyosatni qabul qilish degan maʼnoni anglatadi.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">10. Aloqa</h2>
        <p className="text-muted-foreground leading-relaxed">
          Shaxsiy maʼlumotlarni qayta ishlash bilan bogʻliq barcha savollar uchun ilovaning «Administratsiya bilan bogʻlanish» boʻlimi orqali yoki elektron pochta manziliga murojaat qilishingiz mumkin:{' '}<a href="mailto:durakonlinefromkz@gmail.com" className="text-amber-400 hover:text-amber-300 underline">durakonlinefromkz@gmail.com</a>.
        </p>
      </section>
    </>
  );
}

function PrivacyContentPl() {
  return (
    <>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">1. Postanowienia ogólne</h2>
        <p className="text-muted-foreground leading-relaxed">
          Niniejsza Polityka prywatności określa zasady przetwarzania i ochrony danych osobowych użytkowników aplikacji mobilnej „Durak online from KZ" (dalej — „Aplikacja"). Korzystając z Aplikacji, wyrażasz zgodę na warunki niniejszej Polityki.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">2. Jakie dane zbieramy</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Podczas korzystania z Aplikacji możemy zbierać następujące dane:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li><strong className="text-foreground">Dane konta:</strong> adres e-mail, nazwa wyświetlana (pseudonim), awatar</li>
          <li><strong className="text-foreground">Dane gry:</strong> statystyki gier (wygrane, przegrane), saldo w grze (tenge), zakupione przedmioty (awatary, ramki, talie, stoły)</li>
          <li><strong className="text-foreground">Dane techniczne:</strong> typ urządzenia, wersja systemu operacyjnego, adres IP, identyfikator sesji</li>
          <li><strong className="text-foreground">Dane interakcji:</strong> lista znajomych, historia skarg</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">3. Jak wykorzystujemy dane</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Zebrane dane są wykorzystywane do:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Zapewnienia działania Aplikacji i świadczenia funkcji gry</li>
          <li>Identyfikacji użytkownika i zarządzania kontem</li>
          <li>Prowadzenia statystyk gry i rankingów</li>
          <li>Zapewnienia bezpieczeństwa i zapobiegania oszustwom</li>
          <li>Rozpatrywania skarg i rozwiązywania sporów między graczami</li>
          <li>Poprawy jakości Aplikacji i doświadczeń użytkownika</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">4. Przechowywanie i ochrona danych</h2>
        <p className="text-muted-foreground leading-relaxed">
          Podejmujemy wszelkie niezbędne środki organizacyjne i techniczne w celu ochrony danych osobowych przed nieautoryzowanym dostępem, zmianą, ujawnieniem lub zniszczeniem. Dane są przechowywane na zabezpieczonych serwerach z zastosowaniem szyfrowania. Hasła są przechowywane w postaci zaszyfrowanej i nie mogą być odtworzone w oryginalnej formie.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">5. Przekazywanie danych stronom trzecim</h2>
        <p className="text-muted-foreground leading-relaxed">
          Nie sprzedajemy, nie wymieniamy ani nie przekazujemy Twoich danych osobowych stronom trzecim, z wyjątkiem przypadków przewidzianych przez obowiązujące przepisy prawa lub gdy jest to niezbędne do świadczenia usług (np. dostawcy hostingu, systemy płatności).
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">6. Prawa użytkownika</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Masz prawo do:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Uzyskania informacji o przechowywanych danych osobowych</li>
          <li>Żądania poprawienia nieprawidłowych danych</li>
          <li>Żądania usunięcia konta i wszystkich powiązanych danych</li>
          <li>Wycofania zgody na przetwarzanie danych osobowych</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">7. Dane nieletnich</h2>
        <p className="text-muted-foreground leading-relaxed">
          Aplikacja nie jest przeznaczona dla dzieci poniżej 13 roku życia. Nie zbieramy świadomie danych osobowych dzieci poniżej 13 roku życia. Jeśli dowiesz się, że dziecko przekazało nam swoje dane, skontaktuj się z nami w celu ich usunięcia.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">8. Pliki cookie i analityka</h2>
        <p className="text-muted-foreground leading-relaxed">
          Aplikacja używa sesyjnych plików cookie do utrzymania autoryzacji. Możemy korzystać z anonimowej analityki w celu poprawy jakości usług. Dane analityczne nie zawierają danych osobowych.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">9. Zmiany Polityki</h2>
        <p className="text-muted-foreground leading-relaxed">
          Zastrzegamy sobie prawo do wprowadzania zmian w niniejszej Polityce prywatności. W przypadku istotnych zmian poinformujemy użytkowników za pośrednictwem Aplikacji. Dalsze korzystanie z Aplikacji po wprowadzeniu zmian oznacza akceptację zaktualizowanej Polityki.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-3">10. Kontakt</h2>
        <p className="text-muted-foreground leading-relaxed">
          W przypadku wszelkich pytań dotyczących przetwarzania danych osobowych możesz skontaktować się z nami przez sekcję „Kontakt z administracją" w Aplikacji lub pod adresem e-mail:{' '}<a href="mailto:durakonlinefromkz@gmail.com" className="text-amber-400 hover:text-amber-300 underline">durakonlinefromkz@gmail.com</a>.
        </p>
      </section>
    </>
  );
}
