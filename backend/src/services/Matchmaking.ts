import { Player, Game } from '../models';
import { gameStateService } from './GameState';
import { BOT_PLAYER_ID, competitiveBotService } from './CompetitiveBot';
import { MATCHMAKING_TIMEOUT_MS } from '../config';
import { Socket } from 'socket.io';  

export interface MatchResult {
  newGame: Game;
  opponentSocketId: string;
}

const waitingQueue: Player[] = [];
const botTimeouts: Map<string, NodeJS.Timeout> = new Map();

export class MatchmakingService {
  
  public enqueuePlayer(player: Player, socket: Socket): MatchResult | null {
    
    if (waitingQueue.length > 0) {
      const opponent = waitingQueue.shift()!; 
      this.dequeuePlayer(opponent.id); 

      
      const newGame = gameStateService.createGame(player, opponent, false);

      console.log(`[Matchmaking] PvP Match found: ${player.username} vs ${opponent.username}`);

      
      return { 
        newGame: newGame, 
        opponentSocketId: opponent.socketId,
      };
    } else {
      waitingQueue.push(player);

     
      const timeout = setTimeout(() => {
        this.startBotGame(player, socket);
      }, MATCHMAKING_TIMEOUT_MS);

      botTimeouts.set(player.id, timeout);

      
      socket.emit('waiting_for_opponent', { 
        timeout_ms: MATCHMAKING_TIMEOUT_MS,
        message: `Searching for opponent. If no one joins in ${MATCHMAKING_TIMEOUT_MS / 1000} seconds, you will play the Bot.`,
      });

      console.log(`[Matchmaking] ${player.username} added to queue. Bot fallback timer started.`);

      return null; 
    }
  }

  
  private startBotGame(player: Player, socket: Socket): void {
    
    if (!waitingQueue.find(p => p.id === player.id)) {
      return; 
    }

    
    this.dequeuePlayer(player.id); 

    
    const bot: Player = {
      id: BOT_PLAYER_ID,
      username: 'CompetitiveBot',
      socketId: BOT_PLAYER_ID, 
    };

    
    const game = gameStateService.createGame(player, bot, true);
    const gameRoom = game.id;

   
    socket.join(gameRoom);

    console.log(`[Matchmaking] Bot game started: ${player.username} vs CompetitiveBot in ${gameRoom}`);

   
    socket.emit('game_update', game);
  }


  public dequeuePlayer(playerId: string): void {
    const index = waitingQueue.findIndex(p => p.id === playerId);
    if (index !== -1) {
      waitingQueue.splice(index, 1);
    }

    const timeout = botTimeouts.get(playerId);
    if (timeout) {
      clearTimeout(timeout);
      botTimeouts.delete(playerId);
    }
  }
}


export const matchmakingService = new MatchmakingService();
