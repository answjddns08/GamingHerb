import { useSocketStore } from "@/stores/socket";
import { useUserStore } from "@/stores/user";
// eslint-disable-next-line no-unused-vars
import MiniGameScene from "@/games/WaitingMiniGame/waitingGame";

const socketStore = useSocketStore();
/**
 * 현재 씬 참조
 * @type {MiniGameScene|null}
 */
let scene = null;

/**
 * 컴포넌트 props
 * @type {{gameId: string, roomId: string}}
 */
let props = {};

/**
 * 사용자 정보 스토어
 */
const userStore = useUserStore();

/**
 * 소켓 메시지 전송 함수
 * @param {Object} payload - 추가 페이로드
 */
function send(payload = {}) {
  socketStore.sendMessage("waiting", {
    gameId: props.gameId,
    roomName: props.roomId,
    userId: userStore.id,
    userName: userStore.name,
    action: { type: "miniGame", payload: payload },
  });

  console.log("Sent Game socket message with payload:", payload);
}

/**
 * 멀티플레이어 게임 관련 소켓 이벤트 등록
 */
function RegisterMultiPlayerEvents() {
  /**
   * 다른 플레이어의 이동을 처리합니다.
   * @param {Object} data - { userId, x, y, velocityX, velocityY }
   */
  socketStore.registerHandler("playerMove", (data) => {
    if (data?.payload?.userId && data.payload.userId !== userStore.id) {
      const { userId, x, y } = data.payload;
      MoveOtherPlayer(userId, x, y);
    }
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
  socketStore.unregisterHandler("playerMove");
  socketStore.unregisterHandler("playerAttack");
}

/**
 * 씬 정리 및 리소스 해제
 */
function CleanupScene() {
  if (scene) {
    scene.cleanup();
    scene.events.removeAllListeners();
    scene = null;
  }
}

/**
 * Phaser Game 인스턴스 설정 (이벤트 기반 방식)
 * @param {Phaser.Game} instance - Phaser Game 인스턴스
 * @param {{gameId: string, roomId: string}} inputProps - 컴포넌트 props
 * @returns {void}
 */
function GetGameInstance(instance, inputProps) {
  if (!instance || !inputProps) {
    console.error("Game instance or props is null");
    return;
  }

  props = inputProps;

  console.log("Multi-player game instance set:", instance);

  // 방법 2: 이벤트 리스닝 (Scene이 준비되면 알림받음)
  instance.events.once("ready", () => {
    const miniGameScene = instance.scene.getScene("MiniGameScene");

    if (!miniGameScene) return;
    // Scene의 'scene-ready' 이벤트 대기
    miniGameScene.events.once("scene-ready", (readyScene) => {
      scene = readyScene;
      console.log("MiniGameScene is ready via event:", scene);

      // 이동 동기화 시작 (초당 30회)
      StartPositionSync();
    });
  });
}

/**
 * 플레이어 위치를 주기적으로 서버에 동기화
 * 약 33ms마다 실행 (약 30Hz) - 네트워크 효율과 부드러움의 균형
 */
function StartPositionSync() {
  if (!scene) {
    console.warn("Scene is not initialized");
    return;
  }

  scene.time.addEvent({
    delay: 33, // 약 33ms마다 실행 (초당 ~30회)
    callback: () => {
      const player = scene.players.getChildren().find((p) => p.name === `player_${userStore.id}`);

      if (player) {
        send({
          type: "move",
          id: userStore.id,
          x: player.x,
          y: player.y,
          velocityX: player.body.velocity.x,
          velocityY: player.body.velocity.y,
        });
      }
    },
    loop: true, // 계속 반복
  });
}

/**
 * 플레이어 배열 받기
 * @param {Array<{id: string, x: number, y: number}>} players - 플레이어 배열
 */
function InitPlayers(players) {
  if (!scene) {
    console.warn("Scene is not initialized");
    return;
  }

  players.forEach((player) => {
    scene.addPlayer(player.id, player.x, player.y);
  });
}

/** 새로운 플레이어 추가
 * @param {string} id - 플레이어 ID
 */
function NewPlayer(id) {
  if (!scene) {
    console.warn("Scene is not initialized");
    return;
  }

  console.log(`Adding new player with ID: ${id}`);

  const isXPlus = Math.random() < 0.5;
  const isYPlus = Math.random() < 0.5;

  const XCoords = Math.random() * 200 * (isXPlus ? 1 : -1);
  const YCoords = Math.random() * 200 * (isYPlus ? 1 : -1);

  scene.addPlayer(id, XCoords, YCoords);

  send({ type: "join", id: id, x: XCoords, y: YCoords });
}

/**
 * 플레이어가 멀티플레이어 게임에 참여
 * @param {string} id - 플레이어 ID
 * @param {number} x - 플레이어 초기 X 좌표
 * @param {number} y - 플레이어 초기 Y 좌표
 */
function JoinPlayer(id, x, y) {
  if (!scene) {
    console.warn("Scene is not initialized");
    return;
  }

  scene.addPlayer(id, x, y);
}

/**
 * 다른 플레이어 이동 처리
 * @param {string} id - 플레이어 ID
 * @param {number} x - 목표 X 좌표
 * @param {number} y - 목표 Y 좌표
 */
function MoveOtherPlayer(id, x, y) {
  if (!scene) {
    console.warn("Scene is not initialized");
    return;
  }

  scene.MoveOtherPlayer(id, x, y);
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
  send({ type: "exit", id: id });
}

export {
  RegisterMultiPlayerEvents,
  GetGameInstance,
  JoinPlayer,
  ExitPlayer,
  NewPlayer,
  CleanEvents,
  InitPlayers,
  CleanupScene,
  StartPositionSync,
};
