# Казахский Дурак Онлайн — TODO

## Server-side
- [x] Shared game types (gameTypes.ts) — cards, suits, ranks, game state, room, socket events
- [x] Shared card assets (cardAssets.ts) — CDN URLs for face cards, card back, game table
- [x] Game engine (gameEngine.ts) — full game logic with all Kazakh Durak rules
- [x] Socket server (socketServer.ts) — WebSocket rooms, multiplayer, bots, timers
- [x] Register socket server in server/_core/index.ts

## Client-side
- [x] Dark theme with amber/gold color scheme
- [x] useSocket hook — client WebSocket connection and game state management
- [x] PlayingCard component — card rendering with face/back images
- [x] GameTable component — main game UI with battlefield, hand, actions
- [x] Lobby page — room list, create room dialog
- [x] WaitingRoom page — player list, ready toggle, start game
- [x] Home page — landing page (unauthenticated) + game flow (authenticated)
- [x] App.tsx — dark theme, routing

## Improvements needed
- [x] Add passTurn button for non-attacker/non-defender players in GameTable (uses skipTurn action)
- [x] Handle useSocket events properly (trumpChanged, directionChanged, gameOver)
- [x] Add "Вернуться в лобби" button on game over screen

## Testing
- [x] Game engine unit tests (61 tests)
- [x] Socket server integration tests (10 tests)
- [x] Auth logout test (1 test)
- [x] All 72 tests passing

## Механика хода — исправления
- [x] Приоритет хода атакующего: edge-игроки НЕ могут подкидывать, пока текущий атакующий не нажмёт "бито". После "бито" атакующего — ход переходит к edge-игроку. Если edge-игрок подкинул карту, которую защитник отбил картой, совпадающей с рукой атакующего — атакующий снова получает приоритет.
- [x] Механика "взять": когда защитник нажимает "взять", атакующие получают возможность докинуть карты (до лимита). Только после того как все атакующие нажмут "бито" — защитник забирает карты со стола.
- [x] Лимит карт: первая бита — не более 13 карт. Далее — не более количества карт в руке защитника.
- [x] Обновить UI: показывать состояние "Защитник берёт — можно докинуть" и соответствующие кнопки
- [x] Обновить тесты для новой механики (84 теста проходят)

## UI улучшения
- [x] Увеличить значок козыря — text-2xl с большим padding
- [x] Увеличить карты на столе (battlefield) — medium размер вместо small

## Баг: отключение не-хост игроков
- [x] Исправлено: 45с grace period при disconnect, auto-reconnect с rejoinRoom, трекинг комнат игроков, передача хоста при выходе

## Механика "проездной"
- [x] Если на игрока походили, и у него в руке есть козырная карта с таким же номиналом — он может показать её (не выкладывая на стол) как "проездной"
- [x] Ограничение: каждая конкретная карта может быть показана как проездной только 1 раз за игру
- [x] Если у игрока 2 такие карты — он может показать проездной 2 раза
- [x] Другим игрокам нужно показать, что у этого игрока есть проездные карты (UI индикатор)
- [x] Карты-проездные НЕ выкладываются на стол, только показываются
- [x] Обновить тесты для механики проездной (94 теста проходят)

## Баг: после reconnect нельзя подкидывать карты
- [x] Исправлено: сервер всегда отправляет yourTurn (даже пустой массив), клиент сбрасывает stale actions при gameStateUpdate
- [x] Стабилизация: pingTimeout 60s, pingInterval 25s, reconnectionAttempts Infinity, reconnectionDelay 500ms, transport upgrade+remember
- [x] rejoinRoom всегда отправляет полное состояние игры + актуальные действия

## Система победителей
- [x] Игрок без карт + колода пуста = победитель (присвоить winPlace)
- [x] Победитель №1 — первый вышедший, №2 — второй, и т.д.
- [x] Последний оставшийся с картами = "дурак"
- [x] Победитель сразу определяется после отбоя последней картой
- [x] Ход переходит на следующего активного игрока при выходе победителя
- [x] Победитель не участвует в игре, но может наблюдать
- [x] Победитель не получает доступных действий (пустой yourTurn)
- [x] Победитель пропускается при определении атакующего/защитника
- [x] UI: отображение медалей/бейджей победителей рядом с аватарами
- [x] UI: "Вы победили! Место: №X" баннер для победителя
- [x] UI: "Дурак" бейдж для проигравшего
- [x] UI: экран результатов с полным рейтингом всех игроков
- [x] Тесты для системы победителей (101 тест проходит)

## Баг: зависание игры
- [x] Fix race condition: cancel pending bot timeouts on new actions
- [x] Fix getBotAction returning null silently killing game loop
- [x] Fix attacker should always be able to press "бито" when cards are on table
- [x] Add safety fallback: if no actions available for anyone, auto-resolve trick

## Выход из игры (покинул игру)
- [x] Add forfeitGame engine function — player auto-loses, cards go to discard
- [x] Add leaveGame socket event
- [x] Add "left game" (leftGame) status field to Player and ClientPlayer
- [x] UI: "Покинуть игру" button on game table
- [x] UI: "Покинул игру" status in results screen

## Баг: зависания v2 (глубокий анализ)
- [x] Глубокий анализ всех путей выполнения в движке и сервере
- [x] Root cause: executeBotAction игнорировал ошибки → бесконечный цикл сброса таймера
- [x] executeBotAction теперь возвращает boolean и логирует ошибки
- [x] Счётчик провалов бота + forceResolveStuckState после 3 попыток
- [x] Улучшенный handleTimeUp с немедленной финализацией
- [x] Edge bot auto-pass при ошибке
- [x] Deadlock safeguard в handleTimeUp

## Выход из игры — полноценный возврат в лобби
- [x] После покидания игры игрок сразу попадает в лобби (leaveGame очищает всё состояние)

## Прокрутка карт в руке
- [x] PlayerHand компонент с горизонтальной прокруткой и стрелками навигации
- [x] Адаптивный overlap карт в зависимости от количества
- [x] Стрелки влево/вправо появляются при 8+ картах
- [x] Тонкий scrollbar для свободной прокрутки

## Баг: потеря соединения
- [x] Retry rejoin при неудаче (3 попытки с увеличивающейся задержкой)
- [x] Отмена grace timer при rejoin на сервере
- [x] Обновление socket mapping при reconnect
- [x] Восстановление currentRoomIdRef при авто-rejoin

## Баг: неправильная смена защитника + зацикливание ботов
- [x] passedAttackers в pickup mode не сбрасывается полностью — только текущий игрок удаляется
- [x] Боты ограничены макс 2 картами подкидывания в pickup mode
- [x] checkAllAttackersPassed_safe учитывает canPlayerAddCards

## Звуковые эффекты
- [x] Создать звуковые файлы: card_play, card_deal, card_take, round_win, game_win, game_lose, your_turn, timer_warning
- [x] Загрузить звуки на CDN через manus-upload-file (8 файлов)
- [x] Создать useSound hook с предзагрузкой, кэшированием и localStorage персистентностью
- [x] Интегрировать звуки в GameTable: ход картой (cardPlay при изменении battlefield)
- [x] Интегрировать звуки в GameTable: взятие карт (cardTake при очистке стола + рост руки)
- [x] Интегрировать звуки в GameTable: победа/бито (roundWin при очистке стола + рост discard)
- [x] Интегрировать звуки: gameWin/gameLose при завершении игры
- [x] Интегрировать звуки: yourTurn при появлении действий, timerWarning при 5с
- [x] Добавить кнопку включения/выключения звука в HUD (Volume2/VolumeX)

## Баг: прозрачность карт при отбое
- [x] Верхняя карта (защита) при отбое полупрозрачная — видно номинал и масть нижней карты
- [x] Добавлен bg-white фон под изображениями карт (J, Q, K, A) в PlayingCard
- [x] Добавлен z-10 на defense карту в battlefield для гарантированного перекрытия

## Баг: выход со стола не возвращает в лобби (повторный)
- [x] Сервер: ack отправляется ДО broadcast, игрок удаляется из socket.io комнаты
- [x] Клиент: leavingRef флаг блокирует gameStateUpdate после выхода
- [x] untrackPlayerRoom предотвращает авто-rejoin при reconnect

## Баг: reconnect и выход в лобби
- [x] Grace period 30с при потере соединения — после 30с forfeit и выброс в лобби
- [x] При восстановлении соединения в течении 30с — продолжить игру
- [x] После нажатия "выйти в лобби" — не возвращать обратно в игру
- [x] Сервер: forfeitedFromRoom Set блокирует auto-rejoin и rejoinRoom
- [x] Клиент: blockedRoomIdsRef постоянно блокирует комнату (не временный флаг)
- [x] Сервер: forcedToLobby event при disconnect timeout expiry
- [x] Клиент: forcedToLobby handler очищает состояние и показывает toast
- [x] leavingRef блокирует yourTurn и timerUpdate помимо gameStateUpdate

## Баг: выход из игры всё ещё возвращает игрока обратно
- [x] Полный аудит всех путей возврата в игру (сервер + клиент)
- [x] Полностью разделить: intentional leave = навсегда, disconnect = 30с grace
- [x] Убедиться что после leaveGame ни один event не возвращает игрока в игру
- [x] Сервер: forfeitedFromRoom НЕ удаляется при проверке (постоянная блокировка)
- [x] Сервер: leaveGame удаляет игрока из room.players (предотвращает auto-rejoin loop)
- [x] Клиент: blockedRoomIdsRef проверяется во ВСЕХ handlers (roomUpdated, gameStateUpdate, gameStarted, yourTurn, gameOver, timerUpdate)
- [x] Клиент: gameStateUpdate и yourTurn игнорируются если currentRoomIdRef === null (в лобби)
- [x] Клиент: roomUpdated НЕ устанавливает currentRoomIdRef автоматически
- [x] Клиент: leavingRef сбрасывается при создании/вступлении в новую комнату
- [x] 6 новых тестов для leave game isolation (129 тестов проходят)

## Баг: reconnect иногда выкидывает в лобби
- [x] Аудит rejoin logic — почему "не удалось вернуться в комнату" если прошло < 30с
- [x] Исправить rejoin: проверка gameState.players как fallback помимо room.players

## Баг: нельзя подкинуть карту (лимит карт на столе)
- [x] Корневая причина: getMaxAttackCards считал только текущие карты в руке, не учитывая сыгранные на стол
- [x] Исправлено: лимит = hand.length + defenseCardsOnTable (начальное кол-во карт)
- [x] 2 новых теста для проверки лимита

## Баг: перевод хода на игрока с недостаточным количеством карт
- [x] transferAttack: проверка nextDefender.hand.length >= totalAttackCards
- [x] showPassThrough: аналогичная проверка для проездного
- [x] getAvailableActions: скрывает кнопки перевода/проездного если недостаточно карт
- [x] 4 новых теста (transfer blocked, transfer allowed, transfer hidden, pass-through blocked)

## Баг: шестёрки подкидываются всеми, но другие карты — только соседями
- [x] Новая функция canNonNeighborPlayCard: не-соседи могут подкидывать ТОЛЬКО шестёрки
- [x] playAttackCard: проверка canNonNeighborPlayCard при подкидывании
- [x] getAvailableActions: фильтрация карт для edge players через canNonNeighborPlayCard
- [x] autoPassAttackersWithNoCards: учёт ограничения не-соседей
- [x] 7 новых тестов для правила шестёрок
- [x] Всего 145 тестов проходят стабильно (5/5 запусков)
- [x] Клиент получает действия от сервера через getAvailableActions — нет stale карт
- [x] Интеграционные тесты: card limit regression + six-exception с 6 игроками
- [x] Стабилизация flaky тестов: фиксированный козырь + детерминистические карты

## Баг: проездной работает после начала защиты
- [x] showPassThrough: проверка battleField.some(p => p.defense !== null) — блокирует после начала защиты
- [x] getAvailableActions: проездной показывается только когда все карты неотбиты
- [x] 3 новых теста (blocked, allowed, hidden)

## Баг: не-соседи подкидывают не только шестёрки
- [x] Корневая причина: currentAttackerIdx менялся на не-соседа, обходя canNonNeighborPlayCard
- [x] playAttackCard: canNonNeighborPlayCard теперь проверяется для ВСЕХ игроков (включая currentAttacker)
- [x] getAvailableActions: фильтрация canNonNeighborPlayCard добавлена во ВСЕ секции (attacker, pickup, edge)
- [x] 3 новых теста (non-neighbor currentAttacker blocked, actions filtered, neighbor allowed)
- [x] Всего 151 тест стабильно (5/5)

## Улучшение: автозавершение хода при пустой руке защитника
- [x] Если защитник отбил все карты и у него 0 карт в руке — ход завершается автоматически
- [x] Не ждать пока все атакующие нажмут "бито"
- [x] 2 новых теста: auto-complete при 0 картах, НЕ auto-complete при наличии карт

## Улучшение: отображение колод
- [x] Показывать "Колода 1: N  Колода 2: N  Фаза X/3" в верхнем левом углу
- [x] Игрок видит когда поменяется фаза и козырь

## Улучшение: козырь по последней взятой карте при смене фазы
- [x] При смене фазы козырь = масть последней карты, которую взял игрок
- [x] Козыри могут повторяться (нет ограничений на повтор масти)
- [x] 2 новых теста: deck1→phase2 trump change, deck2→phase3 trump change

## Улучшение: козырь на игровом поле
- [x] Большая иконка козыря на столе (центр при пустом столе, справа при наличии карт)
- [x] Не мешает видимости карт на столе

## Улучшение: надпись "ВАШ ХОД"
- [x] Большая надпись "ВАШ ХОД" на 2 секунды при начале хода игрока
- [x] CSS анимация: scale-in при появлении (your-turn-enter), scale-out+fade при исчезновении (your-turn-exit)

## Тесты
- [x] Всего 155 тестов проходят (107 gameEngine + 47 socketServer + 1 auth)
