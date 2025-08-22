<template>
  <div class="ingame-container">
    <!-- 공통 게임 헤더 -->
    <div class="game-header">
      <button @click="exitGame" class="exit-btn">← 나가기</button>

      <div class="game-info">
        <h1 class="game-title">{{ gameConfig?.icon }} {{ gameConfig?.name }}</h1>
        <div class="room-id">방 ID: {{ roomId }}</div>
      </div>

      <div class="game-controls">
        <button @click="showSettings = true" class="settings-btn">⚙️</button>
        <div class="timer" v-if="gameConfig?.features?.timer">{{ formatTime(gameTime) }}</div>
      </div>
    </div>

    <div class="game-layout">
      <!-- 동적 게임 컴포넌트 -->
      <div class="game-content">
        <Suspense>
          <template #default>
            <component
              :is="currentGameComponent"
              v-bind="gameProps"
              @game-end="handleGameEnd"
              @player-action="handlePlayerAction"
              @game-state-change="handleGameStateChange"
              ref="gameComponentRef"
            />
          </template>
          <template #fallback>
            <div class="loading">
              <div class="spinner"></div>
              <p>게임을 불러오는 중...</p>
            </div>
          </template>
        </Suspense>
      </div>

      <!-- 채팅 영역 (채팅 기능이 있는 게임만) -->
      <div v-if="gameConfig?.features?.chat" class="chat-container">
        <h3 class="chat-title">💬 채팅</h3>
        <div class="chat-area" ref="chatContainer">
          <div
            v-for="msg in messages"
            :key="msg.timestamp"
            :class="msg.userId === userStore.id ? 'my-message' : 'other-message'"
          >
            <div class="message-author">{{ msg.userName }}</div>
            <div class="message-text">{{ msg.text }}</div>
            <div class="message-time">{{ formatMessageTime(msg.timestamp) }}</div>
          </div>
        </div>
        <div class="chat-input">
          <form @submit.prevent="sendMessage" class="flex gap-2">
            <input
              type="text"
              placeholder="메시지를 입력하세요..."
              class="flex-1 p-2 border rounded"
              v-model="tempMsg"
              :disabled="!tempMsg"
            />
            <button
              type="submit"
              :disabled="!tempMsg.trim()"
              class="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
            >
              전송
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- 공통 게임 종료 모달 -->
    <div v-if="showEndModal" class="game-end-modal">
      <div class="game-end-modal-content">
        <h2 class="text-4xl font-bold mb-6">🎮 게임 종료!</h2>
        <div class="text-2xl mb-8">
          <div v-if="gameResult.winner === 'draw'">🤝 무승부입니다!</div>
          <div v-else-if="gameResult.winner">🏆 {{ getWinnerText(gameResult.winner) }} 승리!</div>
          <div v-if="gameResult.reason" class="text-lg mt-2 text-gray-600">
            {{ getReasonText(gameResult.reason) }}
          </div>
        </div>
        <div class="flex gap-4 justify-center">
          <button
            class="px-6 py-3 bg-blue-500 text-white rounded-lg text-xl font-bold hover:bg-blue-600 transition-all"
            @click="restartGame"
          >
            🔄 다시 하기
          </button>
          <button
            class="px-6 py-3 bg-green-500 text-white rounded-lg text-xl font-bold hover:bg-green-600 transition-all"
            @click="selectNewGame"
          >
            🎲 다른 게임
          </button>
          <button
            class="px-6 py-3 bg-gray-500 text-white rounded-lg text-xl font-bold hover:bg-gray-600 transition-all"
            @click="exitToLobby"
          >
            🚪 나가기
          </button>
        </div>
      </div>
    </div>

    <!-- 설정 모달 -->
    <div v-if="showSettings" class="settings-modal">
      <div class="settings-modal-content">
        <h2 class="text-2xl font-bold mb-4">⚙️ 게임 설정</h2>
        <div class="settings-options">
          <div class="setting-item">
            <label class="flex items-center">
              <input type="checkbox" v-model="gameSettings.soundEnabled" class="mr-2" />
              🔊 효과음 켜기
            </label>
          </div>
          <div class="setting-item">
            <label class="flex items-center">
              <input type="checkbox" v-model="gameSettings.animationEnabled" class="mr-2" />
              ✨ 애니메이션 켜기
            </label>
          </div>
          <div class="setting-item" v-if="gameConfig?.features?.timer">
            <label class="block mb-2">⏱️ 턴 제한 시간 (초)</label>
            <input
              type="number"
              v-model="gameSettings.turnTimeLimit"
              min="10"
              max="300"
              class="w-full p-2 border rounded"
            />
          </div>
        </div>
        <div class="flex gap-4 justify-end mt-6">
          <button
            class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            @click="showSettings = false"
          >
            취소
          </button>
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            @click="saveSettings"
          >
            저장
          </button>
        </div>
      </div>
    </div>

    <!-- 에러 모달 -->
    <div v-if="gameError" class="error-modal">
      <div class="error-modal-content">
        <h2 class="text-2xl font-bold mb-4 text-red-600">❌ 오류 발생</h2>
        <p class="mb-6">{{ gameError }}</p>
        <div class="flex gap-4 justify-center">
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            @click="loadGame"
          >
            다시 시도
          </button>
          <button
            class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            @click="gameError = null"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user.js";
import { getGameConfig } from "@/games/index.js";

const props = defineProps({
  gameType: {
    type: String,
    required: true,
  },
  roomId: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    default: "pvp", // pvp, pve, practice
  },
});

const router = useRouter();
const userStore = useUserStore();

// 상태 관리
const currentGameComponent = ref(null);
const gameConfig = ref(null);
const gameComponentRef = ref(null);
const showEndModal = ref(false);
const showSettings = ref(false);
const gameResult = ref({});
const gameError = ref(null);
const gameTime = ref(0);
const gameSettings = ref({
  soundEnabled: true,
  animationEnabled: true,
  turnTimeLimit: 60,
});

// 채팅 관련
const messages = ref([]);
const tempMsg = ref("");
const chatContainer = ref(null);

// 타이머
let gameTimer = null;

// 게임 로드
async function loadGame() {
  try {
    gameError.value = null;
    gameConfig.value = getGameConfig(props.gameType);

    if (!gameConfig.value) {
      throw new Error(`지원하지 않는 게임 타입: ${props.gameType}`);
    }

    // 동적 컴포넌트 로드
    const gameModule = await gameConfig.value.component();
    currentGameComponent.value = gameModule.default;

    // 타이머 시작 (타이머 기능이 있는 게임만)
    if (gameConfig.value.features?.timer) {
      startGameTimer();
    }
  } catch (error) {
    console.error("게임 로드 실패:", error);
    gameError.value = error.message;
  }
}

// 게임 props 계산
const gameProps = computed(() => ({
  roomId: props.roomId,
  gameType: props.gameType,
  mode: props.mode,
  settings: gameSettings.value,
}));

// 이벤트 핸들러들
function handleGameEnd(result) {
  if (gameConfig.value?.features?.timer) {
    stopGameTimer();
  }
  gameResult.value = result;
  showEndModal.value = true;
}

function handlePlayerAction(action) {
  console.log("Player action:", action);
  // 여기서 WebSocket이나 API 호출로 서버에 액션 전송

  // 채팅 메시지 추가 (테스트용)
  if (action.type === "move") {
    addSystemMessage(
      `플레이어가 (${action.position.row}, ${action.position.col})에 수를 두었습니다.`,
    );
  }
}

function handleGameStateChange(state) {
  console.log("Game state changed:", state);
}

function restartGame() {
  showEndModal.value = false;
  gameTime.value = 0;

  if (gameConfig.value?.features?.timer) {
    startGameTimer();
  }

  // 게임 컴포넌트의 restart 메서드 호출
  if (gameComponentRef.value?.restart) {
    gameComponentRef.value.restart();
  }
}

function selectNewGame() {
  router.push("/games");
}

function exitToLobby() {
  router.push(`/lobby/${props.gameType}`);
}

function exitGame() {
  if (confirm("정말로 게임을 나가시겠습니까?")) {
    router.push("/");
  }
}

function saveSettings() {
  showSettings.value = false;
  // 설정을 로컬 스토리지에 저장
  localStorage.setItem("gameSettings", JSON.stringify(gameSettings.value));
}

// 채팅 관련 함수들
function sendMessage() {
  if (!tempMsg.value.trim()) return;

  const message = {
    text: tempMsg.value,
    userId: userStore.id,
    userName: userStore.name || "익명",
    timestamp: Date.now(),
  };

  messages.value.push(message);
  tempMsg.value = "";

  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

function addSystemMessage(text) {
  const message = {
    text,
    userId: "system",
    userName: "시스템",
    timestamp: Date.now(),
  };

  messages.value.push(message);

  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

// 타이머 관련
function startGameTimer() {
  if (gameTimer) clearInterval(gameTimer);
  gameTimer = setInterval(() => {
    gameTime.value++;
  }, 1000);
}

function stopGameTimer() {
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 게임 결과 텍스트
function getWinnerText(winner) {
  if (winner === "black") return "흑돌";
  if (winner === "white") return "백돌";
  return winner;
}

function getReasonText(reason) {
  const reasons = {
    win: "정상적인 승리",
    surrender: "상대방 기권",
    timeout: "시간 초과",
    draw: "무승부",
  };
  return reasons[reason] || reason;
}

// 라이프사이클
onMounted(() => {
  // 저장된 설정 불러오기
  const savedSettings = localStorage.getItem("gameSettings");
  if (savedSettings) {
    gameSettings.value = { ...gameSettings.value, ...JSON.parse(savedSettings) };
  }

  loadGame();

  // 시작 메시지 추가
  addSystemMessage(`${gameConfig.value?.name || "게임"}이 시작되었습니다!`);
});

onUnmounted(() => {
  stopGameTimer();
});
</script>

<style scoped>
.ingame-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.exit-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.exit-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.game-info {
  text-align: center;
  color: white;
}

.game-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
}

.room-id {
  font-size: 0.9rem;
  opacity: 0.8;
}

.game-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.settings-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  transition: transform 0.3s;
}

.settings-btn:hover {
  transform: rotate(90deg);
}

.timer {
  color: white;
  font-family: "Courier New", monospace;
  font-size: 1.2rem;
  font-weight: bold;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
}

.game-layout {
  flex: 1;
  display: flex;
  gap: 1rem;
  padding: 1rem;
}

.game-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chat-container {
  width: 300px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.chat-title {
  margin: 0 0 1rem 0;
  text-align: center;
  color: #374151;
}

.chat-area {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
  margin-bottom: 1rem;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
}

.my-message,
.other-message {
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  max-width: 80%;
}

.my-message {
  background: #dbeafe;
  margin-left: auto;
}

.other-message {
  background: #f3f4f6;
}

.message-author {
  font-size: 0.75rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.message-text {
  font-size: 0.875rem;
}

.message-time {
  font-size: 0.625rem;
  opacity: 0.6;
  margin-top: 0.25rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: white;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-top: 5px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 모달 스타일들 */
.game-end-modal,
.settings-modal,
.error-modal {
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

.game-end-modal-content,
.settings-modal-content,
.error-modal-content {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  text-align: center;
  min-width: 400px;
  max-width: 500px;
}

.settings-options {
  text-align: left;
}

.setting-item {
  margin-bottom: 1rem;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .game-layout {
    flex-direction: column;
  }

  .chat-container {
    width: 100%;
    height: 200px;
  }

  .game-header {
    padding: 0.5rem 1rem;
  }

  .game-title {
    font-size: 1.2rem;
  }
}
</style>
