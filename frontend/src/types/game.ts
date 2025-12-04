export type Token = 0 | 1 | 2;


export type Board = Token[][];


export const GameStatus = {
    WAITING: 'WAITING',
    IN_PROGRESS: 'IN_PROGRESS',
    ENDED: 'ENDED',
} as const; 


export type GameStatus = typeof GameStatus[keyof typeof GameStatus];

export interface Player {
    id: string;
    username: string;
}

export interface GameState {
    id: string;
    board: Board;
    players: Player[];
    currentPlayerId: string;
    status: GameStatus;
    winnerId: string | null;
    isBotGame: boolean;
}

export interface Move {
    gameId: string;
    column: number;
}



export interface LeaderboardPlayer {
    username: string;
    wins: number;
}