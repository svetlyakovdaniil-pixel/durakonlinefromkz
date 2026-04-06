import { X, BookOpen, Swords, Shield, Crown, Layers, ArrowRight, Timer, Coins, Wifi, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

export default function RulesModal({ open, onClose }: RulesModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[85vh] bg-gradient-to-b from-[#1a2d45] to-[#0f1923] border border-amber-700/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-700/20 bg-black/20">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-amber-100">Правила игры</h2>
          </div>
          <button
            className="text-amber-200/50 hover:text-amber-100 transition-colors p-1 rounded"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-5 py-4">
          <Accordion type="multiple" defaultValue={["kazakh-rules", "standard-rules"]} className="space-y-3">
            {/* Chapter 1: Kazakh Durak Rules */}
            <AccordionItem value="kazakh-rules" className="border border-amber-700/30 rounded-xl overflow-hidden bg-black/20">
              <AccordionTrigger className="px-4 py-3 text-amber-100 hover:text-amber-200 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span className="text-base font-semibold">Глава 1: Казахский Дурак</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 text-amber-200/80 text-sm leading-relaxed">
                  {/* Deck */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-400" /> Колода и раздача
                    </h4>
                    <p>
                      Используется <strong className="text-amber-100">4 стандартные колоды по 36 карт</strong> (от 6 до туза, четыре масти).
                      Итого <strong className="text-amber-100">144 карты + 1 специальная карта «777» = 145 карт</strong>.
                      Каждой карты в игре по <strong className="text-amber-100">4 копии</strong>.
                      Каждому игроку раздаётся по <strong className="text-amber-100">14 карт</strong>.
                      В игре может участвовать от 2 до 8 игроков.
                    </p>
                  </div>

                  {/* Copy cards beat themselves */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-400" /> Копии карт
                    </h4>
                    <p>
                      Так как каждой карты по 4 копии, <strong className="text-amber-100">копии бьют сами себя</strong>.
                    </p>
                    <ul className="space-y-1 ml-4 mt-1.5">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>7♣ бьёт 7♣</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>Дама♥ бьёт Даму♥</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>Туз♦ бьёт Туза♦</span>
                      </li>
                    </ul>
                    <p className="mt-1.5">
                      <strong className="text-red-400">Исключение:</strong> Король пик ♠К <strong className="text-amber-100">не бьёт сам себя</strong>.
                    </p>
                  </div>

                  {/* Trump system */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-amber-400" /> Система козырей (3 фазы)
                    </h4>
                    <p className="mb-2">
                      Козырная масть меняется в процессе игры. Колода разделена на две части (колода 1 и колода 2).
                    </p>
                    <ul className="space-y-1.5 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold mt-0.5">1.</span>
                        <span><strong className="text-amber-100">Фаза 1</strong> — козырь определяется нижней картой колоды 1 (видна всем). Под ней лежит скрытая карта.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold mt-0.5">2.</span>
                        <span><strong className="text-amber-100">Фаза 2</strong> — когда колода 1 заканчивается, скрытая карта переворачивается. Её масть становится новым козырем.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold mt-0.5">3.</span>
                        <span><strong className="text-amber-100">Фаза 3</strong> — когда колода 2 заканчивается, масть последней взятой из неё карты становится финальным козырем до конца игры.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Special cards */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-amber-400" /> Специальные карты
                    </h4>
                    <ul className="space-y-2 ml-4">
                      <li>
                        <strong className="text-amber-100">Карта «777»</strong> — бьёт абсолютно любую карту в игре. Её нельзя использовать для атаки, только для защиты. Единственная в колоде.
                      </li>
                      <li>
                        <strong className="text-amber-100">Король пик ♠К</strong> — бьёт любую карту в игре, <strong className="text-red-400">кроме самого себя</strong>. Можно использовать и для атаки, и для защиты. Короля пик могут побить только <strong className="text-amber-100">Туз пик ♠Т</strong> и <strong className="text-amber-100">карта «777»</strong>.
                      </li>
                      <li>
                        <strong className="text-amber-100">Туз пик ♠Т</strong> — бьёт Короля пик. В остальном действует как обычный туз.
                      </li>
                    </ul>
                  </div>

                  {/* First bita rule */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-400" /> Первая бита
                    </h4>
                    <p>
                      <strong className="text-amber-100">Первая бита — 13 карт.</strong> В самом начале игры, когда в бито ещё нет ни одной карты, 
                      защитник обязан отбить максимум 13 атакующих карт. 
                      Как только в бито появляется хотя бы одна карта, правило меняется: 
                      <strong className="text-amber-100">игрок обязан бить столько карт, сколько у него в руке</strong>.
                    </p>
                  </div>

                  {/* Throwing cards */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-400" /> Подкидывание карт
                    </h4>
                    <p>
                      Подкидывать карты защитнику могут <strong className="text-amber-100">только крайние игроки</strong> (сидящие слева и справа от защитника).
                    </p>
                    <p className="mt-1.5">
                      <strong className="text-amber-100">Исключение — шестёрка:</strong> если атакующий начал ход с шестёрки, 
                      <strong className="text-amber-100">все игроки за столом</strong> могут подкинуть шестёрку. 
                      Это правило работает только если ход был начат именно с шестёрки.
                    </p>
                  </div>

                  {/* Ten reverses */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <ArrowRight className="w-4 h-4 text-amber-400" /> Десятка — разворот
                    </h4>
                    <p>
                      Если игрок походил с <strong className="text-amber-100">десятки</strong>, направление хода игры <strong className="text-amber-100">переворачивается</strong> — 
                      по аналогии с картой разворота в игре UNO. Если игра шла по часовой стрелке, 
                      она начинает идти против часовой, и наоборот.
                    </p>
                  </div>

                  {/* Transfer */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <ArrowRight className="w-4 h-4 text-amber-400" /> Перевод
                    </h4>
                    <p>
                      Игра всегда по системе <strong className="text-amber-100">«переводной»</strong>. 
                      Защитник может перевести атаку на следующего игрока, 
                      положив карту того же номинала, что и атакующая. Перевод возможен, только если 
                      ни одна карта ещё не отбита. Можно перевести сразу несколько карт одного номинала.
                    </p>
                  </div>

                  {/* Pass-through */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-amber-400" /> Проездной
                    </h4>
                    <p>
                      Если у защитника есть <strong className="text-amber-100">козырная карта того же номинала</strong>, что и атакующая, 
                      он может показать её как «проездной». При этом карта <strong className="text-amber-100">остаётся в руке</strong> защитника, 
                      но атака переводится на следующего игрока. 
                      Проездной — это способ перенаправить атаку, не тратя карту и не отбиваясь.
                      Каждая карта может быть использована как проездной только <strong className="text-amber-100">один раз за игру</strong>.
                    </p>
                  </div>

                  {/* Multi-card attack */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-amber-400" /> Множественная атака и перевод
                    </h4>
                    <p>
                      При начале хода, если у атакующего есть несколько карт одного номинала, 
                      он может <strong className="text-amber-100">выбрать сколько из них положить на стол за раз</strong>. 
                      Нажмите на карту — она вытянется из руки, а карты того же номинала подсветятся. 
                      Выберите нужные и нажмите «Походить».
                    </p>
                    <p className="mt-1.5">
                      Аналогично работает и <strong className="text-amber-100">множественный перевод</strong>: 
                      если у защитника есть несколько карт одного номинала для перевода, 
                      он может выбрать сколько из них перевести за раз.
                    </p>
                  </div>

                  {/* Timer */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Timer className="w-4 h-4 text-amber-400" /> Таймер хода
                    </h4>
                    <p>
                      На каждый ход отводится ограниченное время (настраивается при создании комнаты: 30, 60 или 90 секунд). 
                      Если время истекло — ход пропускается автоматически: 
                      для атакующего это означает «бито», для защитника — «забрать карты».
                    </p>
                    <p className="mt-1.5">
                      <strong className="text-red-400">Два пропуска подряд = автоматический проигрыш.</strong> Игрок считается проигравшим и выбывает из игры.
                    </p>
                  </div>

                  {/* Shanyrak currency */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" /> Шаныраки (игровая валюта)
                    </h4>
                    <p>
                      <strong className="text-amber-100">Шаныраки</strong> — основная игровая валюта, на которую игроки играют. 
                      При создании комнаты устанавливается ставка в шаныраках. 
                      Все игроки вносят ставку, и призовой фонд распределяется между победителями по местам.
                    </p>
                    <p className="mt-1.5">
                      <strong className="text-amber-100">Как заработать шаныраки:</strong>
                    </p>
                    <ul className="space-y-1 ml-4 mt-1">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>Выигрывать игры — чем выше место, тем больше награда</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>Ежедневный бонус при входе в игру</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>Начальный баланс при регистрации</span>
                      </li>
                    </ul>
                  </div>

                  {/* Tenge currency */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-400" /> Тенге (валюта магазина)
                    </h4>
                    <p>
                      <strong className="text-amber-100">Тенге</strong> — валюта магазина, используется для покупки косметических предметов: 
                      колод карт и игровых столов.
                    </p>
                    <p className="mt-1.5">
                      <strong className="text-amber-100">Как заработать тенге:</strong>
                    </p>
                    <ul className="space-y-1 ml-4 mt-1">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>Выигрывать игры — победители получают тенге</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>Ежедневный бонус при входе</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>Начальный баланс при регистрации</span>
                      </li>
                    </ul>
                  </div>

                  {/* Disconnect */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Wifi className="w-4 h-4 text-amber-400" /> Выход из игры / потеря связи
                    </h4>
                    <p>
                      Если игрок <strong className="text-amber-100">выходит из начатой игры</strong> или <strong className="text-amber-100">полностью теряет связь с сервером</strong>, 
                      он автоматически считается <strong className="text-red-400">проигравшим</strong>. 
                      Его ставка в шаныраках не возвращается и распределяется между оставшимися игроками.
                    </p>
                    <p className="mt-1.5">
                      При кратковременной потере связи игрок может переподключиться и продолжить игру, 
                      если таймер хода ещё не истёк дважды подряд.
                    </p>
                  </div>

                  {/* Winning */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" /> Победа и проигрыш
                    </h4>
                    <p>
                      Цель — избавиться от всех карт. Игроки выбывают по мере опустошения руки. 
                      Последний игрок с картами — <strong className="text-amber-100">проигравший (дурак)</strong>. 
                      Призовой фонд (шаныраки) распределяется между победителями по местам.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Chapter 2: Standard Durak Rules */}
            <AccordionItem value="standard-rules" className="border border-amber-700/30 rounded-xl overflow-hidden bg-black/20">
              <AccordionTrigger className="px-4 py-3 text-amber-100 hover:text-amber-200 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Swords className="w-5 h-5 text-amber-400" />
                  <span className="text-base font-semibold">Глава 2: Стандартные правила «Дурака»</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 text-amber-200/80 text-sm leading-relaxed">
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5">Общие сведения</h4>
                    <p>
                      «Дурак» — популярная карточная игра, в которой цель — избавиться от всех карт на руках. 
                      Последний игрок, оставшийся с картами, считается проигравшим и получает звание «дурак».
                    </p>
                  </div>

                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5">Колода</h4>
                    <p>
                      В стандартной версии используется колода из 36 карт (от шестёрки до туза, четыре масти). 
                      Козырная масть определяется одной картой, вытянутой из колоды и положенной под неё рубашкой вверх.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5">Раздача</h4>
                    <p>
                      Каждому игроку раздаётся по 6 карт. Оставшиеся карты образуют колоду для добора. 
                      Первым ходит игрок с наименьшим козырем (или определяется случайно).
                    </p>
                  </div>

                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5">Атака и защита</h4>
                    <p>
                      Атакующий кладёт карту на стол. Защитник должен побить её картой той же масти, но старше, 
                      или любым козырем (если атакующая карта не козырная). Козырную карту можно побить только старшим козырем.
                    </p>
                    <p className="mt-1.5">
                      Другие игроки могут подкидывать карты того же номинала, что уже есть на столе, 
                      но общее количество атакующих карт не может превышать количество карт в руке защитника.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5">Забрать карты</h4>
                    <p>
                      Если защитник не может или не хочет отбиваться, он забирает все карты со стола в свою руку. 
                      После этого ход переходит к следующему игроку (защитник пропускает свой ход атаки).
                    </p>
                  </div>

                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5">Бито</h4>
                    <p>
                      Если все атакующие карты отбиты и никто не подкидывает, атакующий объявляет «Бито». 
                      Все карты со стола уходят в отбой (сброс). Ход переходит к бывшему защитнику — теперь он атакует.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5">Добор карт</h4>
                    <p>
                      После каждого розыгрыша игроки добирают карты из колоды до нужного количества (6 в стандартной версии). 
                      Первым добирает атакующий, затем остальные по кругу. Защитник добирает последним.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5">Окончание игры</h4>
                    <p>
                      Когда колода заканчивается, игроки доигрывают оставшимися картами. 
                      Игрок, избавившийся от всех карт, выходит из игры. 
                      Последний оставшийся с картами — проигравший.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Footer note */}
          <div className="mt-4 mb-2 text-center">
            <p className="text-amber-200/40 text-xs">
              Казахский Дурак Онлайн — карточная игра с уникальными правилами
            </p>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
