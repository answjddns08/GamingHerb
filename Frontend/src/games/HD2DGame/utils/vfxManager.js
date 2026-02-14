import { Scene, Vector2, Vector3 } from "three";
import { VFX } from "./vfxClasses.js";
import { SPRITE_PATHS, VFX_CONFIGS } from "../constants/gameConfig.js";

// VFX 인스턴스 관리
export const activeVFXs = [];

/**
 * VFX 생성 헬퍼
 */
export const createVFX = {
  /**
   * @param {Vector3} position
   * @param {Scene} scene
   * @param {Vector2|null} scaleOverride
   * @returns
   */
  fxTest: (position, scene, scaleOverride = null) => {
    const config = VFX_CONFIGS.fxTest;
    const scale = scaleOverride ?? new Vector2(config.width / 100, config.height / 100);
    const vfx = new VFX(
      SPRITE_PATHS.fxTest,
      config.width,
      config.height,
      config.frameCount,
      config.fps,
      position,
      scale,
      scene,
      config.loop ?? false,
    );
    activeVFXs.push(vfx);
    return vfx;
  },
  /**
   * @param {Vector3} position
   * @param {Scene} scene
   * @param {Vector2|null} scaleOverride
   * @returns
   */
  heal: (position, scene, scaleOverride = null) => {
    const config = VFX_CONFIGS.heal;
    const scale = scaleOverride ?? new Vector2(config.width / 100, config.height / 100);
    const vfx = new VFX(
      SPRITE_PATHS.heal,
      config.width,
      config.height,
      config.frameCount,
      config.fps,
      position,
      scale,
      scene,
      config.loop ?? false,
    );
    activeVFXs.push(vfx);
    return vfx;
  },
};

/**
 * VFX 업데이트 (animate loop에서 호출)
 */
export function updateVFXs() {
  for (let i = activeVFXs.length - 1; i >= 0; i--) {
    const vfx = activeVFXs[i];
    vfx.update();

    if (vfx.isFinished) {
      activeVFXs.splice(i, 1);
    }
  }
}
