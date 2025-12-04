import React, { useState, useCallback } from 'react';


interface LobbyProps {
    
    onJoinQueue: (username: string) => void;
    statusMessage?: string;
}


const Lobby: React.FC<LobbyProps> = ({ onJoinQueue, statusMessage }) => {

    const [usernameInput, setUsernameInput] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    
    const handleJoin = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const trimmedUsername = usernameInput.trim();

        
        if (trimmedUsername.length < 3) {
            setError('Username must be at least 3 characters long.');
            return;
        }

        if (trimmedUsername.length > 15) {
            setError('Username cannot exceed 15 characters.');
            return;
        }

        onJoinQueue(trimmedUsername);
        
    }, [usernameInput, onJoinQueue]);

    return (
        <div className="lobby-container">
            <h2>Welcome to Connect Four Online</h2>
            <p>Enter a username to join the matchmaking queue.</p>

            <form onSubmit={handleJoin} className="lobby-form">
                <input
                    type="text"
                    placeholder="Enter your username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    maxLength={15}
                    disabled={!!statusMessage} 
                />
                
                <button 
                    type="submit" 
                    disabled={usernameInput.trim().length < 3 || !!statusMessage}
                >
                    {statusMessage ? 'Searching for Opponent...' : 'Join Game Queue'}
                </button>
            </form>

            
            {error && <p className="error-message">{error}</p>}

           
            {statusMessage && (
                <div className="status-message">
                    <div className="spinner"></div> 
                    <p>{statusMessage}</p>
                </div>
            )}
        </div>
    );
};

export default Lobby;