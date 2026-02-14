import { Vector3, Vector2, Scene } from "three";
import { createVFX } from "./vfxManager.js";
import { createParticles } from "./particleManager.js";
import { GameCharacter } from "./gameCharacter";
import { TARGET_SELECTION_CONFIG } from "../constants/gameConfig.js";

/**
 * 지연 함수
 * @param {number} ms
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 캐릭터 이동 (선형 보간)
 * @param {GameCharacter} character
 * @param {Vector3} targetPosition
 * @param {number} duration
 */
const moveCharacter = (character, targetPosition, duration = 300) =>
	new Promise((resolve) => {
		const start = character.mesh.position.clone();
		const end = targetPosition.clone();
		const startTime = performance.now();

		/**
		 * @param {Number} now
		 * @returns
		 */
		const step = (now) => {
			const t = Math.min(1, (now - startTime) / duration);
			character.mesh.position.lerpVectors(start, end, t);
			if (t < 1) {
				requestAnimationFrame(step);
				return;
			}
			resolve();
		};

		requestAnimationFrame(step);
	});

/**
 * 타겟 발광 펄스 연출
 * @param {GameCharacter} character
 * @param {{
 *  durationMs?: number;
 *  maxIntensity?: number;
 *  pulseSpeed?: number;
 *  color?: number;
 * }} options
 */
const pulseEmissiveForDuration = (character, options = {}) => {
	if (!character?.sprite) return;

	const {
		durationMs = 1500,
		maxIntensity = TARGET_SELECTION_CONFIG.emissive.intensity * 2,
		pulseSpeed = TARGET_SELECTION_CONFIG.emissive.pulseSpeed,
		color = 0x9dff9d,
	} = options;

	const materials = [];

	character.sprite.traverse((child) => {
		if (!child.isMesh || !child.material) return;

		const materialList = Array.isArray(child.material)
			? child.material
			: [child.material];

		materialList.forEach((material) => {
			if (!material.emissive) return;
			materials.push({
				material,
				color: material.emissive.clone(),
				intensity: material.emissiveIntensity ?? 0,
			});
			material.emissive.setHex(color);
		});
	});

	if (materials.length === 0) return;

	const start = performance.now();

	const step = (now) => {
		const elapsedMs = now - start;
		const elapsedSeconds = elapsedMs / 1000;
		const progress = Math.min(1, elapsedMs / durationMs);
		const t = (Math.sin(elapsedSeconds * Math.PI * 2 * pulseSpeed) + 1) / 2;
		const intensity = t * maxIntensity;

		materials.forEach(({ material }) => {
			material.emissiveIntensity = intensity;
		});

		if (progress < 1) {
			requestAnimationFrame(step);
			return;
		}

		materials.forEach(({ material, color, intensity: baseIntensity }) => {
			material.emissive.copy(color);
			material.emissiveIntensity = baseIntensity;
		});
	};

	requestAnimationFrame(step);
};

/**
 * 근접 공격 시퀀스 (이동 -> 공격 애니메이션 -> 타격 -> 복귀)
 * @param {GameCharacter} user
 * @param {GameCharacter} target
 * @param {{
 *  attackAnimation: string;
 *  damage: number;
 *  approachDistance?: number;
 *  moveDuration?: number;
 *  hitDelay?: number;
 *  returnDelay?: number;
 *  onHit?: (actualDamage: number) => void;
 * }} options
 */
const performMeleeAttackSequence = async (user, target, options) => {
	const {
		attackAnimation,
		damage,
		approachDistance = 0.8,
		moveDuration = 300,
		hitDelay = 150,
		returnDelay = 200,
		onHit,
	} = options;

	if (!user?.isAlive() || !target) return;

	const startPos = user.mesh.position.clone();
	const targetPos = target.mesh.position.clone();
	const direction = new Vector3().subVectors(targetPos, startPos).normalize();
	const approachPos = targetPos
		.clone()
		.addScaledVector(direction, -approachDistance);
	approachPos.y = startPos.y;

	user.animationController.play("walk");
	await moveCharacter(user, approachPos, moveDuration);

	user.animationController.play(attackAnimation);

	await delay(hitDelay);

	const actualDamage = target.takeDamage(damage);

	if (onHit) onHit(actualDamage);

	await delay(returnDelay);

	if (user.isAlive()) {
		user.animationController.play("walk");
	}

	await moveCharacter(user, startPos, moveDuration);

	if (user.isAlive()) {
		user.animationController.play("idle");
	}
};

/**
 * @typedef {String} SkillType
 * @property {"attack"} Attack 스킬
 * @property {"heal"} Heal 스킬
 * @property {"buff"} Buff 스킬
 */

/**
 * 스킬 클래스
 */
export class Skill {
	/**
	 * @param {String} name - 스킬 이름
	 * @param {string} image - 스킬 이미지 경로
	 * @param {SkillType} type - 스킬 타입
	 * @param {Number} power - 스킬 위력
	 * @param {Number} coolDown - 쿨타임 (턴)
	 * @param {String} animationName - 스킬 사용 시 재생할 애니메이션 이름
	 * @param {String} description - 스킬 설명
	 * @param {(user: GameCharacter, target: GameCharacter) => void} effect - 스킬 효과 함수
	 */
	constructor(
		name,
		image = "",
		type,
		power,
		coolDown,
		animationName,
		description,
		effect,
	) {
		this.name = name;
		this.image = image;
		this.type = type;
		this.power = power;
		this.coolDown = coolDown;
		this.remainingCoolDown = 0;
		this.animationName = animationName;
		this.description = description;
		this.effect = effect;
	}

	canUse() {
		return this.remainingCoolDown <= 0;
	}

	use(user, target) {
		if (!this.canUse()) return false;

		this.effect(user, target);
		this.remainingCoolDown = this.coolDown;
		return true;
	}

	updateCoolDown() {
		if (this.remainingCoolDown > 0) this.remainingCoolDown--;
	}
}

/**
 * 스킬 생성 헬퍼
 */
export const createSkills = {
	soldierBasicAttack: () =>
		new Skill(
			"기본 공격",
			"",
			"attack",
			20,
			0,
			"attack1",
			"적에게 기본 공격을 가합니다. 데미지 20",
			(user, target) => {
				const damage = 20;
				performMeleeAttackSequence(user, target, {
					attackAnimation: "attack1",
					damage: damage,
					hitDelay: 200,
					returnDelay: 300,
					onHit: (actualDamage) => {
						console.log(
							`${user.name}이(가) ${target.name}에게 ${actualDamage} 데미지!`,
						);
					},
				});
			},
			{ disableAutoAnimation: true },
		),

	/**
	 * @param {Scene} scene
	 * @returns
	 */
	soldierPowerAttack: (scene) =>
		new Skill(
			"강력한 일격",
			"",
			"attack",
			35,
			2,
			"attack2",
			"힘을 모아 강력한 일격을 날립니다. 데미지 35",
			(user, target) => {
				const damage = 35;

				const vfxPosition = target.mesh.getWorldPosition(new Vector3());
				vfxPosition.y += 0.3;

				const vfx = createVFX.fxTest(vfxPosition, scene, new Vector2(2, 2));

				performMeleeAttackSequence(user, target, {
					attackAnimation: "attack2",
					damage: damage,
					hitDelay: 200,
					returnDelay: 300,
					onHit: (actualDamage) => {
						createParticles.hitBurst(vfxPosition, scene, {
							count: 20,
							speed: 3.0,
							spread: 1.0,
							gravity: 7.0,
							size: 0.06,
							life: 1,
							color: 0xea281b,
						});
						vfx.play();
						console.log(
							`${user.name}이(가) ${target.name}에게 ${actualDamage} 데미지!`,
						);
					},
				});
			},
		),

	/**
	 * @param {Scene} scene
	 * @returns {Skill}
	 */
	soldierHeal: (scene) =>
		new Skill(
			"응급 치료",
			"",
			"heal",
			30,
			3,
			"idle",
			"아군의 체력을 30 회복합니다.",
			(user, target) => {
				const healAmount = 30;

				const vfxPosition = target.mesh.getWorldPosition(new Vector3());
				vfxPosition.y += 0.3;

				const vfx = createVFX.heal(vfxPosition, scene, new Vector2(2, 2));

				vfxPosition.y -= 0.3;

				createParticles.heal(vfxPosition, scene, {
					count: 50,
					gravity: 0.5,
					size: 0.08,
					life: 1.5,
					color: 0x66ff66,
					radius: 0.6,
					height: 1.2,
				});

				vfx.play();

				pulseEmissiveForDuration(target);

				const actualHeal = target.heal(healAmount);
				console.log(
					`${user.name}이(가) ${target.name}을(를) ${actualHeal} 회복!`,
				);
			},
		),

	orcBasicAttack: () =>
		new Skill(
			"기본 공격",
			"",
			"attack",
			15,
			0,
			"attack1",
			"적에게 기본 공격을 가합니다. 데미지 15",
			(user, target) => {
				const damage = 15;
				performMeleeAttackSequence(user, target, {
					attackAnimation: "attack1",
					damage: damage,
					hitDelay: 200,
					returnDelay: 300,
					onHit: (actualDamage) => {
						console.log(
							`${user.name}이(가) ${target.name}에게 ${actualDamage} 데미지!`,
						);
					},
				});
			},
		),

	orcHeavySmash: () =>
		new Skill(
			"강타",
			"",
			"attack",
			30,
			2,
			"attack2",
			"무거운 무기로 적을 내려칩니다. 데미지 30",
			(user, target) => {
				const damage = 30;
				performMeleeAttackSequence(user, target, {
					attackAnimation: "attack2",
					damage: damage,
					hitDelay: 200,
					returnDelay: 300,
					onHit: (actualDamage) => {
						console.log(
							`${user.name}이(가) 강타로 ${target.name}에게 ${actualDamage} 데미지!`,
						);
					},
				});
			},
		),

	orcRage: () =>
		new Skill(
			"분노",
			"",
			"buff",
			10,
			3,
			"idle",
			"분노하여 2턴 동안 공격력이 10 증가합니다.",
			(user, target) => {
				const buffAmount = 10;
				const duration = 2;
				target.applyBuff("damage", buffAmount, duration);
				console.log(
					`${target.name}이(가) 분노 상태! ${duration}턴 동안 공격력 +${buffAmount}`,
				);
			},
		),

	orcDefensiveStance: () =>
		new Skill(
			"방어 태세",
			"",
			"buff",
			8,
			3,
			"idle",
			"방어 태세를 취하여 2턴 동안 방어력이 8 증가합니다.",
			(user, target) => {
				const buffAmount = 8;
				const duration = 2;
				target.applyBuff("defense", buffAmount, duration);
				console.log(
					`${target.name}이(가) 방어 태세! ${duration}턴 동안 방어력 +${buffAmount}`,
				);
			},
		),
};
