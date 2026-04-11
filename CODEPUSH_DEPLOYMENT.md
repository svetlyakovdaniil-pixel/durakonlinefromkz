# CodePush Deployment Guide

Полное руководство по развертыванию OTA обновлений для Казахский Дурак Онлайн.

## Содержание

1. [Быстрый старт](#быстрый-старт)
2. [Подробная настройка](#подробная-настройка)
3. [Развертывание обновлений](#развертывание-обновлений)
4. [Мониторинг и откат](#мониторинг-и-откат)
5. [Решение проблем](#решение-проблем)

## Быстрый старт

### Предварительные требования

```bash
# 1. Установить CodePush CLI глобально
npm install -g code-push-cli
# или
pnpm add -g code-push-cli

# 2. Авторизоваться в CodePush
code-push login
```

### Развертывание обновления

```bash
# Собрать приложение и развернуть на обе платформы
pnpm codepush:deploy

# Или развернуть отдельно
pnpm codepush:ios    # Только iOS
pnpm codepush:android # Только Android
```

### Проверка статуса

```bash
# Посмотреть историю развертываний
pnpm codepush:status

# Откатить последнее обновление (если что-то сломалось)
pnpm codepush:rollback:ios
pnpm codepush:rollback:android
```

## Подробная настройка

### 1. Создание AppCenter аккаунта

1. Перейди на https://appcenter.ms
2. Зарегистрируйся (GitHub, Microsoft или Google)
3. Создай организацию (опционально)

### 2. Создание приложений

#### iOS приложение

1. Нажми "Add app"
2. Заполни:
   - **App name**: `durak-online-kz-ios`
   - **Platform**: iOS
   - **OS**: iOS
3. После создания скопируй **Deployment Key** для Production

#### Android приложение

1. Повтори то же самое
2. **App name**: `durak-online-kz-android`
3. **Platform**: Android
4. Скопируй **Deployment Key** для Production

### 3. Сохранение ключей

Добавь переменные окружения:

```bash
# .env файл (НЕ коммитить в git!)
CODEPUSH_IOS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CODEPUSH_ANDROID_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Или в систему:

```bash
export CODEPUSH_IOS_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export CODEPUSH_ANDROID_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 4. Проверка конфигурации

```bash
# Проверить, что ключи загружены
echo $CODEPUSH_IOS_KEY
echo $CODEPUSH_ANDROID_KEY

# Проверить конфигурацию в приложении
cat codepush.config.ts
```

## Развертывание обновлений

### Процесс развертывания

1. **Внеси изменения в код**
   ```bash
   # Отредактируй файлы
   git add .
   git commit -m "Fix: улучшение UI"
   ```

2. **Собери приложение**
   ```bash
   pnpm build
   ```

3. **Развернись на обе платформы**
   ```bash
   pnpm codepush:deploy
   ```

4. **Проверь статус**
   ```bash
   pnpm codepush:status
   ```

### Развертывание отдельно для каждой платформы

```bash
# Только для iOS
pnpm codepush:ios

# Только для Android
pnpm codepush:android

# С описанием обновления
code-push release-react durak-online-kz-ios ios --deploymentName Production -d "Исправлена ошибка с картами"
```

### Развертывание с опциями

```bash
# Обязательное обновление (пользователь не может отложить)
code-push release-react durak-online-kz-ios ios --deploymentName Production -m

# Только для определённой версии
code-push release-react durak-online-kz-ios ios --deploymentName Production --targetBinaryVersion "1.0.0"

# С описанием и обязательностью
code-push release-react durak-online-kz-ios ios --deploymentName Production -m -d "Критическое исправление"
```

## Мониторинг и откат

### Просмотр истории развертываний

```bash
# Полная история iOS
code-push deployment history durak-online-kz-ios Production

# Полная история Android
code-push deployment history durak-online-kz-android Production

# Компактный вид
pnpm codepush:status
```

### Откат обновления

Если обновление вызвало проблемы:

```bash
# Откатить iOS
pnpm codepush:rollback:ios

# Откатить Android
pnpm codepush:rollback:android

# Откатить обе платформы
pnpm codepush:rollback:ios && pnpm codepush:rollback:android
```

### Проверка активных версий

```bash
# Посмотреть, какие версии активны
code-push deployment ls durak-online-kz-ios
code-push deployment ls durak-online-kz-android
```

## Решение проблем

### Проблема: "Deployment not found"

```bash
# Решение: Проверить имя приложения
code-push app ls

# Должны быть:
# - durak-online-kz-ios
# - durak-online-kz-android
```

### Проблема: "Invalid deployment key"

```bash
# Решение: Проверить переменные окружения
echo $CODEPUSH_IOS_KEY
echo $CODEPUSH_ANDROID_KEY

# Если пусто, добавить в .env и перезагрузить терминал
```

### Проблема: "Build failed"

```bash
# Решение: Очистить и пересобрать
rm -rf dist/
pnpm build

# Проверить ошибки
pnpm test
```

### Проблема: Обновление не применяется на устройстве

1. **Проверить, что приложение использует CodePush**
   - Убедиться, что `useCodePush` hook используется в App.tsx
   - Проверить консоль браузера на ошибки

2. **Проверить, что ключи правильные**
   ```bash
   # В приложении должны быть правильные ключи
   console.log('[CodePush] iOS Key:', codePushConfig.iosDeploymentKey);
   console.log('[CodePush] Android Key:', codePushConfig.androidDeploymentKey);
   ```

3. **Проверить, что обновление активно**
   ```bash
   code-push deployment history durak-online-kz-ios Production
   # Должно быть "Active: true"
   ```

4. **Перезагрузить приложение**
   - Закрыть приложение полностью
   - Открыть заново
   - CodePush проверяет обновления при запуске

## Что можно обновлять через CodePush

✅ **Можно обновлять:**
- JavaScript код
- CSS стили
- Изображения (если они в dist/)
- Конфигурацию
- Шрифты

❌ **Нельзя обновлять:**
- Нативный код (Java/Kotlin, Swift/Objective-C)
- Capacitor плагины
- npm зависимости
- AndroidManifest.xml или Info.plist
- Иконки приложения

Для этого нужна новая версия в App Store / Google Play.

## Размеры обновлений

- **Максимум**: 50 MB
- **Рекомендуется**: < 10 MB

Если обновление больше 50 MB, нужно:
1. Оптимизировать код (tree-shaking, минификация)
2. Сжать изображения
3. Разделить на несколько обновлений
4. Если не помогает - выпустить новую версию в магазинах

## Частота проверки обновлений

По умолчанию CodePush проверяет обновления:
- При запуске приложения
- Каждые 6 часов (если приложение открыто)

Это можно изменить в `codepush.config.ts`:

```typescript
checkFrequency: 6 * 60 * 60 * 1000, // 6 часов
```

## Лучшие практики

1. **Тестируй перед развертыванием**
   ```bash
   pnpm test
   pnpm build
   ```

2. **Используй описания обновлений**
   ```bash
   code-push release-react durak-online-kz-ios ios -d "Исправлена ошибка с отключением"
   ```

3. **Развертывай критические исправления как обязательные**
   ```bash
   code-push release-react durak-online-kz-ios ios -m -d "Критическое исправление"
   ```

4. **Проверяй статус после развертывания**
   ```bash
   pnpm codepush:status
   ```

5. **Будь готов откатить**
   ```bash
   pnpm codepush:rollback:ios
   ```

## Мониторинг в продакшене

Рекомендуется:
1. Отслеживать ошибки в приложении (Sentry, LogRocket)
2. Проверять статус развертываний регулярно
3. Иметь план отката для критических обновлений
4. Документировать все развертывания

## Дополнительные ресурсы

- [AppCenter Documentation](https://docs.microsoft.com/en-us/appcenter/)
- [CodePush CLI Reference](https://github.com/microsoft/code-push/tree/master/cli)
- [React Native CodePush](https://github.com/microsoft/react-native-code-push)
- [Capacitor CodePush Plugin](https://github.com/microsoft/capacitor-codepush)
