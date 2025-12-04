import React, { useCallback, useState, useEffect, useRef } from 'react';

import type{ Board as BoardType, Token } from '../types/game';


interface BoardProps {
    board: BoardType;  
    onColumnClick: (col: number) => void; 
    isTurn: boolean; 
}



const Board: React.FC<BoardProps> = ({ board, onColumnClick, isTurn }) => {
    const [lastDroppedPiece, setLastDroppedPiece] = useState<{ row: number; col: number } | null>(null);
    
    const prevBoardRef = useRef<BoardType | null>(null);

    useEffect(() => {
        const prevBoard = prevBoardRef.current;
        let timer: ReturnType<typeof setTimeout>;
        
        if (prevBoard && board.length > 0) {
            let foundNewPiece = false;

            for (let r = 0; r < board.length; r++) {
                
                for (let c = 0; c < board[r].length; c++) {
                    const currentToken = board[r][c];
                    const previousToken = prevBoard[r] && prevBoard[r][c] !== undefined ? prevBoard[r][c] : 0;

                    if (currentToken !== 0 && previousToken === 0) {
                
                        setLastDroppedPiece({ row: r, col: c });
                        foundNewPiece = true;
                        
                       
                        timer = setTimeout(() => {
                            setLastDroppedPiece(null);
                        }, 500); 
                        
                        
                        break;
                    }
                }
                if (foundNewPiece) break;
            }
            
            
            if (!foundNewPiece) {
                setLastDroppedPiece(null);
            }
        }
        
        
        prevBoardRef.current = board.map(row => [...row]);
        
        return () => {
            if (timer) clearTimeout(timer); 
        };
        
    }, [board]);

    
    const handleColumnClick = useCallback((colIndex: number) => {
       
        if (!isTurn) {
            return;
        }

        if (board[0] && board[0][colIndex] === 0) {
             console.log(`Dropping piece in column ${colIndex}`);
             onColumnClick(colIndex);
        } else {
        
            console.log(`Column ${colIndex} is full or not your turn.`);
        }
    }, [isTurn, board, onColumnClick]);
    
    
    const getTokenClass = (token: Token) => {
        switch (token) {
            case 1:
                return 'token-player-1';
            case 2:
                return 'token-player-2';
            case 0:
            default:
                return 'token-empty';
        }
    };

    
    return (
        <div className="connect-four-container">
            
            <div className="column-click-area">
               
                {[...Array(6)].map((_, colIndex) => {
                   
                    const tokenAtTop = board[0] ? board[0][colIndex] : undefined;
                    
                    
                    const isActive = isTurn && tokenAtTop === 0;
                    
                    return (
                        <div 
                            key={colIndex}
                            className={`column-target ${isActive ? 'target-active' : 'target-inactive'}`}
                            
                            onClick={() => isActive && handleColumnClick(colIndex)}
                            role="button"
                            aria-label={`Drop piece in column ${colIndex + 1}`}
                        >
                           
                        </div>
                    );
                })}
            </div>

          
            <div className="connect-four-board">
                
                {board.map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                        
                        {row.map((token, colIndex) => {
                           
                            const isLastDropped = lastDroppedPiece && 
                                lastDroppedPiece.row === rowIndex && 
                                lastDroppedPiece.col === colIndex;
                                
                            return (
                                <div key={colIndex} className="board-cell">
                                    <div 
                                        className={`board-piece ${getTokenClass(token)} ${isLastDropped ? 'dropping' : ''}`}
                                    >
                                        
                                    </div>
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default Board;