import { Mesh, PlaneGeometry, MeshLambertMaterial, DoubleSide } from "three";
import { AnimationController } from "./gameCharacter.js";
import { SPRITE_PATHS, ANIMATION_CONFIGS } from "../constants/gameConfig.js";

/**
 * 스프라이트 애니메이션 컨트롤러를 가진 캐릭터 생성
 */
export const createCharacter = async (animations, frameWidth, frameHeight, initialAnimation) => {
  // frameWidth와 frameHeight를 픽셀 단위에서 월드 단위로 변환 (100px = 1 unit)
  const worldWidth = frameWidth / 100;
  const worldHeight = frameHeight / 100;

  const geometry = new PlaneGeometry(worldWidth, worldHeight);
  const material = new MeshLambertMaterial({
    transparent: true,
    side: DoubleSide,
    depthWrite: false, // 투명 텍스처를 위한 설정 (깊이 버퍼를 읽기만 하고 쓰진 않음)
    depthTest: true,
    alphaTest: 0.5, // 거의 투명한 부분은 완전히 무시
  });
  material.color.setScalar(0.425); // 배경 대비 밝기 완화
  const mesh = new Mesh(geometry, material);
  mesh.userData.isBillboard = true;
  mesh.castShadow = true; // 그림자 드리우기
  mesh.receiveShadow = false; // 캐릭터는 그림자 안 받음

  const controller = new AnimationController(mesh);
  mesh.userData.animationController = controller;

  for (const name in animations) {
    const anim = animations[name];
    await controller.addAnimation(
      name,
      anim.path,
      frameWidth,
      frameHeight,
      anim.frameCount,
      anim.fps,
    );
  }

  controller.play(initialAnimation);

  return mesh;
};

/**
 * 병사 애니메이션 설정
 */
export const getSoldierAnimations = () => ({
  idle: {
    path: SPRITE_PATHS.soldierIdle,
    frameCount: ANIMATION_CONFIGS.soldier.idle.frameCount,
    fps: ANIMATION_CONFIGS.soldier.idle.fps,
  },
  walk: {
    path: SPRITE_PATHS.soldierWalk,
    frameCount: ANIMATION_CONFIGS.soldier.walk.frameCount,
    fps: ANIMATION_CONFIGS.soldier.walk.fps,
  },
  attack1: {
    path: SPRITE_PATHS.soldierAttack1,
    frameCount: ANIMATION_CONFIGS.soldier.attack1.frameCount,
    fps: ANIMATION_CONFIGS.soldier.attack1.fps,
  },
  attack2: {
    path: SPRITE_PATHS.soldierAttack2,
    frameCount: ANIMATION_CONFIGS.soldier.attack2.frameCount,
    fps: ANIMATION_CONFIGS.soldier.attack2.fps,
  },
  death: {
    path: SPRITE_PATHS.soldierDeath,
    frameCount: ANIMATION_CONFIGS.soldier.death.frameCount,
    fps: ANIMATION_CONFIGS.soldier.death.fps,
  },
  hurt: {
    path: SPRITE_PATHS.soldierHurt,
    frameCount: ANIMATION_CONFIGS.soldier.hurt.frameCount,
    fps: ANIMATION_CONFIGS.soldier.hurt.fps,
  },
});

/**
 * 오크 애니메이션 설정
 */
export const getOrcAnimations = () => ({
  idle: {
    path: SPRITE_PATHS.orcIdle,
    frameCount: ANIMATION_CONFIGS.orc.idle.frameCount,
    fps: ANIMATION_CONFIGS.orc.idle.fps,
  },
  walk: {
    path: SPRITE_PATHS.orcWalk,
    frameCount: ANIMATION_CONFIGS.orc.walk.frameCount,
    fps: ANIMATION_CONFIGS.orc.walk.fps,
  },
  attack1: {
    path: SPRITE_PATHS.orcAttack1,
    frameCount: ANIMATION_CONFIGS.orc.attack1.frameCount,
    fps: ANIMATION_CONFIGS.orc.attack1.fps,
  },
  attack2: {
    path: SPRITE_PATHS.orcAttack2,
    frameCount: ANIMATION_CONFIGS.orc.attack2.frameCount,
    fps: ANIMATION_CONFIGS.orc.attack2.fps,
  },
  death: {
    path: SPRITE_PATHS.orcDeath,
    frameCount: ANIMATION_CONFIGS.orc.death.frameCount,
    fps: ANIMATION_CONFIGS.orc.death.fps,
  },
  hurt: {
    path: SPRITE_PATHS.orcHurt,
    frameCount: ANIMATION_CONFIGS.orc.hurt.frameCount,
    fps: ANIMATION_CONFIGS.orc.hurt.fps,
  },
});
