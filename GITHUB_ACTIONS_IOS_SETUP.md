# GitHub Actions iOS Build — Инструкция по настройке

GitHub Actions workflow уже готов (`.github/workflows/ios-build.yml`).  
Нужно только добавить 5 секретов в GitHub репозиторий.

---

## Шаг 1 — Открыть настройки секретов

Перейти по ссылке:  
**https://github.com/svetlyakovdaniil-pixel/durakonlinefromkz/settings/secrets/actions**

Нажать **"New repository secret"** для каждого из секретов ниже.

---

## Шаг 2 — Добавить секреты

### Секрет 1: `IOS_BUNDLE_ID`
**Значение:** `com.durakonlinefromkz.app`

---

### Секрет 2: `IOS_TEAM_ID`
**Значение:** ваш Apple Developer Team ID

**Где найти:**
1. Открыть https://developer.apple.com/account
2. Войти в аккаунт
3. Перейти в **Membership details**
4. Скопировать **Team ID** (10 символов, например `AB12CD34EF`)

---

### Секрет 3: `APPLE_APP_SPECIFIC_PASSWORD`
**Значение:** пароль приложения для Apple ID `brbpubg@gmail.com`

**Как создать:**
1. Открыть https://appleid.apple.com
2. Войти под `brbpubg@gmail.com`
3. Перейти в **Sign-In and Security → App-Specific Passwords**
4. Нажать **+** → ввести имя "GitHub Actions"
5. Скопировать пароль (формат: `xxxx-xxxx-xxxx-xxxx`)

---

### Секрет 4: `IOS_DISTRIBUTION_CERT_P12`
**Значение:** Distribution сертификат в формате base64

**Как получить:**
1. Открыть https://developer.apple.com/account/resources/certificates/list
2. Найти сертификат **"Apple Distribution"** (или создать новый)
3. Скачать `.cer` файл
4. Открыть его в Keychain Access (на Mac) → экспортировать как `.p12`

**Если нет Mac** — можно создать через браузер:
1. На https://developer.apple.com → Certificates → **+**
2. Выбрать **Apple Distribution**
3. Создать CSR через https://csrgen.com или аналогичный сервис
4. Загрузить CSR → скачать `.cer`
5. Конвертировать в p12: написать мне, помогу через скрипт

**Конвертация в base64 (на Mac):**
```bash
base64 -i YourCert.p12 | pbcopy
```

---

### Секрет 5: `IOS_DISTRIBUTION_CERT_PASSWORD`
**Значение:** пароль от `.p12` файла (тот что вы задали при экспорте)

---

### Секрет 6: `IOS_PROVISIONING_PROFILE`
**Значение:** Provisioning Profile в формате base64

**Как получить:**
1. Открыть https://developer.apple.com/account/resources/profiles/list
2. Найти профиль для `com.durakonlinefromkz.app` с типом **App Store**
3. Скачать `.mobileprovision` файл
4. Конвертировать в base64:
```bash
base64 -i YourProfile.mobileprovision | pbcopy
```

**Если профиля нет** — создать:
1. Certificates → Profiles → **+**
2. Выбрать **App Store Connect**
3. Выбрать App ID `com.durakonlinefromkz.app`
4. Выбрать Distribution сертификат
5. Назвать: `DurakOnlineKZ AppStore Distribution`
6. Скачать и конвертировать в base64

---

## Шаг 3 — Запустить сборку

После добавления всех секретов:

1. Открыть: https://github.com/svetlyakovdaniil-pixel/durakonlinefromkz/actions
2. Выбрать workflow **"iOS Build & App Store Upload"**
3. Нажать **"Run workflow"** → **"Run workflow"**
4. Дождаться завершения (~30-40 минут)
5. Если успешно — IPA автоматически загрузится в App Store Connect

---

## Что делает workflow автоматически

1. Устанавливает зависимости (`pnpm install`)
2. Собирает веб-приложение (`pnpm run build`)
3. Запускает `npx cap add ios` + `npx cap sync ios` (генерирует Xcode проект)
4. Устанавливает CocoaPods зависимости
5. Импортирует Distribution сертификат
6. Устанавливает Provisioning Profile
7. Собирает архив через `xcodebuild archive`
8. Экспортирует `.ipa`
9. Загружает в App Store Connect через `xcrun altool`
10. Сохраняет `.ipa` как артефакт (доступен 30 дней)

---

## Если нет Mac для создания сертификата

Напишите мне — помогу создать CSR и сертификат через скрипт на Linux.
