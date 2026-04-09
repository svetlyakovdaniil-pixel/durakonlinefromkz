import { useMemo } from 'react';
import type { ClientGameState, Card, Suit } from '../../../shared/gameTypes';
import type { TutorialScenario } from './useInteractiveTutorial';

const suitMap: Record<string, Suit> = { 's': 'spades', 'h': 'hearts', 'd': 'diamonds', 'c': 'clubs' };

function parseCards(cardStrings: string[]): Card[] {
  return cardStrings.map((cardStr, idx) => {
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
export function useTutorialGameState(scenario: TutorialScenario | null, baseGameState: ClientGameState) {
  return useMemo(() => {
    if (!scenario) return baseGameState;

    // Create a modified game state for the tutorial scenario
    const tutorialState = { ...baseGameState };

    // Prepare player hand if specified
    if (scenario.playerHand) {
      tutorialState.myHand = parseCards(scenario.playerHand);
    }

    // Set trump suit if specified
    if (scenario.trumpSuit) {
      tutorialState.trumpInfo = {
        ...tutorialState.trumpInfo,
        mainTrump: scenario.trumpSuit,
        currentTrump: scenario.trumpSuit,
      };
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
        cards.forEach((cardStr, idx) => {
          const suitChar = cardStr.slice(-1);
          const card: Card = {
            id: `tutorial-table-${playerId}-${idx}`,
            rank: cardStr.slice(0, -1) as any,
            suit: suitMap[suitChar] || 'spades',
            copy: 1,
          };

          battleField.push({
            attack: card,
            defense: null,
          });
        });
      });

      tutorialState.battleField = battleField;
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
