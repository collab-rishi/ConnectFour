import React from 'react';
import { GameStatus } from '../types/game';
import type{ Player } from '../types/game';


interface GameStatusDisplayProps {
    status: GameStatus;
    players: Player[];
    currentPlayerId: string;
    winnerId: string | null;
    socketId: string | null; 
}


const GameStatusDisplay: React.FC<GameStatusDisplayProps> = ({
    status,
    players,
    currentPlayerId,
    winnerId,
    socketId,
}) => {

    // Helper to find a player by ID (which is the user's unique identifier)
    const getPlayerById = (id: string | null): Player | undefined => {
        if (!id) return undefined;
        return players.find(p => p.id === id);
    };

    // FIX: Use 'id' property of the Player object for matching, as 'socketId' is not defined on 'Player'.
    // We assume the unique 'id' on the Player object is what corresponds to the passed 'socketId'.
    const myPlayer = players.find(p => p.id === socketId);
    const myPlayerId = myPlayer?.id || null; 

    const isMyTurn = myPlayerId && currentPlayerId === myPlayerId;
    
    // FIX: Removed unused 'opponent' variable (TS6133)
    // const opponent = players.find(p => p.id !== myPlayerId); 

    let message = '';
    let statusClass = 'status-default'; 

    switch (status) {
        case GameStatus.WAITING:
            message = 'Waiting for the game to start...';
            statusClass = 'status-waiting';
            break;

        case GameStatus.IN_PROGRESS:
            if (isMyTurn) {
                message = '🟡 Your Turn!';
                statusClass = 'status-turn-me';
            } else {
                const currentPlayer = getPlayerById(currentPlayerId);
                message = `Waiting for ${currentPlayer?.username || 'Opponent'}...`;
                statusClass = 'status-turn-other';
            }
            break;

        case GameStatus.ENDED:
            if (winnerId) {
                const winner = getPlayerById(winnerId);
                
                if (myPlayerId && winnerId === myPlayerId) {
                    message = '🏆 You Win!';
                    statusClass = 'status-win';
                } else {
                    message = `😩 ${winner?.username || 'Opponent'} Wins!`;
                    statusClass = 'status-lose';
                }
            } else {
                message = '🤝 Game Ended in a Draw!';
                statusClass = 'status-draw';
            }
            break;

        default:
            message = 'Game state unknown.';
            statusClass = 'status-error';
    }

    return (
        <div className={`game-status-display ${statusClass}`}>
            
            <h3>{message}</h3>
            
            {myPlayer && status !== GameStatus.WAITING && (
                <p className="player-info">
                    You are {players.findIndex(p => p.id === myPlayer.id) === 0 ? 'Player 1' : 'Player 2'} (Token: {players.findIndex(p => p.id === myPlayer.id)! + 1})
                </p>
            )}
        </div>
    );
};

export default GameStatusDisplay;