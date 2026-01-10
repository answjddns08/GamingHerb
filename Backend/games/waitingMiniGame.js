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
}
export default WaitingMiniGame;
