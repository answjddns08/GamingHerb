import { ref } from "vue";
import { Vector3 } from "three";
import { CAMERA_CONFIG } from "../constants/gameConfig.js";
import { GameCharacter } from "../utils/gameCharacter.js";

/**
 * @typedef {import("vue").Ref<GameCharacter | null>} GameCharacterRef
 */

/**
 * 타겟팅 모드 관리 Composable
 * @param {Object} options
 * @param {Function} options.registerAction - 행동 등록 함수
 * @param {Object} options.focusOnTarget - 카메라 포커싱 함수
 * @param {Object} options.unfocus - 카메라 언포커싱 함수
 * @param {import('vue').Ref} options.selectedCharacter - 선택된 캐릭터 ref
 */
export function useTargeting({
	registerAction,
	focusOnTarget,
	unfocus,
	selectedCharacter,
}) {
	const isTargeting = ref(false);
	/**
	 * @type {import("vue").Ref<import("../utils/skills.js").Skill | null>}
	 */
	const pendingSkill = ref(null);
	/**
	 * @type {GameCharacterRef}
	 */
	const pendingActor = ref(null);
	/**
	 * @type {GameCharacterRef}
	 */
	const pendingTarget = ref(null);
	/**
	 * @type {GameCharacterRef}
	 */
	const selectedTarget = ref(null);
	/**
	 * @type {import("vue").Ref<import("three").Texture | null>}
	 */
	const selectedTargetTexture = ref(null);

	/**
	 * 타겟팅 모드 시작
	 * @param {import("../utils/skills.js").Skill} skill
	 */
	function startTargeting(skill) {
		if (!skill || !selectedCharacter.value) return;

		pendingSkill.value = skill;
		pendingActor.value = selectedCharacter.value;
		pendingTarget.value = null;
		isTargeting.value = true;

		focusOnTarget(new Vector3(0, 0, 0), CAMERA_CONFIG.initialCameraPos, false);
	}

	/**
	 * 타겟팅 모드 종료
	 */
	function stopTargeting() {
		pendingSkill.value = null;
		pendingActor.value = null;
		pendingTarget.value = null;
		isTargeting.value = false;
	}

	/**
	 * 선택된 타겟 초기화 (UI 업데이트용)
	 */
	function clearTargetSelection() {
		selectedTarget.value = null;
		selectedTargetTexture.value = null;
	}

	/**
	 * 타겟 선택 처리
	 * @param {import("../utils/gameCharacter.js").GameCharacter | null} character
	 */
	function handleTargetSelection(character) {
		if (!character) return;

		const material = character.sprite?.material;
		selectedTargetTexture.value = material && material.map;

		// 첫 클릭: 포커싱 + 스탯 표시 (name으로 비교)
		if (
			pendingTarget.value === null ||
			pendingTarget.value.name !== character.name
		) {
			pendingTarget.value = character;
			selectedTarget.value = character;
			focusOnTarget(
				character.sprite.getWorldPosition(new Vector3()),
				CAMERA_CONFIG.focusCameraOffset,
				false,
			);
			return;
		}

		// 두 번째 클릭: 타겟 확정 (같은 이름 = 같은 캐릭터)
		if (pendingActor.value && pendingSkill.value && pendingTarget.value) {
			registerAction(
				pendingActor.value,
				pendingSkill.value,
				pendingTarget.value,
			);
		}

		stopTargeting();
		clearTargetSelection();
		unfocus();

		selectedCharacter.value = null;
	}

	/**
	 * 스킬 선택 처리
	 * @param {import("../utils/skills.js").Skill | null} skill
	 */
	function handleSkillSelected(skill) {
		if (!skill) {
			stopTargeting();
			clearTargetSelection();
			return;
		}

		if (!selectedCharacter.value || !selectedCharacter.value.isFriendly) return;

		startTargeting(skill);
	}

	return {
		isTargeting,
		pendingSkill,
		pendingActor,
		pendingTarget,
		selectedTarget,
		selectedTargetTexture,
		startTargeting,
		stopTargeting,
		clearTargetSelection,
		handleTargetSelection,
		handleSkillSelected,
	};
}
