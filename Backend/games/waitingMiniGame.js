import { broadCastToRoom } from "../utils/roomManage.js";

class WaitingMiniGame {
	constructor() {
		/**
		 * 대기 미니게임에 참여한 플레이어들
		 * @type {Map<id: String, {x: number, y: number, dirX: number, dirY: number}>}
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

		/**
		 * 틱 레이트 (1초에 몇 번 업데이트할지)
		 * @type {number}
		 */
		this.TICK_RATE = 30; // 30Hz
		this.TICK_INTERVAL = 1000 / this.TICK_RATE; // 약 33ms

		/**
		 * 틱 타이머 ID
		 * @type {NodeJS.Timeout|null}
		 */
		this.tickTimer = null;
	}

	/**
	 * 게임 인스턴스 초기화
	 * @param {String} gameId
	 * @param {String} roomName
	 */
	initialize(gameId, roomName) {
		this.gameId = gameId;
		this.roomName = roomName;
		this.startGameTick(); // 틱 루프 시작
	}

	/**
	 * 게임 틱 루프 시작
	 * 일정한 간격으로 모든 플레이어 위치를 배치로 브로드캐스트
	 */
	startGameTick() {
		if (this.tickTimer) {
			clearInterval(this.tickTimer);
		}

		this.tickTimer = setInterval(() => {
			this.broadcastAllPlayersState();
		}, this.TICK_INTERVAL);

		console.log(
			`Game tick started at ${this.TICK_RATE}Hz for room: ${this.roomName}`,
		);
	}

	/**
	 * 게임 틱 루프 정지
	 */
	stopGameTick() {
		if (this.tickTimer) {
			clearInterval(this.tickTimer);
			this.tickTimer = null;
			console.log(`Game tick stopped for room: ${this.roomName}`);
		}
	}

	/**
	 * 모든 플레이어의 상태를 배치로 브로드캐스트
	 * 네트워크 효율성 개선: playerMove 타입 재사용, 배열로 통합 전송
	 */
	broadcastAllPlayersState() {
		if (this.players.size === 0) return;

		const playersState = Array.from(this.players.entries()).map(
			([id, player]) => ({
				userId: id,
				x: player.x,
				y: player.y,
				dirX: player.dirX || 0,
				dirY: player.dirY || 1,
			}),
		);

		broadCastToRoom(
			this.gameId,
			this.roomName,
			{
				type: "playerMove",
				payload: playersState,
			},
			null, // 모든 플레이어에게 전송
		);
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
			`Player ${id} joined the waiting mini-game at position (${x}, ${y}).`,
		);

		this.players.set(id, { x, y, userName, dirX: 0, dirY: 1 });

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
			{ excludeWs: ws },
		);

		ws.send(
			JSON.stringify({
				type: "miniGame:initializePlayers",
				payload: {
					players: this.GetPlayersCoordinates(),
				},
			}),
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
				`Player ${id} tried to exit, but was not found in the waiting mini-game.`,
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
			{ excludeWs: ws },
		);
	}

	/**
	 * 플레이어 위치 및 방향 업데이트 (서버 상태만 업데이트)
	 * 실제 브로드캐스트는 broadcastAllPlayersState()에서 틱마다 처리
	 * @param {String} id
	 * @param {number} x
	 * @param {number} y
	 * @param {number} dirX
	 * @param {number} dirY
	 */
	updatePlayerPosition(id, x, y, dirX = 0, dirY = 1) {
		if (!this.players.has(id)) {
			console.warn(`Player ${id} not found for position update`);
			return;
		}

		const player = this.players.get(id);
		player.x = x;
		player.y = y;
		player.dirX = dirX;
		player.dirY = dirY;

		// 실제 브로드캐스트는 broadcastAllPlayersState()에서 틱마다 처리
	}

	/**
	 * 게임 액션 처리
	 * @param {WebSocket} ws
	 * @param {String} userName
	 * @param {Object} action
	 */
	handleGame(ws, userName, action) {
		//console.log("Handling waiting mini-game action:", action);

		const {
			id,
			x,
			y,
			type,
			velocityX,
			velocityY,
			dirX,
			dirY,
			targetId,
			knockbackX,
			knockbackY,
		} = action;

		switch (type) {
			case "join":
				console.log(`Player ${id} is joining at (${x}, ${y})`);
				this.joinPlayer(id, userName, x, y, ws);
				break;
			case "exit":
				this.exitPlayer(id, ws);
				break;
			case "move":
				// 위치와 방향 업데이트 (브로드캐스트는 틱에서 처리)
				this.updatePlayerPosition(id, x, y, dirX, dirY);
				break;
			case "attack":
				// 방망이 휘두르기 브로드캐스트 (자신 제외)
				broadCastToRoom(
					this.gameId,
					this.roomName,
					{
						type: "playerAttack",
						payload: {
							userId: id,
							dirX: dirX,
							dirY: dirY,
						},
					},
					{ excludeWs: ws },
				);
				break;
			case "knockback":
				// 넉백 효과 브로드캐스트 (자신 제외)
				broadCastToRoom(
					this.gameId,
					this.roomName,
					{
						type: "playerKnockback",
						payload: {
							userId: targetId,
							knockbackX: knockbackX,
							knockbackY: knockbackY,
						},
					},
					{ excludeWs: ws },
				);
				break;
			case "respawn":
				// 부활 시 무적 효과 브로드캐스트 (자신 제외)
				broadCastToRoom(
					this.gameId,
					this.roomName,
					{
						type: "playerRespawn",
						payload: {
							userId: id,
							x: x,
							y: y,
						},
					},
					{ excludeWs: ws },
				);
				break;
			default:
				console.warn(`Unknown action type: ${type}`);
		}
	}

	/**
	 * 모든 플레이어의 좌표 가져오기
	 * @returns {Array<{id: string, x: number, y: number}>}
	 */
	GetPlayersCoordinates() {
		return Array.from(this.players.entries()).map(([id, pos]) => ({
			id,
			x: pos.x,
			y: pos.y,
		}));
	}
}
export default WaitingMiniGame;
