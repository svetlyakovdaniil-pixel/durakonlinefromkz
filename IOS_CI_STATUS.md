# iOS CI/CD — Статус задачи (продолжить завтра)

## Цель
Настроить GitHub Actions workflow для автоматической сборки и загрузки DurakOnlineKZ в App Store Connect через self-hosted Mac runner.

---

## Репозиторий
- **GitHub:** https://github.com/svetlyakovdaniil-pixel/durakonlinefromkz
- **Workflow файл:** `.github/workflows/ios-build.yml`
- **Ветка:** `main`

## Mac Runner — характеристики
- **Пользователь:** `yan`
- **Путь runner'а:** `/Users/yan/actions-runner/`
- **macOS:** 15.6.1
- **Архитектура:** x86_64 (Intel)
- **Ruby (системный):** 2.6.10p210 (системный macOS Ruby)
- **Homebrew:** НЕ установлен (пользователь `yan` не является администратором — нет sudo для установки brew)
- **rbenv:** установлен (через предыдущие попытки)
- **Ruby 3.3.6 через rbenv:** НЕ компилируется (psych/libyaml проблема)

---

## Что было сделано (runs #79–#87)

| Run | Проблема | Решение |
|-----|----------|---------|
| #79 | `gem install` permission denied | Добавили `sudo` |
| #80 | `brew: command not found` (exit 127) | Добавили полный путь к brew |
| #81 | `brew: command not found` снова | Добавили оба пути `/opt/homebrew` и `/usr/local` |
| #82 | `ruby/setup-ruby@v1` → `EACCES: mkdir /Users/runner` | Заменили на ручной rbenv |
| #83 | Ruby BUILD FAILED: `psych` не компилируется (нет libyaml) | Добавили `--without-ext=psych` |
| #84 | Homebrew не установлен, sudo не работает | Убрали зависимость от brew |
| #85 | Ruby BUILD FAILED снова при переустановке | Убрали логику переустановки |
| #86 | Ruby 3.3.6 не найден в rbenv (не сохраняется между запусками) | Переключились на системный Ruby 2.6 с `sudo gem install` |
| #87 | **Runner потерял связь с GitHub** (20m 11s) | `sudo gem install cocoapods` зависло/заняло слишком долго |

---

## Текущее состояние workflow (run #87)

Workflow в run #87 дошёл до шага **"Install CocoaPods"** и там завис на 18+ минут, после чего runner потерял связь с GitHub. Это означает что `sudo gem install cocoapods` с системным Ruby 2.6 либо:
1. Зависло (нет ответа от gem сервера)
2. Заняло слишком долго (большая зависимость)
3. Mac runner перегрелся/завис

---

## Что нужно сделать завтра

### Шаг 1: Проверить статус Mac runner
- Перейти на https://github.com/svetlyakovdaniil-pixel/durakonlinefromkz/settings/actions/runners
- Убедиться что runner онлайн (статус "Idle")
- Если оффлайн — перезапустить runner на Mac (команда: `cd ~/actions-runner && ./run.sh`)

### Шаг 2: Проверить что установлено на Mac runner
Подключиться к Mac и выполнить:
```bash
which ruby && ruby --version
which gem && gem --version
gem list | grep cocoapods
gem list | grep fastlane
which pod && pod --version
which fastlane && fastlane --version
rbenv versions
ls ~/.rbenv/versions/ 2>/dev/null
which brew 2>/dev/null || echo "brew not found"
```

### Шаг 3: Варианты решения (в порядке предпочтения)

**Вариант A (лучший): CocoaPods уже установлен на Mac**
Если `pod` уже установлен на Mac runner — просто добавить его путь в PATH и убрать шаг установки.
```yaml
- name: Check CocoaPods
  run: |
    export PATH="$HOME/.gem/bin:/usr/local/bin:$PATH"
    pod --version || sudo gem install cocoapods -v 1.13.0 --no-document
```

**Вариант B: Установить CocoaPods заранее на Mac**
Зайти на Mac и один раз выполнить:
```bash
sudo gem install cocoapods -v 1.13.0 --no-document
sudo gem install fastlane --no-document
```
Затем в workflow просто проверять наличие и не устанавливать.

**Вариант C: Использовать Bundler**
Создать `Gemfile` в корне проекта:
```ruby
source "https://rubygems.org"
gem "cocoapods", "~> 1.13"
gem "fastlane"
```
И в workflow использовать `bundle install` вместо `gem install`.

**Вариант D: rbenv с Ruby 3.x (если libyaml доступен)**
Установить на Mac: `sudo port install libyaml` или найти другой способ установить libyaml без Homebrew.

### Шаг 4: После исправления Ruby/CocoaPods
В run #83 workflow дошёл до ошибки **"IPA file not found"** — это значит что xcodebuild или export IPA упал. Нужно будет исправить и эту ошибку тоже.

---

## GitHub PAT (для прямого push)
Токен с правами `repo` + `workflow` уже настроен в git remote:
```bash
cd /home/ubuntu/kazakh-durak
git remote -v  # покажет user_github с токеном
git push user_github main  # прямой push без браузера
```

Если токен истёк — попросить пользователя создать новый на https://github.com/settings/tokens/new с правами `repo` + `workflow`.

---

## Текущий workflow файл
Находится в: `/home/ubuntu/kazakh-durak/.github/workflows/ios-build.yml`

Ключевые шаги:
1. Checkout + pnpm + Node.js 22
2. Install dependencies (`pnpm install`)
3. Build web app (`pnpm build`)
4. Install Capacitor CLI
5. Add iOS platform (`npx cap add ios`)
6. **Install CocoaPods** ← ПРОБЛЕМА ЗДЕСЬ
7. Install Fastlane
8. Import Distribution Certificate
9. Install Provisioning Profile
10. Update Xcode project (bundle ID + signing)
11. Build and Archive (`xcodebuild archive`)
12. Export IPA
13. Upload to App Store Connect
14. Upload IPA artifact
15. Cleanup keychain

---

## Secrets в GitHub репозитории (уже настроены)
- `APPLE_CERTIFICATE` — Distribution certificate (base64)
- `APPLE_CERTIFICATE_PASSWORD` — Пароль сертификата
- `APPLE_PROVISIONING_PROFILE` — Provisioning profile (base64)
- `APP_STORE_CONNECT_API_KEY_ID` — App Store Connect API Key ID
- `APP_STORE_CONNECT_API_ISSUER_ID` — Issuer ID
- `APP_STORE_CONNECT_API_KEY_CONTENT` — Private key content
- `BUNDLE_ID` — Bundle identifier приложения

---

## Важные замечания
- Mac runner — **self-hosted**, не GitHub-hosted
- Пользователь `yan` **не является администратором** (нет sudo для системных операций)
- `sudo gem install` работает (пользователь в sudoers для gem), но очень медленно
- Homebrew **не установлен** и не может быть установлен без прав администратора
- rbenv установлен, но Ruby 3.x не компилируется из-за отсутствия libyaml
