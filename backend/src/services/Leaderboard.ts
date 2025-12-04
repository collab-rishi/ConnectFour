import { Game, LeaderboardPlayer, GameStatus } from '../models';

import prisma from '../db'; 
import { Prisma } from '@prisma/client';

type TransactionClient = Prisma.TransactionClient;
const BOT_PLAYER_ID = 'COMPETITIVE_BOT';


export class LeaderboardService {
  
  public async saveCompletedGame(game: Game): Promise<void> {
    if (game.status !== GameStatus.ENDED) {
      console.warn(`Attempted to save an in-progress game: ${game.id}`);
      return;
    }

    
    await prisma.$transaction(async (tx: TransactionClient) => {
    
      for (const player of game.players) {
        
        if (player.id === BOT_PLAYER_ID) continue;

        const isWinner = game.winnerId === player.id;

       
        await tx.player.upsert({
          where: { username: player.username }, 
          update: {
            wins: { increment: isWinner ? 1 : 0 },
            id: player.id,
          },
          create: {
            id: player.id,
            username: player.username,
            wins: isWinner ? 1 : 0, 
          },
        });
      }

      const duration = Date.now() - game.createdAt;

      await tx.gameHistory.create({
        data: {
          id: game.id, 
          status: game.status,
          duration: duration,
          boardSnapshot: game.board as any,
          isBotGame: game.isBotGame,

          winnerId: game.winnerId,
          p1Id: game.players[0].id,
          p2Id: game.players[1].id,
        },
      });

      console.log(`[Leaderboard] Game ${game.id} saved to history and wins updated.`);
    });
  }

  
  public async getLeaderboard(limit: number = 10): Promise<LeaderboardPlayer[]> {
    try {
      const topPlayers = await prisma.player.findMany({
        where: { id: { not: BOT_PLAYER_ID } },
        orderBy: [
          { wins: 'desc' },
          { createdAt: 'asc' },
        ],
        select: {
          username: true,
          wins: true,
        },
        take: limit,
      });

      return topPlayers as LeaderboardPlayer[];
    } catch (error) {
      console.error('Error retrieving leaderboard via Prisma:', error);
      return [];
    }
  }
}


export const leaderboardService = new LeaderboardService();
