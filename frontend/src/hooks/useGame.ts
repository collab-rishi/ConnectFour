import { useState, useEffect, useCallback } from 'react';
import type { GameState } from '../types/game';
import { GameStatus } from '../types/game';
import { socket, emitJoinQueue, emitMakeMove, onGameUpdate, onError } from '../api/socket';


const INITIAL_STATE: GameState = {
    id: '',
    board: Array.from({ length: 7 }, () => Array(6).fill(0)), 
    players: [],
    currentPlayerId: '',
    status: GameStatus.WAITING,
    winnerId: null,
    isBotGame: false,
};


export const useGame = () => {
    const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
    const [error, setError] = useState<string | null>(null);
    const [username, setUsername] = useState<string>('');
    const [currentSocketId, setCurrentSocketId] = useState<string | null>(null);


    const joinQueue = useCallback((name: string) => {
        setUsername(name);
        emitJoinQueue(name);
        setError(null);
    }, []);

    
    const makeMove = useCallback((column: number) => {
        if (gameState.status !== GameStatus.IN_PROGRESS) return;
        
        
        if (currentSocketId && gameState.currentPlayerId === currentSocketId) {
            emitMakeMove(column);
        } else {
            setError("It's not your turn.");
        }
    }, [gameState, currentSocketId]);


    useEffect(() => {
        const handleConnect = () => setCurrentSocketId(socket.id ?? null);
        const handleDisconnect = () => setCurrentSocketId(null);
        
        
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        
        if (socket.connected) {
            setCurrentSocketId(socket.id ?? null);
        }


        
        const handleGameUpdate = (newState: GameState) => {
            setGameState(newState);
            setError(null); 
        };
        onGameUpdate(handleGameUpdate);

       
        const handleError = (message: string) => {
            setError(message);
        };
        onError(handleError);
        
        
        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('game_update', handleGameUpdate);
            socket.off('error', handleError);
        };
    }, []); 

    
    return {
        gameState,
        error,
        username,
        socketId: currentSocketId,
        joinQueue,
        makeMove,
    };
};