/**
 * PrivacyPage — полноэкранная страница политики конфиденциальности.
 * Открывается как route /privacy. Кнопка «Назад» возвращает на предыдущую страницу.
 */
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function PrivacyPage({ backPath = '/' }: { backPath?: string }) {
  const [, navigate] = useLocation();
  const { locale } = useTranslation();

  const headingCls = "text-base font-bold text-amber-200 mb-2 mt-4 first:mt-0";
  const textCls = "text-amber-100/70 leading-relaxed text-sm";
  const listCls = "list-disc pl-5 text-amber-100/70 space-y-1 text-sm";

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
          {locale === 'kk' ? 'Құпиялылық саясаты' : locale === 'en' ? 'Privacy Policy' : 'Политика конфиденциальности'}
        </h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
        {locale === 'kk' ? (
          <>
            <section><h2 className={headingCls}>1. Жалпы ережелер</h2><p className={textCls}>Осы Құпиялылық саясаты «Дурак онлайн from KZ» мобильді қосымшасы пайдаланушыларының жеке деректерін өңдеу және қорғау тәртібін белгілейді. Қосымшаны пайдалана отырып, сіз осы Саясаттың шарттарымен келісесіз.</p></section>
            <section><h2 className={headingCls}>2. Біз қандай деректер жинаймыз</h2><ul className={listCls}><li>Аккаунт деректері: электрондық пошта, лақап ат, аватар</li><li>Ойын деректері: статистика, баланс, сатып алынған заттар</li><li>Техникалық деректер: құрылғы түрі, ОЖ нұсқасы, IP-мекенжай</li><li>Өзара әрекет деректері: достар тізімі, шағымдар тарихы</li></ul></section>
            <section><h2 className={headingCls}>3. Деректерді пайдалану</h2><p className={textCls}>Жиналған деректер қосымшаның жұмысын қамтамасыз ету, пайдаланушыны сәйкестендіру, ойын статистикасын жүргізу және қауіпсіздікті қамтамасыз ету үшін пайдаланылады.</p></section>
            <section><h2 className={headingCls}>4. Деректерді сақтау және қорғау</h2><p className={textCls}>Деректер шифрлаумен қорғалған серверлерде сақталады. Рұқсатсыз қол жеткізуден қорғау үшін барлық қажетті шаралар қолданылады.</p></section>
            <section><h2 className={headingCls}>5. Үшінші тараптарға деректер беру</h2><p className={textCls}>Біз жеке деректерді үшінші тараптарға сатпаймыз, алмастырмаймыз немесе бермейміз, заңда белгіленген жағдайлардан немесе қызметтер көрсету үшін қажет болған жағдайлардан басқа.</p></section>
            <section><h2 className={headingCls}>6. Пайдаланушы құқықтары</h2><ul className={listCls}><li>Сақталған жеке деректер туралы ақпарат алу</li><li>Дұрыс емес деректерді түзетуді сұрау</li><li>Аккаунтыңызды және барлық байланысты деректерді жоюды сұрау</li><li>Жеке деректерді өңдеуге берілген келісімді кері қайтарып алу</li></ul></section>
            <section><h2 className={headingCls}>7. Кәмелетке толмағандардың деректері</h2><p className={textCls}>Қосымша 13 жасқа толмаған балаларға арналмаған. Егер бала деректерін берген болса, оларды жою үшін бізге хабарласыңыз.</p></section>
            <section><h2 className={headingCls}>8. Байланыс</h2><p className={textCls}>Жеке деректерді өңдеуге қатысты мәселелер бойынша: <a href="mailto:durakonlinefromkz@gmail.com" className="text-amber-400 underline">durakonlinefromkz@gmail.com</a></p></section>
          </>
        ) : locale === 'en' ? (
          <>
            <section><h2 className={headingCls}>1. General Provisions</h2><p className={textCls}>This Privacy Policy defines the procedure for processing and protecting personal data of users of the "Durak Online from KZ" mobile application. By using the Application, you agree to the terms of this Policy.</p></section>
            <section><h2 className={headingCls}>2. Data We Collect</h2><ul className={listCls}><li>Account data: email address, display name (nickname), avatar</li><li>Game data: game statistics (wins, losses), game balance (tenge), purchased items</li><li>Technical data: device type, OS version, IP address, session ID</li><li>Interaction data: friends list, complaint history</li></ul></section>
            <section><h2 className={headingCls}>3. How We Use Data</h2><p className={textCls}>Collected data is used to ensure the Application's operation, identify users, maintain game statistics and ratings, ensure security, and improve the Application.</p></section>
            <section><h2 className={headingCls}>4. Data Storage and Protection</h2><p className={textCls}>We take all necessary measures to protect personal data from unauthorized access. Data is stored on secure servers using encryption.</p></section>
            <section><h2 className={headingCls}>5. Third-Party Data Sharing</h2><p className={textCls}>We do not sell, trade, or transfer your personal data to third parties, except as required by law or necessary for providing services.</p></section>
            <section><h2 className={headingCls}>6. User Rights</h2><ul className={listCls}><li>Obtain information about stored personal data</li><li>Request correction of inaccurate data</li><li>Request deletion of your account and all related data</li><li>Withdraw consent for personal data processing</li></ul></section>
            <section><h2 className={headingCls}>7. Children's Data</h2><p className={textCls}>The Application is not intended for children under 13. If you discover a child has provided us their data, contact us for deletion.</p></section>
            <section><h2 className={headingCls}>8. Contact</h2><p className={textCls}>For questions about personal data processing: <a href="mailto:durakonlinefromkz@gmail.com" className="text-amber-400 underline">durakonlinefromkz@gmail.com</a></p></section>
          </>
        ) : (
          <>
            <section><h2 className={headingCls}>1. Общие положения</h2><p className={textCls}>Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей мобильного приложения «Дурак онлайн from KZ». Используя Приложение, вы соглашаетесь с условиями данной Политики.</p></section>
            <section><h2 className={headingCls}>2. Какие данные мы собираем</h2><ul className={listCls}><li><strong>Данные аккаунта:</strong> адрес электронной почты, отображаемое имя (никнейм), аватар</li><li><strong>Игровые данные:</strong> статистика игр (победы, поражения), игровой баланс (тенге), приобретённые предметы</li><li><strong>Технические данные:</strong> тип устройства, версия операционной системы, IP-адрес, идентификатор сессии</li><li><strong>Данные взаимодействия:</strong> список друзей, история жалоб</li></ul></section>
            <section><h2 className={headingCls}>3. Как мы используем данные</h2><ul className={listCls}><li>Обеспечения работы Приложения и предоставления игровых функций</li><li>Идентификации пользователя и управления аккаунтом</li><li>Ведения игровой статистики и рейтингов</li><li>Обеспечения безопасности и предотвращения мошенничества</li><li>Улучшения качества Приложения и пользовательского опыта</li></ul></section>
            <section><h2 className={headingCls}>4. Хранение и защита данных</h2><p className={textCls}>Мы принимаем все необходимые меры для защиты персональных данных от несанкционированного доступа. Данные хранятся на защищённых серверах с использованием шифрования.</p></section>
            <section><h2 className={headingCls}>5. Передача данных третьим лицам</h2><p className={textCls}>Мы не продаём, не обмениваем и не передаём ваши персональные данные третьим лицам, за исключением случаев, предусмотренных применимым законодательством или необходимых для предоставления услуг.</p></section>
            <section><h2 className={headingCls}>6. Права пользователя</h2><ul className={listCls}><li>Получить информацию о хранимых персональных данных</li><li>Запросить исправление неточных данных</li><li>Запросить удаление вашего аккаунта и всех связанных данных</li><li>Отозвать согласие на обработку персональных данных</li></ul></section>
            <section><h2 className={headingCls}>7. Данные несовершеннолетних</h2><p className={textCls}>Приложение не предназначено для детей младше 13 лет. Если вы обнаружили, что ребёнок предоставил нам свои данные, свяжитесь с нами для их удаления.</p></section>
            <section><h2 className={headingCls}>8. Файлы cookie и аналитика</h2><p className={textCls}>Приложение использует сессионные cookie для поддержания авторизации. Мы можем использовать анонимную аналитику для улучшения качества обслуживания.</p></section>
            <section><h2 className={headingCls}>9. Изменения в Политике</h2><p className={textCls}>Мы оставляем за собой право вносить изменения в настоящую Политику конфиденциальности. Продолжение использования Приложения после внесения изменений означает ваше согласие с обновлённой Политикой.</p></section>
            <section><h2 className={headingCls}>10. Контакты</h2><p className={textCls}>По всем вопросам: <a href="mailto:durakonlinefromkz@gmail.com" className="text-amber-400 underline">durakonlinefromkz@gmail.com</a></p></section>
          </>
        )}
      </div>
    </div>
  );
}
