import { Game, Board } from '../models';
import { PLAYER_ONE, PLAYER_TWO, BOARD_COLS, BOARD_ROWS, EMPTY } from '../config';
import { gameLogicService } from './GameLogic';


export const BOT_PLAYER_ID = 'COMPETITIVE_BOT';

export class CompetitiveBotService {

 
  public getBotMove(game: Game): number {
   
    const botPlayer = game.players.find(p => p.id === BOT_PLAYER_ID)!;
    const opponent = game.players.find(p => p.id !== BOT_PLAYER_ID)!;
    
   
    const botPiece = botPlayer.id === game.players[0].id ? PLAYER_ONE : PLAYER_TWO;
    const opponentPiece = opponent.id === game.players[0].id ? PLAYER_ONE : PLAYER_TWO;

    
    const validColumns = this.getValidColumns(game);
    if (validColumns.length === 0) return -1; 

    
    let winningMove = this.findWinningMove(game, validColumns, botPiece);
    if (winningMove !== -1) {
      console.log(`[Bot Strategy] Winning move found: Column ${winningMove}`);
      return winningMove;
    }

    
    let blockingMove = this.findWinningMove(game, validColumns, opponentPiece);
    if (blockingMove !== -1) {
      console.log(`[Bot Strategy] Blocking move found: Column ${blockingMove}`);
      return blockingMove;
    }
    
    
    const preferredOrder = [3, 2, 4, 1, 5, 0, 6]; 
    
    for (const col of preferredOrder) {
      if (validColumns.includes(col)) {
        
        console.log(`[Bot Strategy] Default/Center move chosen: Column ${col}`);
        return col;
      }
    }
    
    
    console.warn(`[Bot Strategy] Fallback to random move.`);
    return validColumns[Math.floor(Math.random() * validColumns.length)];
  }

  
  private getValidColumns(game: Game): number[] {
    const validColumns: number[] = [];
    for (let col = 0; col < BOARD_COLS; col++) {
      if (game.board[0][col] === EMPTY) { 
        validColumns.push(col);
      }
    }
    return validColumns;
  }

  
  private findWinningMove(game: Game, validColumns: number[], piece: number): number {
    for (const col of validColumns) {
      
      const { newBoard, row } = gameLogicService.makeMove(game.board, col, piece);
      
      const isWin = gameLogicService.checkWin(newBoard, row, col, piece);

      if (isWin) {
        return col;
      }
    }
    return -1;
  }
}

export const competitiveBotService = new CompetitiveBotService();