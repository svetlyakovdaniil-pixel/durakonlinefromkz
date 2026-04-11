# Развёртывание на Railway.app

Код проекта загружен в GitHub: https://github.com/svetlyakovdaniil-pixel/durakonlinefromkz-railway

## Шаг 1: Создать проект на Railway

1. Перейди на https://railway.app
2. Нажми **"New Project"** (или "Create Project")
3. Выбери **"Deploy from GitHub"**
4. Авторизуйся с GitHub и разреши доступ Railway к репозиториям
5. Выбери репозиторий **`durakonlinefromkz-railway`**
6. Нажми **"Deploy"**

Railway автоматически обнаружит `package.json` и создаст Node.js сервис.

## Шаг 2: Добавить PostgreSQL базу данных

1. В Railway проекте нажми **"Add"** (+ кнопка)
2. Выбери **"Database"** → **"PostgreSQL"**
3. Railway создаст новый сервис PostgreSQL
4. Переменная `DATABASE_URL` автоматически добавится в Node.js сервис

## Шаг 3: Настроить переменные окружения

В Railway проекте:
1. Нажми на **Node.js сервис** (или "Variables")
2. Нажми **"Add Variable"** и добавь:

### Обязательные переменные:

| Переменная | Значение | Описание |
|---|---|---|
| `NODE_ENV` | `production` | Окружение |
| `JWT_SECRET` | `your-secret-key-here` | Любая длинная случайная строка (32+ символа) |
| `DATABASE_URL` | *(автоматически от PostgreSQL)* | Строка подключения к БД |

### Опциональные (для Google Sign-In):

| Переменная | Значение |
|---|---|
| `VITE_OAUTH_PORTAL_URL` | URL твоего Manus OAuth (если используется) |
| `BUILT_IN_FORGE_API_URL` | Manus API URL (если используется) |
| `BUILT_IN_FORGE_API_KEY` | Manus API ключ (если используется) |

**Где найти эти значения?**
- `JWT_SECRET` — сгенерируй сам (например, используя `openssl rand -hex 32`)
- Остальные — из твоего Manus проекта (Settings → Secrets)

## Шаг 4: Запустить миграции БД

После первого деплоя нужно создать таблицы в БД:

1. В Railway проекте нажми на **Node.js сервис**
2. Перейди в **"Deployments"** → последний деплой
3. Нажми **"View Logs"** и проверь, что сервис запустился без ошибок

Если сервис работает, миграции должны запуститься автоматически при старте (если настроено в `package.json`).

**Если нужно запустить вручную:**
```bash
# Локально (если есть доступ к Railway БД)
DATABASE_URL="postgresql://..." pnpm db:push
```

## Шаг 5: Проверить, что всё работает

1. Railway выдаст публичный домен (например: `https://durakonlinefromkz-railway.up.railway.app`)
2. Открой этот домен в браузере
3. Проверь:
   - ✅ Лендинг загружается
   - ✅ Можешь зарегистрироваться / войти
   - ✅ Можешь создать комнату и играть

## Шаг 6: Настроить Google Sign-In (если используется)

Если используешь Google Sign-In через Firebase:

1. Перейди в Firebase Console → твой проект
2. Settings → "Authorized domains"
3. Добавь домен Railway: `durakonlinefromkz-railway.up.railway.app`
4. Сохрани

Теперь Google Sign-In будет работать на Railway.

## Шаг 7: Настроить автодеплой (опционально)

Railway автоматически деплоит при `git push` в `main` ветку. Если хочешь отключить:

1. Railway проект → Settings
2. "Auto-deploy" → отключи если нужно

## Проблемы и решения

### Ошибка: "Cannot find module"
- Убедись, что `pnpm-lock.yaml` загружен в GitHub
- Railway использует `pnpm` автоматически

### Ошибка: "Database connection failed"
- Проверь, что PostgreSQL сервис создан и работает
- Убедись, что `DATABASE_URL` правильно установлена

### Ошибка: "Port already in use"
- Railway автоматически выбирает порт из переменной `PORT`
- Убедись, что сервер слушает на `process.env.PORT || 3000`

### Медленное соединение / частые разрывы
- Railway обычно стабильнее, чем Manus
- Если проблемы остаются, проверь логи в Railway Dashboard

## Полезные ссылки

- Railway Docs: https://docs.railway.app
- Railway Dashboard: https://railway.app/dashboard
- GitHub Repo: https://github.com/svetlyakovdaniil-pixel/durakonlinefromkz-railway

---

**Нужна помощь?** Напиши, какой шаг не понял или какая ошибка возникла.
