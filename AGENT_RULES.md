# AGENT RULES — ЧИТАТЬ В НАЧАЛЕ КАЖДОЙ СЕССИИ

Этот файл содержит обязательные правила работы с проектом kazakh-durak.
**ВСЕГДА читать этот файл перед началом любой работы.**

---

## 1. ДЕПЛОЙ — ОБЯЗАТЕЛЬНЫЙ ПОРЯДОК

После КАЖДОГО изменения кода:
1. `webdev_save_checkpoint` — сохраняет в Manus + пушит в `origin` (S3)
2. `git push user_github main` — пушит в GitHub (откуда тянет продакшн)
3. SSH на продакшн: `cd /root/app && git pull origin main && pnpm build && bash /root/post-deploy.sh && GHOST_PLAYER_COUNT=100 pm2 restart durak --update-env`

**НИКОГДА не деплоить без шага 2 — продакшн читает с GitHub, не с Manus S3.**

---

## 2. ПРОДАКШН СЕРВЕР

- **IP:** 185.221.199.177
- **SSH:** `sshpass -p '8RQyO9x2qJ62' ssh -o StrictHostKeyChecking=no root@185.221.199.177`
- **Проект:** `/root/app`
- **PM2 процесс:** `durak`
- **Статические ассеты:** `/root/static_assets/` → восстанавливаются через `bash /root/post-deploy.sh`
- **GHOST_PLAYER_COUNT:** 100 (передавать при каждом `pm2 restart`)
- **GitHub remote:** `git@github.com:svetlyakovdaniil-pixel/durakonlinefromkz.git`

---

## 3. ПАНЕЛЬ УПРАВЛЕНИЯ СЕРВЕРОМ

- **URL:** https://my.aeza.net
- **Логин:** svetlyakovdaniil@gmail.com
- **Пароль:** 557767923233557767Qq, (с запятой!)
- Для жёсткого перезапуска ВМ — использовать кнопку Reboot в панели

---

## 4. ГОСТ-ПЛЕЕРЫ

- Количество: 100 (задаётся через `GHOST_PLAYER_COUNT=100`)
- Гост-плееры подключаются к `localhost` — не зависят от CDN/прокси
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

## 7. CDN / ПРОКСИ

- Сайт работает через **Bunny.net** (CDN/прокси)
- Домен: **durakonlinefromkz.online**
- Nginx слушает порт 80/443, проксирует на Node.js порт 3000
- Гост-плееры подключаются напрямую к localhost:3000 — CDN не влияет на них
