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
import WaitingMiniGame from "../games/waitingMiniGame.js";

/** @typedef {import('../utils/roomManage.js').Room} Room */

// Maps game IDs to their corresponding game logic class
const gameLogicMap = {
	GomokuGame: GomokuGame,
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

			// 안전하게 속성 추출 (undefined 방지)
			const { gameId, roomName, userId, userName, action, type } = data || {};

			// 필수 속성 검증
			if (!type) {
				console.error("Message type is required");
				return;
			}

			switch (type) {
				case "join": {
					// #region Join Room

					// join 메시지에 필요한 속성 검증
					if (!gameId || !roomName || !userId || !userName) {
						console.error("Join message missing required properties:", {
							gameId,
							roomName,
							userId,
							userName,
						});
						ws.send(
							JSON.stringify({
								type: "error",
								message: "Join message missing required properties",
							})
						);
						return;
					}

					// 재연결인지 확인 (같은 userId가 이미 있는지)
					const room = getRoomDetails(gameId, roomName);
					let isReconnecting = false;

					if (room && room.players.has(userId)) {
						// 재연결: WebSocket만 업데이트
						const existingPlayer = room.players.get(userId);
						existingPlayer.ws = ws;
						existingPlayer.disconnected = false;
						isReconnecting = true;

						// 재연결 타이머가 있다면 취소
						if (existingPlayer.disconnectTimer) {
							clearTimeout(existingPlayer.disconnectTimer);
							existingPlayer.disconnectTimer = null;
						}

						console.log(`Player ${userId} reconnected to room ${roomName}`);

						// 재연결 알림 (자신 제외)
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
						const joinResult = joinRoom(gameId, roomName, userId, userName, ws);
						if (!joinResult) {
							ws.send(
								JSON.stringify({
									type: "error",
									message: "Failed to join room",
								})
							);
							return;
						}
					}

					const updatedRoom = getRoomDetails(gameId, roomName);
					if (!updatedRoom) {
						ws.send(
							JSON.stringify({ type: "error", message: "Room not found" })
						);
						return;
					}

					// 미니게임 인스턴스 초기화 (아직 초기화되지 않았다면)
					if (!updatedRoom.miniGameInstance.gameId) {
						updatedRoom.miniGameInstance.initialize(gameId, roomName);
					}

					// Send initial room details to the joining/reconnecting player
					ws.send(
						JSON.stringify({
							type: "initialize",
							settings: updatedRoom.settings,
							players: Array.from(updatedRoom.players.values()).map((p) => ({
								userId: p.userId,
								userName: p.username,
								isReady: p.isReady,
								disconnected: p.disconnected || false,
							})),
							hostId: updatedRoom.hostId,
						})
					);

					// 새 연결인 경우에만 다른 플레이어들에게 알림
					if (!isReconnecting) {
						broadCastToRoom(
							gameId,
							roomName,
							{
								type: "playerJoined",
								player: { userId: userId, userName: userName, isReady: false },
							},
							ws
						);
					}
					break;

					// #endregion
				}

				case "waiting": {
					// #region Waiting Room Actions

					// waiting 메시지에 필요한 속성 검증
					if (!gameId || !roomName || !userId || !action) {
						console.error("Waiting message missing required properties:", {
							gameId,
							roomName,
							userId,
							action,
						});
						return;
					}

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
						// Ready 상태만 브로드캐스트하고 자동 게임 시작은 제거
						// 호스트만 게임을 시작할 수 있도록 함
					} else if (action.type === "chat") {
						// 대기방 채팅 처리
						if (action.payload?.text) {
							broadCastToRoom(
								gameId,
								roomName,
								{
									type: "waitingChat",
									payload: {
										userId,
										userName,
										text: action.payload.text,
										timestamp: Date.now(),
									},
								},
								ws
							);
						}
					} else if (action.type === "kickUser") {
						// 호스트만 플레이어를 강퇴할 수 있음
						if (userId === room.hostId && action.payload?.targetUserId) {
							const targetUserId = action.payload.targetUserId;
							const targetPlayer = room.players.get(targetUserId);

							if (targetPlayer && targetUserId !== room.hostId) {
								// 강퇴당한 플레이어에게 알림
								try {
									targetPlayer.ws.send(
										JSON.stringify({
											type: "playerKicked",
											playerId: targetUserId,
										})
									);
								} catch (error) {
									console.error("Failed to notify kicked player:", error);
								}

								// 방에서 플레이어 제거
								room.players.delete(targetUserId);

								// 다른 플레이어들에게 알림
								broadCastToRoom(gameId, roomName, {
									type: "playerKicked",
									playerId: targetUserId,
								});

								console.log(
									`Player ${targetUserId} was kicked from room ${roomName} by host ${userId}`
								);
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
									// 방 설정을 게임에 전달
									const gameSettings = room.settings || {};
									const game = new GameClass(gameSettings);

									// 타이머가 활성화된 경우에만 타이머 시작
									if (
										game.settings.timerEnabled &&
										game.settings.playerTimeLimit > 0
									) {
										// 타이머 콜백 설정
										game.startTimer(
											// 타이머 업데이트 콜백
											(timerData) => {
												broadCastToRoom(gameId, roomName, {
													type: "game:timerUpdate",
													payload: timerData,
												});
											},
											// 시간 초과 콜백
											(timeoutData) => {
												broadCastToRoom(gameId, roomName, {
													type: "game:timeout",
													payload: timeoutData,
												});
												updateRoomStatus(gameId, roomName, "waiting");
											}
										);
										room.gameTimerActive = true;
									} else {
										room.gameTimerActive = false;
									}

									setGameState(gameId, roomName, game);
									updateRoomStatus(gameId, roomName, "active");
									broadCastToRoom(gameId, roomName, {
										type: "gameStart",
										payload: game.getState(),
									});
								}
							}
						}
					} else if (action.type === "miniGame") {
						console.log(`Player ${userId} sent mini-game action.`);

						// 미니게임 인스턴스에서 모든 게임 로직과 브로드캐스팅 처리
						room.miniGameInstance.handleGame(ws, userName, action.payload);
					}
					break;

					// #endregion
				}

				case "inGame": {
					// #region In-Game Actions

					// inGame 메시지에 필요한 속성 검증
					if (!gameId || !roomName || !userId || !action) {
						console.error("InGame message missing required properties:", {
							gameId,
							roomName,
							userId,
							action,
						});
						return;
					}

					const room = getRoomDetails(gameId, roomName);
					const game = getGameState(gameId, roomName);
					if (!room || !game) return;

					// 채팅 메시지 처리
					if (action.type === "chat:message") {
						if (action.payload?.text) {
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
								ws
							);
						}
						break;
					}

					// 게임 클래스의 handleAction 메서드를 호출
					const result = game.handleAction(action, userId, room);

					if (result.success) {
						// 방 상태 업데이트가 필요한 경우
						if (result.shouldUpdateRoomStatus) {
							updateRoomStatus(gameId, roomName, result.shouldUpdateRoomStatus);
						}

						// 특정 플레이어에게만 전송하는 경우
						if (result.targetPlayer && result.response) {
							try {
								result.targetPlayer.ws.send(JSON.stringify(result.response));
							} catch (error) {
								console.error(
									"Failed to send message to target player:",
									error
								);
							}
						}
						// 요청한 플레이어에게만 전송하는 경우
						else if (!result.shouldBroadcast && result.response) {
							ws.send(JSON.stringify(result.response));
						}
						// 모든 플레이어에게 브로드캐스트하는 경우
						else if (result.shouldBroadcast) {
							if (result.responses) {
								// 여러 응답이 있는 경우
								result.responses.forEach((response) => {
									broadCastToRoom(gameId, roomName, response);
								});
							} else if (result.response) {
								// 단일 응답인 경우
								broadCastToRoom(gameId, roomName, result.response);
							}
						}
					}
					break;

					// #endregion
				}

				case "leave": {
					// #region Leave Room

					// 의도적으로 나가는 경우 - 유예 기간 없이 즉시 제거
					const playerInfo = findPlayerByWs(ws);
					if (playerInfo) {
						const {
							userId,
							gameId: playerGameId,
							roomName: playerRoomName,
							room,
						} = playerInfo;

						// 재연결 타이머가 있다면 취소
						const player = room.players.get(userId);
						if (player && player.disconnectTimer) {
							clearTimeout(player.disconnectTimer);
						}

						// 진행 중인 재시작 요청이 있다면 취소
						if (
							room.restartRequest &&
							room.restartRequest.status === "pending"
						) {
							room.restartRequest.status = "none";
							broadCastToRoom(playerGameId, playerRoomName, {
								type: "game:restart:cancelled",
								payload: {
									reason: "playerLeft",
									leftPlayer: player?.username || "Unknown",
								},
							});
						}

						// 플레이어 즉시 제거
						room.players.delete(userId);

						// 다른 플레이어들에게 알림
						broadCastToRoom(playerGameId, playerRoomName, {
							type: "playerLeft",
							playerId: userId,
							playerName: player?.username || "Unknown",
							reason: "intentional",
						});

						// 방이 비었거나 호스트가 나간 경우 방 삭제
						if (room.players.size === 0 || room.hostId === userId) {
							if (room.players.size > 0) {
								broadCastToRoom(playerGameId, playerRoomName, {
									type: "roomDeleted",
									reason: "Host left",
								});
							}
							deleteRoom(playerGameId, playerRoomName);
							console.log(
								`Room ${playerRoomName} deleted - host left intentionally`
							);
						}

						console.log(
							`Player ${userId} left room ${playerRoomName} intentionally`
						);
					}
					break;

					// #endregion
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
				playerName: player.username,
				isTemporary: true, // 임시 연결 해제임을 표시
			});

			// 진행 중인 재시작 요청이 있다면 취소
			if (room.restartRequest && room.restartRequest.status === "pending") {
				room.restartRequest.status = "none";
				broadCastToRoom(gameId, roomName, {
					type: "game:restart:cancelled",
					payload: {
						reason: "playerDisconnected",
						disconnectedPlayer: player.username,
					},
				});
			}

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
					playerName: player.username,
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
						disconnectedPlayer: player.username,
					});
					updateRoomStatus(gameId, roomName, "interrupted");
				}
			}, 30000); // 30초 유예 기간
		}
	}
}

export default setupWebsocket;
