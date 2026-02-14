import { ref } from "vue";
import { Skill } from "../utils/skills";
import { GameCharacter } from "../utils/gameCharacter";
import { TARGET_SELECTION_CONFIG } from "../constants/gameConfig";

export function useCharacterSelection() {
  /**
   * 선택된 캐릭터
   * @type {import("vue").Ref<GameCharacter | null>}
   */
  const selectedCharacter = ref(null);

  /**
   * 선택된 캐릭터의 스킬 목록
   * @type {import("vue").Ref<Array<Skill>>}
   */
  const characterSkills = ref([]);

  /**
   * 선택된 캐릭터의 텍스처
   * @type {import("vue").Ref<import("three").Texture | null>}
   */
  const selectedCharacterTexture = ref(null);

  /**
   * @param {GameCharacter | null} character
   */
  function selectCharacter(character) {
    selectedCharacter.value = character;

    if (!character) return;

    characterSkills.value = character.skills;
    selectedCharacterTexture.value = character.sprite.material.map;
  }

  /**
   *@param {GameCharacter} newObject
   *@param {GameCharacter} oldObject
   */
  function selectEmission(newObject, oldObject) {
    // 이전 대상 emissive 해제
    if (oldObject && oldObject.sprite) {
      oldObject.sprite.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.emissive.setHex(0x000000);
          child.material.emissiveIntensity = 0;
        }
      });
    }

    // 새 대상 emissive 적용
    if (newObject && newObject.sprite) {
      newObject.sprite.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.emissive.setHex(TARGET_SELECTION_CONFIG.emissive.color);
          child.material.emissiveIntensity = TARGET_SELECTION_CONFIG.emissive.intensity;
        }
      });
    }
  }

  /**
   * 타겟 emissive 강도 펄스 업데이트
   * @param {GameCharacter} character
   * @param {number} timeSeconds
   * @returns
   */
  function updateEmissivePulse(character, timeSeconds) {
    if (!character?.sprite) return;

    const maxIntensity = TARGET_SELECTION_CONFIG.emissive.intensity;
    const pulseSpeed = TARGET_SELECTION_CONFIG.emissive.pulseSpeed;
    const t = (Math.sin(timeSeconds * Math.PI * 2 * pulseSpeed) + 1) / 2;
    const intensity = t * maxIntensity;

    character.sprite.traverse((child) => {
      if (child.isMesh && child.material?.emissive) {
        child.material.emissiveIntensity = intensity;
      }
    });
  }

  return {
    selectedCharacter,
    selectCharacter,
    characterSkills,
    selectedCharacterTexture,
    selectEmission,
    updateEmissivePulse,
  };
}
