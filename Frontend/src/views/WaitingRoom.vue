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
  <div class="player-card">
    <p class="font-bold text-3xl">Player Card</p>
    <p>
      players: {{ players.size }}
      /
      {{ gameSetting ? gameSetting.maxPlayerCount : "?" }}
    </p>
    <div v-for="player in playerList" :key="player.userId">
      <p class="text-lg">{{ player.username }}</p>
    </div>
  </div>
  <div class="start-card">
    <button @click="startGame">Start Game</button>
  </div>
  <div class="goBack-card">
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
import { loadGameComponent, getGameInfo } from "../utils/gameLoader.js";
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
      });

      console.log("현재 플레이어 목록:", players.value);
    } else if (data.type === "playerLeft") {
      console.log("플레이어가 퇴장했습니다:", data.playerId);
      players.value.delete(data.playerId);
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
      console.log("방 초기화 데이터 수신:", data);
      gameSetting.value = data.settings; // 방 설정 업데이트
      players.value = new Map(
        data.players.map((player) => [
          player.userId,
          { username: player.username, userId: player.userId },
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

  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
}

.goBack-card {
  position: fixed;

  bottom: 20px;
  left: 20px;
  padding: 10px;
}
</style>
