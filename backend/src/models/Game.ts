
export type Board = number[][];


import { Player } from './Player';


export enum GameStatus {

  WAITING = 'WAITING',

  IN_PROGRESS = 'IN_PROGRESS',

  ENDED = 'ENDED',
}


export interface Game {

  id: string;

  board: Board;

  players: [Player, Player];

  currentPlayerId: string;
  
  status: GameStatus;
  
  winnerId: string | null;
 
  createdAt: number;
  
  isBotGame: boolean;
  
  disconnectTimeout: NodeJS.Timeout | null;
}