import { useEffect, useMemo, useState } from 'react';
import { useGame } from './hooks/useGame';  
import { useLeaderboard } from './hooks/useLeaderboard'; 
import { GameStatus } from './types/game';
import { connectSocket } from './api/socket'; 
import './App.css'


import Lobby from './components/Lobby';
import Board from './components/Board';
import GameStatusDisplay from './components/GameStatusDisplay';
import Leaderboard from './components/Leaderboard';



const App = () => {
    
    const { 
        gameState, 
        error, 
        socketId, 
        joinQueue, 
        makeMove 
    } = useGame();

    const {
        leaderboard,
        isLoading: leaderboardLoading
    } = useLeaderboard();

   
    const [showLeaderboard, setShowLeaderboard] = useState(false);

 
    useEffect(() => {
       
        connectSocket(); 
    }, []);

   

    const isMyTurn = !!(socketId && gameState.currentPlayerId === socketId);

   
    const { currentPlayer, opponent } = useMemo(() => {
        const currentPlayer = gameState.players.find(p => p.id === socketId);
        const opponent = gameState.players.find(p => p.id !== socketId);
        return { currentPlayer, opponent };
    }, [gameState.players, socketId]);
   

    if (gameState.status === GameStatus.WAITING) {
       
        const lobbyStatus = 
            gameState.id ? 
            'Waiting for an opponent to connect...' : 
            'Searching for a game...';

        
        return (
            <div className="app-container">
                <Lobby onJoinQueue={joinQueue} statusMessage={gameState.id ? lobbyStatus : undefined} />
                
              
                {!showLeaderboard ? (
                    <button className="leaderboard-toggle-btn" onClick={() => setShowLeaderboard(true)}>
                        View Leaderboard
                    </button>
                ) : (
                    <>
                        <button className="leaderboard-toggle-btn" onClick={() => setShowLeaderboard(false)}>
                            Hide Leaderboard
                        </button>
                        <Leaderboard leaderboard={leaderboard} isLoading={leaderboardLoading} />
                    </>
                )}
            </div>
        );
    }

    
    
    
    return (
        <div className="app-container">

            <header className="game-header">
                <h1>Connect Four</h1>
                
                <div className="player-display">
                    
                    <p>You ({currentPlayer?.username || 'Player'}) vs. {opponent?.username || 'Opponent'}</p>
                </div>
            </header>



            <GameStatusDisplay 
                status={gameState.status}
                players={gameState.players}
                currentPlayerId={gameState.currentPlayerId}
                winnerId={gameState.winnerId}
                socketId={socketId}
            />
            
            
            {error && <p className="error-message">{String(error)}</p>}
            
            
            {(gameState.status === GameStatus.IN_PROGRESS || gameState.status === GameStatus.ENDED) && (
            <Board 
                board={gameState.board}
                onColumnClick={makeMove}
                isTurn={isMyTurn}
            />
            )}

            {gameState.status === GameStatus.ENDED && (
                <button 
                    onClick={() => joinQueue(gameState.players.find(p => p.id === socketId)!.username)}
                    className="rematch-button"
                >
                    Play Again
                </button>
            )}
        </div>
    );
};

export default App;