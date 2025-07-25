<template>
  <main class="waiting-room">
    <div v-if="!gameStarted" class="waiting-content">
      <h1>Waiting Room</h1>
      <p>Please wait while we set up the game...</p>
      <p>Room ID: {{ roomId }}</p>
      <div v-if="gameInfo" class="game-info">
        <h3>{{ gameInfo.name }}</h3>
        <p>{{ gameInfo.description }}</p>
        <p>플레이어: {{ gameInfo.minPlayers }}-{{ gameInfo.maxPlayers }}명</p>
        <p>카테고리: {{ gameInfo.category }}</p>
      </div>
      <div v-else class="game-info">
        <p>Game ID: {{ gameId }}</p>
      </div>
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
    <p>Player Name: Test Player</p>
    <p>Room ID: {{ roomId }}</p>
    <p>Game: {{ gameId }}</p>
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
import { ref, onMounted, shallowRef } from "vue";
import { loadGameComponent, getGameInfo } from "../utils/gameLoader.js";

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

/**
 * @todo
 * - 게임 기다리기 지루할까봐 간단한 2D 멀티플레이 게임 구현(그냥 플레이어가 이동하는 정도)
 * - 게임 위에 플레이어가 적힌 카드 생성(z index가 높아야 함)
 */

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

// 돌아가기 함수
const goBack = () => {
  gameStarted.value = false;
  GameComponent.value = null;
};

onMounted(() => {
  console.log("대기방 마운트됨:", { roomId: props.roomId, gameId: props.gameId });

  // 게임 정보 미리 로드
  gameInfo.value = getGameInfo(props.gameId);
  if (gameInfo.value) {
    console.log("게임 정보 로드됨:", gameInfo.value.name);
  } else {
    console.warn(`게임 ID "${props.gameId}"에 대한 정보를 찾을 수 없습니다.`);
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
