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
					// 재연결인지 확인 (같은 userId가 이미 있는지)
					const room = getRoomDetails(gameId, roomName);
					if (room && room.players.has(userId)) {
						// 재연결: WebSocket만 업데이트
						const existingPlayer = room.players.get(userId);
						existingPlayer.ws = ws;
						existingPlayer.disconnected = false;

						// 재연결 타이머가 있다면 취소
						if (existingPlayer.disconnectTimer) {
							clearTimeout(existingPlayer.disconnectTimer);
							existingPlayer.disconnectTimer = null;
						}

						console.log(`Player ${userId} reconnected to room ${roomName}`);

						// 재연결 알림
						broadCastToRoom(
							gameId,
							roomName,
							{
								type: "playerReconnected",
								playerId: userId,
								playerName: userName,
							},
							ws
						);
					} else {
						// 새로운 연결
						joinRoom(gameId, roomName, userId, userName, ws);
					}

					const updatedRoom = getRoomDetails(gameId, roomName);
					if (!updatedRoom) {
						ws.send(JSON.stringify({ error: "Room not found" }));
						return;
					}

					// Send initial room details to the joining player
					ws.send(
						JSON.stringify({
							type: "initialize",
							settings: updatedRoom.settings,
							players: Array.from(updatedRoom.players.values()).map((p) => ({
								userId: p.userId,
								userName: p.userName,
								isReady: p.isReady,
								disconnected: p.disconnected || false,
							})),
							hostId: updatedRoom.hostId,
						})
					);

					// 새 연결인 경우에만 다른 플레이어들에게 알림
					if (!room || !room.players.has(userId)) {
						broadCastToRoom(
							gameId,
							roomName,
							{
								type: "playerJoined",
								player: { userId, userName, isReady: false },
							},
							ws
						);
					}
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
					} else if (action.type === "startGame") {
						// 호스트만 게임 시작 가능
						if (userId === room.hostId) {
							const nonHostPlayers = Array.from(room.players.values()).filter(
								(p) => p.userId !== userId
							);
							const allNonHostReady = nonHostPlayers.every((p) => p.isReady);

							if (room.players.size >= 2 && allNonHostReady) {
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

		// 연결 해제 처리 (유예 기간 적용)
		ws.on("close", () => {
			console.log("WebSocket client disconnected");
			handlePlayerDisconnectWithGrace(ws);
		});

		// 에러 처리
		ws.on("error", (error) => {
			console.error("WebSocket error:", error);
			handlePlayerDisconnectWithGrace(ws);
		});
	});
}

/**
 * 유예 기간을 두고 플레이어 연결 해제 처리
 * @param {WebSocket} ws - 끊어진 WebSocket 연결
 */
function handlePlayerDisconnectWithGrace(ws) {
	console.log("Handling player disconnect with grace period...");

	// 끊어진 WebSocket의 플레이어 정보 찾기
	const playerInfo = findPlayerByWs(ws);
	if (playerInfo) {
		const { userId, gameId, roomName, room } = playerInfo;
		const player = room.players.get(userId);

		if (player) {
			// 플레이어를 연결 해제 상태로 표시 (즉시 제거하지 않음)
			player.disconnected = true;
			player.ws = null; // WebSocket 참조 제거

			console.log(
				`Player ${userId} marked as disconnected from room ${roomName}`
			);

			// 다른 플레이어들에게 연결 해제 알림
			broadCastToRoom(gameId, roomName, {
				type: "playerDisconnected",
				playerId: userId,
				playerName: player.userName,
				isTemporary: true, // 임시 연결 해제임을 표시
			});

			// 30초 후 완전 제거 타이머 설정
			player.disconnectTimer = setTimeout(() => {
				console.log(
					`Grace period expired for player ${userId}, removing permanently`
				);

				// 플레이어 완전 제거
				room.players.delete(userId);

				// 다른 플레이어들에게 완전 제거 알림
				broadCastToRoom(gameId, roomName, {
					type: "playerLeft",
					playerId: userId,
					playerName: player.userName,
					reason: "timeout",
				});

				// 방이 비었거나 호스트가 나간 경우 방 삭제
				if (room.players.size === 0 || room.hostId === userId) {
					if (room.players.size > 0) {
						broadCastToRoom(gameId, roomName, {
							type: "roomDeleted",
							reason: "Host disconnected",
						});
					}
					deleteRoom(gameId, roomName);
					console.log(`Room ${roomName} deleted due to timeout`);
				}

				// 게임 중이었다면 게임 상태 처리
				if (room.status === "active") {
					broadCastToRoom(gameId, roomName, {
						type: "gameInterrupted",
						reason: "playerDisconnected",
						disconnectedPlayer: player.userName,
					});
					updateRoomStatus(gameId, roomName, "interrupted");
				}
			}, 30000); // 30초 유예 기간
		}
	}
}

export default setupWebsocket;
