import { useState, useEffect, useCallback } from 'react';
import type { LeaderboardPlayer } from '../types/game';
import { socket, onLeaderboardUpdate, emitFetchLeaderboard } from '../api/socket';


export const useLeaderboard = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

   
    const refreshLeaderboard = useCallback(() => {
        setIsLoading(true);
        emitFetchLeaderboard();
    }, []);

    useEffect(() => {
   
        const handleLeaderboardUpdate = (data: LeaderboardPlayer[]) => {
            setLeaderboard(data);
            setIsLoading(false);
            setError(null);
        };

        onLeaderboardUpdate(handleLeaderboardUpdate);

       
        refreshLeaderboard();


        return () => {
            socket.off('leaderboard_update', handleLeaderboardUpdate);
        };
    }, [refreshLeaderboard]);

    return {
        leaderboard,
        isLoading,
        error,
        refreshLeaderboard,
    };
};
