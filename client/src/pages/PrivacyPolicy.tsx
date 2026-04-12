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
          {locale === 'kk' ? <PrivacyContentKk /> : <PrivacyContentRu />}
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
