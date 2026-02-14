import { Vector3 } from "three";
import { SPRITE_PATHS } from "./gameConfig";
import { createSkills } from "../utils/skills";
import { getOrcAnimations, getSoldierAnimations } from "../utils/characterFactory";

// 위치는 캐릭터가 생성될 때 조정할 수 있습니다. (자기 팀 캐릭터들은 x값이 - 쪽에 배치되고 적 팀 캐릭터들은 + 쪽에 배치됩니다.)

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
