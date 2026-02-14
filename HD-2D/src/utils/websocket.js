/**
 * WebSocket 클라이언트 유틸리티
 */
class GameWebSocket {
	constructor(url = "wss://test.redeyes.dev/api/ws") {
		this.url = url;
		this.ws = null;
		this.isConnected = false;
		this.reconnectAttempts = 0;
		this.maxReconnectAttempts = 5;
		this.reconnectDelay = 2000; // ms 기준

		// 이벤트 핸들러
		/**
		 * @type {function(boolean): void} 연결 상태 변경 시 호출되는 콜백 함수
		 */
		this.onConnectionChange = null;
		/**
		 * @type {function(object): void} 메시지 수신 시 호출되는 콜백 함수
		 */
		this.onMessage = null;
		/**
		 * @type {function(object): void} 오류 발생 시 호출되는 콜백 함수
		 */
		this.onError = null;
	}

	/**
	 * 웹소켓 연결
	 */
	connect() {
		return new Promise((resolve, reject) => {
			try {
				this.ws = new WebSocket(this.url);

				this.ws.onopen = () => {
					console.log("✅ WebSocket 연결 성공!");
					this.isConnected = true;
					this.reconnectAttempts = 0;

					if (this.onConnectionChange) {
						this.onConnectionChange(true);
					}

					resolve();
				};

				this.ws.onmessage = (event) => {
					try {
						const data = JSON.parse(event.data);
						console.log("📨 받은 메시지:", data);

						if (this.onMessage) {
							this.onMessage(data);
						}
					} catch (error) {
						console.error("메시지 파싱 오류:", error);
					}
				};

				this.ws.onerror = (error) => {
					console.error("❌ WebSocket 오류:", error);
					this.isConnected = false;

					if (this.onError) {
						this.onError(error);
					}
				};

				this.ws.onclose = () => {
					console.log("🔌 WebSocket 연결 종료");
					this.isConnected = false;

					if (this.onConnectionChange) {
						this.onConnectionChange(false);
					}

					// 자동 재연결 시도
					if (this.reconnectAttempts < this.maxReconnectAttempts) {
						this.reconnectAttempts++;
						console.log(
							`🔄 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`
						);
						setTimeout(() => this.connect(), this.reconnectDelay);
					} else {
						console.log("❌ 최대 재연결 시도 횟수 초과");
					}
				};
			} catch (error) {
				console.error("WebSocket 연결 실패:", error);
				reject(error);
			}
		});
	}

	/**
	 * 메시지 전송
	 * @param {string} type - 메시지 타입
	 * @param {object} data - 전송할 데이터
	 */
	send(type, data = {}) {
		if (!this.isConnected || !this.ws) {
			console.warn("⚠️ WebSocket이 연결되지 않았습니다.");
			return false;
		}

		// ai_action_request의 경우 gameState를 최상위로 이동
		let message;
		if (type === "ai_action_request" && data.gameState) {
			message = {
				type,
				data: { ...data },
				gameState: data.gameState,
				timestamp: Date.now(),
			};
			// data에서 gameState 제거 (중복 방지)
			delete message.data.gameState;
		} else {
			message = {
				type,
				data,
				timestamp: Date.now(),
			};
		}

		try {
			this.ws.send(JSON.stringify(message));
			console.log("📤 전송한 메시지:", message);
			return true;
		} catch (error) {
			console.error("메시지 전송 실패:", error);
			return false;
		}
	}

	/**
	 * 연결 종료
	 */
	disconnect() {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
			this.isConnected = false;
		}
	}

	/**
	 * 핑 전송 (연결 확인용)
	 */
	ping() {
		this.send("ping");
	}

	/**
	 * 전투 시작 알림
	 * @param {object} battleData - 전투 데이터
	 */
	sendBattleStart(battleData) {
		this.send("battle_start", battleData);
	}

	/**
	 * 턴 행동 전송
	 * @param {object} turnData - 턴 데이터
	 */
	sendTurnAction(turnData) {
		this.send("turn_action", turnData);
	}

	/**
	 * AI 행동 요청
	 * @param {object} characterData - 캐릭터 데이터
	 */
	requestAIAction(characterData) {
		this.send("ai_action_request", characterData);
	}

	/**
	 * 게임 상태 업데이트
	 * @param {object} gameState - 게임 상태
	 */
	updateGameState(gameState) {
		this.send("game_state_update", gameState);
	}
}

export default GameWebSocket;
