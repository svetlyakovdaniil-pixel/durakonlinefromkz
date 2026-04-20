/**
 * DemoGame — renders a static GameTable with mock data for UI preview/screenshots.
 * Accessible at /demo-game. Remove before production if desired.
 */
import GameTable from "@/components/GameTable";
import type { ClientGameState } from "../../../shared/gameTypes";

const mockGameState: ClientGameState = {
  roomId: "demo-room",
  deckStyle: "classic",
  tableStyle: "dark_kazakh",
  betAmount: 0,
  deck1Count: 18,
  deck2Count: 0,
  trumpInfo: {
    mainTrump: "hearts",
    hiddenTrump1: "spades",
    hiddenTrump2: "clubs",
    currentTrump: "hearts",
    phase: 1,
    trumpCard: { id: "trump-A-hearts-0", suit: "hearts", rank: "A", copy: 0 },
  },
  battleField: [
    {
      attack: { id: "c1", suit: "spades", rank: "K", copy: 0 },
      defense: { id: "c2", suit: "hearts", rank: "A", copy: 0 },
    },
    {
      attack: { id: "c3", suit: "diamonds", rank: "10", copy: 1 },
      defense: null,
    },
  ],
  discardCount: 12,
  currentAttackerIdx: 0,
  currentDefenderIdx: 1,
  direction: "cw",
  turnPhase: "attack",
  gamePhase: "playing",
  firstTrick: false,
  trickCount: 4,
  myHand: [
    { id: "h1", suit: "spades", rank: "6", copy: 0 },
    { id: "h2", suit: "spades", rank: "7", copy: 0 },
    { id: "h3", suit: "spades", rank: "J", copy: 0 },
    { id: "h4", suit: "clubs", rank: "Q", copy: 0 },
    { id: "h5", suit: "clubs", rank: "K", copy: 0 },
    { id: "h6", suit: "diamonds", rank: "9", copy: 0 },
    { id: "h7", suit: "hearts", rank: "8", copy: 0 },
    { id: "h8", suit: "hearts", rank: "10", copy: 0 },
    { id: "h9", suit: "spades", rank: "A", copy: 0 },
  ],
  myIndex: 0,
  winnersOrder: [],
  loserId: null,
  turnTimer: 20,
  turnTimerMax: 30,
  leadCardRank: null,
  attackerHasPriority: true,
  passedAttackers: [],
  canAddCards: true,
  defenderTaking: false,
  revealedPassThroughs: [],
  availableActions: [
    { type: "playCard", cardIds: ["h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8", "h9"] },
  ],
  playerPrizes: [],
  prizePool: 0,
  phantomNeighborIdx: null,
  players: [
    {
      id: "player-0",
      name: "Вы",
      cardCount: 9,
      isOut: false,
      seatIndex: 0,
      isBot: false,
      winPlace: null,
      leftGame: false,
      gameId: 1,
      avatarId: "default",
      seasonRating: 1200,
    },
    {
      id: "player-1",
      name: "Алибек",
      cardCount: 7,
      isOut: false,
      seatIndex: 1,
      isBot: false,
      winPlace: null,
      leftGame: false,
      gameId: 2,
      avatarId: "default",
      seasonRating: 980,
    },
    {
      id: "player-2",
      name: "Айгерим",
      cardCount: 5,
      isOut: false,
      seatIndex: 2,
      isBot: true,
      winPlace: null,
      leftGame: false,
      gameId: 3,
      avatarId: "default",
      seasonRating: 750,
    },
    {
      id: "player-3",
      name: "Нурлан",
      cardCount: 8,
      isOut: false,
      seatIndex: 3,
      isBot: false,
      winPlace: null,
      leftGame: false,
      gameId: 4,
      avatarId: "default",
      seasonRating: 1450,
    },
  ],
};

const noop = () => {};

export default function DemoGame() {
  return (
    <GameTable
      gameState={mockGameState}
      availableActions={mockGameState.availableActions}
      turnTimer={20}
      onPlayCard={noop}
      onTransferCard={noop}
      onTakeCards={noop}
      onPassTurn={noop}
      onEndAttack={noop}
      onSkipTurn={noop}
      onShowPassThrough={noop}
      onLeaveGame={noop}
      onReturnToLobby={noop}
      musicEnabled={false}
    />
  );
}
