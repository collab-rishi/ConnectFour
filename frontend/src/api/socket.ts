import { io, Socket } from 'socket.io-client';
import type{ GameState, LeaderboardPlayer } from '../types/game';
import dotenv from "dotenv";
dotenv.config();


const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL;


export const socket: Socket = io(SOCKET_SERVER_URL);


export const connectSocket = (): void => {
    
    socket.on('connect', () => {
        console.log('Connected to backend server.');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from backend server.');
    });

    socket.on('connect_error', (err) => {
        
        console.error('Connection error:', err.message);
    });
};

export const emitJoinQueue = (username: string): void => {
    socket.emit('join_queue', username);
};


export const emitMakeMove = (column: number): void => {
    
    socket.emit('make_move', column);
};


export const emitReconnectGame = (gameId: string): void => {
    socket.emit('reconnect_game', gameId);
};


export const emitFetchLeaderboard = (): void => {
    socket.emit('fetch_leaderboard');
};



export const onGameUpdate = (callback: (state: GameState) => void): void => {
   
    socket.on('game_update', callback);
};


export const onError = (callback: (message: string) => void): void => {
    
    socket.on('error', callback);
};



export const onLeaderboardUpdate = (callback: (data: LeaderboardPlayer[]) => void): void => {
    socket.on('leaderboard_update', callback);
};