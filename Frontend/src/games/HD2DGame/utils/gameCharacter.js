import {
  CanvasTexture,
  Group,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  Vector3,
  TextureLoader,
  NearestFilter,
  MeshLambertMaterial,
  DoubleSide,
} from "three";
import { HEALTH_BAR_CONFIG } from "../constants/gameConfig.js";

/**
 * 체력바 클래스
 */
export class HealthBar {
  constructor(maxWidth = 1, height = 0.1, offset = new Vector3(0, 1.5, 0)) {
    this.maxWidth = maxWidth;
    this.height = height;
    this.offset = offset;
    this.currentHealthRatio = 1.0;

    this.canvas = document.createElement("canvas");
    this.canvas.width = 256;
    this.canvas.height = 32;
    this.ctx = this.canvas.getContext("2d");

    this.texture = new CanvasTexture(this.canvas);

    const geometry = new PlaneGeometry(maxWidth, height);
    const material = new MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthWrite: false, // 투명 객체는 depth buffer에 쓰지 않음
      depthTest: true,
      alphaTest: 0.1, // 알파값 0.1 이하는 픽셀 버림
    });
    this.mesh = new Mesh(geometry, material);
    this.mesh.userData.isBillboard = true;
    this.mesh.renderOrder = 999; // 체력바는 항상 마지막에 렌더링

    this.group = new Group();
    this.group.add(this.mesh);

    this.renderHealthBar(1.0);
  }

  renderHealthBar(healthRatio) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#333333";
    ctx.fillRect(0, 0, width, height);

    const healthWidth = Math.floor(width * healthRatio);
    if (healthWidth > 0) {
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(0, 0, healthWidth, height);
    }

    this.texture.needsUpdate = true;
  }

  update(currentHealth, maxHealth) {
    const healthRatio = Math.max(0, Math.min(1, currentHealth / maxHealth));

    if (Math.abs(this.currentHealthRatio - healthRatio) > 0.001) {
      this.currentHealthRatio = healthRatio;
      this.renderHealthBar(healthRatio);
    }
  }

  updatePosition(characterPosition) {
    this.group.position.copy(characterPosition).add(this.offset);
  }

  addToScene(scene) {
    scene.add(this.group);
  }

  removeFromScene(scene) {
    scene.remove(this.group);
  }
}

/**
 * 스프라이트 애니메이션 클래스
 */
export class SpriteAnimation {
  /**
   *
   * @param {import("three").Texture} texture
   * @param {number} frameWidth
   * @param {number} frameHeight
   * @param {number} frameCount
   * @param {number} fps
   */
  constructor(texture, frameWidth, frameHeight, frameCount, fps = 10) {
    this.texture = texture;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frameCount = frameCount;
    this.fps = fps;
    this.currentFrame = 0;
    this.frameTime = 1000 / fps;
    this.lastFrameTime = Date.now();

    this.texture.magFilter = NearestFilter;
    this.texture.minFilter = NearestFilter;

    this.imageWidth = texture.image.width;
    this.imageHeight = texture.image.height;

    this.framesPerRow = Math.floor(this.imageWidth / this.frameWidth);

    this.updateFrame(0);
  }

  updateFrame(frame) {
    this.currentFrame = frame % this.frameCount;

    const row = Math.floor(this.currentFrame / this.framesPerRow);
    const col = this.currentFrame % this.framesPerRow;

    const offsetX = (col * this.frameWidth) / this.imageWidth;
    const offsetY = (row * this.frameHeight) / this.imageHeight;
    const repeatX = this.frameWidth / this.imageWidth;
    const repeatY = this.frameHeight / this.imageHeight;

    this.texture.offset.x = offsetX;
    this.texture.offset.y = 1 - offsetY - repeatY;
    this.texture.repeat.x = repeatX;
    this.texture.repeat.y = repeatY;
  }

  update() {
    const now = Date.now();
    if (now - this.lastFrameTime >= this.frameTime) {
      this.updateFrame(this.currentFrame + 1);
      this.lastFrameTime = now;
    }
  }
}

/**
 * 애니메이션 컨트롤러
 */
export class AnimationController {
  constructor(mesh) {
    this.mesh = mesh;
    this.sprite = mesh; // 하위 호환성
    this.animations = new Map();
    this.currentAnimation = null;
    this.currentAnimationName = null;

    if (!this.mesh.material) {
      this.mesh.material = new MeshLambertMaterial({
        transparent: true,
        side: DoubleSide,
        depthWrite: false, // 투명 텍스처를 위한 설정
        depthTest: true,
        alphaTest: 0.8, // 투명한 부분이 depth/bokeh에 영향을 주지 않도록 높은 값 설정
      });
    }
  }

  async addAnimation(name, texturePath, frameWidth, frameHeight, frameCount, fps) {
    return new Promise((resolve, reject) => {
      const loader = new TextureLoader();
      loader.load(
        texturePath,
        (texture) => {
          const animation = new SpriteAnimation(texture, frameWidth, frameHeight, frameCount, fps);
          this.animations.set(name, animation);
          resolve();
        },
        undefined,
        reject,
      );
    });
  }

  play(name) {
    if (this.currentAnimationName === name || !this.animations.has(name)) {
      return;
    }

    const animation = this.animations.get(name);
    this.currentAnimation = animation;
    this.currentAnimationName = name;

    this.currentAnimation.updateFrame(0);

    this.mesh.material.map = this.currentAnimation.texture;
    this.mesh.material.needsUpdate = true;
  }

  update() {
    if (this.currentAnimation) {
      this.currentAnimation.update();
    }
  }
}

/**
 * 게임 캐릭터 클래스
 */
export class GameCharacter {
  /**
   * 게임 캐릭터 생성자
   * @param {string} name
   * @param {number} health
   * @param {number} defense
   * @param {number} damage
   * @param {number} speed
   * @param {import("three").Mesh} mesh
   * @param {boolean} isFriendly
   * @param {string} [imgSrc] - 캐릭터 초상화 이미지 경로 (선택적)
   */
  constructor(name, health, defense, damage, speed, mesh, isFriendly, imgSrc = null) {
    this.name = name;
    this.health = health;
    this.maxHealth = health;
    this.defense = defense;
    this.baseDamage = damage;
    this.damage = damage;
    this.baseDefense = defense;
    this.speed = speed;
    this.mesh = mesh;
    this.sprite = mesh; // 하위 호환성
    this.imgSrc = imgSrc;

    /**
     * @type {Array<import("./skills").Skill>}
     */
    this.skills = [];
    this.isFriendly = isFriendly;

    this.activeBuffs = [];

    this.healthBar = new HealthBar(
      HEALTH_BAR_CONFIG.maxWidth,
      HEALTH_BAR_CONFIG.height,
      HEALTH_BAR_CONFIG.offset,
    );

    this.mesh.name = name;

    this.mesh.userData.character = this;
    this._hitShakeId = 0;
    this._pendingServerDamage = null;
    this._pendingServerHeal = null;
  }

  get animationController() {
    /**
     * @type {AnimationController}
     */
    return this.mesh.userData.animationController;
  }

  /**
   * 게임 씬에 체력바 추가
   * @param {import("three").Scene} scene
   */
  addHealthBarToScene(scene) {
    this.healthBar.addToScene(scene);
    this.updateHealthBarPosition();
    this.healthBar.update(this.health, this.maxHealth);
  }

  updateHealthBarPosition() {
    const worldPos = new Vector3();
    this.mesh.getWorldPosition(worldPos);
    this.healthBar.updatePosition(worldPos);
  }

  /**
   * 게임 씬에서 체력바 제거
   * @param {import("three").Scene} scene
   */
  removeHealthBarFromScene(scene) {
    this.healthBar.removeFromScene(scene);
  }

  addSkill(skill) {
    this.skills.push(skill);
  }

  useSkill(skillName, target) {
    const skill = this.skills.find((s) => s.name === skillName);
    if (!skill || !skill.canUse()) return;
    skill.use(this, target);
  }

  isAlive() {
    return this.health > 0;
  }

  updateCoolDowns() {
    this.skills.forEach((s) => s.updateCoolDown());
  }

  updateBuffs() {
    this.activeBuffs = this.activeBuffs.filter((buff) => {
      buff.duration--;
      if (buff.duration <= 0) {
        this.removeBuff(buff);
        return false;
      }
      return true;
    });
  }

  applyBuff(type, amount, duration) {
    const buff = { type, amount, duration };
    this.activeBuffs.push(buff);

    if (type === "damage") {
      this.damage += amount;
    } else if (type === "defense") {
      this.defense += amount;
    } else if (type === "health") {
      this.maxHealth += amount;
      this.health += amount;
    }
  }

  removeBuff(buff) {
    if (buff.type === "damage") {
      this.damage -= buff.amount;
    } else if (buff.type === "defense") {
      this.defense -= buff.amount;
    } else if (buff.type === "health") {
      this.maxHealth -= buff.amount;
      this.health = Math.min(this.health, this.maxHealth);
    }
  }

  /**
   * @param {Object} options
   * @param {number} options.durationMs - 흔들림 지속 시간 (밀리초)
   * @param {number} options.amplitude - 흔들림 세기
   */
  playHitShake({ durationMs = 200, amplitude = 0.06 } = {}) {
    if (!this.mesh) return;

    const shakeId = ++this._hitShakeId;
    const origin = this.mesh.position.clone();
    const start = performance.now();

    const step = (now) => {
      if (shakeId !== this._hitShakeId) return;

      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const strength = (1 - t) * amplitude;

      this.mesh.position.set(
        origin.x + (Math.random() * 2 - 1) * strength,
        origin.y,
        origin.z + (Math.random() * 2 - 1) * strength,
      );

      if (t < 1) {
        requestAnimationFrame(step);
        return;
      }

      this.mesh.position.copy(origin);
    };

    requestAnimationFrame(step);
  }

  takeDamage(damage) {
    const hasOverride = this._pendingServerDamage !== null;
    const actualDamage = hasOverride
      ? Math.max(0, this._pendingServerDamage)
      : Math.max(0, damage - this.defense);
    this._pendingServerDamage = null;
    this.health = Math.max(0, this.health - actualDamage);

    this.healthBar.update(this.health, this.maxHealth);

    this.animationController.play("hurt");
    this.playHitShake({ durationMs: 200, amplitude: 0.06 });

    if (!this.isAlive()) {
      this.animationController.play("death");
    } else {
      setTimeout(() => {
        if (this.isAlive()) {
          this.animationController.play("idle");
        }
      }, 400);
    }

    return actualDamage;
  }

  heal(amount) {
    const hasOverride = this._pendingServerHeal !== null;
    const actualHeal = hasOverride
      ? Math.min(this._pendingServerHeal, this.maxHealth - this.health)
      : Math.min(amount, this.maxHealth - this.health);
    this._pendingServerHeal = null;
    this.health = Math.min(this.maxHealth, this.health + actualHeal);

    this.healthBar.update(this.health, this.maxHealth);

    return actualHeal;
  }

  setNextDamageOverride(amount) {
    this._pendingServerDamage = amount;
  }

  setNextHealOverride(amount) {
    this._pendingServerHeal = amount;
  }
}
