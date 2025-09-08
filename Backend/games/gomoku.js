class GomokuGame {
	constructor() {
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
				// 요청자 ID 저장
				room.restartRequest.requesterId = userId;
				room.restartRequest.status = "pending";

				// 상대방 찾기
				const opponentPlayer = Array.from(room.players.values()).find(
					(p) => p.userId !== userId
				);

				return {
					success: true,
					response: {
						type: "game:restart:requested",
						payload: {
							requesterId: userId,
							requesterName: room.players.get(userId)?.username || "Unknown",
						},
					},
					targetPlayer: opponentPlayer,
				};
			}

			case "game:restart:accept": {
				if (
					room.restartRequest.status !== "pending" ||
					room.restartRequest.requesterId === userId
				) {
					return { success: false };
				}

				this.reset();
				room.restartRequest.status = "none";

				return {
					success: true,
					responses: [
						{
							type: "game:updateState",
							payload: this.getState(),
						},
						{
							type: "game:restart:accepted",
							payload: { accepterId: userId },
						},
					],
					shouldBroadcast: true,
				};
			}

			case "game:restart:decline": {
				if (
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
						payload: { declinerId: userId },
					},
					shouldBroadcast: true,
				};
			}

			case "player:loaded": {
				const players = Array.from(room.players.values()).map((p) => ({
					userId: p.userId,
					userName: p.username,
				}));

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

			default:
				return { success: false };
		}
	}
}

export default GomokuGame;
