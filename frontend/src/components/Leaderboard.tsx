import React from 'react';
import type { LeaderboardPlayer } from '../types/game';

interface LeaderboardProps {
    leaderboard: LeaderboardPlayer[];
    isLoading: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ leaderboard, isLoading }) => {
    if (isLoading) {
        return (
            <div className="leaderboard-container">
                <div className="leaderboard-loading">Loading Leaderboard...</div>
            </div>
        );
    }

    if (!leaderboard || leaderboard.length === 0) {
        return (
            <div className="leaderboard-container">
                <div className="leaderboard-empty">No scores recorded yet.</div>
            </div>
        );
    }

    return (
        <div className="leaderboard-container">
            <h2>🏆 Top Players</h2>
            <table className="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Wins</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.map((entry, index) => (
                        <tr key={entry.username}>
                            <td className="leaderboard-rank">#{index + 1}</td>
                            <td className="leaderboard-player">{entry.username}</td>
                            <td className="leaderboard-wins">{entry.wins}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Leaderboard;