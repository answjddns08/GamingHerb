class HD2DGame {
	constructor(settings = {}) {
		this.settings = {
			turnTimeLimit: settings.turnTimeLimit?.value || 60,
			timerEnabled: settings.timerEnabled !== false,
			teamMode: settings.teamMode || "1v1",
			...settings,
		};
		this.reset();
	}

	// 게임 상태 초기화
	reset() {
		this.players = new Map(); // playerId -> { username, team }
		this.characters = []; // 게임 내 캐릭터들
		this.turnOrder = []; // 속도 순으로 정렬된 턴 순서
		this.currentTurnIndex = 0;
		this.battlePhase = "setup"; // setup, planning, executing, finished
		this.turnActions = []; // 현재 턴의 행동 목록
		this.gameOver = false;
		this.winner = null;
		this.turnCount = 0;
	}

	// 플레이어 추가 및 초기 캐릭터 생성
	addPlayer(userId, username, team) {
		this.players.set(userId, { username, team });

		// 팀별 캐릭터 생성 (병사 2명)
		const basePosition = team === "team1" ? -2 : 2;

		const char1 = {
			id: `${userId}_char1`,
			playerId: userId,
			team,
			type: "soldier",
			name: `${username}의 병사 1`,
			health: 100,
			maxHealth: 100,
			damage: 20,
			defense: 10,
			speed: 15,
			position: { x: basePosition, y: 0, z: -1 },
			skills: [
				{
					id: "soldier_basic_attack",
					name: "기본 공격",
					type: "attack",
					power: 20,
					cooldown: 0,
					remainingCooldown: 0,
					description: "적에게 기본 공격을 가합니다. 데미지 20",
				},
				{
					id: "soldier_power_attack",
					name: "강력한 일격",
					type: "attack",
					power: 35,
					cooldown: 2,
					remainingCooldown: 0,
					description: "힘을 모아 강력한 일격을 날립니다. 데미지 35",
				},
				{
					id: "soldier_heal",
					name: "응급 치료",
					type: "heal",
					power: 30,
					cooldown: 3,
					remainingCooldown: 0,
					description: "아군의 체력을 30 회복합니다.",
				},
			],
			activeBuffs: [],
		};

		const char2 = {
			id: `${userId}_char2`,
			playerId: userId,
			team,
			type: "soldier",
			name: `${username}의 병사 2`,
			health: 100,
			maxHealth: 100,
			damage: 20,
			defense: 10,
			speed: 18,
			position: { x: basePosition, y: 0, z: 1 },
			skills: [
				{
					id: "soldier_basic_attack",
					name: "기본 공격",
					type: "attack",
					power: 20,
					cooldown: 0,
					remainingCooldown: 0,
					description: "적에게 기본 공격을 가합니다. 데미지 20",
				},
				{
					id: "soldier_power_attack",
					name: "강력한 일격",
					type: "attack",
					power: 35,
					cooldown: 2,
					remainingCooldown: 0,
					description: "힘을 모아 강력한 일격을 날립니다. 데미지 35",
				},
				{
					id: "soldier_heal",
					name: "응급 치료",
					type: "heal",
					power: 30,
					cooldown: 3,
					remainingCooldown: 0,
					description: "아군의 체력을 30 회복합니다.",
				},
			],
			activeBuffs: [],
		};

		this.characters.push(char1, char2);
	}

	// 전투 시작 (턴 순서 결정)
	startBattle() {
		this.turnOrder = [...this.characters].sort((a, b) => b.speed - a.speed);
		this.battlePhase = "planning";
		this.currentTurnIndex = 0;
		console.log(
			"턴 순서:",
			this.turnOrder.map((c) => `${c.name}(속도:${c.speed})`).join(" → ")
		);
	}

	// 플레이어의 행동 설정
	setAction(userId, characterId, skillId, targetId) {
		const character = this.characters.find((c) => c.id === characterId);
		const skill = character?.skills.find((s) => s.id === skillId);
		const target = this.characters.find((c) => c.id === targetId);

		if (!character || !skill || !target) {
			return { success: false, message: "유효하지 않은 행동입니다." };
		}

		if (character.playerId !== userId) {
			return { success: false, message: "본인의 캐릭터만 조종할 수 있습니다." };
		}

		if (skill.remainingCooldown > 0) {
			return { success: false, message: "스킬이 쿨타임 중입니다." };
		}

		// 기존 행동 제거
		this.turnActions = this.turnActions.filter(
			(action) => action.characterId !== characterId
		);

		// 새 행동 추가
		this.turnActions.push({
			characterId,
			skillId,
			targetId,
			playerId: userId,
		});

		return { success: true };
	}

	// 모든 플레이어가 행동을 설정했는지 확인
	checkAllPlayersReady() {
		const myCharacters = this.characters.filter((c) => !c.isDead);
		const actionCharacters = new Set(
			this.turnActions.map((a) => a.characterId)
		);

		return myCharacters.every((c) => actionCharacters.has(c.id));
	}

	// 턴 실행
	executeTurn() {
		if (this.battlePhase !== "planning") {
			return { success: false, message: "계획 단계가 아닙니다." };
		}

		this.battlePhase = "executing";
		const results = [];

		// 속도 순으로 정렬된 순서대로 행동 실행
		for (const character of this.turnOrder) {
			if (character.isDead) continue;

			const action = this.turnActions.find(
				(a) => a.characterId === character.id
			);
			if (!action) continue;

			const skill = character.skills.find((s) => s.id === action.skillId);
			const target = this.characters.find((c) => c.id === action.targetId);

			if (!skill || !target || target.isDead) continue;

			// 스킬 실행
			const result = this.executeSkill(character, skill, target);
			results.push(result);

			// 쿨다운 설정
			skill.remainingCooldown = skill.cooldown;
		}

		// 쿨다운 감소
		this.characters.forEach((char) => {
			char.skills.forEach((skill) => {
				if (skill.remainingCooldown > 0) {
					skill.remainingCooldown--;
				}
			});
			// 버프 지속시간 감소
			char.activeBuffs = char.activeBuffs.filter((buff) => {
				buff.duration--;
				return buff.duration > 0;
			});
		});

		// 행동 목록 초기화
		this.turnActions = [];
		this.turnCount++;

		// 승리 조건 확인
		this.checkVictory();

		if (this.gameOver) {
			this.battlePhase = "finished";
		} else {
			this.battlePhase = "planning";
		}

		return { success: true, results };
	}

	// 스킬 실행
	executeSkill(user, skill, target) {
		const result = {
			userId: user.playerId,
			characterName: user.name,
			skillName: skill.name,
			targetName: target.name,
			effects: [],
		};

		switch (skill.type) {
			case "attack": {
				const damage = Math.max(0, skill.power - target.defense);
				target.health = Math.max(0, target.health - damage);
				result.effects.push({ type: "damage", value: damage });

				if (target.health === 0) {
					target.isDead = true;
					result.effects.push({ type: "death" });
				}
				break;
			}

			case "heal": {
				const healAmount = Math.min(
					skill.power,
					target.maxHealth - target.health
				);
				target.health += healAmount;
				result.effects.push({ type: "heal", value: healAmount });
				break;
			}

			case "buff": {
				// 버프 적용 (예: 공격력 증가)
				target.activeBuffs.push({
					type: "damage",
					amount: skill.power,
					duration: 2,
				});
				result.effects.push({
					type: "buff",
					buffType: "damage",
					value: skill.power,
				});
				break;
			}
		}

		return result;
	}

	// 승리 조건 확인
	checkVictory() {
		const teams = new Map();

		this.characters.forEach((char) => {
			if (!char.isDead) {
				if (!teams.has(char.team)) {
					teams.set(char.team, []);
				}
				teams.get(char.team).push(char);
			}
		});

		// 한 팀만 남았으면 승리
		if (teams.size === 1) {
			this.gameOver = true;
			const winningTeam = Array.from(teams.keys())[0];
			this.winner = Array.from(this.players.entries()).find(
				([_, data]) => data.team === winningTeam
			)?.[0];
		}
	}

	// 현재 게임 상태 반환
	getState() {
		return {
			players: Object.fromEntries(this.players),
			characters: this.characters,
			turnOrder: this.turnOrder,
			currentTurnIndex: this.currentTurnIndex,
			battlePhase: this.battlePhase,
			turnActions: this.turnActions,
			gameOver: this.gameOver,
			winner: this.winner,
			turnCount: this.turnCount,
			settings: this.settings,
		};
	}

	/**
	 * 게임 액션을 처리하는 중앙 메서드
	 */
	handleAction(action, userId, room) {
		switch (action.type) {
			case "game:selectTeam": {
				const { team } = action.payload;

				// 이미 선택된 팀인지 확인
				const teamTaken = Array.from(this.players.values()).some(
					(player) => player.team === team
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

				// 플레이어 추가
				const username = room.players.get(userId)?.username || "Unknown";
				this.addPlayer(userId, username, team);

				// 모든 플레이어가 팀을 선택했으면 전투 시작
				if (this.players.size === 2) {
					this.startBattle();
				}

				return {
					success: true,
					response: {
						type: "game:updateState",
						payload: this.getState(),
					},
					shouldBroadcast: true,
				};
			}

			case "game:setAction": {
				const { characterId, skillId, targetId } = action.payload;
				const result = this.setAction(userId, characterId, skillId, targetId);

				if (!result.success) {
					return {
						success: false,
						response: {
							type: "game:error",
							payload: { message: result.message },
						},
					};
				}

				return {
					success: true,
					response: {
						type: "game:updateState",
						payload: this.getState(),
					},
					shouldBroadcast: true,
				};
			}

			case "game:ready": {
				// 플레이어가 준비 완료를 표시
				// 모든 플레이어가 준비되면 턴 실행
				if (this.checkAllPlayersReady()) {
					const result = this.executeTurn();

					return {
						success: true,
						response: {
							type: "game:turnExecuted",
							payload: {
								gameState: this.getState(),
								results: result.results,
							},
						},
						shouldBroadcast: true,
					};
				}

				return {
					success: true,
					response: {
						type: "game:updateState",
						payload: this.getState(),
					},
					shouldBroadcast: true,
				};
			}

			case "player:loaded": {
				return {
					success: true,
					response: {
						type: "game:initialState",
						payload: {
							gameState: this.getState(),
						},
					},
					shouldBroadcast: false,
				};
			}

			default:
				return { success: false };
		}
	}
}

export default HD2DGame;
