<template>
  <main class="layout">
    <div class="status-container">
      <h1 class="text-2xl font-bold">오목 게임 UI 테스트</h1>
      <h3>현재 차례: {{ gameState.currentPlayer === "black" ? "흑돌" : "백돌" }}</h3>
      <button
        class="mt-auto p-3 w-1/2 rounded-lg bg-red-300 text-2xl font-bold transition-all hover:bg-red-400"
        @click="testSurrender"
        :disabled="gameState.gameOver"
      >
        기권
      </button>
    </div>
    <div class="enemy-info">
      <div
        class="enemyIcon"
        :class="{ active: gameState.currentPlayer !== myColor && !gameState.gameOver }"
      ></div>
      <div class="flex flex-col gap-3 flex-1">
        <progress class="time-bar" max="100" value="50" min="0"></progress>
        <div class="flex justify-between">
          <span>상대방</span>
          <span>1:20</span>
        </div>
      </div>
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
              @click="testMakeMove(row - 1, col - 1)"
              :class="{ disabled: gameState.gameOver || gameState.currentPlayer !== myColor }"
            >
              <div
                v-if="gameState.board[row - 1]?.[col - 1]"
                class="stone"
                :class="gameState.board[row - 1]?.[col - 1]"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="player-info">
      <div
        class="playerIcon"
        :class="{ active: gameState.currentPlayer === myColor && !gameState.gameOver }"
      ></div>
      <div class="flex flex-col gap-3 flex-1">
        <progress class="time-bar" max="100" value="75" min="0"></progress>
        <div class="flex justify-between">
          <span>나</span>
          <span>1:59</span>
        </div>
      </div>
    </div>
    <div class="chat-container">
      <h1 class="text-5xl font-bold">Chat UI Test</h1>
      <div class="chat-area" ref="chatContainer">
        <div class="my-message"><strong>나:</strong> 안녕하세요!</div>
        <div class="other-message"><strong>상대방:</strong> 반갑습니다!</div>
        <div class="my-message"><strong>나:</strong> 게임 시작해볼까요?</div>
      </div>
      <div class="mt-auto">
        <form class="flex gap-3" @submit.prevent="testSendMessage">
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
          >
            Send
          </button>
        </form>
      </div>
    </div>

    <!-- 테스트 버튼들 -->
    <div class="test-controls">
      <button @click="showColorModal" class="test-btn">색상 선택 모달</button>
      <button @click="showGameEndModal" class="test-btn">게임 종료 모달</button>
      <button @click="testToast('테스트 메시지', 'info')" class="test-btn">토스트 알림</button>
      <button @click="testToast('상대가 재시작 요청을 보냈습니다', 'info')" class="test-btn">
        재시작 요청 토스트
      </button>
    </div>

    <!-- 돌 선택 모달 -->
    <div v-if="!isSelectedColor" class="modal flex flex-col">
      <h2 class="text-4xl font-bold text-white mb-6">돌 색깔 선택</h2>
      <p class="text-lg text-white mb-8">어떤 색깔의 돌로 플레이하시겠습니까?</p>
      <div class="flex gap-10 mb-10">
        <button
          @click="selectColor('black')"
          class="color-selection-btn min-h-[350px] min-w-[250px]"
          :disabled="enemyColor === 'black'"
          :class="{ selected: myColor === 'black' }"
        >
          <div class="stone-preview black"></div>
          <span>흑돌 (선공)</span>
          <span
            v-if="(enemyColor === 'black') | (myColor === 'black')"
            class="text-sm text-gray-700"
            >선택됨</span
          >
        </button>
        <button
          @click="selectColor('white')"
          class="color-selection-btn min-h-[350px] min-w-[250px]"
          :disabled="enemyColor === 'white'"
          :class="{ selected: myColor === 'white' }"
        >
          <div class="stone-preview white"></div>
          <span>백돌 (후공)</span>
        </button>
      </div>
      <p class="text-gray-100">흑돌이 먼저 시작합니다</p>
    </div>

    <!-- 토스트 알림 -->
    <div v-if="toastMessage" :class="['toast-notification', toastType]">
      {{ toastMessage }}
    </div>

    <!-- 게임 종료 모달 -->
    <div v-if="showGameOverModal" class="modal">
      <div class="modal-content">
        <h2 class="text-4xl font-bold mb-6">게임 종료!</h2>
        <div class="text-2xl mb-8">
          <div v-if="gameState.winner === 'draw'">무승부입니다!</div>
          <div v-else-if="gameState.winner === myColor">승리했습니다!</div>
          <div v-else>패배했습니다.</div>
        </div>
        <div class="flex gap-4 justify-center">
          <button
            class="px-6 py-3 bg-blue-500 text-white rounded-lg text-xl font-bold hover:bg-blue-600 transition-all"
            @click="testRestartGame"
          >
            다시 하기
          </button>
          <button
            class="px-6 py-3 bg-gray-500 text-white rounded-lg text-xl font-bold hover:bg-gray-600 transition-all"
            @click="hideGameEndModal"
          >
            로비로
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from "vue";

// 게임 상태 (테스트용)
const gameState = ref({
  board: Array(15)
    .fill(null)
    .map(() => Array(15).fill(null)),
  currentPlayer: "black",
  gameOver: false,
  winner: null,
});

/**
- 재시작 모달 생성
	- 상대가 돌 선택하면 그 돌의 모달은 사용 못하게 비활성화 처리
- 재시작 신청
	- 상대가 재시작 신청을 하면 토스트 메세지가 옴
	- 양측 모두 재시작 버튼을 누를 때에만 재시작
	- 둘중 한명이라도 나가면 재시작이 비활성화되고 토스트로 나갔다고 메세지가 옴
- 타이머 바(timer-bar) 구현
	- 각 플레이어의 남은 시간을 표시
	- 시간이 다 되면 자동으로 기권 처리
- 그외 대충 오류 확인 정도
 */

// UI 상태 변수들
const tempMsg = ref("");
const myColor = ref("");
const enemyColor = ref("black");
const isSelectedColor = ref(true);
const showGameOverModal = ref(false);
const toastMessage = ref("");
const toastType = ref("info");
let toastTimer = null;

// 토스트 알림 함수
function testToast(message, type = "info", duration = 3000) {
  toastMessage.value = message;
  toastType.value = type;

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(() => {
    toastMessage.value = "";
    toastTimer = null;
  }, duration);
}

// 돌 색깔 선택
function selectColor(color) {
  if (myColor.value === color) {
    myColor.value = "";
    return;
  }

  myColor.value = color;
}

// 테스트 함수들
const testMakeMove = (row, col) => {
  if (gameState.value.board[row][col] || gameState.value.gameOver) return;

  gameState.value.board[row][col] = gameState.value.currentPlayer;
  gameState.value.currentPlayer = gameState.value.currentPlayer === "black" ? "white" : "black";
  testToast("돌을 놓았습니다!", "info");
};

const testSendMessage = () => {
  if (!tempMsg.value.trim()) return;
  testToast(`메시지 전송: ${tempMsg.value}`, "info");
  tempMsg.value = "";
};

const testSurrender = () => {
  gameState.value.gameOver = true;
  gameState.value.winner = myColor.value === "black" ? "white" : "black";
  testToast("기권했습니다", "warning");
};

const testRestartGame = () => {
  testToast("재시작 요청을 보냈습니다", "info");
  showGameOverModal.value = false;
};

// 테스트 모달 표시 함수들
const showColorModal = () => {
  isSelectedColor.value = false;
};

const showGameEndModal = () => {
  gameState.value.gameOver = true;
  gameState.value.winner = "black";
  showGameOverModal.value = true;
};

const hideGameEndModal = () => {
  showGameOverModal.value = false;
  gameState.value.gameOver = false;
};

onMounted(() => {
  // 테스트용 초기 보드 설정
  gameState.value.board[7][7] = "black";
  gameState.value.board[7][8] = "white";
  gameState.value.board[8][7] = "black";
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
  grid-template-areas: "enemy-comment enemy-info chat" "status gomoku chat" "player-comment player-info chat";
}

.test-controls {
  position: fixed;
  top: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 999;
}

.test-btn {
  padding: 8px 12px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.test-btn:hover {
  background: #3730a3;
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
  background: #2563eb;
  color: #fff;
  border-radius: 1rem 1rem 0.25rem 1rem;
  padding: 0.5rem 1rem;
  margin: 0.25rem 0;
  max-width: 70%;
}
.other-message {
  align-self: flex-start;
  background: #e5e7eb;
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

.modal {
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
.modal-content {
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

.color-selection-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.color-selection-btn:disabled {
  background: #9ea7b5;
  pointer-events: none;
}

.color-selection-btn.selected {
  border: 4px solid #2563eb;
  box-shadow: 0 0 10px rgba(37, 99, 235, 0.7);
}

.color-selection-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.stone-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.stone-preview.black {
  background-color: #1a1a1a;
  border: 1px solid #333;
}

.stone-preview.white {
  background-color: #f5f5f5;
  border: 1px solid #ccc;
}

.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 6px;
  color: white;
  font-weight: 500;
  z-index: 1001;
  animation: slideIn 0.3s ease-out;
}

.toast-notification.info {
  background-color: #3b82f6;
}

.toast-notification.success {
  background-color: #10b981;
}

.toast-notification.warning {
  background-color: #f59e0b;
}

.toast-notification.error {
  background-color: #ef4444;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.time-bar {
  width: 100%;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.time-bar::-webkit-progress-bar {
  background-color: #e5e7eb;
}

.time-bar::-webkit-progress-value {
  background-color: #12c323;
}
</style>
