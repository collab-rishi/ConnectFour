import { Game, Board, Player, GameStatus } from '../models';
import { BOARD_ROWS, BOARD_COLS, EMPTY } from '../config';
import { BOT_PLAYER_ID } from './CompetitiveBot';
import crypto from 'crypto';

const activeGames: Map<string, Game> = new Map();
const playerToGameMap: Map<string, string> = new Map();

export class GameStateService {
  public getGameMap(): Map<string, Game> {
    return activeGames;
  }

  public createGame(player1: Player, player2: Player, isBotGame: boolean): Game {
    const gameId = crypto.randomUUID();

    const board: Board = Array(BOARD_ROWS)
      .fill(0)
      .map(() => Array(BOARD_COLS).fill(EMPTY));

    const startingPlayerId = player1.id;

    const newGame: Game = {
      id: gameId,
      board: board,
      players: [player1, player2],
      currentPlayerId: startingPlayerId,
      status: GameStatus.IN_PROGRESS,
      winnerId: null,
      createdAt: Date.now(),
      isBotGame: isBotGame,
      disconnectTimeout: null,
    };

    activeGames.set(gameId, newGame);
    playerToGameMap.set(player1.id, gameId);
    playerToGameMap.set(player2.id, gameId);

    console.log(`[GameState] New game created: ${gameId} (${player1.username} vs ${player2.username})`);

    return newGame;
  }

  public getGameById(gameId: string): Game | undefined {
    return activeGames.get(gameId);
  }

  public getGameByPlayerId(playerId: string): Game | undefined {
    const gameId = playerToGameMap.get(playerId);
    return gameId ? this.getGameById(gameId) : undefined;
  }

  public getGameBySocketId(socketId: string): Game | undefined {
    for (const game of activeGames.values()) {
      if (game.players.some(p => p.socketId === socketId)) {
        return game;
      }
    }
    return undefined;
  }

  public getGameByUsername(username: string): Game | undefined {
    for (const game of activeGames.values()) {
      if (game.players.some(p => p.username === username)) {
        return game;
      }
    }
    return undefined;
  }

  public updateGame(game: Game): void {
    activeGames.set(game.id, game);
  }

  public updatePlayerSocketId(playerId: string, newSocketId: string): void {
    const game = this.getGameByPlayerId(playerId);
    if (game) {
      const player = game.players.find(p => p.id === playerId);
      if (player) {
        player.socketId = newSocketId;
        this.updateGame(game);
      }
    }
  }

  public removeGame(gameId: string): void {
    const game = activeGames.get(gameId);
    if (game) {
      game.players.forEach(player => {
        if (player.id !== BOT_PLAYER_ID) {
          playerToGameMap.delete(player.id);
        }
      });

      this.clearDisconnectTimeout(gameId);
      activeGames.delete(gameId);
      console.log(`[GameState] Game ${gameId} removed from memory.`);
    }
  }

  public clearDisconnectTimeout(gameId: string): void {
    const game = activeGames.get(gameId);

    if (game && game.disconnectTimeout) {
      clearTimeout(game.disconnectTimeout);
      game.disconnectTimeout = null;
      this.updateGame(game);
      console.log(`[GameState] Disconnect timeout cleared for game ${gameId}.`);
    }
  }
}

export const gameStateService = new GameStateService();
