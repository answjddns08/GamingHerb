<template>
  <main class="waiting-room">
    <div v-if="!gameStarted" class="waiting-content">
      <h1>Waiting Room</h1>
      <p>Please wait while we set up the game...</p>
    </div>

    <!-- 동적으로 게임 컴포넌트 로드 -->
    <div v-if="gameStarted && GameComponent" class="game-container">
      <component :is="GameComponent" :room-id="roomId" />
    </div>

    <!-- 게임을 찾을 수 없는 경우 -->
    <div v-if="gameStarted && !GameComponent" class="error-content">
      <h2>게임을 찾을 수 없습니다</h2>
      <p>게임 ID: {{ gameId }}에 해당하는 게임이 존재하지 않습니다.</p>
      <button
        @click="goBack"
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        돌아가기
      </button>
    </div>
  </main>
  <div class="player-card" v-if="!gameStarted">
    <div class="flex justify-between items-end gap-4">
      <p class="font-bold text-3xl">Players</p>
      <p class="text-sm text-gray-400">
        {{ players.size }}
        /
        {{ gameSetting ? gameSetting.maxPlayerCount + " max" : "?" }}
      </p>
    </div>
    <div
      v-for="player in playerList"
      :key="player.userId"
      class="flex items-center justify-between gap-2"
    >
      <div class="flex items-center gap-2">
        <p>{{ player.username }}</p>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 640"
          style="height: 1.5rem; fill: gold"
          v-if="player.userId === gameSetting.hostId"
        >
          <!-- host icon -->
          <path
            d="M341.5 45.1C337.4 37.1 329.1 32 320.1 32C311.1 32 302.8 37.1 298.7 45.1L225.1 189.3L65.2 214.7C56.3 216.1 48.9 222.4 46.1 231C43.3 239.6 45.6 249 51.9 255.4L166.3 369.9L141.1 529.8C139.7 538.7 143.4 547.7 150.7 553C158 558.3 167.6 559.1 175.7 555L320.1 481.6L464.4 555C472.4 559.1 482.1 558.3 489.4 553C496.7 547.7 500.4 538.8 499 529.8L473.7 369.9L588.1 255.4C594.5 249 596.7 239.6 593.9 231C591.1 222.4 583.8 216.1 574.8 214.7L415 189.3L341.5 45.1z"
          />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 640"
          style="height: 1.5rem"
          v-else-if="player.isReady"
        >
          <!-- status icon -->
          <path
            d="M136 192C136 125.7 189.7 72 256 72C322.3 72 376 125.7 376 192C376 258.3 322.3 312 256 312C189.7 312 136 258.3 136 192zM48 546.3C48 447.8 127.8 368 226.3 368L285.7 368C384.2 368 464 447.8 464 546.3C464 562.7 450.7 576 434.3 576L77.7 576C61.3 576 48 562.7 48 546.3zM612.4 196.7L532.4 324.7C528.2 331.4 521 335.6 513.1 336C505.2 336.4 497.6 332.8 492.9 326.4L444.9 262.4C436.9 251.8 439.1 236.8 449.7 228.8C460.3 220.8 475.3 223 483.3 233.6L510.3 269.6L571.7 171.3C578.7 160.1 593.5 156.6 604.8 163.7C616.1 170.8 619.5 185.5 612.4 196.8z"
          />
        </svg>
      </div>
      <button
        v-if="player.userId !== userStore.id && userStore.id === gameSetting.hostId"
        @click="kickUser(player.userId)"
        class="kick-btn"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" style="height: 1.5rem">
          <!-- user kick icon -->
          <path
            d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM231 231C240.4 221.6 255.6 221.6 264.9 231L319.9 286L374.9 231C384.3 221.6 399.5 221.6 408.8 231C418.1 240.4 418.2 255.6 408.8 264.9L353.8 319.9L408.8 374.9C418.2 384.3 418.2 399.5 408.8 408.8C399.4 418.1 384.2 418.2 374.9 408.8L319.9 353.8L264.9 408.8C255.5 418.2 240.3 418.2 231 408.8C221.7 399.4 221.6 384.2 231 374.9L286 319.9L231 264.9C221.6 255.5 221.6 240.3 231 231z"
          />
        </svg>
      </button>
    </div>
  </div>
  <div class="start-card" v-if="!gameStarted && userStore.id === gameSetting?.hostId">
    <button
      @click="startGame"
      :disabled="
        playerList.filter((player) => player.isReady).length < gameSetting.maxPlayerCount - 1
      "
    >
      Start Game
    </button>
  </div>
  <button
    v-else-if="!gameStarted"
    class="ready-btn"
    @click="ReadyGame"
    :class="{ active: isReady }"
  >
    {{ isReady ? "Cancel" : "Ready" }}
  </button>
  <div class="goBack-card" v-if="!gameStarted">
    <RouterLink :to="{ name: 'game-rooms' }">
      <button class="bg-red-300 text-black px-4 py-2 rounded hover:bg-red-400 transition">
        Go Back
      </button>
    </RouterLink>
  </div>
</template>

<script setup>
import { ref, onMounted, shallowRef, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import { loadGameComponent, getGameInfo } from "@/games/index.js";
import { useUserStore } from "@/stores/user.js";

const userStore = useUserStore();

const router = useRouter();

const props = defineProps({
  gameId: {
    type: String,
    default: "GomokuGame",
    required: true,
  },
  roomId: {
    type: String,
    default: "default-room",
    required: true,
  },
});

const gameStarted = ref(false);
const GameComponent = shallowRef(null); // shallowRef 사용으로 변경
const gameInfo = ref(null);
const gameSetting = ref(null);

/**
 * 플레이어 목록
 * @type {Map<userId: string, { userId: string, userName: string}>}
 */
const players = ref(new Map());

const playerList = computed(() => Array.from(players.value.values())); // 파생 데이터

const isReady = ref(false);

/**
 * WebSocket 연결을 위한 변수
 * @type {WebSocket|null}
 */
const ws = ref(null);

// 게임 시작 함수
const startGame = async () => {
  try {
    gameStarted.value = true;

    // 게임 정보 가져오기
    gameInfo.value = getGameInfo(props.gameId);

    if (gameInfo.value) {
      // 게임 컴포넌트 동적 로드
      GameComponent.value = await loadGameComponent(props.gameId);
      console.log(`${gameInfo.value.name} (${props.gameId}) 게임이 로드되었습니다.`);
    } else {
      console.error(`게임 ID "${props.gameId}"에 해당하는 게임을 찾을 수 없습니다.`);
      GameComponent.value = null;
    }
  } catch (error) {
    console.error("게임 로드 중 오류 발생:", error);
    GameComponent.value = null;
  }
};

const ReadyGame = async () => {
  if (isReady.value) {
    // 이미 준비 상태인 경우 취소
    isReady.value = false;

    players.value.set(userStore.id, {
      userId: userStore.id,
      username: userStore.name,
      isReady: false,
    });

    if (ws.value) {
      ws.value.send(
        JSON.stringify({
          type: "waiting",
          action: "ReadyCancel",
          gameId: props.gameId,
          roomName: props.roomId,
          userId: userStore.id,
        }),
      );
    }

    return;
  }
  // 준비 상태로 변경
  isReady.value = true;

  players.value.set(userStore.id, {
    userId: userStore.id,
    username: userStore.name,
    isReady: true,
  });

  // WebSocket을 통해 서버에 준비 상태 전송
  if (ws.value) {
    ws.value.send(
      JSON.stringify({
        type: "waiting",
        action: "Ready",
        gameId: props.gameId,
        roomName: props.roomId,
        userId: userStore.id,
      }),
    );
  }
};

function kickUser(targetUserId) {
  // 호스트만 유저를 퇴장시킬 수 있음
  ws.value.send(
    JSON.stringify({
      type: "waiting",
      action: "KickUser",
      gameId: props.gameId,
      roomName: props.roomId,
      userId: targetUserId,
    }),
  );
}

function beforeUnloading(event) {
  event.preventDefault();
  event.returnValue = "";
}

onMounted(async () => {
  console.log("대기방 마운트됨:", { roomId: props.roomId, gameId: props.gameId });

  ws.value = new WebSocket(`wss://gamingherb.redeyes.dev/api`);

  ws.value.onopen = () => {
    console.log("WebSocket 연결됨");
    ws.value.send(
      JSON.stringify({
        type: "join",
        gameId: props.gameId,
        roomName: props.roomId,
        userId: userStore.id,
        userName: userStore.name,
      }),
    );
  };

  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("WebSocket 메시지 수신:", data);

    if (data.type === "roomDeleted") {
      console.log("방이 삭제되었습니다.");
      gameStarted.value = false;
      GameComponent.value = null;

      router.push({
        name: "game-rooms",
        params: { gameId: props.gameId },
      });
    } else if (data.type === "playerJoined") {
      console.log("새 플레이어가 참여했습니다:", data.player);

      players.value.set(data.player.userId, {
        userId: data.player.userId,
        username: data.player.userName,
        isReady: data.player.isReady,
      });

      console.log("현재 플레이어 목록:", players.value);
    } else if (data.type === "playerLeft") {
      console.log("플레이어가 퇴장했습니다:", data.playerId);
      players.value.delete(data.playerId);
    } else if (data.type === "playerReady") {
      console.log("플레이어 준비 상태 업데이트:", data.playerId, data.isReady);
      const player = players.value.get(data.playerId);
      if (player) {
        player.isReady = true;
      } else {
        console.warn(`플레이어 ID "${data.playerId}"를 찾을 수 없습니다.`);
      }
    } else if (data.type === "playerNotReady") {
      console.log("플레이어 준비 해제:", data.playerId);
      const player = players.value.get(data.playerId);
      if (player) {
        player.isReady = false;
      } else {
        console.warn(`플레이어 ID "${data.playerId}"를 찾을 수 없습니다.`);
      }
    } else if (data.type === "playerKicked") {
      console.log("플레이어가 퇴장되었습니다:", data.playerId);
      players.value.delete(data.playerId);

      if (data.playerId === userStore.id) {
        // 현재 유저가 퇴장당한 경우
        gameStarted.value = false;
        GameComponent.value = null;

        router.push({
          name: "game-rooms",
          params: { gameId: props.gameId },
        });
      }
    } else if (data.type === "gameStarted") {
      console.log("게임이 시작되었습니다.");
      gameStarted.value = true;

      // 게임 컴포넌트 동적 로드
      loadGameComponent(props.gameId)
        .then((component) => {
          GameComponent.value = component;
          console.log(`${data.gameName} 게임이 로드되었습니다.`);
        })
        .catch((error) => {
          console.error("게임 컴포넌트 로드 중 오류 발생:", error);
          GameComponent.value = null;
        });
    } else if (data.type === "roomSettings") {
      console.log("방 설정 업데이트:", data.settings);
      gameSetting.value = data.settings; // 방 데이터 업데이트
    } else if (data.type === "initialize") {
      console.log("방 초기화 데이터 수신");
      gameSetting.value = data.settings; // 방 설정 업데이트

      gameSetting.value.hostId = data.hostId; // 호스트 ID 추가

      players.value = new Map(
        data.players.map((player) => [
          player.userId,
          { username: player.username, userId: player.userId, isReady: player.isReady },
        ]),
      ); // 플레이어 정보 업데이트
    } else {
      console.warn("알 수 없는 메시지 타입:", data.type);
    }
  };

  window.addEventListener("beforeunload", beforeUnloading);

  // 게임 정보 미리 로드
  gameInfo.value = getGameInfo(props.gameId);
  if (gameInfo.value) {
    console.log("게임 정보 로드됨:", gameInfo.value.name);
  } else {
    console.warn(`게임 ID "${props.gameId}"에 대한 정보를 찾을 수 없습니다.`);
  }
});

onUnmounted(async () => {
  window.removeEventListener("beforeunload", beforeUnloading);

  console.log("대기방 언마운트됨:", { roomId: props.roomId, gameId: props.gameId });

  gameStarted.value = false;
  GameComponent.value = null;

  if (ws.value) {
    ws.value.send(
      JSON.stringify({
        type: "leave",
        gameId: props.gameId,
        roomName: props.roomId,
        userId: userStore.id,
      }),
    );
    ws.value.close();
    ws.value = null;

    console.log("WebSocket 연결 종료됨");
  }
});
</script>

<style scoped>
.waiting-room {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.waiting-content,
.error-content {
  text-align: center;
  padding: 40px 20px;
}

.game-info {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.game-info h3 {
  margin-top: 0;
  color: #495057;
}

.game-container {
  width: 100%;
  height: 100vh;
}

.error-content {
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
}

button {
  cursor: pointer;
}

.player-card {
  position: absolute;

  top: 20px;
  left: 20px;

  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  z-index: 10; /* 플레이어 카드가 게임 위에 표시되도록 */
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
}

.start-card {
  position: fixed;
  bottom: 20px;
  right: 20px;
}

.start-card button {
  background-color: #28a745;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;

  cursor: pointer;

  transition: background-color 0.3s ease;
}

.start-card button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.ready-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;

  color: white;
  background-color: rgb(40, 236, 40);

  padding: 10px 20px;
  border-radius: 5px;

  cursor: pointer;

  transition: background-color 0.3s ease;
}

.ready-btn:hover {
  background-color: #26c235;
}

.ready-btn.active {
  background-color: rgb(208, 28, 28);
}

.ready-btn.active:hover {
  background-color: #dc3545;
}

.kick-btn {
  color: white;
  border-radius: 5px;

  cursor: pointer;

  transition: all 0.3s ease;
}

.kick-btn:hover {
  fill: #dc3545;

  scale: 1.25;
}

.goBack-card {
  position: fixed;

  bottom: 20px;
  left: 20px;
  padding: 10px;
}
</style>
