# iOS Build Instructions — App Store Resubmission

## Что изменилось

Исправлены два нарушения App Store:

- **2.1(a) Performance — Apple Login unresponsive**: добавлен `durak://` URL scheme в `Info.plist`, теперь iOS перехватывает callback и возвращает управление в приложение
- **4.0 Design — login opens external browser**: вход теперь открывается через `SFSafariViewController` внутри приложения (через `@capacitor/browser`), а не в Safari

---

## Шаги на Mac

### 1. Получить последние изменения

```bash
cd kazakh-durak
git pull origin main
```

### 2. Установить зависимости

```bash
pnpm install
```

### 3. Собрать веб-приложение

```bash
pnpm run build
```

### 4. Синхронизировать с iOS

```bash
npx cap sync ios
```

Эта команда:
- Копирует собранные файлы в `ios/App/App/public/`
- Обновляет `Info.plist` с новым URL scheme `durak://`
- Устанавливает CocoaPods зависимости (`@capacitor/browser`, `@capacitor/app`)

### 5. Открыть в Xcode

```bash
npx cap open ios
```

### 6. Проверить в Xcode

Убедитесь что в `Info.plist` есть URL scheme `durak`:
- Открыть `App/App/Info.plist`
- Найти `CFBundleURLTypes`
- Должны быть два элемента: `google-sign-in` и `durak-oauth-callback`

### 7. Увеличить версию сборки

В Xcode: `General → Build` — увеличить номер (например с 2 до 3)

### 8. Архивировать и загрузить

`Product → Archive → Distribute App → App Store Connect`

---

## Тестирование перед отправкой

1. Запустить на реальном устройстве (не симуляторе)
2. Нажать "Войти через Google" — должен открыться SFSafariViewController внутри приложения
3. Войти через Google — приложение должно вернуться на главный экран
4. Нажать "Войти через Apple" — аналогично
5. Проверить на iPad (ревьюер тестировал на iPad Air M3)

---

## Технические детали

### Поток авторизации (новый)

```
Пользователь нажимает "Войти" 
  → Browser.open(url, 'popover')  ← SFSafariViewController
  → Google/Apple OAuth
  → Сервер: redirect durak://auth/success?token=JWT
  → iOS перехватывает durak:// URL scheme
  → App.addListener('appUrlOpen') срабатывает
  → Browser.close()
  → POST /api/auth/native/session { token }
  → Сессионная cookie установлена
  → window.location.href = '/'
```

### Новые файлы/изменения

- `client/src/pages/Login.tsx` — использует `@capacitor/browser` и `@capacitor/app`
- `ios/App/App/Info.plist` — добавлен URL scheme `durak://`
- `android/app/src/main/AndroidManifest.xml` — добавлен intent-filter для `durak://`
- `server/googleAuth.ts` — поддержка `native=true` в state, redirect на `durak://`
- `server/appleAuth.ts` — поддержка `native=true` в state, redirect на `durak://`
- `server/_core/index.ts` — добавлен `/api/auth/native/session` endpoint
