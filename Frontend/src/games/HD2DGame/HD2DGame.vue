<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import {
  PerspectiveCamera,
  Scene,
  Sprite,
  SpriteMaterial,
  Group,
  TextureLoader,
  NearestFilter,
  Raycaster,
  Vector2,
  Vector3,
  CanvasTexture,
  DirectionalLight,
  AmbientLight,
  HemisphereLight,
  WebGLRenderer,
  Color,
} from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { VignetteShader } from "three/examples/jsm/shaders/VignetteShader.js";

import { useSocketStore } from "@/stores/socket";
import { useUserStore } from "@/stores/user";
import { useRoute } from "vue-router";

const socketStore = useSocketStore();
const userStore = useUserStore();
const route = useRoute();

// Props
const props = defineProps({
  roomId: String,
});

const canvasRef = ref(null);

// 게임 상태
const gameState = ref({
  players: {},
  currentTurn: null,
  turnOrder: [],
  characters: [],
  turnActions: [],
  battlePhase: "planning", // planning, executing, finished
  gameOver: false,
  winner: null,
});

// UI 상태
const selectedCharacter = ref(null);
const selectedSkill = ref(null);
const hoveredSkillIndex = ref(null);
const myPlayerId = computed(() => userStore.userId);

// Three.js 객체들
let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let composer = null;
const raycaster = new Raycaster();
const pointer = new Vector2();

// 캐릭터 스프라이트 매핑
const characterSprites = new Map();

// 스프라이트 경로
const soldierIdlePath =
  "/Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/Soldier/Soldier/Soldier-Idle.png";
const soldierWalkPath =
  "/Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/Soldier/Soldier/Soldier-Walk.png";
const soldierAttachPath =
  "/Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/Soldier/Soldier/Soldier-Attack01.png";
const soldierAttachPath2 =
  "/Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/Soldier/Soldier/Soldier-Attack02.png";
const soldierDeathPath =
  "/Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/Soldier/Soldier/Soldier-Death.png";
const soldierHurtPath =
  "/Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/Soldier/Soldier/Soldier-Hurt.png";

const orcIdlePath =
  "/Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/Orc/Orc/Orc-Idle.png";
const orcAttackPath =
  "/Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/Orc/Orc/Orc-Attack01.png";
const orcAttackPath2 =
  "/Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/Orc/Orc/Orc-Attack02.png";
const orcWalkPath =
  "/Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/Orc/Orc/Orc-Walk.png";
const orcDeathPath =
  "/Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/Orc/Orc/Orc-Death.png";
const orcHurtPath =
  "/Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/Orc/Orc/Orc-Hurt.png";

// 애니메이션 클래스
class SpriteAnimation {
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

class AnimationController {
  constructor(sprite) {
    this.sprite = sprite;
    this.animations = new Map();
    this.currentAnimation = null;
    this.currentAnimationName = null;

    if (!this.sprite.material) {
      this.sprite.material = new SpriteMaterial({ transparent: true });
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
    this.sprite.material.map = this.currentAnimation.texture;
    this.sprite.material.needsUpdate = true;
  }

  update() {
    if (this.currentAnimation) {
      this.currentAnimation.update();
    }
  }
}

// 캐릭터 생성 함수
const createCharacter = async (animations, frameWidth, frameHeight, initialAnimation) => {
  const sprite = new Sprite();
  const controller = new AnimationController(sprite);
  sprite.userData.animationController = controller;

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
  return sprite;
};

// Three.js 초기화
const initScene = () => {
  const newScene = new Scene();
  const loader = new TextureLoader();
  loader.load("/background.png", (texture) => {
    newScene.background = texture;
  });
  return newScene;
};

const initCamera = (sizes) => {
  const newCamera = new PerspectiveCamera(80, sizes.width / sizes.height);
  newCamera.position.set(-5.16, 4, 4.45);
  newCamera.lookAt(0, 0, 0);
  return newCamera;
};

const initRenderer = (canvas) => {
  const newRenderer = new WebGLRenderer({ canvas });
  return newRenderer;
};

function animate() {
  if (!scene || !camera || !renderer || !controls || !composer) return;

  controls.update();

  // 모든 스프라이트 애니메이션 업데이트
  scene.traverse((object) => {
    if (object.userData.animationController) {
      object.userData.animationController.update();
    }
  });

  requestAnimationFrame(animate);
  composer.render();
}

// 게임 초기화
const setupGame = async () => {
  const sizes = { width: window.innerWidth, height: window.innerHeight };

  scene = initScene();
  camera = initCamera(sizes);
  renderer = initRenderer(canvasRef.value);
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // Post-processing
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // 조명
  const ambientLight = new AmbientLight(0xffffff, 5);
  scene.add(ambientLight);

  const hemisphereLight = new HemisphereLight(0xffffff, 0x444444, 3);
  scene.add(hemisphereLight);

  const light = new DirectionalLight(0xffffff, 3);
  light.position.set(15, 15, 5);
  scene.add(light);

  // 블룸 효과
  const bloomPass = new UnrealBloomPass(new Vector2(sizes.width, sizes.height), 0.1, 0.4, 0.9);
  composer.addPass(bloomPass);

  // Bokeh
  const bokehPass = new BokehPass(scene, camera, {
    focus: 7.0,
    aperture: 0.0005,
    maxblur: 0.0005,
  });
  composer.addPass(bokehPass);

  // Vignette
  const vignettePass = new ShaderPass(VignetteShader);
  vignettePass.uniforms.offset.value = 0.95;
  vignettePass.uniforms.darkness.value = 1.2;
  composer.addPass(vignettePass);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.enableZoom = true;
  controls.enableRotate = true;

  scene.add(camera);

  // 리사이즈 이벤트
  window.addEventListener("resize", onResize);

  // 애니메이션 시작
  animate();
};

function onResize() {
  if (!camera || !renderer || !composer) return;

  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  composer.setSize(w, h);
}

// 캐릭터 렌더링
const renderCharacters = async () => {
  if (!scene || !gameState.value.characters) return;

  // 기존 캐릭터 제거
  characterSprites.forEach((sprite) => {
    scene.remove(sprite);
  });
  characterSprites.clear();

  const friendly = new Group();
  const enemy = new Group();

  const soldierAnimations = {
    idle: { path: soldierIdlePath, frameCount: 4, fps: 5 },
    walk: { path: soldierWalkPath, frameCount: 6, fps: 10 },
    attack1: { path: soldierAttachPath, frameCount: 6, fps: 10 },
    attack2: { path: soldierAttachPath2, frameCount: 6, fps: 10 },
    death: { path: soldierDeathPath, frameCount: 6, fps: 10 },
    hurt: { path: soldierHurtPath, frameCount: 4, fps: 10 },
  };

  const orcAnimations = {
    idle: { path: orcIdlePath, frameCount: 4, fps: 5 },
    walk: { path: orcWalkPath, frameCount: 6, fps: 10 },
    attack1: { path: orcAttackPath, frameCount: 6, fps: 10 },
    attack2: { path: orcAttackPath2, frameCount: 6, fps: 10 },
    death: { path: orcDeathPath, frameCount: 6, fps: 10 },
    hurt: { path: orcHurtPath, frameCount: 4, fps: 10 },
  };

  for (const character of gameState.value.characters) {
    const animations = character.type === "soldier" ? soldierAnimations : orcAnimations;
    const sprite = await createCharacter(animations, 100, 100, "idle");

    sprite.position.set(character.position.x, character.position.y, character.position.z);
    sprite.scale.set(5, 5, 5);
    sprite.userData.characterId = character.id;

    characterSprites.set(character.id, sprite);

    if (character.playerId === myPlayerId.value) {
      friendly.add(sprite);
    } else {
      enemy.add(sprite);
    }
  }

  scene.add(friendly);
  scene.add(enemy);
};

// 스킬 선택
const selectSkill = (skill) => {
  if (!selectedCharacter.value || !skill.canUse()) return;
  selectedSkill.value = skill;
};

// 행동 제출
const submitAction = () => {
  if (!selectedCharacter.value || !selectedSkill.value) return;

  socketStore.send({
    type: "game:action",
    payload: {
      characterId: selectedCharacter.value.id,
      skillId: selectedSkill.value.id,
      targetId: null, // 타겟 선택 시 업데이트 필요
    },
  });

  // UI 초기화
  selectedCharacter.value = null;
  selectedSkill.value = null;
};

// 전투 준비 완료
const readyBattle = () => {
  socketStore.send({
    type: "game:ready",
    payload: {},
  });
};

// WebSocket 메시지 핸들러
const handleGameState = (data) => {
  gameState.value = data.gameState;
  renderCharacters();
};

const handleTurnUpdate = (data) => {
  gameState.value.currentTurn = data.currentTurn;
  gameState.value.battlePhase = data.phase;
};

onMounted(async () => {
  await setupGame();

  // WebSocket 핸들러 등록
  socketStore.on("game:updateState", handleGameState);
  socketStore.on("game:turnUpdate", handleTurnUpdate);

  // 게임 상태 요청
  socketStore.send({
    type: "player:loaded",
    payload: {},
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", onResize);

  socketStore.off("game:updateState", handleGameState);
  socketStore.off("game:turnUpdate", handleTurnUpdate);

  if (renderer) {
    renderer.dispose();
  }
});
</script>

<template>
  <div class="game-container">
    <canvas ref="canvasRef"></canvas>

    <!-- 게임 UI -->
    <div class="UI">
      <!-- 캐릭터 스탯 패널 -->
      <div v-if="selectedCharacter" class="character-stats-panel">
        <h3 class="text-white font-bold mb-3">{{ selectedCharacter.name }}</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">체력:</span>
            <span class="stat-value"
              >{{ selectedCharacter.health }}/{{ selectedCharacter.maxHealth }}</span
            >
          </div>
          <div class="stat-item">
            <span class="stat-label">공격력:</span>
            <span class="stat-value">{{ selectedCharacter.damage }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">방어력:</span>
            <span class="stat-value">{{ selectedCharacter.defense }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">속도:</span>
            <span class="stat-value speed-highlight">{{ selectedCharacter.speed }}</span>
          </div>
        </div>
      </div>

      <!-- 스킬 카드 -->
      <div v-if="selectedCharacter" class="skill-cards-container">
        <h4 class="text-white font-bold mb-3 text-center text-xl">스킬</h4>
        <div class="skill-cards">
          <div
            v-for="(skill, index) in selectedCharacter.skills"
            :key="index"
            class="skill-card"
            :class="{
              'skill-card-selected': selectedSkill === skill,
              'skill-card-disabled': !skill.canUse(),
              [skill.type]: true,
            }"
            @click="selectSkill(skill)"
          >
            <div class="skill-image">
              <div class="skill-icon" :class="`skill-type-${skill.type}`"></div>
            </div>
            <div class="skill-info">
              <h4 class="skill-name">{{ skill.name }}</h4>
              <p class="skill-description">{{ skill.description }}</p>
              <div class="skill-stats">
                <span class="skill-type-badge">{{ skill.type }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 전투 준비 버튼 -->
      <div v-if="gameState.battlePhase === 'planning'" class="ready-button-container">
        <button class="ready-button" @click="readyBattle">전투 준비 완료</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.UI {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 0.25rem;
  pointer-events: none;
}

.character-stats-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  pointer-events: auto;
  padding: 1.5rem;
  background: rgba(63, 63, 63, 0.85);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  min-width: 280px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-top: 1rem;
}

.stat-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-weight: 600;
  color: #fff;
  font-size: 0.9rem;
}

.stat-value {
  font-weight: bold;
  color: #4fc3f7;
  font-size: 1rem;
}

.speed-highlight {
  color: #ff9800;
  font-size: 1.1rem;
}

.skill-cards-container {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: auto;
  max-width: 90%;
}

.skill-cards {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.skill-card {
  width: 200px;
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: 2px solid transparent;
}

.skill-card:hover {
  transform: scale(1.05) translateY(-5px);
}

.skill-card-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.attack {
  background: #f17676;
  border-color: #d63333;
}

.heal {
  background: #55e083;
  border-color: #4dff88;
}

.buff {
  background: #ffe863;
  border-color: #ffd700;
}

.skill-card-selected {
  border-color: #1a7844;
  box-shadow: 0 8px 24px rgba(51, 224, 32, 0.8);
}

.skill-image {
  width: 100%;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.skill-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.skill-info {
  color: white;
}

.skill-name {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-align: center;
}

.skill-description {
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
  line-height: 1.4;
  opacity: 0.9;
  min-height: 3rem;
}

.skill-stats {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.skill-type-badge {
  background: rgba(255, 255, 255, 0.3);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
}

.ready-button-container {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  pointer-events: auto;
}

.ready-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.ready-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}
</style>
