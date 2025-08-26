<template>
  <main class="layout">
    <div class="status-container">
      <h1 class="text-2xl font-bold">오목 게임</h1>
      <h3>현재 차례: {{ gameState.currentPlayer === "black" ? "흑돌" : "백돌" }}</h3>
      <button
        class="mt-auto p-3 w-1/2 rounded-lg bg-red-300 text-2xl font-bold transition-all hover:bg-red-400"
        @click="surrender"
        :disabled="gameState.gameOver"
      >
        기권
      </button>
    </div>
    <div class="enemy-info">
      <!-- userIcon -->
      <div
        class="enemyIcon"
        :class="{ active: gameState.currentPlayer === 'white' && !gameState.gameOver }"
      ></div>

      <div class="flex flex-col gap-3 flex-1">
        <!--time bar -->
        <div class="bg-gray-300 rounded-lg w-auto h-2"></div>

        <div class="flex justify-between">
          <span>백돌 플레이어</span>
          <span>{{ playerColor === false ? "나" : "AI" }}</span>
        </div>
      </div>
    </div>
    <div class="enemy-comment">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
        <path
          d="M320 544C461.4 544 576 436.5 576 304C576 171.5 461.4 64 320 64C178.6 64 64 171.5 64 304C64 358.3 83.2 408.3 115.6 448.5L66.8 540.8C62 549.8 63.5 560.8 70.4 568.3C77.3 575.8 88.2 578.1 97.5 574.1L215.9 523.4C247.7 536.6 282.9 544 320 544zM192 272C209.7 272 224 286.3 224 304C224 321.7 209.7 336 192 336C174.3 336 160 321.7 160 304C160 286.3 174.3 272 192 272zM320 272C337.7 272 352 286.3 352 304C352 321.7 337.7 336 320 336C302.3 336 288 321.7 288 304C288 286.3 302.3 272 320 272zM416 304C416 286.3 430.3 272 448 272C465.7 272 480 286.3 480 304C480 321.7 465.7 336 448 336C430.3 336 416 321.7 416 304z"
        />
      </svg>
    </div>
    <div class="board">
      <div class="board-container">
        <div class="display">
          <div v-for="row in 15" :key="row" class="grid-row">
            <div v-for="col in 15" :key="col" class="grid-cell"></div>
          </div>
        </div>
        <div class="interaction">
          <div v-for="row in 16" :key="`interaction-row-${row}`" class="interaction-row">
            <div
              v-for="col in 16"
              :key="`interaction-col-${col}`"
              class="cell"
              @click="makeMove(row - 1, col - 1)"
              :class="{ disabled: gameState.gameOver }"
            >
              <div
                v-if="gameState.getStoneAt(row - 1, col - 1)"
                class="stone"
                :class="gameState.getStoneAt(row - 1, col - 1)"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="player-info">
      <!-- userIcon -->
      <div
        class="playerIcon"
        :class="{ active: gameState.currentPlayer === 'black' && !gameState.gameOver }"
      ></div>

      <div class="flex flex-col gap-3 flex-1">
        <!--time bar -->
        <div class="bg-gray-300 rounded-lg w-auto h-2"></div>

        <div class="flex justify-between">
          <span>흑돌 플레이어</span>
          <span>{{ playerColor === true ? "나" : "AI" }}</span>
        </div>
      </div>
    </div>
    <div class="player-comment">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
        <path
          d="M320 544C461.4 544 576 436.5 576 304C576 171.5 461.4 64 320 64C178.6 64 64 171.5 64 304C64 358.3 83.2 408.3 115.6 448.5L66.8 540.8C62 549.8 63.5 560.8 70.4 568.3C77.3 575.8 88.2 578.1 97.5 574.1L215.9 523.4C247.7 536.6 282.9 544 320 544zM192 272C209.7 272 224 286.3 224 304C224 321.7 209.7 336 192 336C174.3 336 160 321.7 160 304C160 286.3 174.3 272 192 272zM320 272C337.7 272 352 286.3 352 304C352 321.7 337.7 336 320 336C302.3 336 288 321.7 288 304C288 286.3 302.3 272 320 272zM416 304C416 286.3 430.3 272 448 272C465.7 272 480 286.3 480 304C480 321.7 465.7 336 448 336C430.3 336 416 321.7 416 304z"
        />
      </svg>
    </div>
    <div class="chat-container">
      <h1 class="text-5xl font-bold">Chat</h1>
      <div class="chat-area" ref="chatContainer">
        <div
          v-for="msg in messages"
          :key="msg.timestamp"
          :class="msg.userId === userStore.id ? 'my-message' : 'other-message'"
        >
          {{ msg.text }}
        </div>
      </div>
      <div class="mt-auto">
        <form class="flex gap-3" @submit.prevent="SendMessage">
          <input
            type="text"
            placeholder="Type your message here..."
            class="w-full p-2 border rounded"
            v-model="tempMsg"
          />
          <button
            type="submit"
            :disabled="!tempMsg"
            class="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
            @click="SendMessage"
          >
            Send
          </button>
        </form>
      </div>
    </div>
    <div v-if="isRockSelecting" class="start-modal">
      <div class="flex" style="gap: 5rem">
        <button class="start-modal-content" @click="selectRock(true)">
          <div
            class="rounded-full h-30 w-30 bg-black my-auto"
            style="box-shadow: 0 0 1rem grey"
          ></div>
          <h2 class="text-3xl font-bold mt-auto">흑돌</h2>
        </button>
        <button class="start-modal-content" @click="selectRock(false)">
          <div
            class="rounded-full h-30 w-30 bg-gray-100 my-auto"
            style="box-shadow: 0 0 1rem grey"
          ></div>
          <h2 class="text-3xl font-bold mt-auto">백돌</h2>
        </button>
      </div>
      <span class="text-white text-xl font-bold">원하는 돌을 선택하시오</span>
    </div>

    <!-- 게임 종료 모달 -->
    <div v-if="showGameEndModal" class="game-end-modal">
      <div class="game-end-modal-content">
        <h2 class="text-4xl font-bold mb-6">게임 종료!</h2>
        <div class="text-2xl mb-8">
          <div v-if="gameState.winner === 'draw'">무승부입니다!</div>
          <div v-else-if="gameState.winner === 'black'">흑돌 승리!</div>
          <div v-else-if="gameState.winner === 'white'">백돌 승리!</div>
        </div>
        <div class="flex gap-4 justify-between">
          <button
            class="px-6 py-3 bg-blue-500 text-white rounded-lg text-xl font-bold hover:bg-blue-600 transition-all"
            @click="restartGame"
          >
            다시 하기
          </button>
          <button
            class="px-6 py-3 bg-gray-500 text-white rounded-lg text-xl font-bold hover:bg-gray-600 transition-all"
            @click="exitGame"
          >
            나가기
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from "vue";
import { useUserStore } from "@/stores/user.js";
import { GomokuGameState } from "./utils.js";

const userStore = useUserStore();

const isRockSelecting = ref(false);
const showGameEndModal = ref(false);
const gameState = ref(new GomokuGameState());
const playerColor = ref(null); // true for black, false for white

/**
 * Chat messages
 * @typedef {Array<{text: string, userId: string, timestamp: number}>} message
 * @type {import("vue").Ref<message>}
 */
const messages = ref([]);

const tempMsg = ref("");

const chatContainer = ref(null);

// 게임 상태 변화를 감지하여 게임 종료 모달 표시
watch(
  () => gameState.value.gameOver,
  (isGameOver) => {
    if (isGameOver) {
      setTimeout(() => {
        showGameEndModal.value = true;
      }, 500); // 0.5초 딜레이 후 모달 표시
    }
  },
);

function SendMessage() {
  console.log("message send: ", tempMsg.value);

  messages.value.push({
    text: tempMsg.value,
    userId: userStore.id,
    timestamp: Date.now(),
  });

  tempMsg.value = "";

  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

/**
 * @param {bool} isBlack
 */
function selectRock(isBlack) {
  isRockSelecting.value = false;
  playerColor.value = isBlack;

  // AI가 흑돌이고 첫 번째 차례인 경우 AI가 먼저 둠
  if (!isBlack && gameState.value.currentPlayer === "black") {
    setTimeout(() => {
      makeAIMove();
    }, 1000);
  }
}

function makeMove(row, col) {
  // 게임이 끝났거나 유효하지 않은 위치인 경우 무시
  if (gameState.value.gameOver || row < 0 || row >= 15 || col < 0 || col >= 15) {
    return;
  }

  // 현재 플레이어가 사용자인지 확인
  const isPlayerTurn =
    (gameState.value.currentPlayer === "black" && playerColor.value === true) ||
    (gameState.value.currentPlayer === "white" && playerColor.value === false);

  if (!isPlayerTurn) {
    return;
  }

  // 돌 놓기
  if (gameState.value.placeStone(row, col)) {
    // AI 차례가 되었고 게임이 끝나지 않았으면 AI가 수를 둠
    if (!gameState.value.gameOver) {
      setTimeout(() => {
        makeAIMove();
      }, 500);
    }
  }
}

function makeAIMove() {
  if (gameState.value.gameOver) return;

  // 간단한 AI: 랜덤한 빈 위치에 돌 놓기
  const emptyPositions = [];
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (!gameState.value.getStoneAt(row, col)) {
        emptyPositions.push([row, col]);
      }
    }
  }

  if (emptyPositions.length > 0) {
    const randomIndex = Math.floor(Math.random() * emptyPositions.length);
    const [row, col] = emptyPositions[randomIndex];
    gameState.value.placeStone(row, col);
  }
}

function surrender() {
  if (gameState.value.gameOver) return;

  const currentPlayer = gameState.value.currentPlayer;
  gameState.value.surrender(currentPlayer);
}

function restartGame() {
  showGameEndModal.value = false;
  gameState.value.reset();

  // AI가 흑돌이고 첫 번째 차례인 경우 AI가 먼저 둠
  if (playerColor.value === false && gameState.value.currentPlayer === "black") {
    setTimeout(() => {
      makeAIMove();
    }, 1000);
  }
}

function exitGame() {
  showGameEndModal.value = false;
  isRockSelecting.value = true;
  gameState.value.reset();
  playerColor.value = null;
}

onMounted(() => {
  isRockSelecting.value = true;
});
</script>

<style scoped>
.layout {
  display: grid;

  width: 100%;
  height: 100vh;

  gap: 0.625rem;

  grid-template-columns: 1fr 3fr 2fr;
  grid-template-rows: auto 1fr auto;

  grid-template-areas:
    "enemy-comment enemy-info chat"
    "status gomoku chat"
    "player-comment player-info chat";
}

.status-container {
  grid-area: status;

  display: flex;
  flex-direction: column;

  align-items: center;

  padding: 1.25rem;

  gap: 3rem;

  margin-top: auto;
  margin-bottom: auto;

  margin-left: 1.5rem;

  border: 0.125rem solid #333;
  border-radius: 1.125rem;
}

.enemy-info {
  grid-area: enemy-info;

  display: flex;

  align-items: center;
  justify-content: space-between;

  margin-left: 5%;
  margin-right: 5%;

  border-bottom: 0.125rem solid #333;
  border-left: 0.125rem solid #333;
  border-right: 0.125rem solid #333;

  border-radius: 0 0 1.5rem 1.5rem;

  gap: 2.5rem;

  padding: 1.25rem;
}

.enemyIcon {
  background-color: red;

  border-radius: 50%;

  width: 5rem;
  height: 5rem;

  transition: all 0.3s ease;
}

.enemyIcon.active {
  box-shadow: 0 0 0 0.5rem greenyellow;
}

.enemy-comment {
  grid-area: enemy-comment;

  margin-bottom: auto;
  margin-left: auto;

  margin-top: 1.5rem;

  transform: scaleX(-1);

  width: 3.5rem;

  transition: all 0.3s ease;
}

.enemy-comment:hover {
  transform: scale(1.2);
}

.player-info {
  grid-area: player-info;
  display: flex;

  align-items: center;
  justify-content: space-between;

  margin-left: 2.5%;
  margin-right: 2.5%;

  border-top: 0.125rem solid #333;
  border-left: 0.125rem solid #333;
  border-right: 0.125rem solid #333;

  border-radius: 1.5rem 1.5rem 0 0;

  gap: 2.5rem;

  padding: 1.25rem;
}

.playerIcon {
  background-color: aqua;

  border-radius: 50%;

  width: 5rem;
  height: 5rem;

  transition: all 0.3s ease;
}

.playerIcon.active {
  box-shadow: 0 0 0 0.5rem greenyellow;
}

.player-comment {
  grid-area: player-comment;

  margin-top: auto;
  margin-left: auto;

  margin-bottom: 1.5rem;

  transform: scaleX(-1);

  width: 3.5rem;

  transition: all 0.3s ease;
}

.player-comment:hover {
  transform: scale(1.2);
}

.chat-container {
  grid-area: chat;

  display: flex;
  flex-direction: column;

  padding: 1.25rem;

  border: 2px solid #333;
  border-radius: 2.125rem;

  margin: 1.75rem;
}

.chat-area {
  display: flex;

  flex-direction: column;

  gap: 0.625rem;

  flex-grow: 1;
  overflow-y: auto;
}

.my-message {
  align-self: flex-end;
  background: #2563eb; /* blue-600 */
  color: #fff;
  border-radius: 1rem 1rem 0.25rem 1rem;
  padding: 0.5rem 1rem;
  margin: 0.25rem 0;
  max-width: 70%;
}

.other-message {
  align-self: flex-start;
  background: #e5e7eb; /* gray-200 */
  color: #222;
  border-radius: 1rem 1rem 1rem 0.25rem;
  padding: 0.5rem 1rem;
  margin: 0.25rem 0;
  max-width: 70%;
}

.board {
  grid-area: gomoku;

  display: flex;
  justify-content: center;
  align-items: center;
}

.board-container {
  position: relative;
  background: #d4a574;
  padding: 1.875rem;

  border-radius: 0.5rem;

  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.2);

  border-collapse: collapse;
}

.display {
  border: 0.125rem solid #333;
  display: flex;
  flex-direction: column;
}

.grid-row {
  display: flex;
}

.grid-cell {
  width: 2.5rem;
  height: 2.5rem;
  border: 0.0625rem solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
}

.interaction {
  position: absolute;
  top: 0%;
  left: 0%;
  width: 100%;
  height: 100%;
  padding: 0.625rem;
  display: flex;
  flex-direction: column;
}

.interaction-row {
  display: flex;

  justify-content: center;
}

.cell {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
}

.cell:hover {
  background-color: #e0e0e0a1;
}

.cell.disabled {
  cursor: not-allowed;
}

.stone {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.stone.black {
  background-color: #1a1a1a;
  border: 1px solid #333;
}

.stone.white {
  background-color: #f5f5f5;
  border: 1px solid #ccc;
}

.game-end-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
}

.game-end-modal-content {
  background-color: white;

  display: flex;
  flex-direction: column;

  justify-content: center;

  border-radius: 1rem;

  padding: 2rem;

  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);

  text-align: center;

  min-width: 400px;
}

.start-modal {
  position: fixed;

  top: 0;
  left: 0;

  width: 100%;
  height: 100%;

  display: flex;

  justify-content: center;
  align-items: center;

  flex-direction: column;

  gap: 5rem;

  background-color: rgba(0, 0, 0, 0.4);
}

.start-modal-content {
  background-color: white;

  border-radius: 8px;

  padding: 20px;

  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  min-width: 275px;

  min-height: 450px;

  position: relative;

  display: flex;

  flex-direction: column;
  align-items: center;

  transition: all 0.3s ease;
}

.start-modal-content:hover {
  transform: scale(1.05);

  border: 0.25rem solid #ff0000;
}
</style>
