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

import useMulti from "../multi.js";

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
  makeTeams,
} from "../utils/characterFactory.js";
import { createSkills, BUFF_SKILL_META } from "../utils/skills.js";
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

const {
  registerAction,
  turnActions,
  isBattleReady,
  friendlyCount,
  executeActionsSequentially,
  setActions,
  updateCharacterCounts,
} = useBattleActions();

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

const multi = useMulti();

const props = defineProps({
  gameId: { type: String, required: true },
  roomName: { type: String, required: true },
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
const restartNotice = ref("");
const restartDisabled = ref(false);
const restartRequested = ref(false);

function buildBattleResult(snapshot = null, winner = "", loser = "") {
  const fallbackCharacters = [...gameManager.friendly, ...gameManager.enemy].map((character) => ({
    name: character.name,
    team: character.isFriendly ? "friendly" : "enemy",
    damageDealt: character.damageDealt ?? 0,
    damageTaken: character.damageTaken ?? 0,
  }));

  const characters = snapshot?.characters?.length
    ? snapshot.characters.map((character) => ({
        name: character.name,
        team: character.team,
        damageDealt: character.damageDealt ?? 0,
        damageTaken: character.damageTaken ?? 0,
      }))
    : fallbackCharacters;

  return { winner, loser, characters };
}

/**
 * 상대가 선택한 종족
 * @type {import("vue").Ref<string|null>}
 */
const enemySelectedTeam = ref(null);
/**
 * 종족 선택 및 게임 시작
 * @type {import("vue").Ref<string|null>}
 */
const mySelectedTeam = ref(null);

/**
 * 적 행동 할당 및 턴 실행
 * @param {string} teamName
 */
function handleRaceSelect(teamName) {
  console.log("선택한 종족:", teamName);
  mySelectedTeam.value = teamName;
  multi.SendGameAction("game:selectTeam", { team: teamName });
}

function handleResultClose() {
  console.log("결과 모달 닫기");
  showResultModal.value = false;
  multi.SendGameAction("game:leaveMatch");
}

function handleResultRestart() {
  console.log("재시작 선택");
  if (restartDisabled.value || restartRequested.value) return;
  restartRequested.value = true;
  restartNotice.value = "재시작 요청을 보냈습니다.";
  multi.SendGameAction("game:restartRequest");
}

function handleOpenRaceModal() {
  showRaceSelection.value = true;
}

function handleOpenResultModal() {
  console.log("결과 모달 열기");
  battleResult.value = buildBattleResult();
  showResultModal.value = true;
}

function getCharacterByName(name) {
  return [...gameManager.friendly, ...gameManager.enemy].find(
    (character) => character.name === name,
  );
}

function buildTurnSubmission() {
  const actions = turnActions.value
    .filter((action) => action.character.isFriendly)
    .map((action) => ({
      actorName: action.character.name,
      skillName: action.skill.name,
      targetName: action.target.name,
      skillType: action.skill.type,
      skillPower: action.skill.power,
      buffType: BUFF_SKILL_META[action.skill.name]?.buffType,
      buffDuration: BUFF_SKILL_META[action.skill.name]?.duration,
    }));

  const characters = gameManager.friendly.map((character) => ({
    name: character.name,
    team: mySelectedTeam.value,
    health: character.health,
    maxHealth: character.maxHealth,
    damage: character.damage,
    defense: character.defense,
    speed: character.speed,
    baseDamage: character.baseDamage ?? character.damage,
    baseDefense: character.baseDefense ?? character.defense,
  }));

  return { actions, characters };
}

function applySnapshot(snapshot) {
  if (!snapshot?.characters?.length) return;

  snapshot.characters.forEach((state) => {
    const character = getCharacterByName(state.name);
    if (!character) return;

    character.health = state.health;
    character.maxHealth = state.maxHealth;
    character.damage = state.damage;
    character.defense = state.defense;
    character.speed = state.speed;
    character.damageDealt = state.damageDealt ?? 0;
    character.damageTaken = state.damageTaken ?? 0;

    character.healthBar.update(character.health, character.maxHealth);

    if (character.health <= 0) {
      character.removeHealthBarFromScene(sceneRef.value);
      if (character.sprite?.parent) {
        character.sprite.parent.remove(character.sprite);
      }
      gameManager.removeCharacter(character);
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

  const submission = buildTurnSubmission();
  multi.SendGameAction("game:submitTurn", submission);
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

onMounted(async () => {
  removeMouseEvent();

  multi.getIDs(props.gameId, props.roomName);

  multi.registerHandlers();

  await multi.ensureConnected();

  multi.SendGameAction("game:join");

  /**
   * 팀 선택 콜백
   * @param {string|null} myTeam - 내가 선택한 팀 (done=true일 때만)
   * @param {string|null} opponentTeam - 상대가 선택한 팀
   * @param {boolean} done - 모두 선택 완료 여부
   * @returns {void}
   */
  multi.setTeamSelectedCallback(async (myTeam, opponentTeam, done) => {
    console.log("내 팀:", myTeam, "상대 팀:", opponentTeam, "모두 선택 완료:", done);

    if (done) {
      // 모두 선택 완료: 서버에서 받은 정보로 팀 설정
      mySelectedTeam.value = myTeam;
      enemySelectedTeam.value = opponentTeam;
      await makeTeams(mySelectedTeam.value, enemySelectedTeam.value, sceneRef.value, gameManager);
      updateCharacterCounts(gameManager); // 캐릭터 수 업데이트
      showRaceSelection.value = false;
    } else {
      // 상대만 선택: UI에 표시만
      enemySelectedTeam.value = opponentTeam;
    }
  });

  /**
   * @param {Object} payload
   * @param {Array} payload.actions - 서버에서 처리된 행동 목록
   * @param {Object} payload.snapshot - 행동 처리 후 게임 상태 스냅샷
   * @param {boolean} payload.gameOver - 게임 종료 여부
   * @param {string} payload.winner - 승자 팀 이름
   * @param {string} payload.loser - 패자 팀 이름
   * @returns {Promise<void>}
   */
  multi.setTurnResolvedCallback(async (payload) => {
    if (!payload?.actions || !sceneRef.value) return;

    const resolvedActions = payload.actions
      .map((action) => {
        const actor = getCharacterByName(action.actorName);
        const target = getCharacterByName(action.targetName);
        if (!actor || !target) return null;

        const skill = actor.skills.find((s) => s.name === action.skillName);
        if (!skill) return null;

        return { character: actor, skill, target, result: action.result };
      })
      .filter(Boolean);

    setActions(resolvedActions);
    gameManager.startBattle();

    await executeActionsSequentially(gameManager, sceneRef.value);

    applySnapshot(payload.snapshot);

    if (payload.gameOver) {
      battleResult.value = buildBattleResult(payload.snapshot, payload.winner, payload.loser);
      showResultModal.value = true;
    }

    isExecutingTurn.value = false;
  });

  multi.setRestartRequestedCallback((payload) => {
    if (payload?.userId) {
      restartNotice.value = "상대방이 재시작을 요청했습니다.";
    }
  });

  multi.setRestartConfirmedCallback(() => {
    window.location.reload();
  });

  multi.setOpponentLeftCallback(() => {
    restartDisabled.value = true;
    restartNotice.value = "상대방이 나갔습니다. 재시작할 수 없습니다.";
  });

  handleOpenRaceModal();

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

  multi.unregisterHandlers();
});
</script>

<template>
  <div v-if="restartNotice" class="restart-banner">
    {{ restartNotice }}
  </div>
  <RaceSelectionModal
    v-if="showRaceSelection"
    @select="handleRaceSelect"
    :selected-team="enemySelectedTeam || mySelectedTeam"
  />
  <GameResultModal
    v-if="showResultModal"
    :result="battleResult"
    :restart-disabled="restartDisabled || restartRequested"
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
      @give-up="multi.giveUp"
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

.restart-banner {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 60;
  background: #fff2d9;
  color: #2b1b0f;
  border: 2px solid #4a2b14;
  border-radius: 12px;
  padding: 0.6rem 0.9rem;
  box-shadow: 3px 3px 0 rgba(74, 43, 20, 0.7);
  pointer-events: auto;
}
</style>
