# CodePush OTA Updates Setup Guide

CodePush позволяет обновлять приложение без публикации в App Store и Google Play.

## 1. Создание AppCenter аккаунта

1. Перейди на https://appcenter.ms
2. Зарегистрируйся через GitHub, Microsoft или Google
3. Создай новую организацию (если нужна)

## 2. Создание приложений в AppCenter

### Для iOS:
1. Нажми "Add app"
2. Выбери "Durak Online KZ" (или своё имя)
3. Выбери платформу "iOS"
4. Выбери OS "iOS"
5. Скопируй **Deployment Key** для Production

### Для Android:
1. Повтори то же самое для Android
2. Скопируй **Deployment Key** для Production

## 3. Сохранение ключей

Добавь ключи в переменные окружения:

```bash
export CODEPUSH_IOS_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export CODEPUSH_ANDROID_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Или в `.env` файл (НЕ коммитить в git):

```
CODEPUSH_IOS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CODEPUSH_ANDROID_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 4. Установка CodePush CLI

```bash
npm install -g code-push-cli
# или
pnpm add -g code-push-cli
```

## 5. Логин в CodePush

```bash
code-push login
```

Откроется браузер, где нужно авторизоваться.

## 6. Публикация обновления

После изменения кода:

```bash
# Собрать приложение
pnpm build

# Опубликовать для iOS
code-push release-react durak-online-kz-ios ios --deploymentName Production

# Опубликовать для Android
code-push release-react durak-online-kz-android android --deploymentName Production

# Или оба сразу
code-push release-react durak-online-kz-ios ios && code-push release-react durak-online-kz-android android
```

## 7. Проверка статуса

```bash
# Список всех релизов
code-push deployment ls durak-online-kz-ios

# Статус конкретного релиза
code-push deployment history durak-online-kz-ios Production
```

## 8. Откат обновления

Если что-то сломалось:

```bash
code-push rollback durak-online-kz-ios Production
```

## Как это работает

1. Пользователь открывает приложение
2. CodePush проверяет наличие обновлений на сервере
3. Если обновление доступно:
   - Опциональное обновление → диалог "Установить?"
   - Обязательное обновление → диалог "Требуется обновление"
4. Обновление скачивается в фоне
5. При перезагрузке приложения применяется новый код

## Ограничения CodePush

✅ Можно обновлять:
- JavaScript код
- CSS стили
- Изображения
- Конфигурацию

❌ Нельзя обновлять:
- Нативный код (Java/Kotlin для Android, Swift/Objective-C для iOS)
- Capacitor плагины
- Зависимости (npm packages)
- Конфигурацию AndroidManifest.xml или Info.plist

Для этого нужна новая версия в App Store / Google Play.

## Размер обновления

- Максимальный размер: 50 MB
- Рекомендуемый размер: < 10 MB

Если обновление больше — нужна новая версия в магазинах.
