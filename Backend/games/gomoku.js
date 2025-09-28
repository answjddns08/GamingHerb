class GomokuGame {
	constructor(settings = {}) {
		this.settings = {
			playerTimeLimit: 60, // 기본값 60초
			...settings,
		};
		this.playerTimers = {
			black: this.settings.playerTimeLimit,
			white: this.settings.playerTimeLimit,
		};
		this.timerInterval = null;
		this.reset();
	}

	// 게임 상태 초기화
	reset() {
		this.board = Array(15)
			.fill(null)
			.map(() => Array(15).fill(null));
		this.currentPlayer = "black"; // 흑돌부터 시작
		this.gameOver = false;
		this.winner = null;
		this.moveCount = 0;

		// 타이머 초기화
		this.playerTimers = {
			black: this.settings.playerTimeLimit,
			white: this.settings.playerTimeLimit,
		};
		this.clearTimer();
	}

	// 타이머 시작
	startTimer(onTimerUpdate, onTimeOut) {
		this.clearTimer();
		this.onTimerUpdate = onTimerUpdate;
		this.onTimeOut = onTimeOut;

		this.timerInterval = setInterval(() => {
			if (!this.gameOver && this.playerTimers[this.currentPlayer] > 0) {
				this.playerTimers[this.currentPlayer]--;

				// 타이머 업데이트 콜백 호출
				if (this.onTimerUpdate) {
					this.onTimerUpdate({
						black: this.playerTimers.black,
						white: this.playerTimers.white,
						currentPlayer: this.currentPlayer,
					});
				}

				// 시간 초과 확인
				if (this.playerTimers[this.currentPlayer] <= 0) {
					this.handleTimeOut();
				}
			}
		}, 1000);
	}

	// 타이머 정지
	clearTimer() {
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}

	// 시간 초과 처리
	handleTimeOut() {
		this.gameOver = true;
		this.winner = this.currentPlayer === "black" ? "white" : "black";
		this.clearTimer();

		if (this.onTimeOut) {
			this.onTimeOut({
				winner: this.winner,
				reason: "timeout",
			});
		}
	}

	// 돌 놓기
	placeStone(row, col, player) {
		if (
			this.gameOver ||
			!this.isValidMove(row, col) ||
			player !== this.currentPlayer
		) {
			return false; // 놓을 수 없는 경우
		}

		this.board[row][col] = player;
		this.moveCount++;

		if (this.checkWin(row, col)) {
			this.gameOver = true;
			this.winner = player;
		} else if (this.moveCount === 15 * 15) {
			this.gameOver = true;
			this.winner = "draw"; // 무승부
		} else {
			// 턴 변경
			this.currentPlayer = this.currentPlayer === "black" ? "white" : "black";
		}

		return true; // 성공적으로 놓음
	}

	isValidMove(row, col) {
		return (
			row >= 0 &&
			row < 15 &&
			col >= 0 &&
			col < 15 &&
			this.board[row][col] === null
		);
	}

	// 승리 조건 확인
	checkWin(row, col) {
		const player = this.board[row][col];
		if (!player) return false;

		// 4가지 방향 (가로, 세로, 대각선 2개)
		const directions = [
			{ x: 1, y: 0 }, // 가로
			{ x: 0, y: 1 }, // 세로
			{ x: 1, y: 1 }, // 대각선 (오른쪽 아래)
			{ x: 1, y: -1 }, // 대각선 (오른쪽 위)
		];

		for (const dir of directions) {
			let count = 1;
			// 정방향 체크
			for (let i = 1; i < 5; i++) {
				const x = row + i * dir.x;
				const y = col + i * dir.y;
				if (
					x >= 0 &&
					x < 15 &&
					y >= 0 &&
					y < 15 &&
					this.board[x][y] === player
				) {
					count++;
				} else {
					break;
				}
			}
			// 역방향 체크
			for (let i = 1; i < 5; i++) {
				const x = row - i * dir.x;
				const y = col - i * dir.y;
				if (
					x >= 0 &&
					x < 15 &&
					y >= 0 &&
					y < 15 &&
					this.board[x][y] === player
				) {
					count++;
				} else {
					break;
				}
			}

			if (count >= 5) {
				return true;
			}
		}

		return false;
	}

	// 항복 처리
	surrender(player) {
		if (this.gameOver) return;
		this.gameOver = true;
		this.winner = player === "black" ? "white" : "black"; // 항복한 플레이어의 반대편이 승리
	}

	// 현재 게임 상태 반환
	getState() {
		return {
			board: this.board,
			currentPlayer: this.currentPlayer,
			gameOver: this.gameOver,
			winner: this.winner,
			moveCount: this.moveCount,
			playerTimers: this.playerTimers,
			settings: this.settings,
		};
	}

	/**
	 * 게임 액션을 처리하는 중앙 메서드
	 * @param {Object} action - 액션 객체 { type, payload }
	 * @param {string} userId - 액션을 수행하는 사용자 ID
	 * @param {Object} room - 방 정보 (플레이어 목록 등)
	 * @returns {Object} - { success: boolean, response?: Object, shouldBroadcast?: boolean }
	 */
	handleAction(action, userId, room) {
		const playerIds = Array.from(room.players.keys());
		const playerIndex = playerIds.indexOf(userId);
		const playerColor = playerIndex === 0 ? "black" : "white";

		switch (action.type) {
			case "game:move": {
				const { row, col } = action.payload;
				if (this.placeStone(row, col, playerColor)) {
					return {
						success: true,
						response: {
							type: "game:updateState",
							payload: this.getState(),
						},
						shouldBroadcast: true,
					};
				}
				return { success: false };
			}

			case "game:surrender": {
				this.surrender(playerColor);
				return {
					success: true,
					response: {
						type: "game:updateState",
						payload: this.getState(),
					},
					shouldBroadcast: true,
					shouldUpdateRoomStatus: "waiting",
				};
			}

			case "game:restart:request": {
				// 이미 재시작 요청이 있는 경우
				if (room.restartRequest && room.restartRequest.status === "pending") {
					// 다른 플레이어가 이미 요청을 보낸 경우 - 자동 승인
					if (room.restartRequest.requesterId !== userId) {
						this.reset();

						// 방 관련 게임 설정 초기화
						room.restartRequest.status = "none";
						room.playerColors = new Map(); // 플레이어 색상 선택 초기화
						room.gameTimerActive = false; // 타이머 비활성화

						return {
							success: true,
							response: {
								type: "game:restart:accepted",
								payload: {
									message: "양측이 재시작에 동의했습니다.",
									gameState: this.getState(),
								},
							},
							shouldBroadcast: true,
						};
					}
					// 같은 플레이어가 다시 요청하는 경우는 무시
					return { success: false };
				}

				// 첫 번째 재시작 요청
				if (!room.restartRequest) {
					room.restartRequest = {};
				}
				room.restartRequest.requesterId = userId;
				room.restartRequest.status = "pending";

				return {
					success: true,
					response: {
						type: "game:restart:requested",
						payload: {
							requesterId: userId,
							requesterName: room.players.get(userId)?.username || "Unknown",
						},
					},
					shouldBroadcast: true,
				};
			}

			case "game:restart:accept": {
				if (
					!room.restartRequest ||
					room.restartRequest.status !== "pending" ||
					room.restartRequest.requesterId === userId
				) {
					return { success: false };
				}

				this.reset();

				// 방 관련 게임 설정 초기화
				room.restartRequest.status = "none";
				room.playerColors = new Map(); // 플레이어 색상 선택 초기화
				room.gameTimerActive = false; // 타이머 비활성화

				return {
					success: true,
					response: {
						type: "game:restart:accepted",
						payload: {
							accepterId: userId,
							gameState: this.getState(),
						},
					},
					shouldBroadcast: true,
				};
			}

			case "game:restart:decline": {
				if (
					!room.restartRequest ||
					room.restartRequest.status !== "pending" ||
					room.restartRequest.requesterId === userId
				) {
					return { success: false };
				}

				room.restartRequest.status = "none";

				return {
					success: true,
					response: {
						type: "game:restart:declined",
						payload: {
							declinerId: userId,
							declinerName: room.players.get(userId)?.username || "Unknown",
						},
					},
					shouldBroadcast: true,
				};
			}

			// 플레이어가 나갔을 때 재시작 요청 취소
			case "player:left": {
				if (room.restartRequest && room.restartRequest.status === "pending") {
					room.restartRequest.status = "none";

					return {
						success: true,
						response: {
							type: "game:restart:cancelled",
							payload: {
								reason: "playerLeft",
								message: "상대방이 나갔습니다.",
							},
						},
						shouldBroadcast: true,
					};
				}
				return { success: true };
			}

			// 플레이어가 일시적으로 연결이 끊어졌을 때 재시작 요청 취소
			case "player:disconnected": {
				if (room.restartRequest && room.restartRequest.status === "pending") {
					room.restartRequest.status = "none";

					return {
						success: true,
						response: {
							type: "game:restart:cancelled",
							payload: {
								reason: "playerDisconnected",
								message: "상대방의 연결이 끊어졌습니다.",
							},
						},
						shouldBroadcast: true,
					};
				}
				return { success: true };
			}

			case "player:loaded": {
				// 플레이어 목록과 색상 정보 준비
				const players = {};
				room.players.forEach((player, playerId) => {
					players[playerId] = {
						userId: player.userId,
						userName: player.username,
						color: room.playerColors ? room.playerColors.get(playerId) : null,
					};
				});

				return {
					success: true,
					response: {
						type: "game:initialState",
						payload: {
							gameState: this.getState(),
							players: players,
						},
					},
					shouldBroadcast: false, // 요청한 플레이어에게만 전송
				};
			}

			case "game:selectColor": {
				const { color } = action.payload;

				// 플레이어 색상 정보 저장 (room에 저장)
				if (!room.playerColors) {
					room.playerColors = new Map();
				}

				// 색깔 선택 해제인 경우 (color가 null)
				if (color === null) {
					// 해당 플레이어의 색상 선택을 제거
					room.playerColors.delete(userId);

					return {
						success: true,
						response: {
							type: "game:selectColor",
							payload: {
								player: userId,
								color: null,
							},
						},
						shouldBroadcast: true,
					};
				}

				// 이미 다른 플레이어가 선택한 색상인지 확인 (null이 아닌 경우만)
				const existingPlayerWithColor = Array.from(
					room.playerColors.entries()
				).find(
					([playerId, playerColor]) =>
						playerId !== userId && playerColor === color
				);

				if (existingPlayerWithColor) {
					return { success: false }; // 이미 선택된 색상
				}

				// 색상 선택 저장
				room.playerColors.set(userId, color);

				// 양쪽 플레이어가 모두 색상을 선택했는지 확인
				const playerIds = Array.from(room.players.keys());
				const allColorsSelected =
					playerIds.length >= 2 &&
					playerIds.every((id) => {
						const playerColor = room.playerColors.get(id);
						return playerColor && playerColor !== null;
					});

				let gameStartResponse = null;
				if (allColorsSelected) {
					// 게임 시작
					this.gameOver = false;
					this.currentPlayer = "black"; // 흑돌부터 시작

					// 타이머 시작 (설정에서 타이머가 활성화된 경우)
					if (this.settings.timerEnabled !== false) {
						room.gameTimerActive = true;
					}

					gameStartResponse = {
						type: "game:started",
						payload: {
							gameState: this.getState(),
							message: "게임이 시작되었습니다!",
						},
					};
				}

				return {
					success: true,
					responses: gameStartResponse
						? [
								{
									type: "game:selectColor",
									payload: {
										player: userId,
										color: color,
									},
								},
								gameStartResponse,
						  ]
						: [
								{
									type: "game:selectColor",
									payload: {
										player: userId,
										color: color,
									},
								},
						  ],
					shouldBroadcast: true,
				};
			}

			default:
				return { success: false };
		}
	}
}

export default GomokuGame;
