import { Vector3 } from "three";
import { SPRITE_PATHS } from "./gameConfig";
import { createSkills, Skill } from "../utils/skills";
import { getOrcAnimations, getSoldierAnimations } from "../utils/characterFactory";

// 위치는 캐릭터가 생성될 때 조정할 수 있습니다. (자기 팀 캐릭터들은 x값이 - 쪽에 배치되고 적 팀 캐릭터들은 + 쪽에 배치됩니다.)

/**
 * @typedef {Object} Character
 * @property {string} name - 캐릭터 이름
 * @property {number} health - 캐릭터 체력
 * @property {number} defense - 캐릭터 방어력
 * @property {number} damage - 캐릭터 공격력
 * @property {number} speed - 캐릭터 속도
 * @property {string} spritePath - 캐릭터 스프라이트 이미지 경로
 * @property {Object} animation - 캐릭터 애니메이션 설정 객체 (idle, walk, attack 등)
 * @property {Array<Function>} skills - 캐릭터가 사용할 수 있는 스킬들의 배열 (스킬 생성 함수들)
 * @property {Vector3} position - 캐릭터의 초기 위치 (x, y, z)
 * @property {Vector3} scale - 캐릭터의 크기 조정 (x, y, z)
 */

/**
 * @typedef {Object} Team
 * @property {string} name - 팀 이름
 * @property {string} description - 팀 설명
 * @property {Array<Character>} characters - 팀에 속한 캐릭터들의 배열
 */

/**
 * @description 게임에 등장하는 팀과 캐릭터들의 설정을 담은 객체
 * @type {Object<string, Team>}
 */
export const Teams = {
  Orc_team: {
    name: "오크 무리",
    description: "거친 돌격과 강력한 타격을 자랑하는 오크들이 모인 팀입니다.",
    characters: [
      {
        name: "오크 1",
        health: 120,
        defense: 5,
        damage: 15,
        speed: 18,
        spritePath: SPRITE_PATHS.orcPicture,
        animation: getOrcAnimations(),
        skills: [createSkills.orcBasicAttack(), createSkills.orcHeavySmash()],
        position: new Vector3(2, 0, -1),
        scale: new Vector3(5, 5, 5),
      },
      {
        name: "오크 2",
        health: 120,
        defense: 5,
        damage: 15,
        speed: 19,
        spritePath: SPRITE_PATHS.orcPicture,
        animation: getOrcAnimations(),
        skills: [createSkills.orcBasicAttack(), createSkills.orcHeavySmash()],
        position: new Vector3(2, 0, 1),
        scale: new Vector3(5, 5, 5),
      },
      {
        name: "보스 오크",
        health: 120,
        defense: 5,
        damage: 15,
        speed: 16,
        spritePath: SPRITE_PATHS.orcPicture,
        animation: getOrcAnimations(),
        skills: [createSkills.orcBasicAttack(), createSkills.orcHeavySmash()],
        position: new Vector3(3.5, 0.15, 0),
        scale: new Vector3(7, 7, 7),
      },
    ],
  },
  Soldier_team: {
    name: "기사 부대",
    description: "훈련된 병사들이 모인 팀으로, 균형 잡힌 능력을 자랑합니다.",
    characters: [
      {
        name: "병사 1",
        health: 100,
        defense: 10,
        damage: 20,
        speed: 20,
        spritePath: SPRITE_PATHS.soldierPicture,
        animation: getSoldierAnimations(),
        skills: [createSkills.soldierBasicAttack(), createSkills.soldierPowerAttack()],
        position: new Vector3(-2, 0, -1),
        scale: new Vector3(5, 5, 5),
      },
      {
        name: "병사 2",
        health: 120,
        defense: 10,
        damage: 20,
        speed: 15,
        spritePath: SPRITE_PATHS.soldierPicture,
        animation: getSoldierAnimations(),
        skills: [createSkills.soldierBasicAttack(), createSkills.soldierHeal()],
        position: new Vector3(-2, 0, 1),
        scale: new Vector3(5, 5, 5),
      },
      {
        name: "특급 병사",
        health: 200,
        defense: 25,
        damage: 20,
        speed: 10,
        spritePath: SPRITE_PATHS.soldierPicture,
        animation: getSoldierAnimations(),
        skills: [createSkills.soldierBasicAttack(), createSkills.soldierPowerAttack()],
        position: new Vector3(-2, 0, 1),
        scale: new Vector3(5, 5, 5),
      },
    ],
  },
};
