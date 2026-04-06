import { X, BookOpen, Swords, Shield, Crown, Layers, ArrowRight, Timer, Coins, Wifi, Users } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useTranslation } from '@/i18n';

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

export default function RulesModal({ open, onClose }: RulesModalProps) {
  const { t } = useTranslation();

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
            <h2 className="text-lg font-bold text-amber-100">{t('rules.title')}</h2>
          </div>
          <button
            className="text-amber-200/50 hover:text-amber-100 transition-colors p-1 rounded"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Accordion type="multiple" defaultValue={["kazakh-rules", "standard-rules"]} className="space-y-3">
            {/* Chapter 1: Kazakh Durak Rules */}
            <AccordionItem value="kazakh-rules" className="border border-amber-700/30 rounded-xl overflow-hidden bg-black/20">
              <AccordionTrigger className="px-4 py-3 text-amber-100 hover:text-amber-200 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span className="text-base font-semibold">{t('rules.chapter1')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 text-amber-200/80 text-sm leading-relaxed">
                  {/* Deck */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-400" /> {t('rules.deckTitle')}
                    </h4>
                    <p>{t('rules.deckText')}</p>
                  </div>

                  {/* Copy cards beat themselves */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-400" /> {t('rules.copiesTitle')}
                    </h4>
                    <p>{t('rules.copiesText')}</p>
                    <ul className="space-y-1 ml-4 mt-1.5">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>{t('rules.copiesEx1')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>{t('rules.copiesEx2')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>{t('rules.copiesEx3')}</span>
                      </li>
                    </ul>
                    <p className="mt-1.5">
                      <strong className="text-red-400">{t('rules.copiesException')}</strong>
                    </p>
                  </div>

                  {/* Trump system */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-amber-400" /> {t('rules.trumpTitle')}
                    </h4>
                    <p className="mb-2">{t('rules.trumpIntro')}</p>
                    <ul className="space-y-1.5 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold mt-0.5">1.</span>
                        <span><strong className="text-amber-100">{t('rules.trumpPhase1')}</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold mt-0.5">2.</span>
                        <span><strong className="text-amber-100">{t('rules.trumpPhase2')}</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold mt-0.5">3.</span>
                        <span><strong className="text-amber-100">{t('rules.trumpPhase3')}</strong></span>
                      </li>
                    </ul>
                  </div>

                  {/* Special cards */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-amber-400" /> {t('rules.specialTitle')}
                    </h4>
                    <ul className="space-y-2 ml-4">
                      <li><strong className="text-amber-100">{t('rules.special777')}</strong></li>
                      <li><strong className="text-amber-100">{t('rules.specialKing')}</strong></li>
                      <li><strong className="text-amber-100">{t('rules.specialAce')}</strong></li>
                    </ul>
                  </div>

                  {/* First bita rule */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-400" /> {t('rules.firstBitaTitle')}
                    </h4>
                    <p>{t('rules.firstBitaText')}</p>
                  </div>

                  {/* Throwing cards */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-400" /> {t('rules.throwingTitle')}
                    </h4>
                    <p>{t('rules.throwingText')}</p>
                    <p className="mt-1.5">{t('rules.throwingSixRule')}</p>
                  </div>

                  {/* Ten reverses */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <ArrowRight className="w-4 h-4 text-amber-400" /> {t('rules.tenReverseTitle')}
                    </h4>
                    <p>{t('rules.tenReverseText')}</p>
                  </div>

                  {/* Transfer */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <ArrowRight className="w-4 h-4 text-amber-400" /> {t('rules.transferTitle')}
                    </h4>
                    <p>{t('rules.transferText')}</p>
                  </div>

                  {/* Pass-through */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-amber-400" /> {t('rules.passThroughTitle')}
                    </h4>
                    <p>{t('rules.passThroughText')}</p>
                  </div>

                  {/* Multi-card attack */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-amber-400" /> {t('rules.multiAttackTitle')}
                    </h4>
                    <p>{t('rules.multiAttackText')}</p>
                    <p className="mt-1.5">{t('rules.multiTransferText')}</p>
                  </div>

                  {/* Timer */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Timer className="w-4 h-4 text-amber-400" /> {t('rules.timerTitle')}
                    </h4>
                    <p>{t('rules.timerText')}</p>
                    <p className="mt-1.5">
                      <strong className="text-red-400">{t('rules.timerPenalty')}</strong>
                    </p>
                  </div>

                  {/* Shanyrak currency */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" /> {t('rules.shanyrakTitle')}
                    </h4>
                    <p>{t('rules.shanyrakText')}</p>
                    <p className="mt-1.5"><strong className="text-amber-100">{t('rules.shanyrakEarn')}</strong></p>
                    <ul className="space-y-1 ml-4 mt-1">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>{t('rules.shanyrakWin')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>{t('rules.shanyrakDaily')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>{t('rules.shanyrakStart')}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Tenge currency */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-400" /> {t('rules.tengeTitle')}
                    </h4>
                    <p>{t('rules.tengeText')}</p>
                    <p className="mt-1.5"><strong className="text-amber-100">{t('rules.tengeEarn')}</strong></p>
                    <ul className="space-y-1 ml-4 mt-1">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>{t('rules.tengeWin')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>{t('rules.tengeDaily')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>{t('rules.tengeStart')}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Disconnect */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Wifi className="w-4 h-4 text-amber-400" /> {t('rules.disconnectTitle')}
                    </h4>
                    <p>{t('rules.disconnectText')}</p>
                    <p className="mt-1.5">{t('rules.disconnectReconnect')}</p>
                  </div>

                  {/* Winning */}
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" /> {t('rules.winTitle')}
                    </h4>
                    <p>{t('rules.winText')}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Chapter 2: Standard Durak Rules */}
            <AccordionItem value="standard-rules" className="border border-amber-700/30 rounded-xl overflow-hidden bg-black/20">
              <AccordionTrigger className="px-4 py-3 text-amber-100 hover:text-amber-200 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Swords className="w-5 h-5 text-amber-400" />
                  <span className="text-base font-semibold">{t('rules.chapter2')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 text-amber-200/80 text-sm leading-relaxed">
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5">{t('rules.stdGeneralTitle')}</h4>
                    <p>{t('rules.stdGeneral')}</p>
                  </div>
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5">{t('rules.stdDeckTitle')}</h4>
                    <p>{t('rules.stdDeck')}</p>
                  </div>
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5">{t('rules.stdDealTitle')}</h4>
                    <p>{t('rules.stdDeal')}</p>
                  </div>
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5">{t('rules.stdAttackTitle')}</h4>
                    <p>{t('rules.stdAttack')}</p>
                    <p className="mt-1.5">{t('rules.stdAttackMore')}</p>
                  </div>
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5">{t('rules.stdTakeTitle')}</h4>
                    <p>{t('rules.stdTake')}</p>
                  </div>
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5">{t('rules.stdBitoTitle')}</h4>
                    <p>{t('rules.stdBito')}</p>
                  </div>
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5">{t('rules.stdDrawTitle')}</h4>
                    <p>{t('rules.stdDraw')}</p>
                  </div>
                  <div>
                    <h4 className="text-amber-100 font-semibold mb-1.5">{t('rules.stdEndTitle')}</h4>
                    <p>{t('rules.stdEnd')}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Footer note */}
          <div className="mt-4 mb-2 text-center">
            <p className="text-amber-200/40 text-xs">{t('rules.footer')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
