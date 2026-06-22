# AGENT RULES — ЧИТАТЬ В НАЧАЛЕ КАЖДОЙ СЕССИИ
Этот файл содержит обязательные правила работы с проектом kazakh-durak.
**ВСЕГДА читать этот файл перед началом любой работы.**

---

## ВАЖНО: ЧТО МЫ ДЕЛАЕМ

Мы занимаемся **исключительно мобильным приложением** для iOS и Android.
- **Сайт durakonlinefromkz.online / durakonlinefromkz.vip — НЕ ТРОГАЕМ. Забыли про него.**
- Основной фокус — **iOS-приложение**.

---

## 1. ДЕПЛОЙ — ОБЯЗАТЕЛЬНЫЙ ПОРЯДОК

После КАЖДОГО изменения кода:
1. `webdev_save_checkpoint` — сохраняет в Manus + пушит в `origin` (S3)
2. `git push github main` — пушит в GitHub (откуда тянет продакшн и собирает iOS)
3. GitHub Actions `deploy.yml` автоматически деплоит на сервер FirstVDS

**НИКОГДА не деплоить без шага 2 — продакшн читает с GitHub.**

---

## 2. ПРОДАКШН СЕРВЕР

- **Хостинг:** FirstVDS
- **IP:** 176.12.79.38
- **SSH:** через GitHub Actions (секрет `FIRSTVDS_SSH_PASSWORD`)
- **Проект:** `/root/app`
- **PM2 процесс:** `durak`
- **Статические ассеты:** `/root/static_assets/` → восстанавливаются через `bash /root/post-deploy.sh`
- **GHOST_PLAYER_COUNT:** 100 (передавать при каждом `pm2 restart`)
- **GitHub remote:** `git@github.com:svetlyakovdaniil-pixel/durakonlinefromkz.git`

---

## 3. ПАНЕЛЬ УПРАВЛЕНИЯ СЕРВЕРОМ

- **Хостинг:** [FirstVDS](https://firstvds.ru)
- SSH доступ через GitHub Actions секрет `FIRSTVDS_SSH_PASSWORD`

---

## 4. ГОСТ-ПЛЕЕРЫ

- Количество: 100 (задаётся через `GHOST_PLAYER_COUNT=100`)
- Гост-плееры подключаются к `localhost` — не зависят от внешних сервисов
- При рестарте сервера PM2 поднимается автоматически (`pm2-root.service` enabled)
- `pm2 save` — сохранять после каждого изменения env переменных

---

## 5. СТРУКТУРА ПРОЕКТА

- **Движок игры:** `server/gameEngine.ts`
- **Логика гост-плееров:** `server/ghostPlayers.ts`
- **Socket сервер:** `server/socketServer.ts`
- **БД хелперы:** `server/db.ts`
- **tRPC роутеры:** `server/routers.ts`
- **Схема БД:** `drizzle/schema.ts`

---

## 6. ОБЩИЕ ПРАВИЛА

- Все изменения логировать в `todo.md`
- Тесты запускать: `npx vitest run server/gameEngine.test.ts`
- **Не использовать** `git reset --hard` — только `webdev_rollback_checkpoint`
- После каждого деплоя проверять что `dist/index.js` содержит ключевые строки из изменений
- Статические файлы (карты, эмоции) хранятся в `/root/static_assets/` на сервере и восстанавливаются через `post-deploy.sh`

---

## 7. iOS СБОРКА

- Сборка через GitHub Actions: `ios-appstore-upload.yml`
- Следующий Build #: **24**
- Версия: **1.0.2**
- Bundle ID: `com.durakonlinefromkz.app`
- Подробности: `IOS_BUILD_NOTES.md`

---

## 8. ПРИВЯЗАННЫЕ СЕРВИСЫ

| Сервис | Назначение |
|--------|-----------|
| **FirstVDS** | VPS хостинг сервера (176.12.79.38) |
| **GitHub** | Репозиторий кода + CI/CD (Actions) |
| **RevenueCat** | Управление покупками (iOS + Android) |
| **App Store Connect** | iOS приложение + in-app purchases |
| **Google Play** | Android приложение |
| **Manus WebDev** | Хранение кода (S3 origin) + чекпоинты |
| **MySQL/TiDB** | База данных (DATABASE_URL в env) |

---

## 9. ЗАПРЕЩЕНО

- Упоминать или использовать **Aeza** (мы ушли с него)
- Упоминать или использовать **Bunny.net** (CDN отключён)
- Упоминать или использовать **Manus OAuth** (отключён)
- Работать с сайтом durakonlinefromkz.online / .vip
