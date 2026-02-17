class HD2DGame {
	constructor(settings = {}) {
		this.settings = {
			timerEnabled: settings.timerEnabled !== false,
			turnTimeLimit: settings.turnTimeLimit?.value || 60,
		};
		this.reset();
	}

	// 게임 상태 초기화
	reset() {
		/**
		 * @type {Map<String, {team: String}>} players - 참여한 플레이어 정보 (userId -> {username, team})
		 */
		this.players = new Map();
		this.characters = []; // 게임 내 캐릭터들
		this.turnOrder = []; // 속도 순으로 정렬된 턴 순서
		this.currentTurnIndex = 0;
		this.turnActions = []; // 현재 턴의 행동 목록
		this.gameOver = false;
		this.winner = null;
		this.turnCount = 0;
		this.turnId = 0;
		this.pendingTurnActions = new Map();
		this.pendingTurnCharacters = new Map();
	}

	getState() {
		return {
			players: Array.from(this.players.entries()).map(([userId, info]) => ({
				userId,
				team: info.team,
			})),
			characters: this.characters,
			currentTurn: this.turnOrder[this.currentTurnIndex] || null,
			turnActions: this.turnActions,
			gameOver: this.gameOver,
			winner: this.winner,
			turnCount: this.turnCount,
		};
	}

	/**
	 * 게임 액션을 처리하는 중앙 메서드
	 * @param {Object} action - 클라이언트로부터 받은 액션 객체
	 * @param {String} action.type - 액션 타입 (예: 'game:selectTeam')
	 * @param {Object} action.payload - 액션에 필요한 추가 데이터
	 * @param {String} action.payload.team - 선택된 팀 이름 (예: 'soldier' 또는 'orc')
	 * @param {String} userId - 액션을 보낸 플레이어의 ID
	 * @param {String} room - 액션이 발생한 방 이름
	 * @returns {Object} 처리 결과 (success, response, shouldBroadcast)
	 *  - success: 액션 처리 성공 여부
	 *  - response: 클라이언트에 보낼 응답 메시지 (type, payload)
	 *  - shouldBroadcast: 다른 플레이어에게도 이 액션을 전파할지 여부
	 */
	handleAction(action, userId, room) {
		switch (action.type) {
			case "game:join": {
				this.players.set(userId, { team: null });

				return {
					// 일단은 참가성공했을 경우 따로 메세지는 보내지 않음, 나중에 성공적으로 되었는지 확인하기 위해서 메세지 보내도록 수정할 수도 있을 것 같음
					success: true,
				};
			}
			case "game:selectTeam": {
				const { team } = action.payload;

				// 이미 선택된 팀인지 확인
				const teamTaken = Array.from(this.players.values()).some(
					(player) => player.team === team,
				);

				if (teamTaken) {
					return {
						success: false,
						response: {
							type: "game:error",
							payload: { message: "이미 선택된 팀입니다." },
						},
					};
				}

				// 플레이어 정보 추가 or 업데이트
				this.players.set(userId, { team: team });

				if (this.players.size === 2) {
					return {
						success: true,
						response: {
							type: "game:selectTeam",
							payload: {
								selectedTeams: team,
								done: true,
							},
						},
						shouldBroadcast: true,
					};
				}

				return {
					success: true,
					response: {
						type: "game:selectTeam",
						payload: {
							selectedTeams: team,
						},
					},
					shouldBroadcast: true,
				};
			}

			case "game:submitTurn": {
				if (!this.players.has(userId)) {
					return { success: false };
				}

				if (!Array.isArray(action.payload?.actions)) {
					return {
						success: false,
						response: {
							type: "game:error",
							payload: { message: "Invalid actions payload." },
						},
					};
				}

				if (!Array.isArray(action.payload?.characters)) {
					return {
						success: false,
						response: {
							type: "game:error",
							payload: { message: "Invalid characters payload." },
						},
					};
				}

				this.pendingTurnActions.set(userId, action.payload.actions);
				this.pendingTurnCharacters.set(userId, action.payload.characters);

				if (this.pendingTurnActions.size < this.players.size) {
					return { success: true };
				}

				const charactersByName = new Map();
				for (const characterList of this.pendingTurnCharacters.values()) {
					characterList.forEach((character) => {
						if (!character?.name) return;
						charactersByName.set(character.name, character);
					});
				}

				const mergedActions = Array.from(
					this.pendingTurnActions.values(),
				).flat();
				const orderedActions = mergedActions
					.map((actionItem, index) => {
						const actor = charactersByName.get(actionItem.actorName);
						return {
							...actionItem,
							speed: actor?.speed ?? 0,
							_order: index,
						};
					})
					.sort((a, b) => {
						if (b.speed !== a.speed) return b.speed - a.speed;
						return a._order - b._order;
					})
					.map(({ _order, speed, ...rest }) => rest);

				this.pendingTurnActions.clear();
				this.pendingTurnCharacters.clear();
				this.turnId += 1;

				return {
					success: true,
					response: {
						type: "game:turnResolved",
						payload: {
							turnId: this.turnId,
							actions: orderedActions,
						},
					},
					shouldBroadcast: true,
				};
			}

			default:
				return { success: false };
		}
	}
}

export default HD2DGame;
