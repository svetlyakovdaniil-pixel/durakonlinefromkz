# Анализ стабильности WebSocket соединения — Казахский Дурак Онлайн

## Текущая конфигурация

### Сервер (socketServer.ts)
- `pingTimeout: 60000` (60с) — время ожидания pong ответа
- `pingInterval: 25000` (25с) — интервал отправки ping
- `connectTimeout: 45000` (45с) — таймаут подключения
- `transports: ['websocket', 'polling']` — оба транспорта
- `connectionStateRecovery: 2 минуты` — восстановление состояния
- `FREEZE_TIMEOUT_MS: 30000` (30с) — заморозка комнаты при disconnect
- `DISCONNECT_GRACE_MS: 60000` (60с) — grace period

### Клиент (useSocket.ts)
- `transports: ['websocket', 'polling']` — WebSocket с fallback на polling
- `upgrade: true` — апгрейд с polling на WebSocket
- `reconnectionAttempts: Infinity` — бесконечные попытки
- `reconnectionDelay: 500ms` — начальная задержка
- `reconnectionDelayMax: 5000ms` — макс задержка
- `timeout: 45000` (45с) — таймаут подключения
- Visibility change: >30с в фоне → принудительный disconnect + reconnect

---

## Выявленные проблемы

### 1. Railway Free Tier — главная причина
Railway Free Tier имеет ограничения:
- **Спящий режим**: сервер засыпает после периода неактивности
- **Лимит ресурсов**: ограниченная память и CPU
- **Нестабильный WebSocket**: Railway может разрывать долгие WebSocket соединения
- **Холодный старт**: при пробуждении сервера все соединения теряются

**Рекомендация**: Перейти на Railway Hobby Plan ($5/мес) или Pro Plan для стабильных WebSocket.

### 2. Агрессивный forced reconnect при visibility change
Текущий код (строка 317-322 useSocket.ts):
```js
if (hiddenDuration > 30000) {
  socket.disconnect();
  setTimeout(() => socket.connect(), 100);
}
```
Проблема: если пользователь переключился на другую вкладку на 31 секунду, соединение принудительно разрывается и создаётся заново. Это вызывает:
- Потерю текущего socket ID
- Необходимость rejoin
- Возможную заморозку комнаты для других игроков

### 3. Дублирование requestRoomList handler
В socketServer.ts есть два handler для `requestRoomList`:
- Строка 293: `socket.on('requestRoomList', ...)` — отправляет `sanitizeRoom()`
- Строка 1267: `socket.on('requestRoomList', ...)` — отправляет raw rooms

Второй перезаписывает первый, отправляя несанитизированные данные.

### 4. Отсутствие heartbeat на уровне приложения
Socket.IO имеет встроенный ping/pong, но нет application-level heartbeat для обнаружения "зомби" соединений (socket считает себя подключённым, но данные не проходят).

### 5. Нет retry для критических emit
Когда клиент отправляет `playCard`, `transferCard` и т.д., нет механизма retry при потере соединения в момент отправки.

---

## Рекомендуемые улучшения

### A. Улучшения на Railway (инфраструктура)
1. **Перейти на Hobby Plan** ($5/мес) — убирает спящий режим
2. **Настроить health check** — Railway пингует сервер и не даёт ему заснуть
3. **Увеличить memory** — WebSocket соединения потребляют память

### B. Улучшения клиента (useSocket.ts)
1. Увеличить порог visibility change с 30с до 120с
2. Добавить application-level heartbeat каждые 15с
3. Добавить retry для критических game actions
4. Не делать forced disconnect при visibility change — просто проверять соединение

### C. Улучшения сервера (socketServer.ts)
1. Удалить дублирующий requestRoomList handler
2. Добавить application-level heartbeat handler
3. Добавить логирование причин disconnect для диагностики
4. Увеличить pingTimeout до 90с для мобильных сетей
