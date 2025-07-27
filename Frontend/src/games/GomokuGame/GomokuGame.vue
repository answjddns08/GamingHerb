<template>
  <main class="gomoku-game">
    <header class="game-header">
      <h1>{{ gameInfo.name }}</h1>
      <div class="game-meta">
        <span>Room: {{ roomId }}</span>
        <span>Players: {{ gameInfo.minPlayers }}-{{ gameInfo.maxPlayers }}</span>
      </div>
    </header>

    <div class="game-content">
      <div class="game-board">
        <div class="board-placeholder">
          <!-- 실제 게임 보드가 여기에 들어갑니다 -->
          <div class="board-grid">
            <div v-for="i in totalCells" :key="i" class="cell" @click="placeStone(i)">
              <div v-if="board[i]" :class="['stone', board[i]]"></div>
            </div>
          </div>
        </div>

        <div class="game-controls">
          <button @click="resetGame" class="reset-btn">다시 시작</button>
          <button @click="showDescription = true" class="info-btn">게임 정보</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { GAME_CONSTANTS } from "./utils.js";
import gameConfig from "./settings.js";

// Props
const props = defineProps({
  roomId: {
    type: String,
    default: "default-room",
  },
});

// State
const showDescription = ref(true);
const gameInfo = ref(gameConfig);
const board = ref({});
const currentPlayer = ref("black");

// Computed
const boardSize = computed(() => GAME_CONSTANTS.BOARD_SIZE);
const totalCells = computed(() => GAME_CONSTANTS.BOARD_SIZE * GAME_CONSTANTS.BOARD_SIZE);

const initializeBoard = () => {
  board.value = {};
  currentPlayer.value = "black";
};

const placeStone = (position) => {
  if (!board.value[position]) {
    board.value[position] = currentPlayer.value;
    currentPlayer.value = currentPlayer.value === "black" ? "white" : "black";
  }
};

const resetGame = () => {
  initializeBoard();
};

// Lifecycle
onMounted(async () => {
  console.log(`Gomoku Game mounted for room: ${props.roomId}`);

  initializeBoard();
});
</script>

<style scoped>
.gomoku-game {
  width: 100%;
  height: 100vh;
  padding: 20px;
  background: #f5f5f5;
}

.game-header {
  text-align: center;
  margin-bottom: 20px;
}

.game-header h1 {
  color: #333;
  margin-bottom: 10px;
}

.game-meta {
  display: flex;
  justify-content: center;
  gap: 20px;
  color: #666;
  font-size: 14px;
}

.game-content {
  max-width: 800px;
  margin: 0 auto;
}

.game-description {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.start-btn {
  background: #4caf50;
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
  transition: background 0.3s;
}

.start-btn:hover {
  background: #45a049;
}

.game-board {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(v-bind(boardSize), 1fr);
  gap: 1px;
  background: #8b4513;
  padding: 10px;
  border-radius: 8px;
  max-width: 500px;
  margin: 0 auto;
}

.cell {
  width: 30px;
  height: 30px;
  background: #deb887;
  border: 1px solid #8b4513;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.cell:hover {
  background: #d2b48c;
}

.stone {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  pointer-events: none;
}

.stone.black {
  background: #000;
  box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.3);
}

.stone.white {
  background: #fff;
  border: 1px solid #ccc;
  box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.game-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.reset-btn,
.info-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.reset-btn {
  background: #f44336;
  color: white;
}

.reset-btn:hover {
  background: #da190b;
}

.info-btn {
  background: #2196f3;
  color: white;
}

.info-btn:hover {
  background: #0b7dda;
}
</style>
