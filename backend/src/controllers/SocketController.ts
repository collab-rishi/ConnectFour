import { Server, Socket } from 'socket.io';
import { matchmakingService } from '../services/Matchmaking';
import { gameStateService } from '../services/GameState';
import { gameLogicService } from '../services/GameLogic';
import { competitiveBotService, BOT_PLAYER_ID } from '../services/CompetitiveBot';
import { Player, GameStatus, Game } from '../models';
import { RECONNECT_TIMEOUT_MS } from '../config';
import { leaderboardService } from '../services/Leaderboard';


const GAME_END_DELAY_MS = 500;

export class SocketController {
	private io: Server;

	constructor(io: Server) {
		this.io = io;
		this.io.on('connection', this.onConnection);
	}

	private handleMatchFound(game: Game, opponentSocketId: string): void {
		

		const opponentSocket = this.io.sockets.sockets.get(opponentSocketId);
		
		if (!opponentSocket) {
			console.error(`[Matchmaking Error] Could not find opponent socket ID: ${opponentSocketId}`);
			return;
		}

		const gameRoom = game.id;

		opponentSocket.join(gameRoom);
		
		this.io.to(gameRoom).emit('game_update', game);

		console.log(`[Game Start] PvP Game ${gameRoom} started. Sent initial state to both players.`);
	}

	
	private onConnection = (socket: Socket) => {
		
		console.log(`[Socket] Client connected: ${socket.id}`);
		
	
		socket.on('join_queue', (username: string) => this.handleJoinQueue(socket, username));
		socket.on('make_move', (column: number) => this.handleMakeMove(socket, column));
		socket.on('rejoin_game', (username: string) => this.handleRejoinGame(socket, username));
		socket.on('disconnect', () => this.handleDisconnect(socket));
		socket.on('match_found', (payload: { game: Game, opponentSocketId: string }) => 
			this.handleMatchFound(payload.game, payload.opponentSocketId)
		);

		socket.on('fetch_leaderboard', async () => {
			try {
				const leaderboard = await leaderboardService.getLeaderboard(10);
				socket.emit('leaderboard_update', leaderboard);
			} catch (error) {
				console.error('Error fetching leaderboard:', error);
			}
		});
	}

	
	private handleJoinQueue(socket: Socket, username: string): void {
		const playerId = socket.id;
		const trimmedUsername = username.trim();

		
		const endedGame = Array.from(gameStateService.getGameMap().values()).find(
			(g: Game) => g.status === GameStatus.ENDED && g.players.some((p: Player) => p.username === trimmedUsername)
		);

		if (endedGame) {
			
			gameStateService.removeGame(endedGame.id);
			console.log(`[Cleanup] Ended game ${endedGame.id} removed for player ${trimmedUsername}.`);
		}
		
		const player: Player = {
			id: playerId,
			username: trimmedUsername,
			socketId: playerId,
		};
		
		
		const matchResult = matchmakingService.enqueuePlayer(player, socket);
		
		if (matchResult) {
				const { newGame, opponentSocketId } = matchResult;
				
				
				socket.join(newGame.id);
				
				
				const opponentSocket = this.io.sockets.sockets.get(opponentSocketId);
				
				if (opponentSocket) {
					
						opponentSocket.join(newGame.id);
				} else {
						console.error(`[Matchmaking Error] Opponent socket not found for broadcast: ${opponentSocketId}`);
						
				}

				
				this.io.to(newGame.id).emit('game_update', newGame);
				
				console.log(`[Game Start] PvP Game ${newGame.id} started. Broadcasted state.`);
		} else {
				console.log(`[Queue] Player ${trimmedUsername} added to matchmaking queue.`);
		}
	}
	
	
	private handleRejoinGame(socket: Socket, username: string): void {
		
		const game = gameStateService.getGameByUsername(username);

		if (!game) {
			socket.emit('rejoin_failed', { message: 'No active or recent game found for this user.' });
			return;
		}
		
		gameStateService.clearDisconnectTimeout(game.id);
		
		const playerToRejoin = game.players.find(p => p.username === username);
		if (playerToRejoin) {
			playerToRejoin.socketId = socket.id;
			gameStateService.updatePlayerSocketId(playerToRejoin.id, socket.id);
		}

		socket.join(game.id);

		socket.emit('game_rejoined', game);
		
		socket.to(game.id).emit('player_reconnected', { username: playerToRejoin?.username });
		
		console.log(`[Rejoin] Player ${username} reconnected to game ${game.id}`);
	}

	private handleMakeMove(socket: Socket, column: number): void {
		const playerId = socket.id;
		const game = gameStateService.getGameBySocketId(playerId);
		
		if (!game) {
			socket.emit('error', { message: 'You are not in an active game.' });
			return;
		}
		
		const gameRoom = game.id;

		
		const activePlayer = game.players.find(p => p.socketId === playerId);

		if (!activePlayer) { 
				socket.emit('error', { message: 'Player ID not found in game state.' });
				return;
		}

		const activePlayerGameId = activePlayer.id; 

		
		if (game.currentPlayerId !== activePlayerGameId) { 
			socket.emit('move_rejected', { message: 'It is not your turn.' });
			return;
		}
		
		
		if (game.status === GameStatus.ENDED) {
			socket.emit('move_rejected', { message: 'The game has already ended.' });
			return;
		}

	
		if (!gameLogicService.isValidMove(game, column)) {
			socket.emit('move_rejected', { message: 'Invalid column or column is full.' });
			return;
		}
		
		const currentPlayerPiece = game.currentPlayerId === game.players[0].id ? 1 : 2;
		
		
		const { newBoard, row } = gameLogicService.makeMove(game.board, column, currentPlayerPiece);
		game.board = newBoard;

		
		const isWin = gameLogicService.checkWin(game.board, row, column, currentPlayerPiece);
		const isDraw = !isWin && gameLogicService.checkDraw(game.board);
		
		if (isWin || isDraw) {
			
			
			console.log(`[Game Status] Game ${game.id} - Win: ${isWin}, Draw: ${isDraw}`);
			
			
			game.status = GameStatus.ENDED; 
			
			
			const winnerId = isWin ? game.currentPlayerId : null;
			game.winnerId = winnerId;
			
			
			gameStateService.updateGame(game); 
			this.io.to(gameRoom).emit('game_update', game); 

			
			setTimeout(() => {
				
				gameLogicService.concludeGame(game, winnerId); 

				
				this.io.to(gameRoom).emit('game_end', game);
				
				console.log(`[Game Over] Game ${game.id} ended. Winner: ${winnerId} (Sent after ${GAME_END_DELAY_MS}ms delay)`);
			}, GAME_END_DELAY_MS);
			
			return;
		} 


		game.currentPlayerId = gameLogicService.getNextPlayerId(game);
		gameStateService.updateGame(game);
		
		
		this.io.to(gameRoom).emit('game_update', game);
				
		
		const nextPlayerIsBot = game.currentPlayerId === BOT_PLAYER_ID;
		if (nextPlayerIsBot) {
			setTimeout(() => this.handleBotMove(game), 500); 
		}
	}
	

	private handleBotMove(game: Game): void {

		const column = competitiveBotService.getBotMove(game);
		
		this.processBotMove(game, column);
	}
	

	private processBotMove(game: Game, column: number): void {
		if (game.status !== GameStatus.IN_PROGRESS || game.currentPlayerId !== BOT_PLAYER_ID) {
				console.warn(`[Bot Skip] Game ${game.id} state invalid for bot move.`);
				return;
		}
		const gameRoom = game.id;
		const currentPlayerPiece = game.currentPlayerId === game.players[0].id ? 1 : 2;
		
		const { newBoard, row } = gameLogicService.makeMove(game.board, column, currentPlayerPiece);
		game.board = newBoard;
		
		const isWin = gameLogicService.checkWin(game.board, row, column, currentPlayerPiece);
		const isDraw = !isWin && gameLogicService.checkDraw(game.board);
		
		console.log(`[Bot Move] Game ${game.id}, Column ${column}, Win: ${isWin}`);

		if (isWin || isDraw) {
			
			console.log(`[Game Status] Game ${game.id} - Win: ${isWin}, Draw: ${isDraw}`);

			game.status = GameStatus.ENDED; 

			const winnerId = isWin ? game.currentPlayerId : null;
			game.winnerId = winnerId;
			
			gameStateService.updateGame(game); 
			this.io.to(gameRoom).emit('game_update', game); 

			setTimeout(() => {
				gameLogicService.concludeGame(game, winnerId);
				
				this.io.to(gameRoom).emit('game_end', game);
				
				console.log(`[Game Over] Bot Game ${game.id} ended. Winner: ${winnerId} (Sent after ${GAME_END_DELAY_MS}ms delay)`);
			}, GAME_END_DELAY_MS);
			
			return;
		} 
		
		game.currentPlayerId = gameLogicService.getNextPlayerId(game);
		gameStateService.updateGame(game);
		this.io.to(gameRoom).emit('game_update', game);
	}


	private handleDisconnect(socket: Socket): void {
		const playerId = socket.id;
		console.log(`[Socket] Client disconnected: ${playerId}`);
		
		matchmakingService.dequeuePlayer(playerId);
		
		const game = gameStateService.getGameBySocketId(playerId);
		if (!game || game.status === GameStatus.ENDED) return; 
		
		const timeout = setTimeout(() => {
			this.handleForfeitTimeout(game.id, playerId);
		}, RECONNECT_TIMEOUT_MS);
		
		game.disconnectTimeout = timeout;
		gameStateService.updateGame(game);
		
		const opponent = game.players.find(p => p.socketId !== playerId) || game.players.find(p => p.id !== BOT_PLAYER_ID);
		if (opponent) {
			socket.to(game.id).emit('player_disconnected', { 
				message: `${opponent.username} has disconnected. They have ${RECONNECT_TIMEOUT_MS / 1000} seconds to rejoin.`,
				reconnect_time_ms: RECONNECT_TIMEOUT_MS
			});
		}
	}
	

	private handleForfeitTimeout(gameId: string, forfeitedPlayerSocketId: string): void {
		const game = gameStateService.getGameById(gameId);

		if (!game || game.status === GameStatus.ENDED) return;

		
		const forfeitedPlayer = game.players.find(p => p.socketId === forfeitedPlayerSocketId);
		
		const winner = game.players.find(p => p.socketId !== forfeitedPlayerSocketId && p.id !== BOT_PLAYER_ID); 

		if (!winner) {
			
			if (game.isBotGame && forfeitedPlayer?.id === BOT_PLAYER_ID) {
					console.log(`[Forfeit Skip] Bot disconnected from game ${gameId}. No human opponent to notify.`);
					return;
			}
			console.error(`[Forfeit] Cannot find human winner for game ${gameId}.`);
			return;
		}

		const winnerId = winner.id;
		
		console.log(`[Forfeit] Player ${forfeitedPlayer?.username} forfeited game ${gameId}. Winner: ${winner.username}`);
		
		game.winnerId = winnerId;
		game.status = GameStatus.ENDED;
		
		gameLogicService.concludeGame(game, winnerId); 

		this.io.to(gameId).emit('game_forfeit', { 
			winnerId: winnerId,
			forfeitedUsername: forfeitedPlayer?.username,
			message: `${forfeitedPlayer?.username} failed to rejoin and forfeited the game. You win!`
		});
		
	}
}