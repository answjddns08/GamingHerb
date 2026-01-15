import { broadCastToRoom } from "../utils/roomManage.js";

class WaitingMiniGame {
	constructor() {
		/**
		 * 대기 미니게임에 참여한 플레이어들
		 * @type {Map<id: String, {x: number, y: number}>}
		 */
		this.players = new Map();

		/**
		 * 게임 ID
		 * @type {String|null}
		 */
		this.gameId = null;

		/**
		 * 방 이름
		 * @type {String|null}
		 */
		this.roomName = null;
	}

	/**
	 * 게임 인스턴스 초기화
	 * @param {String} gameId
	 * @param {String} roomName
	 */
	initialize(gameId, roomName) {
		this.gameId = gameId;
		this.roomName = roomName;
	}

	/**
	 * 플레이어가 대기 미니게임에 참여함
	 * @param {String} id
	 * @param {String} userName
	 * @param {number} x
	 * @param {number} y
	 * @param {WebSocket} ws - 요청한 플레이어의 웹소켓 (브로드캐스트 제외용)
	 */
	joinPlayer(id, userName, x, y, ws) {
		console.log(
			`Player ${id} joined the waiting mini-game at position (${x}, ${y}).`
		);

		this.players.set(id, { x, y, userName });

		// 다른 플레이어들에게 새 플레이어 참가 알림 (자신 제외)
		broadCastToRoom(
			this.gameId,
			this.roomName,
			{
				type: "miniGame:playerJoined",
				payload: {
					userId: id,
					x: x,
					y: y,
				},
			},
			ws
		);
	}

	/**
	 * 플레이어가 대기 미니게임에서 나감
	 * @param {String} id
	 * @param {WebSocket} ws - 요청한 플레이어의 웹소켓 (브로드캐스트 제외용)
	 * @returns {void}
	 */
	exitPlayer(id, ws) {
		if (!this.players.has(id)) {
			console.warn(
				`Player ${id} tried to exit, but was not found in the waiting mini-game.`
			);
			return;
		}

		this.players.delete(id);
		console.log(`Player ${id} exited the waiting mini-game.`);

		// 다른 플레이어들에게 퇴장 알림 (자신 제외)
		broadCastToRoom(
			this.gameId,
			this.roomName,
			{
				type: "miniGame:playerLeft",
				payload: {
					userId: id,
				},
			},
			ws
		);
	}

	/**
	 * 플레이어 위치 업데이트 및 동기화
	 * @param {String} id
	 * @param {number} x
	 * @param {number} y
	 * @param {number} velocityX
	 * @param {number} velocityY
	 * @param {WebSocket} ws - 요청한 플레이어의 웹소켓 (브로드캐스트 제외용)
	 */
	updatePlayerPosition(id, x, y, velocityX = 0, velocityY = 0, ws) {
		if (!this.players.has(id)) {
			console.warn(`Player ${id} not found for position update`);
			return;
		}

		const player = this.players.get(id);
		player.x = x;
		player.y = y;
		player.velocityX = velocityX;
		player.velocityY = velocityY;

		// 다른 플레이어들에게 위치 정보 브로드캐스트 (자신 제외)
		broadCastToRoom(
			this.gameId,
			this.roomName,
			{
				type: "playerMove",
				payload: {
					userId: id,
					x: x,
					y: y,
					velocityX: velocityX,
					velocityY: velocityY,
				},
			},
			ws
		);
	}

	/**
	 * 게임 액션 처리
	 * @param {WebSocket} ws
	 * @param {String} userName
	 * @param {Object} action
	 */
	handleGame(ws, userName, action) {
		//console.log("Handling waiting mini-game action:", action);

		const { id, x, y, type, velocityX, velocityY } = action;

		switch (type) {
			case "join":
				console.log(`Player ${id} is joining at (${x}, ${y})`);
				this.joinPlayer(id, userName, x, y, ws);
				break;
			case "exit":
				this.exitPlayer(id, ws);
				break;
			case "move":
				this.updatePlayerPosition(id, x, y, velocityX, velocityY, ws);
				break;
			default:
				console.warn(`Unknown action type: ${type}`);
		}
	}

	/**
	 * 모든 플레이어의 좌표 가져오기
	 * @returns {Array<{id: string, x: number, y: number, velocityX: number, velocityY: number}>}
	 */
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
