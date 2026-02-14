import { ref, computed } from "vue";
import { ANIMATION_TIMINGS } from "../constants/gameConfig.js";
import { GameCharacter } from "../utils/gameCharacter.js";
import { Skill } from "../utils/skills.js";

export function useBattleActions() {
	/**
	 * 턴별 행동 목록
	 * @type {Array<{character: GameCharacter, skill: Skill, target: GameCharacter}>} - 행동 객체 배열
	 */
	const turnActions = ref([]);
	const totalCharacters = ref(0);
	const friendlyCount = ref(0);

	// 전투 준비 완료 체크 (아군만 행동 설정되면 OK)
	const isBattleReady = computed(() => {
		if (friendlyCount.value === 0) return false;

		const friendlyActionsCount = turnActions.value.filter(
			(action) => action.character.isFriendly,
		).length;

		return friendlyActionsCount === friendlyCount.value;
	});

	/**
	 * 행동 등록
	 */
	function registerAction(character, skill, target) {
		const existingActionIndex = turnActions.value.findIndex(
			(a) => a.character === character,
		);

		const action = {
			character,
			skill,
			target,
		};

		if (existingActionIndex >= 0) {
			turnActions.value[existingActionIndex] = action;
		} else {
			turnActions.value.push(action);
		}

		turnActions.value = sortActionsBySpeed();

		console.log(
			`${character.name}이(가) ${target.name}에게 ${skill.name} 사용 예약!`,
		);
	}

	/**
	 * 행동 목록 초기화
	 */
	function clearActions() {
		turnActions.value = [];
	}

	/**
	 * 행동 정렬 (속도 순)
	 */
	function sortActionsBySpeed() {
		return [...turnActions.value].sort(
			(a, b) => b.character.speed - a.character.speed,
		);
	}

	/**
	 * 순차적으로 행동 실행
	 */
	async function executeActionsSequentially(gameManager, sceneRef) {
		const sortedActions = sortActionsBySpeed();

		console.log(
			"행동 순서:",
			sortedActions
				.map((a) => `${a.character.name}(속도:${a.character.speed})`)
				.join(" → "),
		);

		return new Promise((resolve) => {
			let actionIndex = 0;

			function executeNextAction() {
				if (actionIndex >= sortedActions.length) {
					// 모든 행동 완료
					setTimeout(() => {
						console.log("\n=== 턴 종료 ===");
						// 쿨다운 업데이트
						gameManager.turnOrder.forEach((char) => char.updateCoolDowns());
						// 버프 업데이트
						gameManager.turnOrder.forEach((char) => char.updateBuffs());
						// 행동 목록 초기화
						clearActions();

						// 전투 종료 조건 체크
						const allFriendlyDead = gameManager.friendly.every(
							(c) => !c.isAlive(),
						);
						const allEnemyDead = gameManager.enemy.every((c) => !c.isAlive());

						if (allFriendlyDead) {
							console.log("\n💀 패배! 모든 아군이 전멸했습니다!");
							resolve("defeat");
						} else if (allEnemyDead) {
							console.log("\n🎉 승리! 모든 적을 물리쳤습니다!");
							resolve("victory");
						} else {
							resolve("continue");
						}
					}, 1000);
					return;
				}

				const action = sortedActions[actionIndex];

				// 행동자가 살아있는지 확인
				if (!action.character.isAlive()) {
					console.log(`${action.character.name}은(는) 전투 불능 상태입니다.`);
					actionIndex++;
					setTimeout(executeNextAction, 500);
					return;
				}

				console.log(
					`\n${action.character.name}의 턴: ${action.skill.name} → ${action.target.name}`,
				);

				const target = action.target;
				const wasAlive = target.isAlive();

				action.character.useSkill(action.skill.name, target);

				// 타겟이 사망했는지 확인
				setTimeout(() => {
					if (wasAlive && !target.isAlive()) {
						console.log(`💀 ${target.name}이(가) 사망했습니다!`);

						if (sceneRef) {
							target.removeHealthBarFromScene(sceneRef);
						}

						// 스프라이트 제거
						setTimeout(() => {
							if (target.sprite && target.sprite.parent) {
								target.sprite.parent.remove(target.sprite);
							}
							gameManager.removeCharacter(target);
						}, ANIMATION_TIMINGS.deathAnimationDuration);
					}
				}, ANIMATION_TIMINGS.skillEffectDelay);

				actionIndex++;
				setTimeout(executeNextAction, ANIMATION_TIMINGS.skillActionInterval);
			}

			executeNextAction();
		});
	}

	/**
	 * 행동 카운트 정보 업데이트
	 */
	function updateCharacterCounts(gameManager) {
		totalCharacters.value = gameManager.turnOrder.length;
		friendlyCount.value = gameManager.friendly.length;
	}

	return {
		turnActions,
		totalCharacters,
		friendlyCount,
		isBattleReady,
		registerAction,
		clearActions,
		sortActionsBySpeed,
		executeActionsSequentially,
		updateCharacterCounts,
	};
}
