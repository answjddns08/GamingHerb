import { useSocketStore } from "@/stores/socket";
import { useUserStore } from "@/stores/user";
// eslint-disable-next-line no-unused-vars
import MiniGameScene, { WORLD_CENTER_X, WORLD_CENTER_Y } from "@/games/WaitingMiniGame/waitingGame";

const socketStore = useSocketStore();
/**
 * 현재 씬 참조
 * @type {MiniGameScene|null}
 */
let scene = null;

/**
 * 씬이 준비되었는지 여부
 * @type {boolean}
 */
let isSceneReady = false;

/**
 * Scene 준비 전에 호출된 함수들을 저장하는 큐
 * @type {Array<{name: string, args: any[]}>}
 */
let actionQueue = [];

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

  //console.log("Sent Game socket message with payload:", payload);
}

/**
 * 멀티플레이어 게임 관련 소켓 이벤트 등록
 */
function RegisterMultiPlayerEvents() {
  /**
   * 새 플레이어가 미니게임에 참가했을 때 (기존 플레이어들이 받음)
   * @param {Object} payload - { userId, userName, x, y }
   */
  socketStore.registerHandler("miniGame:playerJoined", (payload) => {
    console.log("miniGame:playerJoined event received with data:", payload);

    if (payload?.userId && payload.userId !== userStore.id) {
      const { userId, userName, x, y } = payload;
      console.log(`New player ${userId} (${userName}) joined mini-game at (${x}, ${y})`);
      JoinPlayer(userId, x, y, userName);
    }
  });

  /**
   * 플레이어가 미니게임에서 퇴장했을 때
   * @param {Object} payload - { userId }
   */
  socketStore.registerHandler("miniGame:playerLeft", (payload) => {
    if (payload?.userId && payload.userId !== userStore.id) {
      const { userId } = payload;
      console.log(`Player ${userId} left mini-game`);
      ExitPlayer(userId);
    }
  });

  /**
   * 미니게임 참가자 초기화 이벤트
   * @param {Object} payload - { players: Array<{id, x, y}> }
   */
  socketStore.registerHandler("miniGame:initializePlayers", (payload) => {
    console.log("miniGame:initializePlayers event received with data:", payload);

    if (payload?.players) {
      InitPlayers(payload.players);
    }
  });

  /**
   * 다른 플레이어의 이동을 처리합니다.
   * 배열 형식: 틱 기반 배치 업데이트 (여러 플레이어)
   * 단일 형식: 개별 플레이어 이동 (레거시 지원)
   * @param {Object|Array} payload - { userId, x, y, velocityX, velocityY } or Array<{userId, x, y, ...}>
   */
  socketStore.registerHandler("playerMove", (payload) => {
    // 배열 형식: 틱 기반 배치 업데이트
    if (Array.isArray(payload)) {
      payload.forEach((playerState) => {
        if (playerState?.userId && playerState.userId !== userStore.id) {
          MoveOtherPlayer(
            playerState.userId,
            playerState.x,
            playerState.y,
            playerState.dirX,
            playerState.dirY,
          );
        }
      });
      return;
    }

    // 단일 형식: 개별 플레이어 이동
    if (payload?.userId && payload.userId !== userStore.id) {
      const { userId, x, y, dirX, dirY } = payload;
      MoveOtherPlayer(userId, x, y, dirX, dirY);
    }
  });

  socketStore.registerHandler("playerAttack", (payload) => {
    console.log("Player attack event received with data:", payload);
    if (payload?.userId && payload.userId !== userStore.id) {
      const { userId, dirX, dirY } = payload;
      ShowRemotePlayerSwing(userId, dirX, dirY);
    }
  });

  /**
   * 넉백 이벤트 처리
   * @param {Object} payload - { userId, knockbackX, knockbackY }
   */
  socketStore.registerHandler("playerKnockback", (payload) => {
    console.log("Player knockback event received with data:", payload);
    if (payload?.userId) {
      const { userId, knockbackX, knockbackY } = payload;
      ApplyRemoteKnockback(userId, knockbackX, knockbackY);
    }
  });

  /**
   * 부활 이벤트 처리
   * @param {Object} payload - { userId, x, y }
   */
  socketStore.registerHandler("playerRespawn", (payload) => {
    console.log("Player respawn event received with data:", payload);
    if (payload?.userId && payload.userId !== userStore.id) {
      const { userId, x, y } = payload;
      ShowRemotePlayerRespawn(userId, x, y);
    }
  });
}

/**
 * 멀티플레이어 게임 관련 소켓 이벤트 정리
 */
function CleanEvents() {
  socketStore.unregisterHandler("miniGame:playerJoined");
  socketStore.unregisterHandler("miniGame:playerLeft");
  socketStore.unregisterHandler("miniGame:initializePlayers");
  socketStore.unregisterHandler("playerMove");
  socketStore.unregisterHandler("playerAttack");
  socketStore.unregisterHandler("playerKnockback");
  socketStore.unregisterHandler("playerRespawn");
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
  isSceneReady = false; // ✅ 플래그 리셋
  actionQueue = []; // ✅ 큐 초기화
}

/**
 * 큐에 저장된 모든 액션을 순서대로 처리합니다.
 */
function ProcessActionQueue() {
  console.log(`Processing action queue with ${actionQueue.length} items`);

  while (actionQueue.length > 0) {
    const { name, args } = actionQueue.shift();
    console.log(`Executing queued action: ${name}`, args);

    switch (name) {
      case "NewPlayer":
        NewPlayerImpl(...args);
        break;
      case "JoinPlayer":
        JoinPlayerImpl(...args);
        break;
      case "InitPlayers":
        InitPlayersImpl(...args);
        break;
      case "MoveOtherPlayer":
        MoveOtherPlayerImpl(...args);
        break;
      default:
        console.warn(`Unknown queued action: ${name}`);
    }
  }
}

/**
 * 플레이어 이름 조회 함수
 * @type {Function|null}
 */
let getPlayerNameFunc = null;

/**
 * Phaser Game 인스턴스 설정 (이벤트 기반 방식)
 * @param {Phaser.Game} instance - Phaser Game 인스턴스
 * @param {{gameId: string, roomId: string}} inputProps - 컴포넌트 props
 * @param {Function} getPlayerName - 플레이어 이름 조회 함수
 * @returns {void}
 */
function GetGameInstance(instance, inputProps, getPlayerName) {
  if (!instance || !inputProps) {
    console.error("Game instance or props is null");
    return;
  }

  props = inputProps;
  getPlayerNameFunc = getPlayerName;

  console.log("Multi-player game instance set:", instance);

  // 방법 2: 이벤트 리스닝 (Scene이 준비되면 알림받음)
  instance.events.once("ready", () => {
    const miniGameScene = instance.scene.getScene("MiniGameScene");

    if (!miniGameScene) return;
    // Scene의 'scene-ready' 이벤트 대기
    miniGameScene.events.once("scene-ready", (readyScene) => {
      scene = readyScene;
      isSceneReady = true; // ✅ 씬이 준비되었음을 표시

      console.log("MiniGameScene is ready via event:", scene);

      // ✅ 큐에 저장된 액션들 처리
      ProcessActionQueue();

      // 이동 동기화 시작 (초당 30회)
      StartPositionSync();

      // Phaser 씬에 SendSwingAttack 함수 주입
      scene.sendSwingAttack = SendSwingAttack;

      // 씬에서 발생하는 로컬 이벤트 리스닝
      scene.events.on("local-knockback", (data) => {
        // 넉백 이벤트를 서버로 전송
        send({
          type: "knockback",
          id: userStore.id,
          targetId: data.targetId,
          knockbackX: data.knockbackX,
          knockbackY: data.knockbackY,
        });
      });

      scene.events.on("local-respawn", (data) => {
        // 부활 이벤트를 서버로 전송
        send({
          type: "respawn",
          id: userStore.id,
          x: data.x,
          y: data.y,
        });
      });
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
        // ✅ 넉백 중에도 계속 동기화 (velocity로 이동 중이므로 위치 업데이트 필요)
        // 원격 플레이어는 velocity 적용 중이므로 새 위치는 무시하지만,
        // 서버의 위치는 항상 최신 상태 유지 → 다른 플레이어들이 정확한 위치 받음

        const dir = player.lastDirection || { x: 0, y: 1 };
        // 고정된 월드 중심을 기준으로 상대좌표 + 방향 전송
        send({
          type: "move",
          id: userStore.id,
          x: player.x - WORLD_CENTER_X,
          y: player.y - WORLD_CENTER_Y,
          dirX: dir.x,
          dirY: dir.y,
        });

        // ✅ 넉백 종료 플래그 초기화
        if (player.knockbackEnded) {
          player.knockbackEnded = false;
        }
      }
    },
    loop: true, // 계속 반복
  });
}

/**
 * 플레이어 배열 받기 (공개 인터페이스)
 * @param {Array<{id: string, x: number, y: number}>} players - 플레이어 배열
 */
function InitPlayers(players) {
  if (isSceneReady) {
    InitPlayersImpl(players);
  } else {
    actionQueue.push({ name: "InitPlayers", args: [players] });
    console.log("InitPlayers queued. Queue size:", actionQueue.length);
  }
}

/**
 * 플레이어 배열 받기 (내부 구현)
 * @param {Array<{id: string, x: number, y: number, userName: string}>} players - 플레이어 배열
 */
function InitPlayersImpl(players) {
  if (!scene) {
    console.warn("Scene is not initialized");
    return;
  }

  players.forEach((player) => {
    if (player.id === userStore.id) return; // 자기 자신은 건너뜀

    // 서버에서 온 userName 우선 사용, 없으면 로컬 Map에서 조회
    const playerName =
      player.userName || (getPlayerNameFunc ? getPlayerNameFunc(player.id) : "Player");
    scene.addPlayer(player.id, player.x, player.y, true, playerName); // 상대좌표로 처리
    console.log(`InitPlayers: Added player ${player.id} with name ${playerName}`);
  });
}

/**
 * 새로운 플레이어 입갤 (공개 인터페이스)
 * @param {string} id - 플레이어 ID
 */
function NewPlayer(id) {
  if (isSceneReady) {
    NewPlayerImpl(id);
  } else {
    actionQueue.push({ name: "NewPlayer", args: [id] });
    console.log(`NewPlayer '${id}' queued. Queue size:`, actionQueue.length);
  }
}

/**
 * 새로운 플레이어 입갤 (내부 구현)
 * @param {string} id - 플레이어 ID
 */
function NewPlayerImpl(id) {
  if (!scene) {
    console.warn("Scene is not initialized");
    return;
  }

  console.log(`Adding new player with ID: ${id}`);

  const isXPlus = Math.random() < 0.5;
  const isYPlus = Math.random() < 0.5;

  // 상대 좌표 생성 (월드 중심 기준으로 ±50 범위)
  const offsetX = Math.random() * 50 * (isXPlus ? 1 : -1);
  const offsetY = Math.random() * 50 * (isYPlus ? 1 : -1);

  // 절대 좌표로 변환하여 로컬에서 플레이어 생성
  const absX = WORLD_CENTER_X + offsetX;
  const absY = WORLD_CENTER_Y + offsetY;

  scene.addPlayer(id, absX, absY, false, userStore.name);

  // 웹소켓으로는 상대 좌표 전송 (다른 클라이언트에서 절대 좌표로 변환)
  send({ type: "join", id: id, x: offsetX, y: offsetY });
}

/**
 * 플레이어가 멀티플레이어 게임에 참여 (공개 인터페이스)
 * @param {string} id - 플레이어 ID
 * @param {number} x - 플레이어 초기 X 좌표 (상대좌표)
 * @param {number} y - 플레이어 초기 Y 좌표 (상대좌표)
 * @param {string} userName - 플레이어 닉네임
 */
function JoinPlayer(id, x, y, userName) {
  if (isSceneReady) {
    JoinPlayerImpl(id, x, y, userName);
  } else {
    actionQueue.push({ name: "JoinPlayer", args: [id, x, y, userName] });
    console.log(`JoinPlayer '${id}' queued. Queue size:`, actionQueue.length);
  }
}

/**
 * 플레이어가 멀티플레이어 게임에 참여 (내부 구현)
 * @param {string} id - 플레이어 ID
 * @param {number} x - 플레이어 초기 X 좌표 (상대좌표)
 * @param {number} y - 플레이어 초기 Y 좌표 (상대좌표)
 * @param {string} userName - 플레이어 닉네임
 */
function JoinPlayerImpl(id, x, y, userName) {
  if (!scene) {
    console.warn("Scene is not initialized");
    return;
  }

  // 서버에서 온 userName 우선 사용, 없으면 로컬 Map에서 조회
  const playerName = userName || (getPlayerNameFunc ? getPlayerNameFunc(id) : "Player");
  scene.addPlayer(id, x, y, true, playerName); // 상대좌표로 처리
  console.log(`JoinPlayer: Added player ${id} with name ${playerName}`);
}

/**
 * 다른 플레이어 이동 처리 (공개 인터페이스)
 * @param {string} id - 플레이어 ID
 * @param {number} x - 목표 X 좌표 (상대좌표)
 * @param {number} y - 목표 Y 좌표 (상대좌표)
 * @param {number} dirX - 이동 방향 X
 * @param {number} dirY - 이동 방향 Y
 */
function MoveOtherPlayer(id, x, y, dirX = 0, dirY = 1) {
  if (isSceneReady) {
    MoveOtherPlayerImpl(id, x, y, dirX, dirY);
  } else {
    actionQueue.push({ name: "MoveOtherPlayer", args: [id, x, y, dirX, dirY] });
  }
}

/**
 * 다른 플레이어 이동 처리 (내부 구현)
 * @param {string} id - 플레이어 ID
 * @param {number} x - 목표 X 좌표 (상대좌표)
 * @param {number} y - 목표 Y 좌표 (상대좌표)
 * @param {number} dirX - 이동 방향 X
 * @param {number} dirY - 이동 방향 Y
 */
function MoveOtherPlayerImpl(id, x, y, dirX = 0, dirY = 1) {
  if (!scene) {
    console.warn("Scene is not initialized");
    return;
  }

  // 고정된 월드 중심을 기준으로 절대좌표로 변환
  scene.MoveOtherPlayer(id, WORLD_CENTER_X + x, WORLD_CENTER_Y + y, dirX, dirY);
}

/**
 * 원격 플레이어의 방망이 휘두르기 애니메이션 표시
 * @param {string} id - 플레이어 ID
 * @param {number} dirX - 방향 X
 * @param {number} dirY - 방향 Y
 */
function ShowRemotePlayerSwing(id, dirX, dirY) {
  if (!scene) {
    console.warn("Scene is not initialized");
    return;
  }
  scene.ShowRemotePlayerSwing(id, dirX, dirY);
}

/**
 * 원격 플레이어에게 넉백 적용
 * @param {string} id - 플레이어 ID
 * @param {number} knockbackX - 넉백 X 속도
 * @param {number} knockbackY - 넉백 Y 속도
 */
function ApplyRemoteKnockback(id, knockbackX, knockbackY) {
  if (!scene) {
    console.warn("Scene is not initialized");
    return;
  }
  scene.ApplyRemoteKnockback(id, knockbackX, knockbackY);
}

/**
 * 원격 플레이어 부활 처리 (무적 효과 표시)
 * @param {string} id - 플레이어 ID
 * @param {number} x - 부활 위치 X (상대좌표)
 * @param {number} y - 부활 위치 Y (상대좌표)
 */
function ShowRemotePlayerRespawn(id, x, y) {
  if (!scene) {
    console.warn("Scene is not initialized");
    return;
  }
  // 절대좌표로 변환
  const absX = WORLD_CENTER_X + x;
  const absY = WORLD_CENTER_Y + y;
  scene.ShowRemotePlayerRespawn(id, absX, absY);
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

function SendSwingAttack() {
  if (!scene) {
    console.warn("Scene is not initialized");
    return;
  }

  const player = scene.players.getChildren().find((p) => p.name === `player_${userStore.id}`);
  if (!player) return;

  const dir = player.lastDirection;
  console.log("Sending swing attack for user:", userStore.id, "direction:", dir);

  // 로컬 스윙 애니메이션 먼저 실행
  scene.trySwing();

  // 서버로 공격 정보 전송
  send({ type: "attack", id: userStore.id, dirX: dir.x, dirY: dir.y });
}

export {
  RegisterMultiPlayerEvents,
  GetGameInstance,
  ExitPlayer,
  NewPlayer,
  CleanEvents,
  InitPlayers,
  CleanupScene,
  StartPositionSync,
  SendSwingAttack,
};
