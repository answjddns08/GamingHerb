import { useSocketStore } from "@/stores/socket";
// eslint-disable-next-line no-unused-vars
import MiniGameScene from "@/games/WaitingMiniGame/waitingGame";

const socketStore = useSocketStore();

/**
 * 멀티플레이어 게임 인스턴스
 * @type {Phaser.Game|null}
 */
let gameInstance = null;

/**
 * 현재 씬 참조
 * @type {MiniGameScene|null}
 */
let scene = null;

/**
 * 멀티플레이어 게임 관련 소켓 이벤트 등록
 */
function RegisterMultiPlayerEvents() {
  socketStore.registerHandler("playerMoving", (data) => {
    console.log("Multi-player game started with data:", data);
    // Handle the multi-player game start logic here
  });

  socketStore.registerHandler("playerAttack", (data) => {
    console.log("Player attack event received with data:", data);
    // Handle the player attack logic here
  });
}

/**
 * 멀티플레이어 게임 관련 소켓 이벤트 정리
 */
function CleanEvents() {
  socketStore.unregisterHandler("playerMoving");
  socketStore.unregisterHandler("playerAttack");
}

/**
 * Phaser Game 인스턴스 설정
 * @param {Phaser.Game} instance - Phaser Game 인스턴스
 * @returns {void}
 */
function GetGameInstance(instance) {
  if (!instance) {
    console.error("Game instance is null");
    return;
  }

  gameInstance = instance;
  scene = gameInstance.scene.getScene("MiniGameScene");

  if (!scene) {
    console.error("MiniGameScene not found");
    return;
  }

  console.log("Multi-player game instance set:", gameInstance);
}

/**
 * 플레이어가 멀티플레이어 게임에 참여
 * @param {string} id - 플레이어 ID
 * @param {number} x - 플레이어 초기 X 좌표
 * @param {number} y - 플레이어 초기 Y 좌표
 */
function JoinPlayer(id, x, y) {
  scene.addPlayer(id, x, y);
}

/**
 * 플레이어가 멀티플레이어 게임에서 나감
 * @param {string} id - 플레이어 ID
 * @returns {void}
 */
function ExitPlayer(id) {
  if (!scene) {
    console.warn("Scene is not initialized");
    return;
  }
  scene.deletePlayer(id);
}

export { RegisterMultiPlayerEvents, GetGameInstance, JoinPlayer, ExitPlayer, CleanEvents };
