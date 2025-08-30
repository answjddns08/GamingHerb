import {
	joinRoom,
	getRoomDetails,
	deleteRoom,
	broadCastToRoom,
	findPlayerByWs,
	getGameState,
	setGameState,
	updateRoomStatus,
} from "../utils/roomManage.js";
import GomokuGame from "../games/gomoku.js";
import ReversiGame from "../games/reversi.js";

/** @typedef {import('../utils/roomManage').Room} Room */

// Maps game IDs to their corresponding game logic class
const gameLogicMap = {
	Gomoku: GomokuGame,
	Reversi: ReversiGame,
	// Add other games here in the future
	// Chess: ChessGame,
};

/**
 * WebSocket server setup for handling game rooms and in-game actions.
 * @param {import("ws").Server} wss
 */
function setupWebsocket(wss) {
	wss.on("connection", (ws, request) => {
		console.log("WebSocket client connected");

		ws.on("message", (message) => {
			console.log("received: %s", message);

			let data;
			try {
				data = JSON.parse(message);
			} catch (error) {
				console.error("Invalid JSON received:", error);
				return;
			}

			const { gameId, roomName, userId, userName, action } = data;

			switch (data.type) {
				case "join": {
					joinRoom(gameId, roomName, userId, userName, ws);
					const room = getRoomDetails(gameId, roomName);
					if (!room) {
						ws.send(JSON.stringify({ error: "Room not found" }));
						return;
					}

					// Send initial room details to the joining player
					ws.send(
						JSON.stringify({
							type: "initialize",
							settings: room.settings,
							players: Array.from(room.players.values()).map((p) => ({
								userId: p.userId,
								userName: p.userName,
								isReady: p.isReady,
							})),
							hostId: room.hostId,
						})
					);

					// Notify other players
					broadCastToRoom(
						gameId,
						roomName,
						{
							type: "playerJoined",
							player: { userId, userName, isReady: false },
						},
						ws
					);
					break;
				}

				case "waiting": {
					const room = getRoomDetails(gameId, roomName);
					if (!room) return;

					const player = room.players.get(userId);
					if (!player) return;

					if (action.type === "setReady") {
						player.isReady = action.payload.isReady;
						broadCastToRoom(gameId, roomName, {
							type: "playerReadyState",
							payload: { userId, isReady: player.isReady },
						});

						// Check if all players are ready to start the game
						const allReady = Array.from(room.players.values()).every(
							(p) => p.isReady
						);
						if (room.players.size >= 2 && allReady) {
							const GameClass = gameLogicMap[gameId];
							if (GameClass) {
								const game = new GameClass();
								setGameState(gameId, roomName, game);
								updateRoomStatus(gameId, roomName, "active");
								broadCastToRoom(gameId, roomName, {
									type: "gameStart",
									payload: game.getState(),
								});
							}
						}
					}
					break;
				}

				case "inGame": {
					const room = getRoomDetails(gameId, roomName);
					const game = getGameState(gameId, roomName);
					if (!room || !game) return;

					switch (action.type) {
						case "game:move": {
							const { row, col } = action.payload;
							// Determine player color by their join order (1st is black)
							const playerIds = Array.from(room.players.keys());
							const playerIndex = playerIds.indexOf(userId);
							const playerColor = playerIndex === 0 ? "black" : "white";

							if (game.placeStone(row, col, playerColor)) {
								broadCastToRoom(gameId, roomName, {
									type: "game:updateState",
									payload: game.getState(),
								});
							}
							break;
						}
						case "game:surrender": {
							const playerIds = Array.from(room.players.keys());
							const playerIndex = playerIds.indexOf(userId);
							const playerColor = playerIndex === 0 ? "black" : "white";

							game.surrender(playerColor);
							broadCastToRoom(gameId, roomName, {
								type: "game:updateState",
								payload: game.getState(),
							});
							updateRoomStatus(gameId, roomName, "waiting");
							break;
						}
						case "game:restart:request": {
							const room = getRoomDetails(gameId, roomName);
							if (!room) return;

							// 요청자 ID 저장
							room.restartRequest.requesterId = userId;
							room.restartRequest.status = "pending";

							// 상대방에게 재시작 요청 알림
							const opponentPlayer = Array.from(room.players.values()).find(
								(p) => p.userId !== userId
							);
							if (opponentPlayer) {
								opponentPlayer.ws.send(
									JSON.stringify({
										type: "game:restart:requested",
										payload: { requesterId: userId, requesterName: userName },
									})
								);
							}
							break;
						}
						case "game:restart:accept": {
							const room = getRoomDetails(gameId, roomName);
							const game = getGameState(gameId, roomName);
							if (
								!room ||
								!game ||
								room.restartRequest.status !== "pending" ||
								room.restartRequest.requesterId === userId
							) {
								return; // 유효하지 않은 요청
							}

							game.reset();
							room.restartRequest.status = "none"; // 요청 상태 초기화

							broadCastToRoom(gameId, roomName, {
								type: "game:updateState",
								payload: game.getState(),
							});
							broadCastToRoom(gameId, roomName, {
								type: "game:restart:accepted",
								payload: { accepterId: userId },
							});
							break;
						}
						case "game:restart:decline": {
							const room = getRoomDetails(gameId, roomName);
							if (
								!room ||
								room.restartRequest.status !== "pending" ||
								room.restartRequest.requesterId === userId
							) {
								return; // 유효하지 않은 요청
							}

							room.restartRequest.status = "none"; // 요청 상태 초기화

							broadCastToRoom(gameId, roomName, {
								type: "game:restart:declined",
								payload: { declinerId: userId },
							});
							break;
						}

						case "player:loaded": {
							const room = getRoomDetails(gameId, roomName);
							const game = getGameState(gameId, roomName);
							if (room && game) {
								const players = Array.from(room.players.values()).map((p) => ({
									userId: p.userId,
									userName: p.userName,
								}));
								ws.send(
									JSON.stringify({
										type: "game:initialState",
										payload: {
											gameState: game.getState(),
											players: players,
										},
									})
								);
							}
							break;
						}
					}
					break; // This break closes the inGame case
				}

				case "chat:message": {
					broadCastToRoom(
						gameId,
						roomName,
						{
							type: "chat:message",
							payload: {
								userId,
								userName,
								text: action.payload.text,
								timestamp: Date.now(),
							},
						},
						ws // broadcast to others
					);
					break;
				}

				case "leave": {
					// Handle leave logic
					break;
				}
			}
		});

		ws.on("close", () => {
			console.log("WebSocket client disconnected");
			// Comprehensive cleanup logic should be implemented here
		});

		ws.on("error", (error) => {
			console.error("WebSocket error:", error);
		});
	});
}

export default setupWebsocket;
