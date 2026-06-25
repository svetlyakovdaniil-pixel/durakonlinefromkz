# iOS Build & Deploy Process

## Важно: Сборка iOS делается через GitHub Actions, НЕ через Xcode/MacBook

Для выпуска новой версии iOS-приложения нужно:

1. Убедиться что все изменения запушены в ветку `main` на GitHub
2. Зайти в браузере на:
   https://github.com/svetlyakovdaniil-pixel/durakonlinefromkz/actions/workflows/ios-appstore-upload.yml
3. Нажать кнопку **"Run workflow"** (справа вверху)
4. Заполнить поля:
   - **App version** — версия приложения (см. таблицу ниже для актуальной версии)
   - **Build number** — **ОБЯЗАТЕЛЬНО** взять из таблицы ниже (последний успешный + 1)
   - **Upload to App Store Connect** — оставить включённым
5. Нажать зелёную кнопку **"Run workflow"**
6. Сборка занимает ~4-5 минут
7. После успеха IPA автоматически загружается в TestFlight/App Store Connect

## ⚠️ Правила нумерации Build Number

- **Build number в App Store Connect НИКОГДА не может уменьшаться** — Apple отклонит сборку
- Последняя успешная загрузка: **1.0.44 (Build 47)** — Run #44
- **Следующий Build # = 50**
- **Следующая версия = 1.0.47** (или выше)
- Если сборка упала — всё равно увеличивай Build # на 1 (упавший номер уже "занят")

## История сборок

| Run # | Версия | Build # | Дата | Статус | Примечание |
|-------|--------|---------|------|--------|------------|
| #47   | 1.0.47 | 53      | 2026-06-25 | ⏳ In Progress | Переделаны Sheet → модальные окна (ProfileDrawer, FriendsDrawer, LeaderboardDrawer, SettingsSheet) |
| #46   | 1.0.46 | 49      | 2026-06-24 | ⏳ Pending | Fix: IAP/AdMob детальные ошибки, PRODUCT_NOT_AVAILABLE, AdMob failReason |
| #45   | 1.0.45 | 48      | 2026-06-24 | ✅ Success | Fix: IAP premium verify URL для native, AdMob кнопка всегда активна на native |
| #44   | 1.0.44 | 47      | 2026-06-24 | ✅ Success | Все исправления: ассеты, цена $1.99, AdMob, без лимита рекламы (6m 23s) |
| #43   | 1.0.44 | 46      | 2026-06-23 | ✅ Success | Загружен в TestFlight (8m 20s) |
| #42   | 1.0.44 | 45      | 2026-06-23 | ❌ FAILED | FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED |
| #41   | 1.0.2  | 24      | 2026-06-22 | ✅ Загружен | Build 24 < 44, Apple отклонила |
| #40   | 1.0.43 | 44      | 2026-05-12 | ✅ Success | Последняя принятая Apple |
| #38   | 1.0.43 | 43      | 2026-05-12 | ✅ Success | |
| #36   | 1.0.43 | 42      | 2026-05-11 | ✅ Success | |
| #34   | 1.0.43 | 41      | 2026-05-10 | ✅ Success | |
| #33   | 1.0.43 | 40      | 2026-05-10 | ✅ Success | |
| #32   | 1.0.43 | 39      | 2026-05-10 | ✅ Success | |
| #31   | 1.0.2  | 23      | 2026-05-12 | ⏳ Pending | |
| #30   | 1.0.2  | 22      | 2026-05-10 | ✅ Success | |
| #29   | 1.0.2  | 19      | 2026-05-01 | ✅ Success | |

## Важно: Всегда использовать ios-appstore-upload.yml

- `ios-appstore-upload.yml` — **основной workflow для ручного релиза** (используй его)
- `ios-build.yml` — автоматические сборки при пуше в main (не для релиза)
- Self-hosted runner (`MacBook-Pro-An`) часто офлайн — **никогда не полагаться на него**

## Что делает workflow

1. Checkout кода из ветки `main`
2. Устанавливает зависимости (pnpm, CocoaPods)
3. Собирает веб-часть (`pnpm build`)
4. Копирует билд в iOS (`npx cap sync ios`)
5. Устанавливает сертификаты и provisioning profile из GitHub Secrets
6. Собирает `.xcarchive` через `xcodebuild`
7. Экспортирует `.ipa`
8. Загружает в App Store Connect через Fastlane

## GitHub Secrets (уже настроены)

- `IOS_CERTIFICATE_BASE64` — сертификат подписи
- `IOS_CERTIFICATE_PASSWORD` — пароль сертификата
- `IOS_PROVISIONING_PROFILE_BASE64` — provisioning profile
- `IOS_TEAM_ID` — Apple Team ID
- `IOS_BUNDLE_ID` — Bundle ID приложения
- `APP_STORE_CONNECT_API_KEY_ID` — ключ App Store Connect API
- `APP_STORE_CONNECT_ISSUER_ID` — Issuer ID
- `APP_STORE_CONNECT_API_KEY_CONTENT` — содержимое .p8 ключа
- `IOS_APP_APPLE_ID` — Apple ID приложения в App Store Connect
- `FIRSTVDS_SSH_PASSWORD` — пароль для деплоя на продакшн сервер (FirstVDS)

## Деплой сервера (автоматический)

Каждый push в ветку `main` автоматически деплоит изменения на сервер FirstVDS (`176.12.79.38`) через workflow `deploy.yml`.
