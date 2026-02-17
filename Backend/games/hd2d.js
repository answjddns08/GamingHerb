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
		this.charactersByName = new Map();
		this.restartRequests = new Set();
		this.leftPlayers = new Set();
	}

	initializeCharactersIfNeeded(characterLists) {
		if (this.charactersByName.size > 0) return;
		characterLists.forEach((list) => {
			list.forEach((character) => {
				if (!character?.name) return;
				const baseDamage = character.baseDamage ?? character.damage ?? 0;
				const baseDefense = character.baseDefense ?? character.defense ?? 0;
				this.charactersByName.set(character.name, {
					name: character.name,
					team: character.team,
					health: character.health ?? character.maxHealth ?? 0,
					maxHealth: character.maxHealth ?? character.health ?? 0,
					damage: character.damage ?? 0,
					defense: character.defense ?? 0,
					speed: character.speed ?? 0,
					baseDamage,
					baseDefense,
					activeBuffs: [],
					damageDealt: 0,
					damageTaken: 0,
				});
			});
		});
	}

	applyBuff(target, buffType, amount, duration) {
		if (!target || !buffType || !amount || !duration) return;
		const buff = { type: buffType, amount, duration };
		target.activeBuffs.push(buff);

		if (buffType === "damage") {
			target.damage += amount;
		} else if (buffType === "defense") {
			target.defense += amount;
		} else if (buffType === "health") {
			target.maxHealth += amount;
			target.health += amount;
		}
	}

	updateBuffs() {
		this.charactersByName.forEach((character) => {
			character.activeBuffs = character.activeBuffs.filter((buff) => {
				buff.duration -= 1;
				if (buff.duration > 0) return true;

				if (buff.type === "damage") {
					character.damage = Math.max(
						character.baseDamage,
						character.damage - buff.amount,
					);
				} else if (buff.type === "defense") {
					character.defense = Math.max(
						character.baseDefense,
						character.defense - buff.amount,
					);
				} else if (buff.type === "health") {
					character.maxHealth = Math.max(character.maxHealth - buff.amount, 1);
					character.health = Math.min(character.health, character.maxHealth);
				}

				return false;
			});
		});
	}

	resolveAction(actionItem) {
		const actor = this.charactersByName.get(actionItem.actorName);
		const target = this.charactersByName.get(actionItem.targetName);
		if (!actor || !target || actor.health <= 0 || target.health <= 0) {
			return { type: "skipped" };
		}

		if (actionItem.skillType === "heal") {
			const healAmount = Math.max(0, actionItem.skillPower ?? 0);
			const actualHeal = Math.min(healAmount, target.maxHealth - target.health);
			target.health = Math.min(target.maxHealth, target.health + actualHeal);
			return {
				type: "heal",
				amount: actualHeal,
				targetHealth: target.health,
				targetMaxHealth: target.maxHealth,
			};
		}

		if (actionItem.skillType === "buff") {
			const buffType = actionItem.buffType || "damage";
			const amount = Math.max(0, actionItem.skillPower ?? 0);
			const duration = Math.max(1, actionItem.buffDuration ?? 2);
			this.applyBuff(target, buffType, amount, duration);
			return {
				type: "buff",
				buffType,
				amount,
				duration,
			};
		}

		const baseDamage = Math.max(0, actionItem.skillPower ?? 0);
		const actualDamage = Math.max(0, baseDamage - target.defense);
		target.health = Math.max(0, target.health - actualDamage);
		actor.damageDealt += actualDamage;
		target.damageTaken += actualDamage;

		return {
			type: "damage",
			amount: actualDamage,
			targetHealth: target.health,
			targetMaxHealth: target.maxHealth,
			targetDied: target.health <= 0,
		};
	}

	buildSnapshot() {
		const characters = Array.from(this.charactersByName.values()).map(
			(character) => ({
				name: character.name,
				team: character.team,
				health: character.health,
				maxHealth: character.maxHealth,
				damage: character.damage,
				defense: character.defense,
				speed: character.speed,
				damageDealt: character.damageDealt,
				damageTaken: character.damageTaken,
			}),
		);

		return { characters };
	}

	getGameOverState() {
		const teamCounts = new Map();
		this.charactersByName.forEach((character) => {
			const isAlive = character.health > 0;
			const count = teamCounts.get(character.team) || { alive: 0, total: 0 };
			count.total += 1;
			if (isAlive) count.alive += 1;
			teamCounts.set(character.team, count);
		});

		if (teamCounts.size === 0) {
			return { gameOver: false, winner: "", loser: "" };
		}

		const teams = Array.from(teamCounts.entries());
		const aliveTeams = teams.filter(([, info]) => info.alive > 0);
		if (aliveTeams.length === 1 && teams.length > 1) {
			const winner = aliveTeams[0][0];
			const loser = teams.find(([team]) => team !== winner)?.[0] || "";
			return { gameOver: true, winner, loser };
		}
		if (aliveTeams.length === 0) {
			return { gameOver: true, winner: "draw", loser: "" };
		}
		return { gameOver: false, winner: "", loser: "" };
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

				const isAllSelected = Array.from(this.players.values()).every(
					(player) => player.team !== null,
				);

				if (isAllSelected) {
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

				this.initializeCharactersIfNeeded(
					Array.from(this.pendingTurnCharacters.values()),
				);

				const mergedActions = Array.from(
					this.pendingTurnActions.values(),
				).flat();
				const orderedActions = mergedActions
					.map((actionItem, index) => {
						const actor = this.charactersByName.get(actionItem.actorName);
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
				this.turnCount += 1;

				const resolvedActions = orderedActions.map((actionItem) => ({
					...actionItem,
					result: this.resolveAction(actionItem),
				}));

				this.updateBuffs();
				const snapshot = this.buildSnapshot();
				this.characters = snapshot.characters;
				const gameOverState = this.getGameOverState();

				return {
					success: true,
					response: {
						type: "game:turnResolved",
						payload: {
							turnId: this.turnId,
							actions: resolvedActions,
							snapshot,
							gameOver: gameOverState.gameOver,
							winner: gameOverState.winner,
							loser: gameOverState.loser,
						},
					},
					shouldBroadcast: true,
				};
			}

			case "game:restartRequest": {
				if (!this.players.has(userId) || this.leftPlayers.has(userId)) {
					return { success: false };
				}

				this.restartRequests.add(userId);
				const allRequested = this.restartRequests.size === this.players.size;

				if (allRequested) {
					return {
						success: true,
						response: {
							type: "game:restartConfirmed",
							payload: {},
						},
						shouldBroadcast: true,
					};
				}

				return {
					success: true,
					response: {
						type: "game:restartRequested",
						payload: { userId },
					},
					shouldBroadcast: true,
				};
			}

			case "game:leaveMatch": {
				if (!this.players.has(userId)) {
					return { success: false };
				}

				this.leftPlayers.add(userId);
				return {
					success: true,
					response: {
						type: "game:opponentLeft",
						payload: { userId },
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
