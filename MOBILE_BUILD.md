# Сборка мобильных приложений — iOS и Android

## Обзор

Приложение использует **Capacitor 6** для оборачивания веб-приложения в нативные iOS/Android оболочки.

- **App ID**: `online.durakonline.fromkz`
- **App Name**: `Дурак KZ`
- **Минимальный iOS**: 14.0
- **Минимальный Android SDK**: 22 (Android 5.1)

---

## Предварительные требования

| Инструмент | Версия | Платформа |
|---|---|---|
| Node.js | 22+ | Обе |
| pnpm | 9+ | Обе |
| Xcode | 15+ | macOS (iOS) |
| Android Studio | Hedgehog+ | Обе |
| Java JDK | 17+ | Android |
| CocoaPods | 1.14+ | iOS |

---

## Шаг 1: Настройка окружения

### 1.1 Установить зависимости

```bash
pnpm install
```

### 1.2 Настроить секреты (env vars)

Создайте `.env.local` или задайте через Manus Secrets:

```env
# AdMob (Google AdMob — https://admob.google.com)
VITE_ADMOB_IOS_APP_ID=ca-app-pub-XXXXXXXX~XXXXXXXX
VITE_ADMOB_ANDROID_APP_ID=ca-app-pub-XXXXXXXX~XXXXXXXX
VITE_ADMOB_REWARDED_AD_UNIT_ID=ca-app-pub-XXXXXXXX/XXXXXXXX

# RevenueCat (IAP — https://app.revenuecat.com)
VITE_REVENUECAT_IOS_KEY=appl_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_REVENUECAT_ANDROID_KEY=goog_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# RevenueCat Secret Key (server-side receipt verification — optional but recommended)
# Get from: https://app.revenuecat.com → Project → API Keys → Secret keys
REVENUECAT_SECRET_KEY=sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Тестовые ID для AdMob (только для разработки):**
- iOS App ID: `ca-app-pub-3940256099942544~1458002511`
- Android App ID: `ca-app-pub-3940256099942544~3347511713`
- Rewarded Unit (iOS): `ca-app-pub-3940256099942544/1712485313`
- Rewarded Unit (Android): `ca-app-pub-3940256099942544/5224354917`

---

## Шаг 2: Сборка веб-приложения

```bash
pnpm run build
```

Это создаст `dist/public/` — директорию, которую Capacitor упакует в нативное приложение.

---

## Шаг 3: Добавить нативные платформы (первый раз)

```bash
# Добавить iOS (требует macOS + Xcode)
npx cap add ios

# Добавить Android
npx cap add android
```

---

## Шаг 4: Синхронизировать веб-код с нативными проектами

После каждой сборки:

```bash
npx cap sync
```

Это копирует `dist/public/` в нативные проекты и обновляет плагины.

---

## Шаг 5: Настройка iOS

### 5.1 Открыть в Xcode

```bash
npx cap open ios
```

### 5.2 Обязательные настройки в Xcode

1. **Bundle Identifier**: `online.durakonline.fromkz`
2. **Signing**: выбрать Apple Developer Team
3. **Deployment Target**: iOS 14.0
4. **Capabilities**: добавить `In-App Purchase`

### 5.3 Info.plist — обязательные ключи

Добавить в `ios/App/App/Info.plist`:

```xml
<!-- AdMob: обязательно для iOS 14+ -->
<key>NSUserTrackingUsageDescription</key>
<string>Мы используем данные для показа персонализированной рекламы и поддержки бесплатного приложения.</string>

<!-- AdMob App ID -->
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXXXXXXX~XXXXXXXX</string>

<!-- SKAdNetwork для атрибуции рекламы -->
<key>SKAdNetworkItems</key>
<array>
  <dict>
    <key>SKAdNetworkIdentifier</key>
    <string>cstr6suwn9.skadnetwork</string>
  </dict>
</array>
```

### 5.4 Иконки приложения

Иконка уже сгенерирована (1024×1024 PNG, без прозрачности):

https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/app-icon-1024-2KWTBFRezkbwDxeAeoxNR5.png

Скачайте и добавьте через Xcode → Assets.xcassets → AppIcon.

### 5.5 Splash Screen

Сплэш уже сгенерирован (2048×2048 PNG):

https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/splash-screen-2732-Fgq82zxGSYXgiPu4SpJooF.png

Скачайте и добавьте в `ios/App/App/Assets.xcassets/Splash.imageset/`.

---

## Шаг 6: Настройка Android

### 6.1 Открыть в Android Studio

```bash
npx cap open android
```

### 6.2 AndroidManifest.xml — обязательные ключи

Добавить в `android/app/src/main/AndroidManifest.xml` внутри `<application>`:

```xml
<!-- AdMob App ID -->
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXXXX~XXXXXXXX"/>
```

### 6.3 build.gradle — версии SDK

В `android/app/build.gradle`:

```gradle
android {
    compileSdkVersion 34
    defaultConfig {
        applicationId "online.durakonline.fromkz"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

### 6.4 Иконки приложения

Используйте ту же иконку (1024×1024, Android Studio сам масштабирует):

https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/app-icon-1024-2KWTBFRezkbwDxeAeoxNR5.png

Добавьте через Android Studio → Resource Manager → Image Asset.

### 6.5 Splash Screen

Используйте сгенерированный сплэш:

https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/splash-screen-2732-Fgq82zxGSYXgiPu4SpJooF.png

Добавьте в `android/app/src/main/res/drawable/splash.png`.

---

## Шаг 7: Сборка для публикации

### iOS (App Store)

1. В Xcode: Product → Archive
2. Distribute App → App Store Connect
3. Загрузить на [App Store Connect](https://appstoreconnect.apple.com)

### Android (Google Play)

#### 7.1 Создание Keystore (ОБЯЗАТЕЛЬНО — сделать один раз)

> ⚠️ **Keystore нельзя потерять!** Без него невозможно обновить приложение в Google Play.
> Храните файл `.jks` и пароли в надёжном месте (password manager, encrypted backup).

```bash
# Создать keystore (выполнить один раз)
keytool -genkey -v \
  -keystore android/app/durak-kz-release.jks \
  -alias durak-kz \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Durak KZ, OU=Mobile, O=DurakOnline, L=Almaty, ST=Almaty, C=KZ"
```

#### 7.2 Настройка signing в build.gradle

Откройте `android/app/build.gradle` и добавьте блок `signingConfigs`:

```groovy
android {
    signingConfigs {
        release {
            storeFile file('durak-kz-release.jks')
            storePassword System.getenv('ANDROID_STORE_PASSWORD') ?: 'YOUR_STORE_PASSWORD'
            keyAlias 'durak-kz'
            keyPassword System.getenv('ANDROID_KEY_PASSWORD') ?: 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 7.3 Сборка подписанного AAB

```bash
# В Android Studio: Build → Generate Signed Bundle/APK
# Выбрать Android App Bundle (.aab) для Play Store
```

Или через командную строку:

```bash
cd android
export ANDROID_STORE_PASSWORD=YOUR_STORE_PASSWORD
export ANDROID_KEY_PASSWORD=YOUR_KEY_PASSWORD
./gradlew bundleRelease
```

AAB файл: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Шаг 8: Требования App Store / Google Play

### App Store (Apple)

- [ ] Apple Developer Program ($99/год)
- [ ] Privacy Policy URL: `https://durakonlinefromkz.online/privacy`
- [ ] Terms of Service URL: `https://durakonlinefromkz.online/terms`
- [ ] Скриншоты: iPhone 6.7", 6.5", iPad 12.9"
- [ ] Описание на русском/английском
- [ ] Возрастной рейтинг: 4+ (карточная игра без насилия)
- [ ] In-App Purchase настроен через App Store Connect

### Google Play

- [ ] Google Play Developer Account ($25 единоразово)
- [ ] Privacy Policy URL: `https://durakonlinefromkz.online/privacy`
- [ ] Скриншоты: телефон + планшет
- [ ] Описание на русском/английском
- [ ] Возрастной рейтинг: PEGI 3 / Everyone
- [ ] In-App Purchase настроен через Play Console

---

## Шаг 9: RevenueCat настройка

1. Создать аккаунт на [app.revenuecat.com](https://app.revenuecat.com)
2. Создать проект `kazakh-durak`
3. Добавить iOS App и Android App
4. Создать продукты:
   - `tenge_100` — 100 Тенге
   - `tenge_500` — 500 Тенге
   - `tenge_1000` — 1000 Тенге
   - `tenge_5000` — 5000 Тенге
5. Скопировать API ключи в env vars
6. (Опционально) Скопировать **Secret Key** (не публичный) в `REVENUECAT_SECRET_KEY` для серверной валидации чеков через `/api/iap/verify`

---

## Шаг 10: Проверочный список перед публикацией

- [ ] `pnpm run build` — 0 ошибок
- [ ] `npx cap sync` — без ошибок
- [ ] Тестирование на реальном устройстве iOS
- [ ] Тестирование на реальном устройстве Android
- [ ] IAP работает в тестовом режиме (Sandbox)
- [ ] AdMob показывает тестовые объявления
- [ ] Haptics работают на iOS и Android
- [ ] Safe area корректна на iPhone с notch и Dynamic Island
- [ ] WebSocket соединение стабильно (WSS)
- [ ] Privacy Policy доступна по URL
- [ ] Terms of Service доступна по URL

---

## Полезные команды

```bash
# Сборка + синхронизация (после изменений)
pnpm run build && npx cap sync

# Запуск на iOS симуляторе
npx cap run ios

# Запуск на Android эмуляторе
npx cap run android

# Проверка установленных плагинов
npx cap ls

# Обновление Capacitor
npx cap update
```

---

## Поддержка

- Документация Capacitor: https://capacitorjs.com/docs
- AdMob плагин: https://github.com/capacitor-community/admob
- RevenueCat Capacitor: https://www.revenuecat.com/docs/getting-started/installation/capacitor

---

## Asset Bundling for Mobile (Cards & Tables)

All card and table images (84 files, ~260MB) are stored in `/home/ubuntu/webdev-static-assets/card-table-assets/` on the build machine.

For web deployment, images are served via `/manus-storage/` CDN paths (already configured in `shared/cardAssets.ts`).

For iOS/Android builds, copy the assets into the Capacitor directories before building:

```bash
# Copy assets for iOS build
mkdir -p ios/App/App/public/assets/static
cp /home/ubuntu/webdev-static-assets/card-table-assets/* ios/App/App/public/assets/static/

# Copy assets for Android build  
mkdir -p android/app/src/main/assets/public/assets/static
cp /home/ubuntu/webdev-static-assets/card-table-assets/* android/app/src/main/assets/public/assets/static/

# Then run Capacitor sync
npx cap sync ios
npx cap sync android
```

These directories are in `.gitignore` to prevent deployment timeouts.
