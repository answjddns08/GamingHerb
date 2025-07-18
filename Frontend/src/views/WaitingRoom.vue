<template>
  <div class="waiting-room">
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

      <button
        @click="startGame"
        class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
      >
        Start Game
      </button>
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
  </div>
</template>

<script setup>
import { ref, onMounted, shallowRef } from "vue";
import { useRoute } from "vue-router";
import { loadGameComponent, getGameInfo } from "../utils/gameLoader.js";

const route = useRoute();

const roomId = ref(route.params.roomId || "default-room");
const gameId = ref(route.params.gameId || "GomokuGame"); // URL params에서 gameId 가져오기
const gameStarted = ref(false);
const GameComponent = shallowRef(null); // shallowRef 사용으로 변경
const gameInfo = ref(null);

// 게임 시작 함수
const startGame = async () => {
  try {
    gameStarted.value = true;

    // 게임 정보 가져오기
    gameInfo.value = getGameInfo(gameId.value);

    if (gameInfo.value) {
      // 게임 컴포넌트 동적 로드
      GameComponent.value = await loadGameComponent(gameId.value);
      console.log(`${gameInfo.value.name} (${gameId.value}) 게임이 로드되었습니다.`);
    } else {
      console.error(`게임 ID "${gameId.value}"에 해당하는 게임을 찾을 수 없습니다.`);
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
  console.log("대기방 마운트됨:", { roomId: roomId.value, gameId: gameId.value });

  // 게임 정보 미리 로드
  gameInfo.value = getGameInfo(gameId.value);
  if (gameInfo.value) {
    console.log("게임 정보 로드됨:", gameInfo.value.name);
  } else {
    console.warn(`게임 ID "${gameId.value}"에 대한 정보를 찾을 수 없습니다.`);
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
  margin-top: 20px;
  cursor: pointer;
}
</style>
