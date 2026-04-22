# iOS Build Guide — без Mac, через GitHub Actions

Это пошаговое руководство позволяет собрать и опубликовать iOS-приложение **без Mac**.
Всё происходит автоматически в облаке (GitHub Actions на macOS-сервере).

---

## Что нужно иметь

| Что | Где получить |
|---|---|
| Apple Developer аккаунт ($99/год) | [developer.apple.com](https://developer.apple.com) |
| iPhone для тестирования | Уже есть |
| GitHub аккаунт | [github.com](https://github.com) |

---

## Шаг 1 — Создать приложение в App Store Connect

1. Открыть [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **Мои приложения** → **+** → **Новое приложение**
3. Заполнить:
   - **Платформы**: iOS
   - **Название**: Дурак Онлайн — Казахстан (или как хотите)
   - **Основной язык**: Русский
   - **Bundle ID**: `online.durakonline.fromkz`
   - **SKU**: `durakonline-kz-ios`
4. Нажать **Создать**

---

## Шаг 2 — Создать API-ключ App Store Connect

Этот ключ нужен Fastlane для загрузки сборок в TestFlight.

1. В App Store Connect → **Пользователи и доступ** → **Ключи** → **+**
2. Имя: `GitHub Actions CI`
3. Доступ: **Менеджер**
4. Нажать **Создать**
5. Скачать `.p8` файл (скачивается только один раз!)
6. Запомнить:
   - **Key ID** (10 символов, например `ABCD123456`)
   - **Issuer ID** (UUID, например `69a6de7e-...`)

Конвертировать `.p8` в base64:
```bash
# На любом компьютере / в терминале iPhone (через a-Shell app)
base64 -i AuthKey_ABCD123456.p8 | tr -d '\n'
```
Сохранить результат — это значение `APPLE_KEY_CONTENT`.

---

## Шаг 3 — Создать сертификат Distribution и Provisioning Profile

### 3.1 Создать Certificate Signing Request (CSR)

На iPhone через приложение **a-Shell** (бесплатно в App Store):
```bash
# Установить openssl если нет
pkg install openssl

# Создать приватный ключ и CSR
openssl genrsa -out distribution.key 2048
openssl req -new -key distribution.key -out distribution.csr \
  -subj "/CN=online.durakonline.fromkz/O=Your Name/C=KZ"
```

### 3.2 Создать Distribution Certificate

1. [developer.apple.com](https://developer.apple.com) → **Certificates** → **+**
2. Выбрать **Apple Distribution**
3. Загрузить `distribution.csr`
4. Скачать `distribution.cer`

### 3.3 Создать .p12 файл

```bash
# Конвертировать .cer в .pem
openssl x509 -in distribution.cer -inform DER -out distribution.pem

# Создать .p12 (придумать пароль, например "mypassword123")
openssl pkcs12 -export \
  -inkey distribution.key \
  -in distribution.pem \
  -out distribution.p12 \
  -passout pass:mypassword123
```

Конвертировать в base64:
```bash
base64 -i distribution.p12 | tr -d '\n'
```
Сохранить — это значение `BUILD_CERTIFICATE_BASE64`.

### 3.4 Создать Provisioning Profile

1. [developer.apple.com](https://developer.apple.com) → **Profiles** → **+**
2. Выбрать **App Store Connect**
3. App ID: `online.durakonline.fromkz`
4. Certificate: выбрать только что созданный
5. Имя профиля: `DurakKZ AppStore Distribution`
6. Скачать `DurakKZ_AppStore_Distribution.mobileprovision`

Конвертировать в base64:
```bash
base64 -i DurakKZ_AppStore_Distribution.mobileprovision | tr -d '\n'
```
Сохранить — это значение `BUILD_PROVISION_PROFILE_BASE64`.

---

## Шаг 4 — Добавить секреты в GitHub

1. Открыть репозиторий на GitHub
2. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Добавить следующие секреты:

| Имя секрета | Значение |
|---|---|
| `BUNDLE_IDENTIFIER` | `online.durakonline.fromkz` |
| `APPLE_ID` | Ваш Apple ID email |
| `APP_STORE_CONNECT_TEAM_ID` | Team ID из developer.apple.com → Account → Membership |
| `APPLE_KEY_ID` | Key ID из Шага 2 (например `ABCD123456`) |
| `APPLE_ISSUER_ID` | Issuer ID из Шага 2 (UUID) |
| `APPLE_KEY_CONTENT` | base64 из `.p8` файла (Шаг 2) |
| `BUILD_CERTIFICATE_BASE64` | base64 из `.p12` файла (Шаг 3.3) |
| `P12_PASSWORD` | Пароль от `.p12` (например `mypassword123`) |
| `BUILD_PROVISION_PROFILE_BASE64` | base64 из `.mobileprovision` (Шаг 3.4) |
| `APPLE_PROFILE_NAME` | `DurakKZ AppStore Distribution` |
| `VITE_APP_ID` | Из Manus Secrets |
| `VITE_OAUTH_PORTAL_URL` | Из Manus Secrets |
| `VITE_ADMOB_IOS_APP_ID` | Из Manus Secrets |
| `VITE_ADMOB_REWARDED_AD_UNIT_ID` | Из Manus Secrets |
| `VITE_REVENUECAT_IOS_KEY` | Из Manus Secrets |
| `VITE_FRONTEND_FORGE_API_KEY` | Из Manus Secrets |
| `VITE_FRONTEND_FORGE_API_URL` | Из Manus Secrets |
| `BUILT_IN_FORGE_API_URL` | Из Manus Secrets |
| `BUILT_IN_FORGE_API_KEY` | Из Manus Secrets |

---

## Шаг 5 — Запустить сборку

### Вариант A: Автоматически при создании тега

```bash
git tag v1.0.0
git push origin v1.0.0
```

### Вариант B: Вручную через GitHub UI

1. GitHub → **Actions** → **Build iOS & Upload to TestFlight**
2. **Run workflow** → **Run workflow**

Сборка занимает ~20-30 минут. После завершения:
- `.ipa` файл будет доступен в **Artifacts** (раздел Actions)
- Сборка автоматически загрузится в **TestFlight**

---

## Шаг 6 — Установить на iPhone через TestFlight

1. Установить приложение **TestFlight** из App Store
2. В App Store Connect → **TestFlight** → выбрать сборку → добавить себя как тестировщика
3. Принять приглашение на email → открыть в TestFlight → установить

---

## Шаг 7 — Отправить на проверку в App Store

1. В App Store Connect → **Моё приложение** → **Подготовить к отправке**
2. Заполнить:
   - Скриншоты (iPhone 6.7", 6.5", iPad 12.9" — обязательно)
   - Описание, ключевые слова
   - Возрастной рейтинг (4+)
   - Политика конфиденциальности: `https://durakonlinefromkz.online/privacy`
3. Выбрать сборку из TestFlight
4. **Отправить на проверку**

Проверка Apple занимает 1-3 рабочих дня.

---

## Частые вопросы

**Q: Где взять a-Shell для iPhone?**
A: App Store → поиск "a-Shell" (бесплатно). Альтернатива — использовать любой Linux/Windows компьютер или онлайн-сервис [base64encode.org](https://www.base64encode.org) для конвертации файлов.

**Q: Сколько стоит GitHub Actions?**
A: Для публичных репозиториев — бесплатно. Для приватных — $0.08/мин на macOS runner. Одна сборка ~20 мин = ~$1.6.

**Q: Можно ли тестировать без TestFlight?**
A: Нет, для установки на iPhone нужен либо TestFlight, либо Mac с Xcode. TestFlight — самый простой способ.

**Q: Что делать если сборка упала?**
A: GitHub → Actions → выбрать упавший workflow → скачать артефакт `build-logs` → прислать мне лог ошибки.
