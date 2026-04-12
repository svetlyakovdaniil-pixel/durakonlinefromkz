import { useMemo } from 'react';
import type { ClientGameState, Card, Suit } from '../../../shared/gameTypes';
import type { TutorialScenario } from './useInteractiveTutorial';

const suitMap: Record<string, Suit> = { 's': 'spades', 'h': 'hearts', 'd': 'diamonds', 'c': 'clubs' };

function parseCards(cardStrings: string[]): Card[] {
  return cardStrings.map((cardStr, idx) => {
    // Handle special 777 card (no suit)
    if (cardStr === '777') {
      return {
        id: `tutorial-card-${idx}-777`,
        rank: '777' as any,
        suit: null,
        copy: 1,
      };
    }
    const suitChar = cardStr.slice(-1);
    return {
      id: `tutorial-card-${idx}-${cardStr}`,
      rank: cardStr.slice(0, -1) as any,
      suit: suitMap[suitChar] || 'spades',
      copy: idx < 7 ? 1 : 2, // Use copy to differentiate duplicates
    };
  });
}

/**
 * Utility to create a mock ClientGameState for tutorial scenarios
 * This prepares the game state with specific cards and situations for each tutorial step
 */
export function useTutorialGameState(scenario: TutorialScenario | null, baseGameState: ClientGameState, locale: string = 'ru') {
  return useMemo(() => {
    if (!scenario) return baseGameState;

    // Create a modified game state for the tutorial scenario
    const tutorialState = { ...baseGameState };

    // Prepare player hand if specified
    if (scenario.playerHand) {
      tutorialState.myHand = parseCards(scenario.playerHand);
    }

    // Set trump suit and trump card if specified
    if (scenario.trumpSuit || scenario.trumpCard) {
      const trumpSuit = scenario.trumpSuit || 'hearts';
      tutorialState.trumpInfo = {
        ...tutorialState.trumpInfo,
        mainTrump: trumpSuit,
        currentTrump: trumpSuit,
      };
      // Set trump card under deck (e.g. 'Qh' = Queen of Hearts)
      if (scenario.trumpCard) {
        const trumpCardStr = scenario.trumpCard;
        const trumpSuitChar = trumpCardStr.slice(-1);
        const trumpRank = trumpCardStr.slice(0, -1);
        const trumpCardObj: Card = {
          id: 'tutorial-trump-card',
          rank: trumpRank as any,
          suit: suitMap[trumpSuitChar] || 'hearts',
          copy: 1,
        };
        tutorialState.trumpInfo = {
          ...tutorialState.trumpInfo,
          trumpCard: trumpCardObj,
        };
      }
    }

    // Update bot card count if botHand specified
    if (scenario.botHand && tutorialState.players) {
      tutorialState.players = tutorialState.players.map(p => {
        if (p.isBot) {
          return { ...p, cardCount: scenario.botHand!.length };
        }
        return p;
      });
    }

    // Set discard count if specified
    if (scenario.discardCount !== undefined) {
      tutorialState.discardCount = scenario.discardCount;
    }

    // Prepare table cards if specified
    if (scenario.tableCards) {
      const battleField: any[] = [];

      scenario.tableCards.forEach(({ playerId, cards }) => {
        cards.forEach((cardEntry, idx) => {
          if (typeof cardEntry === 'string') {
            // Simple attack-only card
            const suitChar = cardEntry.slice(-1);
            const card: Card = {
              id: `tutorial-table-${playerId}-${idx}`,
              rank: cardEntry.slice(0, -1) as any,
              suit: suitMap[suitChar] || 'spades',
              copy: 1,
            };
            battleField.push({ attack: card, defense: null });
          } else {
            // Beaten pair: { attack, defense }
            const aSuitChar = cardEntry.attack.slice(-1);
            const attackCard: Card = {
              id: `tutorial-table-${playerId}-${idx}-atk`,
              rank: cardEntry.attack.slice(0, -1) as any,
              suit: suitMap[aSuitChar] || 'spades',
              copy: 1,
            };
            const dSuitChar = cardEntry.defense.slice(-1);
            const defenseCard: Card = {
              id: `tutorial-table-${playerId}-${idx}-def`,
              rank: cardEntry.defense.slice(0, -1) as any,
              suit: suitMap[dSuitChar] || 'spades',
              copy: 1,
            };
            battleField.push({ attack: attackCard, defense: defenseCard });
          }
        });
      });

      tutorialState.battleField = battleField;
    }

    // Override attacker/defender indices if specified
    if (scenario.attackerPlayerIdx !== undefined) {
      tutorialState.currentAttackerIdx = scenario.attackerPlayerIdx;
    }
    if (scenario.defenderPlayerIdx !== undefined) {
      tutorialState.currentDefenderIdx = scenario.defenderPlayerIdx;
    }

    // Override main bot name if specified
    if (scenario.overrideMainBotName && tutorialState.players) {
      tutorialState.players = tutorialState.players.map(p => {
        if (p.isBot) {
          return { ...p, name: scenario.overrideMainBotName! };
        }
        return p;
      });
    }

    // Override deck counts if specified
    if (scenario.deck1Count !== undefined) {
      tutorialState.deck1Count = scenario.deck1Count;
    }
    if (scenario.deck2Count !== undefined) {
      tutorialState.deck2Count = scenario.deck2Count;
    }

    // Set hidden trump card 1 if specified (revealed when deck1 is empty)
    if (scenario.hiddenTrumpCard1) {
      const htcStr = scenario.hiddenTrumpCard1;
      const htcSuitChar = htcStr.slice(-1);
      const htcRank = htcStr.slice(0, -1);
      const htcCard: Card = {
        id: 'tutorial-hidden-trump-1',
        rank: htcRank as any,
        suit: suitMap[htcSuitChar] || 'clubs',
        copy: 1,
      };
      tutorialState.trumpInfo = {
        ...tutorialState.trumpInfo,
        hiddenTrumpCard1: htcCard,
      };
    }

    // Force deck style to 'custom' (deck #2) during tutorial
    tutorialState.deckStyle = 'custom';

    // Add extra bots if specified
    if (scenario.extraBots && scenario.extraBots > 0) {
      const existingPlayers = tutorialState.players ? [...tutorialState.players] : [];
      for (let i = 0; i < scenario.extraBots; i++) {
        const botNameRu = scenario.extraBotNames?.[i] || `Бот ${i + 2}`;
        const botNameEn = scenario.extraBotNamesEn?.[i] || `Bot ${i + 2}`;
        const botNameKk = scenario.extraBotNamesKk?.[i] || `Қадам ${i + 2}`;
        const botName = locale === 'en' ? botNameEn : locale === 'kk' ? botNameKk : botNameRu;
        existingPlayers.push({
          id: `tutorial-extra-bot-${i + 2}`,
          name: botName,
          isBot: true,
          cardCount: 14,
          isReady: true,
          isAdmin: false,
          avatarUrl: null,
          frameId: null,
          role: 'user',
        } as any);
      }
      tutorialState.players = existingPlayers;
    }

    return tutorialState;
  }, [scenario, baseGameState]);
}

/**
 * Convert card string notation to Card object
 * Format: "2s" = 2 of spades, "Ks" = King of spades, "10h" = 10 of hearts
 */
export function parseCardString(cardStr: string): Card {
  const suitChar = cardStr.slice(-1);
  const suit = suitMap[suitChar] || 'spades';
  const rank = cardStr.slice(0, -1);

  return {
    id: `card-${cardStr}`,
    rank: rank as any,
    suit,
    copy: 1,
  };
}

/**
 * Create a set of tutorial cards for a specific scenario
 */
export function createTutorialCards(cardStrings: string[]): Card[] {
  return parseCards(cardStrings);
}
