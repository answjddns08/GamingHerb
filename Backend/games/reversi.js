class ReversiGame {
	constructor() {
		this.reset();
	}

	reset() {
		this.board = Array(8)
			.fill(null)
			.map(() => Array(8).fill(null));
		// Initial four pieces
		this.board[3][3] = "white";
		this.board[3][4] = "black";
		this.board[4][3] = "black";
		this.board[4][4] = "white";
		this.currentPlayer = "black";
		this.gameOver = false;
		this.winner = null;
		this.skips = 0;
	}

	placeStone(row, col, player) {
		if (this.gameOver || player !== this.currentPlayer) {
			return false;
		}

		const validFlips = this.getValidFlips(row, col, player);
		if (validFlips.length === 0) {
			return false;
		}

		// Place the stone and flip opponent's pieces
		this.board[row][col] = player;
		validFlips.forEach(([r, c]) => {
			this.board[r][c] = player;
		});

		// Switch player
		this.currentPlayer = this.currentPlayer === "black" ? "white" : "black";

		// Check for game end conditions
		if (!this.hasValidMove("black") && !this.hasValidMove("white")) {
			this.endGame();
		} else if (!this.hasValidMove(this.currentPlayer)) {
			// If the new player has no moves, skip their turn
			this.currentPlayer = this.currentPlayer === "black" ? "white" : "black";
			if (!this.hasValidMove(this.currentPlayer)) {
				// If the other player also has no moves, end the game
				this.endGame();
			}
		}

		return true;
	}

	getValidFlips(row, col, player) {
		if (this.board[row][col] !== null) {
			return [];
		}

		const opponent = player === "black" ? "white" : "black";
		const directions = [
			{ x: 0, y: 1 },
			{ x: 1, y: 1 },
			{ x: 1, y: 0 },
			{ x: 1, y: -1 },
			{ x: 0, y: -1 },
			{ x: -1, y: -1 },
			{ x: -1, y: 0 },
			{ x: -1, y: 1 },
		];
		let allFlips = [];

		directions.forEach((dir) => {
			let line = [];
			let r = row + dir.y;
			let c = col + dir.x;

			while (
				r >= 0 &&
				r < 8 &&
				c >= 0 &&
				c < 8 &&
				this.board[r][c] === opponent
			) {
				line.push([r, c]);
				r += dir.y;
				c += dir.x;
			}

			if (r >= 0 && r < 8 && c >= 0 && c < 8 && this.board[r][c] === player) {
				allFlips = allFlips.concat(line);
			}
		});

		return allFlips;
	}

	hasValidMove(player) {
		for (let r = 0; r < 8; r++) {
			for (let c = 0; c < 8; c++) {
				if (this.getValidFlips(r, c, player).length > 0) {
					return true;
				}
			}
		}
		return false;
	}

	endGame() {
		this.gameOver = true;
		let blackCount = 0;
		let whiteCount = 0;
		for (let r = 0; r < 8; r++) {
			for (let c = 0; c < 8; c++) {
				if (this.board[r][c] === "black") blackCount++;
				if (this.board[r][c] === "white") whiteCount++;
			}
		}

		if (blackCount > whiteCount) this.winner = "black";
		else if (whiteCount > blackCount) this.winner = "white";
		else this.winner = "draw";
	}

	getState() {
		let blackCount = 0;
		let whiteCount = 0;
		for (let r = 0; r < 8; r++) {
			for (let c = 0; c < 8; c++) {
				if (this.board[r][c] === "black") blackCount++;
				if (this.board[r][c] === "white") whiteCount++;
			}
		}

		return {
			board: this.board,
			currentPlayer: this.currentPlayer,
			gameOver: this.gameOver,
			winner: this.winner,
			scores: {
				black: blackCount,
				white: whiteCount,
			},
		};
	}

	/**
	 * 게임 액션을 처리하는 중앙 메서드
	 * @param {Object} action - 액션 객체 { type, payload }
	 * @param {string} userId - 액션을 수행하는 사용자 ID
	 * @param {Object} room - 방 정보 (플레이어 목록 등)
	 * @returns {import('../websockets/socket.js').GameActionResult} 게임 액션 처리 결과
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
				// 리버시에서는 항복이 상대방 승리로 처리
				this.gameOver = true;
				this.winner = playerColor === "black" ? "white" : "black";

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
					(p) => p.userId !== userId,
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
						payload: {
							declinerId: userId,
							declinerName: room.players.get(userId)?.username || "Unknown",
						},
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

export default ReversiGame;
