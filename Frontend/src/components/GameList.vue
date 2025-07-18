<template>
  <div class="game-list">
    <h2>사용 가능한 게임</h2>

    <div v-if="loading" class="loading">게임 목록을 불러오는 중...</div>

    <div v-else class="games-grid">
      <div
        v-for="game in games"
        :key="game.id"
        class="game-card"
        @click="selectGame(game.id)"
        :class="{ active: selectedGameId === game.id }"
      >
        <h3>{{ game.name }}</h3>
        <p class="description">{{ game.description }}</p>
        <div class="game-meta">
          <span class="players">👥 {{ game.minPlayers }}-{{ game.maxPlayers }}명</span>
          <span class="category">📂 {{ game.category }}</span>
        </div>
      </div>
    </div>

    <button
      v-if="selectedGameId"
      @click="createRoom"
      class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition mt-4"
    >
      선택된 게임으로 방 만들기
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getAvailableGames } from "../utils/gameLoader.js";

const router = useRouter();
const games = ref([]);
const loading = ref(true);
const selectedGameId = ref(null);

const selectGame = (gameId) => {
  selectedGameId.value = gameId;
};

const createRoom = () => {
  if (selectedGameId.value) {
    // 랜덤 방 ID 생성
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 대기방으로 이동 - params로 gameId와 roomId 전달
    router.push({
      name: "waiting-room",
      params: {
        gameId: selectedGameId.value,
        roomId: roomId,
      },
    });
  }
};

onMounted(() => {
  try {
    games.value = getAvailableGames();
    loading.value = false;
  } catch (error) {
    console.error("게임 목록 로드 실패:", error);
    loading.value = false;
  }
});
</script>

<style scoped>
.game-list {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.game-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.game-card:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.game-card.active {
  border-color: #007bff;
  background-color: #f8f9ff;
}

.game-card h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.description {
  color: #666;
  margin: 10px 0;
  line-height: 1.4;
}

.game-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  font-size: 0.9em;
  color: #888;
}

.players,
.category {
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
}

button {
  display: block;
  margin: 0 auto;
  cursor: pointer;
}
</style>
