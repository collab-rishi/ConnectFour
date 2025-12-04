import { Game, Board, GameStatus } from '../models';
import { BOARD_ROWS, BOARD_COLS, EMPTY, PLAYER_ONE, PLAYER_TWO } from '../config';
import { leaderboardService } from './Leaderboard'; 


export class GameLogicService {
  
  
  public isValidMove(game: Game, column: number): boolean {
  
    if (column < 0 || column >= BOARD_COLS) {
      return false;
    }
    
   
    if (game.board[0][column] === EMPTY) {
      return true;
    }
    
    return false;
  }

  
  public makeMove(board: Board, column: number, playerPiece: number): { newBoard: Board, row: number } {
    
    const newBoard = board.map(row => [...row]);
    let landingRow = -1;

   
    for (let row = BOARD_ROWS - 1; row >= 0; row--) {
      if (newBoard[row][column] === EMPTY) {
        newBoard[row][column] = playerPiece;
        landingRow = row;
        break;
      }
    }
    
   
    return { newBoard, row: landingRow };
  }

  public checkWin(board: Board, lastRow: number, lastCol: number, playerPiece: number): boolean {
   
    return (
      this.checkHorizontal(board, lastRow, playerPiece) ||
      this.checkVertical(board, lastCol, playerPiece) ||
      this.checkDiagonalPositive(board, lastRow, lastCol, playerPiece) || 
      this.checkDiagonalNegative(board, lastRow, lastCol, playerPiece)    
    );
  }

  
  private checkHorizontal(board: Board, lastRow: number, playerPiece: number): boolean {
    let count = 0;
    for (let col = 0; col < BOARD_COLS; col++) {
      if (board[lastRow][col] === playerPiece) {
        count++;
      } else {
        count = 0;
      }
      if (count >= 4) return true;
    }
    return false;
  }

  private checkVertical(board: Board, lastCol: number, playerPiece: number): boolean {
    let count = 0;
    for (let row = 0; row < BOARD_ROWS; row++) {
      if (board[row][lastCol] === playerPiece) {
        count++;
      } else {
        
        count = 0; 
      }
      if (count >= 4) return true;
    }
    return false;
  }

  
  private checkDiagonalPositive(board: Board, lastRow: number, lastCol: number, playerPiece: number): boolean {
    let count = 0;
    
    let startRow = lastRow;
    let startCol = lastCol;
    while (startRow < BOARD_ROWS - 1 && startCol > 0) {
      startRow++;
      startCol--;
    }

    while (startRow >= 0 && startCol < BOARD_COLS) {
      if (board[startRow][startCol] === playerPiece) {
        count++;
      } else {
        count = 0;
      }
      if (count >= 4) return true;
      
      startRow--; 
      startCol++; 
    }
    return false;
  }

  
  private checkDiagonalNegative(board: Board, lastRow: number, lastCol: number, playerPiece: number): boolean {
    let count = 0;
    
    
    let startRow = lastRow;
    let startCol = lastCol;
    while (startRow > 0 && startCol > 0) {
      startRow--;
      startCol--;
    }

    
    while (startRow < BOARD_ROWS && startCol < BOARD_COLS) {
      if (board[startRow][startCol] === playerPiece) {
        count++;
      } else {
        count = 0;
      }
      if (count >= 4) return true;

      startRow++; 
      startCol++; 
    }
    return false;
  }

  
  public checkDraw(board: Board): boolean {
    
    for (let col = 0; col < BOARD_COLS; col++) {
      if (board[0][col] === EMPTY) {
        return false; 
      }
    }
    return true; 
  }
  
  
  public getNextPlayerId(game: Game): string {
    const currentPlayerIndex = game.players.findIndex(p => p.id === game.currentPlayerId);
    
    if (currentPlayerIndex === 0) {
      return game.players[1].id;
    } else if (currentPlayerIndex === 1) {
      return game.players[0].id;
    }
    
   
    return game.players[0].id;
  }
  
  
  public concludeGame(game: Game, winnerId: string | null): void {
    
    game.status = GameStatus.ENDED;
    game.winnerId = winnerId;
    
    console.log(`[Game End] Game ${game.id} concluded. Winner ID: ${winnerId ?? 'Draw'}`);
    
    
    leaderboardService.saveCompletedGame(game)
      .catch(error => console.error('Error persisting completed game or updating leaderboard:', error));
      
    
  }
}


export const gameLogicService = new GameLogicService();