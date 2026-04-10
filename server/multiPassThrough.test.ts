import { describe, expect, it } from "vitest";
import { showMultiplePassThroughs } from "./gameEngine";
import type { GameState, Card, Direction } from "../shared/gameTypes";

/**
 * Tests for showMultiplePassThroughs:
 * - Multiple 10s should change direction based on odd/even count
 * - Non-10 cards should not change direction
 */

function makeCard(id: string, rank: string, suit: string): Card {
  return { id, rank, suit };
}

function createMinimalGameState(overrides: Partial<GameState> = {}): GameState {
  const trumpSuit = "♠";
  return {
    roomId: "test-room",
    players: [
      {
        id: "p0", name: "Alice", hand: [], isActive: true, isReady: false,
        openId: "o0", avatarId: 1, equippedFrame: null, rating: 1000,
        afkStrikes: 0, consecutiveAfkStrikes: 0,
      },
      {
        id: "p1", name: "Bob", hand: [], isActive: true, isReady: false,
        openId: "o1", avatarId: 2, equippedFrame: null, rating: 1000,
        afkStrikes: 0, consecutiveAfkStrikes: 0,
      },
      {
        id: "p2", name: "Charlie", hand: [
          makeCard("c1", "A", "♠"), makeCard("c2", "A", "♥"),
          makeCard("c3", "K", "♠"), makeCard("c4", "K", "♥"),
          makeCard("c5", "Q", "♠"), makeCard("c6", "Q", "♥"),
        ], isActive: true, isReady: false,
        openId: "o2", avatarId: 3, equippedFrame: null, rating: 1000,
        afkStrikes: 0, consecutiveAfkStrikes: 0,
      },
    ],
    deck: [],
    battleField: [{ attack: makeCard("atk1", "10", "♥"), defense: null }],
    trumpInfo: { currentTrump: trumpSuit, originalTrump: trumpSuit },
    trumpCard: null,
    currentAttackerIdx: 0,
    currentDefenderIdx: 1,
    direction: "cw" as Direction,
    leadCardRank: "10",
    turnPhase: "defense",
    defenderTaking: false,
    passedAttackers: [],
    attackerHasPriority: false,
    revealedPassThroughs: [],
    passThroughUsedIds: [],
    gameOver: false,
    winners: [],
    dupiara: null,
    turnTimer: null,
    turnTimerDuration: 30,
    lastTurnTimerReset: Date.now(),
    roundNumber: 1,
    isFirstRound: false,
    settings: {
      maxPlayers: 3,
      deckSize: 36,
      turnTimer: 30,
      bet: 0,
      allowKickVote: true,
    },
    kickVotes: {},
    exitedPlayers: [],
    ...overrides,
  } as unknown as GameState;
}

describe("showMultiplePassThroughs — direction changes", () => {
  it("one 10 reverses direction (cw → ccw)", () => {
    const state = createMinimalGameState();
    // Give Bob (defender, idx=1) one trump 10
    state.players[1].hand = [makeCard("t10a", "10", "♠")];
    // Give Alice (idx=0) enough cards so the pass-through is valid
    // When direction reverses to ccw, next defender from Bob(1) going ccw is Alice(0)
    state.players[0].hand = [
      makeCard("a1", "A", "♥"), makeCard("a2", "K", "♥"),
    ];

    const err = showMultiplePassThroughs(state, 1, ["t10a"]);
    expect(err).toBeNull();
    expect(state.direction).toBe("ccw");
  });

  it("two 10s ALSO reverse direction (multiple tens = one change)", () => {
    const state = createMinimalGameState();
    state.players[1].hand = [
      makeCard("t10a", "10", "♠"),
      makeCard("t10b", "10", "♠"),
    ];
    // Give Alice enough cards (next defender when direction reverses)
    state.players[0].hand = [
      makeCard("a1", "A", "♥"), makeCard("a2", "K", "♥"),
    ];

    const err = showMultiplePassThroughs(state, 1, ["t10a", "t10b"]);
    expect(err).toBeNull();
    expect(state.direction).toBe("ccw"); // one direction change regardless of count
  });

  it("three 10s reverse direction (odd count)", () => {
    const state = createMinimalGameState();
    state.players[1].hand = [
      makeCard("t10a", "10", "♠"),
      makeCard("t10b", "10", "♠"),
      makeCard("t10c", "10", "♠"),
    ];
    // Give Alice enough cards (next defender when direction reverses)
    state.players[0].hand = [
      makeCard("a1", "A", "♥"), makeCard("a2", "K", "♥"),
    ];

    const err = showMultiplePassThroughs(state, 1, ["t10a", "t10b", "t10c"]);
    expect(err).toBeNull();
    expect(state.direction).toBe("ccw");
  });

  it("non-10 trump cards do not change direction", () => {
    // Attack with a non-10 rank
    const state = createMinimalGameState({
      battleField: [{ attack: makeCard("atk1", "A", "♥"), defense: null }],
      leadCardRank: "A",
    });
    state.players[1].hand = [makeCard("tAa", "A", "♠")];

    const err = showMultiplePassThroughs(state, 1, ["tAa"]);
    expect(err).toBeNull();
    expect(state.direction).toBe("cw"); // no change
  });

  it("rejects non-defender player", () => {
    const state = createMinimalGameState();
    state.players[0].hand = [makeCard("t10a", "10", "♠")];

    const err = showMultiplePassThroughs(state, 0, ["t10a"]);
    expect(err).not.toBeNull();
  });

  it("rejects non-trump cards", () => {
    const state = createMinimalGameState();
    // Give Bob a non-trump 10
    state.players[1].hand = [makeCard("t10a", "10", "♥")];

    const err = showMultiplePassThroughs(state, 1, ["t10a"]);
    expect(err).not.toBeNull();
  });

  it("rejects cards with wrong rank", () => {
    const state = createMinimalGameState();
    // Give Bob a trump card with wrong rank
    state.players[1].hand = [makeCard("tKa", "K", "♠")];

    const err = showMultiplePassThroughs(state, 1, ["tKa"]);
    expect(err).not.toBeNull();
  });
});
