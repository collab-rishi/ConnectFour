export interface Player {

  id: string;
  username: string;
  socketId: string;
}


export interface LeaderboardPlayer {
  username: string;
  wins: number;
}