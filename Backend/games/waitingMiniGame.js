class WaitingMiniGame {
	constructor() {
		/**
		 * 대기 미니게임에 참여한 플레이어들
		 * @type {Map<id: String, {x: number, y: number}>}
		 */
		this.players = new Map();
	}

	/**
	 * 플레이어가 대기 미니게임에 참여함
	 * @param {String} id
	 * @param {number} x
	 * @param {number} y
	 */
	joinPlayer(id, x, y) {
		console.log(
			`Player ${id} joined the waiting mini-game at position (${x}, ${y}).`
		);

		this.players.set(id, { x, y });
	}

	/**
	 * 플레이어가 대기 미니게임에서 나감
	 * @param {String} id
	 * @returns {void}
	 */
	exitPlayer(id) {
		if (this.players.has(id) === false) {
			console.warn(
				`Player ${id} tried to exit, but was not found in the waiting mini-game.`
			);
			return;
		}

		this.players.delete(id);
		console.log(`Player ${id} exited the waiting mini-game.`);
	}

	/**
	 * 플레이어 위치 업데이트 및 동기화
	 * @param {String} id
	 * @param {number} x
	 * @param {number} y
	 * @param {number} velocityX
	 * @param {number} velocityY
	 */
	updatePlayerPosition(id, x, y, velocityX = 0, velocityY = 0) {
		if (!this.players.has(id)) {
			console.warn(`Player ${id} not found for position update`);
			return;
		}

		this.players.set(id, { x, y, velocityX, velocityY });
	}

	handleGame(ws, action) {
		console.log("Handling waiting mini-game action:", action);

		const { id, x, y, type, velocityX, velocityY } = action;

		switch (type) {
			case "join":
				console.log(`Player ${id} is joining at (${x}, ${y})`);
				this.joinPlayer(id, x, y);
				break;
			case "exit":
				this.exitPlayer(id);
				break;
			case "move":
				this.updatePlayerPosition(id, x, y, velocityX, velocityY);
				break;
			default:
				console.warn(`Unknown action type: ${type}`);
		}
	}

	GetPlayersCoordinates() {
		return Array.from(this.players.entries()).map(([id, pos]) => ({
			id,
			x: pos.x,
			y: pos.y,
			velocityX: pos.velocityX || 0,
			velocityY: pos.velocityY || 0,
		}));
	}
}
export default WaitingMiniGame;
