<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import {
  Group,
  Vector3,
  Vector2,
  AxesHelper,
  PlaneGeometry,
  MeshBasicMaterial,
  DoubleSide,
  Mesh,
  MeshLambertMaterial,
  BufferGeometry,
  BufferAttribute,
  PointsMaterial,
  Points,
  AdditiveBlending,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";

// vue components
import characterStat from "./characterStat.vue";
import SkillCards from "./SkillCards.vue";
import battleSequence from "./battleSequence.vue";
import Menu from "./Menu.vue";
import RaceSelectionModal from "./RaceSelectionModal.vue";
import GameResultModal from "./GameResultModal.vue";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Composables
import { useOrbitControls } from "../composables/useOrbitControls.js";
import { useCharacterSelection } from "../composables/useCharacterSelection.js";
import { useBattleActions } from "../composables/useBattleActions.js";
import { useTargeting } from "../composables/useTargeting.js";

// Renderer & Post-processing
import {
  initScene,
  initCamera,
  initRenderer,
  setupLighting,
  createResizeHandler,
} from "../composables/useGameRenderer.js";
import { setupPostProcessing } from "../composables/usePostProcessing.js";

// Utils
import { GameManager } from "../utils/gameManager.js";
import { GameCharacter } from "../utils/gameCharacter.js";
import {
  createCharacter,
  getSoldierAnimations,
  getOrcAnimations,
} from "../utils/characterFactory.js";
import { createSkills } from "../utils/skills.js";
import { createTree } from "../utils/trees.js";
import { updateVFXs } from "../utils/vfxManager.js";
import { updateParticles } from "../utils/particleManager.js";

// Constants
import {
  TREE_CONFIGS,
  CHARACTER_STATS,
  SPRITE_POSITIONS,
  TREE_SPAWNS,
  ANIMATION_TIMINGS,
  CAMERA_CONFIG,
  TARGET_SELECTION_CONFIG,
  SPRITE_PATHS,
} from "../constants/gameConfig.js";
import { addMouseEvent, removeMouseEvent } from "../composables/useRaycasting.js";

const canvasRef = ref(null);

// Composables
const {
  controlsRef,
  cameraRef,
  isFocusing,
  desiredTarget,
  desiredCameraPos,
  initialTarget,
  initialCameraPos,
  savedTarget,
  savedCameraPos,
  initOrbitControls,
  unfocus,
  focusOnTarget,
  updateFocusing,
  resetCamera,
} = useOrbitControls();

const {
  selectedCharacter,
  selectCharacter,
  characterSkills,
  selectedCharacterTexture,
  selectEmission,
  updateEmissivePulse,
} = useCharacterSelection();

const { registerAction, turnActions, isBattleReady, friendlyCount, executeActionsSequentially } =
  useBattleActions();

const {
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
} = useTargeting({
  registerAction,
  focusOnTarget,
  unfocus,
  selectedCharacter,
});

// Game Manager
const gameManager = new GameManager();

// Scene references
const sceneRef = ref(null);
const rendererInstance = ref(null);

/**
 * Post-processing
 * @type {EffectComposer || null}
 */
let composer = null;
/**
 * @type {BokehPass || null}
 */
let bokehPass = null;
let onResizeHandler = null;

const isSelectedSomething = ref(false);
const isExecutingTurn = ref(false);

const showRaceSelection = ref(true);
const showResultModal = ref(false);
const battleResult = ref({
  winner: "",
  loser: "",
  characters: [],
});

function getAliveCharacters(list) {
  return list.filter((character) => character.isAlive());
}

function pickRandom(list) {
  if (!list.length) return null;
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function pickLowestHealth(list) {
  if (!list.length) return null;
  return [...list].sort((a, b) => a.health - b.health)[0];
}

function selectEnemySkill(character) {
  const usableSkills = character.skills.filter((skill) => skill.canUse());
  return pickRandom(usableSkills.length ? usableSkills : character.skills);
}

function selectTargetForEnemy(skill, enemy) {
  if (!skill) return null;

  if (skill.type === "heal") {
    const allies = getAliveCharacters(gameManager.enemy).filter((c) => c.health < c.maxHealth);
    return pickLowestHealth(allies) || enemy;
  }

  if (skill.type === "buff") {
    return enemy;
  }

  const targets = getAliveCharacters(gameManager.friendly);
  return pickLowestHealth(targets) || pickRandom(targets);
}

function buildBattleResult() {
  const friendlyAlive = getAliveCharacters(gameManager.friendly);
  const enemyAlive = getAliveCharacters(gameManager.enemy);
  const friendlyWon = friendlyAlive.length > 0 && enemyAlive.length === 0;
  const enemyWon = enemyAlive.length > 0 && friendlyAlive.length === 0;

  let winner = "";
  let loser = "";
  if (friendlyWon) {
    winner = "기사 집단";
    loser = "오크 집단";
  } else if (enemyWon) {
    winner = "오크 집단";
    loser = "기사 집단";
  } else {
    winner = "무승부";
    loser = "-";
  }

  const characters = [...gameManager.friendly, ...gameManager.enemy].map((character) => ({
    name: character.name,
    team: character.isFriendly ? "기사" : "오크",
    damageDealt: 0,
    damageTaken: Math.max(0, character.maxHealth - character.health),
  }));

  return { winner, loser, characters };
}

function handleRaceSelect(raceKey) {
  console.log("선택한 종족:", raceKey);
  showRaceSelection.value = false;
}

function handleRaceClose() {
  console.log("종족 선택 닫기");
  showRaceSelection.value = false;
}

function handleResultClose() {
  console.log("결과 모달 닫기");
  showResultModal.value = false;
}

function handleResultRestart() {
  console.log("재시작 선택");
  showResultModal.value = false;
}

function handleOpenRaceModal() {
  console.log("종족 선택 모달 열기");
  showRaceSelection.value = true;
}

function handleOpenResultModal() {
  console.log("결과 모달 열기");
  battleResult.value = buildBattleResult();
  showResultModal.value = true;
}

function assignEnemyActions() {
  const enemies = getAliveCharacters(gameManager.enemy);

  enemies.forEach((enemy) => {
    const skill = selectEnemySkill(enemy);
    const target = selectTargetForEnemy(skill, enemy);

    if (skill && target) {
      registerAction(enemy, skill, target);
    }
  });
}

async function handleStartBattle() {
  if (!isBattleReady.value || isExecutingTurn.value) return;

  isExecutingTurn.value = true;

  stopTargeting();
  clearTargetSelection();
  selectedCharacter.value = null;
  unfocus();

  // 적 행동 할당 전 딜레이 (UI 전환 텀)
  await new Promise((resolve) => setTimeout(resolve, 500));

  gameManager.startBattle();

  assignEnemyActions();

  // 전투 실행 전 딜레이 (배틀 순서 확인 텀)
  await new Promise((resolve) => setTimeout(resolve, 500));

  await executeActionsSequentially(gameManager, sceneRef.value);

  if (!getAliveCharacters(gameManager.friendly).length) {
    battleResult.value = buildBattleResult();
    showResultModal.value = true;
  } else if (!getAliveCharacters(gameManager.enemy).length) {
    battleResult.value = buildBattleResult();
    showResultModal.value = true;
  }

  isExecutingTurn.value = false;
}

/**
 * 게임 초기화
 */
const setThree = async () => {
  try {
    // 기본 설정
    const scene = initScene();
    const camera = initCamera(initialCameraPos);
    const renderer = initRenderer(canvasRef.value);

    // ref에 저장
    sceneRef.value = scene;
    rendererInstance.value = renderer;

    // AxesHelper(좌표축) 추가 (디버그용)
    //scene.add(new AxesHelper(1));

    // Post-processing 설정
    const ppConfig = setupPostProcessing(renderer, scene, camera);
    composer = ppConfig.composer;
    bokehPass = ppConfig.bokehPass;

    // 라이팅
    setupLighting(scene);

    // OrbitControls 초기화
    initOrbitControls(camera, renderer);

    // 리사이즈 핸들러
    onResizeHandler = createResizeHandler(camera, renderer, composer);
    window.addEventListener("resize", onResizeHandler);

    // 카메라를 씬에 추가
    scene.add(camera);

    // 나무 배경 로드
    const testLoadScene = new GLTFLoader();
    testLoadScene.load("/hd2d/HD2DGuSang.glb", (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.35, 0.35, 0.35);
      model.position.set(0, -0.35, 0);
      model.rotation.y = -(Math.PI / 2);

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      scene.add(model);
    });

    // 테스트용 지면
    /* const testGround = new Mesh(
			new PlaneGeometry(25, 25),
			new MeshLambertMaterial({ color: 0x228b22, side: DoubleSide }),
		);
		testGround.rotation.x = -Math.PI / 2;

		testGround.position.y = -0.4;

		testGround.castShadow = true;
		testGround.receiveShadow = true;

		scene.add(testGround); */

    // 마우스 이벤트 설정
    addMouseEvent(scene, camera, handleCanvasClick);

    // 아군과 적군 그룹 생성
    const friendly = new Group();
    const enemy = new Group();

    // 병사 애니메이션
    const soldierAnimations = getSoldierAnimations();

    // === 아군 생성 ===
    for (let i = 0; i < CHARACTER_STATS.soldiers.length; i++) {
      const stat = CHARACTER_STATS.soldiers[i];
      const pos = SPRITE_POSITIONS.soldiers[i];

      const sprite = await createCharacter(soldierAnimations, 64, 64, "idle");
      sprite.position.copy(pos.position);
      sprite.scale.copy(pos.scale);
      friendly.add(sprite);

      const character = new GameCharacter(
        stat.name,
        stat.health,
        stat.defense,
        stat.damage,
        stat.speed,
        sprite,
        stat.isFriendly,
        SPRITE_PATHS.soldierPicture,
      );

      character.addSkill(createSkills.soldierBasicAttack());
      character.addSkill(createSkills.soldierPowerAttack(scene));
      character.addSkill(createSkills.soldierHeal(scene));
      gameManager.addCharacter(character, true);
      character.addHealthBarToScene(scene);
    }

    friendlyCount.value = CHARACTER_STATS.soldiers.length;

    // 오크 애니메이션
    const orcAnimations = getOrcAnimations();

    // === 적군 생성 ===
    for (let i = 0; i < CHARACTER_STATS.orcs.length; i++) {
      const stat = CHARACTER_STATS.orcs[i];
      const pos = SPRITE_POSITIONS.orcs[i];

      const sprite = await createCharacter(orcAnimations, 64, 64, "idle");
      sprite.position.copy(pos.position);
      sprite.scale.copy(pos.scale);
      enemy.add(sprite);

      const character = new GameCharacter(
        stat.name,
        stat.health,
        stat.defense,
        stat.damage,
        stat.speed,
        sprite,
        stat.isFriendly,
        SPRITE_PATHS.orcPicture,
      );

      if (i < 2) {
        character.addSkill(createSkills.orcBasicAttack());
        character.addSkill(createSkills.orcHeavySmash());
        character.addSkill(i === 0 ? createSkills.orcRage() : createSkills.orcDefensiveStance());
      } else {
        // 보스 오크
        character.addSkill(createSkills.orcBasicAttack());
        character.addSkill(createSkills.orcHeavySmash());
        character.addSkill(createSkills.orcRage());
      }

      gameManager.addCharacter(character, false);
      character.addHealthBarToScene(scene);
    }

    // 씬에 추가
    scene.add(friendly);
    scene.add(enemy);

    // === 나무 배경 생성 ===
    for (const spawn of TREE_SPAWNS) {
      const tree = await createTree(spawn.size, spawn.variant, spawn.scale, TREE_CONFIGS);
      tree.addToScene(scene, spawn.position);
    }

    // 대상 선택 중인 상태 감지
    watch(pendingTarget, selectEmission);

    // === 애니메이션 루프 ===
    let lastFrameTime = performance.now();
    function animate() {
      const nowMs = performance.now();
      const deltaSeconds = Math.max(0, (nowMs - lastFrameTime) / 1000);
      lastFrameTime = nowMs;

      controlsRef.value?.update();

      const timeSeconds = nowMs / 1000;

      // Bokeh Pass 동적 업데이트 (Depth of Field)
      /* if (bokehPass && controlsRef.value) {
				const distance = camera.position.distanceTo(controlsRef.value.target);

				// focus: 거리에 약간의 오프셋 추가 (더 자연스러운 포커스)
				bokehPass.uniforms.focus.value = distance - 0.5;

				// aperture: 거리에 비례 (멀수록 크게 = 보케 작게, 가까울수록 작게 = 보케 크게)
				// 기본 범위: 0.00005 (가까움) ~ 0.001 (멀음)
				const minAperture = 0.0005;
				const maxAperture = 0.001;
				const minDistance = 3;
				const maxDistance = 15;
				const normalizedDistance = Math.min(
					1,
					Math.max(
						0,
						(distance - minDistance) / (maxDistance - minDistance),
					),
				);
				bokehPass.uniforms.aperture.value =
					minAperture + normalizedDistance * (maxAperture - minAperture);
			} */

      // 카메라 빌보딩: 모든 Plane 객체가 카메라 Y축 회전을 따라가도록
      const cameraForward = new Vector3(0, 0, -1);
      cameraForward.applyQuaternion(camera.quaternion);
      cameraForward.y = 0; // Y축 성분 제거 (XZ 평면에 투영)
      cameraForward.normalize();

      // 씬의 모든 빌보드 객체 회전 업데이트
      scene.traverse((object) => {
        if (object.userData.isBillboard) {
          object.quaternion.setFromUnitVectors(new Vector3(0, 0, -1), cameraForward);
        }

        // 애니메이션 업데이트
        if (object.userData.animationController) {
          object.userData.animationController.update();
        }
      });

      // 체력바 위치 업데이트
      [...gameManager.friendly, ...gameManager.enemy].forEach((character) => {
        if (character.isAlive()) {
          character.updateHealthBarPosition();
        }
      });

      // 카메라 포커싱 업데이트
      updateFocusing();

      // 타겟 emissive 펄스 업데이트
      updateEmissivePulse(pendingTarget.value, timeSeconds);

      updateVFXs();
      updateParticles(deltaSeconds);

      requestAnimationFrame(animate);
      composer.render();
    }

    animate();
  } catch (error) {
    console.error("게임 초기화 실패:", error);
  }
};

function consoleCameraPosition() {
  if (cameraRef.value) {
    console.log("Camera Position:", cameraRef.value.position);
    console.log("Camera Target:", controlsRef.value.target);
  }
}

/**
 * 캔버스 클릭 핸들러
 * @param {THREE.Object3D} intersectedObject
 */
function handleCanvasClick(intersectedObject) {
  /**
   * @type {import("../utils/gameCharacter.js").GameCharacter}
   */
  const character = intersectedObject.userData.character;

  //console.log("Clicked on object:", intersectedObject, "Character:", character);

  if (isTargeting.value) {
    handleTargetSelection(character);
    return;
  }

  if (!character) {
    isSelectedSomething.value = false;
    clearTargetSelection();

    if (selectedCharacter.value || isFocusing.value) {
      unfocus();
      selectedCharacter.value = null;
    }

    return;
  }

  const material = intersectedObject.material;

  selectedCharacterTexture.value = material && material.map;
  clearTargetSelection();

  selectCharacter(character);
  focusOnTarget(
    character.sprite.getWorldPosition(new Vector3()),
    CAMERA_CONFIG.focusCameraOffset,
    isSelectedSomething.value ? false : true,
  );

  isSelectedSomething.value = true;
}

onMounted(() => {
  removeMouseEvent();

  setThree();
});

onUnmounted(() => {
  // 이벤트 리스너 정리
  if (rendererInstance.value?.domElement) {
    if (onResizeHandler) {
      removeMouseEvent();
      window.removeEventListener("resize", onResizeHandler);
    }
  }
});
</script>

<template>
  <RaceSelectionModal
    v-if="showRaceSelection"
    @select="handleRaceSelect"
    @close="handleRaceClose"
  />
  <GameResultModal
    v-if="showResultModal"
    :result="battleResult"
    @close="handleResultClose"
    @restart="handleResultRestart"
  />
  <div class="UI">
    <battleSequence
      class="turn-order"
      :battle-actions="turnActions"
      :is-executing-turn="isExecutingTurn"
    />
    <characterStat
      class="enemy-stats"
      v-if="selectedTarget"
      :key="selectedTarget.name"
      :character="selectedTarget"
    />

    <Menu
      class="menu"
      @open-race-modal="handleOpenRaceModal"
      @open-result-modal="handleOpenResultModal"
    />

    <characterStat
      class="friendly-stats"
      v-if="selectedCharacter"
      :key="selectedCharacter.name"
      :character="selectedCharacter"
    />
    <SkillCards
      class="skill-cards"
      :skills="isTargeting ? pendingActor?.skills : selectedCharacter.skills"
      :isFriendly="isTargeting ? pendingActor?.isFriendly : selectedCharacter.isFriendly"
      :is-progressing="isExecutingTurn"
      @unfocus="focusOnTarget(new Vector3(0, 0, 0), CAMERA_CONFIG.initialCameraPos, false)"
      @select-skill="handleSkillSelected"
      v-if="selectedCharacter"
    />
    <button
      class="start-button"
      :class="{ disabled: !isBattleReady || isExecutingTurn }"
      @click="handleStartBattle"
    >
      <div class="button-content">
        <div class="sword-container normal">
          <div class="tip"></div>
          <div class="sword-body"></div>
          <div class="sword-guard"></div>
          <div class="sword-handle"></div>
        </div>
        <div class="sword-container rotated">
          <div class="tip"></div>
          <div class="sword-body"></div>
          <div class="sword-guard"></div>
          <div class="sword-handle"></div>
        </div>
      </div>
    </button>
  </div>
  <canvas ref="canvasRef"></canvas>
</template>

<style scoped>
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

  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 1fr 2fr 1fr;

  grid-template-areas:
    "turn-order turn-order enemy-stats"
    "menu . ."
    "friendly-stats skill-cards start-button";

  /* padding: 0.5rem; */

  pointer-events: none;
}

.turn-order {
  grid-area: turn-order;

  justify-self: start;
  align-self: start;
}

.menu {
  grid-area: menu;

  justify-self: flex-start;
  align-self: center;
}

.enemy-stats {
  grid-area: enemy-stats;

  justify-self: end;
  align-self: start;

  margin-right: 0.25rem;
  margin-top: 0.25rem;
}

.friendly-stats {
  grid-area: friendly-stats;

  justify-self: start;
  align-self: end;

  margin-left: 0.25rem;
  margin-bottom: 0.25rem;
}

.skill-cards {
  grid-area: skill-cards;

  justify-self: center;
  align-self: end;
}

.start-button {
  grid-area: start-button;

  width: 12rem;
  height: 12rem;

  pointer-events: auto;

  justify-self: end;
  align-self: end;

  margin-right: 0.25rem;
  margin-bottom: 0.25rem;

  transform: rotate(-45deg) scale(0.65);

  transition: transform 0.2s ease;

  background-color: #fbbf24;

  border-radius: 1rem;

  z-index: 1;
}

.start-button.disabled {
  pointer-events: none;

  opacity: 0.5;
}

.start-button:hover {
  cursor: pointer;

  transform: rotate(-45deg) scale(0.75);
}

.button-content {
  position: relative;

  width: 100%;
  height: 100%;
}

.sword-container {
  position: absolute;

  height: 100%;

  display: flex;

  flex-direction: column;

  justify-content: flex-start;
  align-items: center;
}

.sword-container.normal {
  left: 39%;
  top: 9%;
  transform-origin: center center;
}

.sword-container.rotated {
  left: 21.5%;
  top: -8%;

  transform: rotate(90deg);
  transform-origin: center center;
}

.tip {
  position: relative;

  border-style: solid;

  border-width: 0 12px 12px 12px;

  border-color: transparent transparent #8f99ac transparent;
}

.tip::before {
  position: absolute;

  content: "";

  transform: translateX(-0.625rem) rotate(90deg);

  top: 2.5px;

  border-style: solid;

  border-width: 0 20px 20px 20px;

  border-color: transparent transparent #73839c transparent;

  z-index: -1;
}

.tip::after {
  position: absolute;

  content: "";

  transform: translateX(-1.85rem) rotate(-90deg);

  top: 2.5px;

  border-style: solid;

  border-width: 0 20px 20px 20px;

  border-color: transparent transparent #b0c8ce transparent;

  z-index: -1;
}

.sword-body {
  height: 6rem;
  width: 25px;

  background: #8f99ac;

  position: relative;
}

.sword-body::before {
  position: absolute;

  height: 100%;
  width: 100%;

  content: "";

  right: -29%;

  background: #73839c;

  z-index: -1;
}

.sword-body::after {
  position: absolute;

  height: 100%;
  width: 100%;

  content: "";

  left: -29%;

  background: #b0c8ce;

  z-index: -1;
}

.sword-guard {
  position: relative;

  height: 1.25rem;
  width: 4.5rem;

  background-color: #5b391b;

  border-radius: 0.25rem;
}

.sword-guard::before {
  position: absolute;

  content: "";

  height: 75%;
  width: 45%;

  left: 50%;

  bottom: -70%;

  border-bottom: 7px solid #3e2723;

  border-left: 15px solid transparent;
  border-right: 15px solid transparent;

  transform: translateX(-50%) rotate(180deg);

  z-index: 1;
}

.sword-handle {
  position: relative;

  height: 2.5rem;
  width: 20px;

  background-color: #3e2723;

  border-radius: 0 0 0.25rem 0.25rem;
}
</style>
