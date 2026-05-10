# iOS Build & Deploy Process

## Важно: Сборка iOS делается через GitHub Actions, НЕ через Xcode/MacBook

Для выпуска новой версии iOS-приложения нужно:

1. Убедиться что все изменения запушены в ветку `main` на GitHub
2. Зайти в браузере на:
   https://github.com/svetlyakovdaniil-pixel/durakonlinefromkz/actions/workflows/ios-appstore-upload.yml
3. Нажать кнопку **"Run workflow"** (справа вверху)
4. Заполнить поля:
   - **App version** — версия приложения (например `1.0.2`)
   - **Build number** — номер сборки (каждый раз увеличивать на 1; последняя успешная сборка была **19**, следующая **20**)
   - **Upload to App Store Connect** — оставить включённым
5. Нажать зелёную кнопку **"Run workflow"**
6. Сборка занимает ~4-5 минут
7. После успеха IPA автоматически загружается в TestFlight/App Store Connect

## История сборок

| Run # | Версия | Build # | Дата | Статус |
|-------|--------|---------|------|--------|
| #30   | 1.0.2  | 20      | 2026-05-10 | ✅ Success |
| #29   | 1.0.2  | 19      | 2026-05-01 | ✅ Success |
| #28   | 1.0.2  | ?       | 2026-05-01 | ❌ Failure |

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
- `AEZA_SSH_PRIVATE_KEY` — SSH ключ для деплоя на продакшн сервер

## Деплой сервера (автоматический)

Каждый push в ветку `main` автоматически деплоит изменения на сервер `185.221.199.177` через workflow `deploy.yml`.
