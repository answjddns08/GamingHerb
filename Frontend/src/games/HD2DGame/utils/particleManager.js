import { BufferAttribute, BufferGeometry, Points, PointsMaterial, Scene, Vector3 } from "three";

export const activeParticleSystems = [];

/**
 * @typedef {Object} ParticleOptions
 * @property {number} count
 * @property {number} speed
 * @property {number} spread
 * @property {number} gravity
 * @property {number} size
 * @property {number} life
 * @property {number} color
 */

class HitBurstParticles {
  /**
   * Creates a burst of hit particles at a given position in the scene.
   * @param {Vector3} position
   * @param {Scene} scene
   * @param {ParticleOptions} options
   */
  constructor(position, scene, options) {
    const {
      count = 16,
      speed = 1.2,
      spread = 0.9,
      gravity = 3.5,
      size = 0.06,
      life = 0.6,
      color = 0xffffff,
    } = options;

    this.scene = scene;
    this.count = count;
    this.gravity = gravity;
    this.life = life;
    this.isFinished = false;

    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      positions[idx] = position.x;
      positions[idx + 1] = position.y;
      positions[idx + 2] = position.z;

      const direction = new Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      );
      direction.y = Math.abs(direction.y) + 0.2;
      direction.normalize();

      const magnitude = speed * (0.6 + Math.random() * 0.6);
      const spreadScale = spread * (0.6 + Math.random() * 0.6);
      direction.multiplyScalar(magnitude * spreadScale);

      velocities[idx] = direction.x;
      velocities[idx + 1] = direction.y;
      velocities[idx + 2] = direction.z;

      lifetimes[i] = life * (0.7 + Math.random() * 0.6);
    }

    this.positions = positions;
    this.velocities = velocities;
    this.lifetimes = lifetimes;

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute("position", new BufferAttribute(positions, 3));

    this.material = new PointsMaterial({
      color,
      size,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  update(deltaSeconds) {
    if (this.isFinished) return;

    let aliveCount = 0;
    const positions = this.positions;
    const velocities = this.velocities;

    for (let i = 0; i < this.count; i++) {
      if (this.lifetimes[i] <= 0) continue;

      const idx = i * 3;
      velocities[idx + 1] -= this.gravity * deltaSeconds;

      positions[idx] += velocities[idx] * deltaSeconds;
      positions[idx + 1] += velocities[idx + 1] * deltaSeconds;
      positions[idx + 2] += velocities[idx + 2] * deltaSeconds;

      this.lifetimes[i] -= deltaSeconds;
      if (this.lifetimes[i] > 0) {
        aliveCount++;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;

    if (aliveCount === 0) {
      this.dispose();
    }
  }

  dispose() {
    if (this.isFinished) return;
    this.isFinished = true;
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}

class healParticles {
  /**
   * Creates a burst of hit particles at a given position in the scene.
   * @param {Vector3} position
   * @param {Scene} scene
   * @param {ParticleOptions} options - 옵션 객체(추가로 쓰는 건 따로 명시함)
   * @param {number} options.radius
   * @param {number} options.height
   */
  constructor(position, scene, options = {}) {
    const {
      count = 30,
      gravity = 2.0,
      size = 0.08,
      life = 1.0,
      color = 0x66ff66,
      radius = 0.6,
      height = 1.2,
    } = options;

    this.scene = scene;
    this.count = count;
    this.gravity = gravity;
    this.life = life;
    this.isFinished = false;
    this.height = height;
    this.lifetime = life;

    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      const theta = Math.random() * Math.PI * 2;
      const r = radius * Math.sqrt(Math.random());
      const y = (Math.random() - 0.5) * height;

      positions[idx] = position.x + r * Math.cos(theta);
      positions[idx + 1] = position.y + y;
      positions[idx + 2] = position.z + r * Math.sin(theta);
    }

    this.positions = positions;

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute("position", new BufferAttribute(positions, 3));

    this.material = new PointsMaterial({
      color,
      size,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  /**
   * @param {Number} deltaSeconds
   * @returns
   */
  update(deltaSeconds) {
    if (this.isFinished) return;

    let aliveCount = 0;
    const positions = this.positions;

    for (let i = 0; i < this.count; i++) {
      if (this.lifetime <= 0) continue;

      if (positions[i * 3 + 1] > this.height) {
        positions[i * 3 + 1] = 0;
      } else {
        positions[i * 3 + 1] += this.gravity * deltaSeconds;
      }

      if (this.lifetime > 0) {
        aliveCount++;
      }
    }

    this.lifetime -= deltaSeconds;

    this.geometry.attributes.position.needsUpdate = true;

    if (aliveCount === 0) {
      this.dispose();
    }
  }

  dispose() {
    if (this.isFinished) return;
    this.isFinished = true;
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}

export const createParticles = {
  /**
   * @param {Vector3} position
   * @param {Scene} scene
   * @param {ParticleOptions} options
   * @returns
   */
  hitBurst: (position, scene, options = {}) => {
    const system = new HitBurstParticles(position, scene, options);
    activeParticleSystems.push(system);
    return system;
  },
  /**
   * @param {Vector3} position
   * @param {Scene} scene
   * @param {ParticleOptions} options
   * @returns
   */
  heal: (position, scene, options = {}) => {
    const system = new healParticles(position, scene, options);
    activeParticleSystems.push(system);
    return system;
  },
};

export function updateParticles(deltaSeconds) {
  for (let i = activeParticleSystems.length - 1; i >= 0; i--) {
    const system = activeParticleSystems[i];
    system.update(deltaSeconds);
    if (system.isFinished) {
      activeParticleSystems.splice(i, 1);
    }
  }
}
