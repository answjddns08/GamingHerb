<template>
  <main class="test-game">
    <header class="game-header">
      <h1>{{ gameInfo.name }}</h1>
      <div class="game-meta">
        <span>Room: {{ roomId }}</span>
        <span>Players: {{ gameInfo.minPlayers }}-{{ gameInfo.maxPlayers }}</span>
      </div>
    </header>

    <div class="game-content">
      <div class="game-description" v-if="showDescription">
        <div v-html="description"></div>
        <button @click="startGame" class="start-btn">테스트 게임 시작</button>
      </div>

      <div class="game-area" v-else>
        <div class="test-playground">
          <h2>테스트 게임 플레이그라운드</h2>
          <p>이곳에서 다양한 게임 기능을 테스트할 수 있습니다.</p>

          <div class="test-controls">
            <button @click="addScore" class="score-btn">점수 추가 (+10)</button>
            <button @click="resetScore" class="reset-btn">점수 초기화</button>
          </div>

          <div class="score-display">
            <h3>현재 점수: {{ score }}</h3>
          </div>

          <div class="test-features">
            <h3>테스트 기능들:</h3>
            <ul>
              <li>점수 시스템 테스트</li>
              <li>버튼 클릭 이벤트</li>
              <li>상태 관리</li>
              <li>컴포넌트 렌더링</li>
            </ul>
          </div>
        </div>

        <div class="game-controls">
          <button @click="showDescription = true" class="info-btn">게임 정보</button>
          <button @click="resetGame" class="reset-btn">게임 리셋</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getGameDescription } from "./utils.js";
import gameConfig from "./config.js";

// Props
const props = defineProps({
  roomId: {
    type: String,
    default: "default-room",
  },
});

// State
const showDescription = ref(true);
const description = ref("");
const gameInfo = ref(gameConfig);
const score = ref(0);

// Methods
const startGame = () => {
  showDescription.value = false;
  resetGame();
};

const addScore = () => {
  score.value += 10;
};

const resetScore = () => {
  score.value = 0;
};

const resetGame = () => {
  score.value = 0;
};

// Lifecycle
onMounted(async () => {
  console.log(`Test Game mounted for room: ${props.roomId}`);

  try {
    description.value = await getGameDescription();
  } catch (error) {
    console.error("게임 설명 로드 실패:", error);
    description.value = "<p>게임 설명을 불러올 수 없습니다.</p>";
  }
});
</script>

<style scoped>
.test-game {
  width: 100%;
  height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.game-header {
  text-align: center;
  margin-bottom: 20px;
}

.game-header h1 {
  color: white;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.game-meta {
  display: flex;
  justify-content: center;
  gap: 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.game-content {
  max-width: 800px;
  margin: 0 auto;
}

.game-description {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 30px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
}

.game-area {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 30px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.test-playground {
  text-align: center;
  margin-bottom: 30px;
}

.test-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 20px 0;
}

.score-display {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: center;
}

.score-display h3 {
  margin: 0;
  font-size: 24px;
  color: #ffd700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.test-features {
  text-align: left;
  max-width: 400px;
  margin: 20px auto;
}

.test-features ul {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 8px;
  list-style-type: none;
}

.test-features li {
  padding: 5px 0;
  position: relative;
  padding-left: 20px;
}

.test-features li:before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #4caf50;
  font-weight: bold;
}

.start-btn,
.score-btn,
.reset-btn,
.info-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.start-btn {
  background: linear-gradient(45deg, #4caf50, #45a049);
  color: white;
  margin-top: 20px;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.score-btn {
  background: linear-gradient(45deg, #ff9800, #f57c00);
  color: white;
}

.score-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
}

.reset-btn {
  background: linear-gradient(45deg, #f44336, #d32f2f);
  color: white;
}

.reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
}

.info-btn {
  background: linear-gradient(45deg, #2196f3, #1976d2);
  color: white;
}

.info-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
}

.game-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}
</style>
