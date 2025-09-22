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
      <div
        class="enemyIcon"
        :class="{ active: gameState.currentPlayer !== myColor && !gameState.gameOver }"
      ></div>
      <div class="flex flex-col gap-3 flex-1">
        <progress
          class="time-bar"
          :max="gameState.settings?.playerTimeLimit || 60"
          :value="gameState.playerTimers?.white || gameState.settings?.playerTimeLimit || 60"
          min="0"
        ></progress>
        <div class="flex justify-between">
          <span>상대방</span>
          <span class="timer-display" :class="enemyTimerClass"
            >{{ gameState.playerTimers?.white || 60 }}초</span
          >
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
              @click="makeMove(row - 1, col - 1)"
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
        <progress
          class="time-bar"
          :max="gameState.settings?.playerTimeLimit || 60"
          :value="gameState.playerTimers?.black || gameState.settings?.playerTimeLimit || 60"
          min="0"
        ></progress>
        <div class="flex justify-between">
          <span>나</span>
          <span class="timer-display" :class="myTimerClass"
            >{{ gameState.playerTimers?.black || 60 }}초</span
          >
        </div>
      </div>
    </div>
    <div class="chat-container">
      <h1 class="text-4xl font-bold">Chat</h1>
      <div class="chat-area" ref="chatContainer">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="msg.userId === userStore.id ? 'my-message' : 'other-message'"
        >
          <strong>{{ msg.userName }}:</strong> {{ msg.text }}
        </div>
      </div>
      <div class="mt-auto">
        <form class="flex gap-3" @submit.prevent="sendMessage">
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
          <span v-if="enemyColor === 'black'" class="text-sm text-gray-700">상대가 선택함</span>
        </button>
        <button
          @click="selectColor('white')"
          class="color-selection-btn min-h-[350px] min-w-[250px]"
          :disabled="enemyColor === 'white'"
          :class="{ selected: myColor === 'white' }"
        >
          <div class="stone-preview white"></div>
          <span>백돌 (후공)</span>
          <span v-if="enemyColor === 'white'" class="text-sm text-gray-700">상대가 선택함</span>
        </button>
      </div>
      <p class="text-gray-100">흑돌이 먼저 시작합니다</p>
    </div>

    <!-- 토스트 알림 -->
    <div v-if="toastMessage" :class="['toast-notification', toastType]">
      {{ toastMessage }}
    </div>

    <!-- 게임 종료 모달 -->
    <div v-if="gameState.gameOver" class="modal">
      <div class="modal-content">
        <h2 class="text-4xl font-bold mb-6">게임 종료!</h2>
        <div class="text-2xl mb-8">
          <div v-if="gameState.winner === 'draw'">무승부입니다!</div>
          <div v-else-if="gameState.winner === myColor">승리했습니다!</div>
          <div v-else>패배했습니다.</div>
        </div>
        <div class="flex gap-4 justify-center">
          <button
            class="retry-btn"
            :class="{ 'restart-requested': isRestartRequested }"
            @click="restartGame"
            :disabled="isEnemyLeaved"
          >
            {{ isRestartRequested ? "재시작 동의" : "다시 하기" }}
          </button>
          <button
            class="px-6 py-3 bg-gray-500 text-white rounded-lg text-xl font-bold hover:bg-gray-600 transition-all"
            @click="exitGame"
          >
            로비로
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
/**
 * @file GomokuGame.vue
 * @description 오목 게임의 전체 UI와 상호작용을 관리하는 컴포넌트입니다.
 *              게임 보드, 플레이어 정보, 채팅, 게임 종료 및 재시작 로직을 포함합니다.
 *              WebSocket을 통해 서버와 실시간으로 게임 상태를 동기화합니다.
 */
import { nextTick, onMounted, onUnmounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user.js";
import { useSocketStore } from "@/stores/socket.js";

/**
 * @todo 돌 선택 모달 설정 - Done
 * @todo 재시작 시 모달이 나타나지 않고 토스트만 나타나도록 설정 - Done (아직 프론트엔드 부분만 구현)
 * @todo 프로그래스 바를 사용하여 타임 바 구현
 * @todo 게임 종료 후 UI 개선
 */

/**
 * 양측이 재시작 요청을 보내면 게임 재시작
 * 한명이라도 취소하면 재시작 안됨
 */

/**
 * 백엔드에서 아마 시간을 처리하도록 하면 안정성이 증가하긴 할 듯(부담은 늘어나겠지만)
 * 주기적으로 초를 보내고 그걸 받아서 프로그래스 바에 표시
 */

const props = defineProps({
  /** @type {String} 현재 게임의 고유 ID */
  gameId: { type: String, required: true },
  /** @type {String} 현재 방의 고유 ID */
  roomId: { type: String, required: true },
});

const userStore = useUserStore();
const socketStore = useSocketStore();
const router = useRouter();

/** @type {import('vue').Ref<Object>} 게임의 현재 상태 (보드, 현재 플레이어, 종료 여부 등) */
const gameState = ref({
  board: Array(15)
    .fill(null)
    .map(() => Array(15).fill(null)),
  currentPlayer: null,
  gameOver: true, // 초기에는 게임오버 상태로 시작
  winner: null,
  playerTimers: { black: 60, white: 60 }, // 기본 타이머
  settings: { playerTimeLimit: 60 }, // 기본 설정
});

/** @type {import('vue').Ref<Array<Object>>} 채팅 메시지 목록 */
const messages = ref([]);

/** @type {import('vue').Ref<String>} 입력 중인 채팅 메시지 */
const tempMsg = ref("");

/** @type {import('vue').Ref<HTMLElement|null>} 채팅 영역의 DOM 엘리먼트 */
const chatContainer = ref(null);

/** @type {import('vue').Ref<'black'|'white'|null>} 현재 플레이어의 돌 색깔 */
const myColor = ref(null);

/** @type {import('vue').Ref<'black'|'white'|null>} 상대 플레이어의 돌 색깔 */
const enemyColor = ref(null);

/** @type {import('vue').Ref<Boolean>} 상대방이 나간 상태 여부 */
const isEnemyLeaved = ref(false);

/** @type {import('vue').Ref<Boolean>} 돌 색깔 선택 모달 표시 여부 (false: 표시, true: 비표시) */
const isSelectedColor = ref(false);

/** @type {import('vue').Ref<String>} 토스트 알림 메시지 */
const toastMessage = ref("");

/** @type {import('vue').Ref<Boolean>} 재시작 요청 중인 상태 */
const isRestartRequested = ref(false);

/** @type {import('vue').Ref<String>} 재시작을 요청한 플레이어 이름 */
const restartRequester = ref("");

/** @type {import('vue').Ref<String>} 토스트 알림 타입 (success, info, warning, error) */
const toastType = ref("info");

/** @type {number} 토스트 알림 타이머 ID */
let toastTimer = null;

// Computed properties for timer styling
const myTimerClass = computed(() => {
  const time = gameState.value.playerTimers?.black || 60;
  if (time <= 10) return "danger";
  if (time <= 30) return "warning";
  return "";
});

const enemyTimerClass = computed(() => {
  const time = gameState.value.playerTimers?.white || 60;
  if (time <= 10) return "danger";
  if (time <= 30) return "warning";
  return "";
});

// --- WebSocket Actions ---

/**
 * 토스트 알림을 표시합니다.
 * @param {String} message - 표시할 메시지
 * @param {String} type - 알림 타입 (success, info, warning, error)
 * @param {Number} duration - 표시 시간 (밀리초)
 */
function showToast(message, type = "info", duration = 3000) {
  toastMessage.value = message;
  toastType.value = type;

  // 기존 타이머가 있다면 제거
  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  // 새 타이머 설정
  toastTimer = setTimeout(() => {
    toastMessage.value = "";
    toastTimer = null;
  }, duration);
}

/**
 * 돌 색깔을 선택합니다.
 * @param {String} color - 선택한 돌 색깔 ('black' 또는 'white')
 */
function selectColor(color) {
  if (myColor.value === color) {
    myColor.value = "";
    return;
  }

  myColor.value = color;

  sendGameAction("game:selectColor", { player: userStore.id, color: color });

  if (enemyColor.value === color) {
    showToast("상대방이 이미 선택한 색깔입니다", "warning");
    return;
  }

  if (myColor.value && enemyColor.value) {
    isSelectedColor.value = true;
  }
}

/**
 * 게임 관련 액션을 서버로 전송합니다.
 * @param {String} type - 액션 타입 (e.g., 'game:move')
 * @param {Object} [payload={}] - 액션에 필요한 추가 데이터
 */
function sendGameAction(type, payload = {}) {
  socketStore.sendMessage("inGame", {
    gameId: props.gameId,
    roomName: props.roomId,
    userId: userStore.id,
    userName: userStore.name,
    action: { type, payload },
  });
}

/** 돌 놓기 액션을 서버로 전송합니다. */
const makeMove = (row, col) => {
  sendGameAction("game:move", { row, col });
};

/** 채팅 메시지를 서버로 전송합니다. */
const sendMessage = () => {
  if (!tempMsg.value.trim()) return;
  sendGameAction("chat:message", { text: tempMsg.value });
  tempMsg.value = "";
};

/** 재시작 요청을 서버로 전송합니다. */
const restartGame = () => {
  // 이미 요청 중이면 자동으로 양측 동의로 처리됨
  if (isRestartRequested.value) {
    sendGameAction("game:restart:request");
    showToast("재시작에 동의했습니다", "success");
  } else {
    sendGameAction("game:restart:request");
    showToast("재시작 요청을 보냈습니다", "info");
  }
};

/** 기권 액션을 서버로 전송합니다. */
const surrender = () => sendGameAction("game:surrender");

/** 게임을 종료하고 방 목록으로 돌아갑니다. */
const exitGame = () => {
  socketStore.disconnect();
  router.push({ name: "game-rooms", params: { gameId: props.gameId } });
};

/** 상대가 돌을 선택한 경우 그 돌의 모달을 비활성화 합니다 */

// --- WebSocket Handlers ---

/**
 * 서버로부터 받은 게임 상태 업데이트를 적용합니다.
 * @param {Object} payload - 새로운 게임 상태
 */
const handleUpdateState = (payload) => {
  gameState.value = payload;
};

/**
 * 돌 선택 업데이트를 처리합니다.
 * @param {Object} payload - { player, color }
 * @param {String} payload.player - 돌을 선택한 플레이어의 ID
 * @param {String} payload.color - 선택된 돌 색깔 ('black' 또는 'white')
 */
const handleColorSelection = (payload) => {
  if (payload.player === userStore.id) return;

  enemyColor.value = payload.color;

  if (myColor.value && enemyColor.value) {
    isSelectedColor.value = true;
  }
};

/**
 * 서버로부터 받은 채팅 메시지를 처리합니다.
 * @param {Object} payload - { userId, userName, text }
 */
const handleChatMessage = (payload) => {
  messages.value.push(payload);
  // 스크롤을 맨 아래로 이동
  nextTick(() => {
    if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  });
};

/**
 * 게임 시작 시 서버로부터 받은 초기 상태를 설정합니다.
 * @param {Object} payload - { gameState, players }
 */
const handleInitialState = (payload) => {
  gameState.value = payload.gameState;
  const playerIds = Object.keys(payload.players);
  const myIndex = playerIds.indexOf(userStore.id);
  myColor.value = myIndex === 0 ? "black" : "white";

  // 게임이 시작된 상태라면 돌 선택 모달 숨김
  if (!gameState.value.gameOver && gameState.value.currentPlayer) {
    isSelectedColor.value = true;
  }
};

/**
 * 상대방의 재시작 요청을 처리하여 모달을 표시합니다.
 * @param {Object} payload - { requesterName }
 */
const handleRestartRequested = (payload) => {
  if (payload.requesterId === userStore.id) return;

  isRestartRequested.value = true;
  restartRequester.value = payload.requesterName || "상대방";
  showToast(`${restartRequester.value}이 게임 재시작을 요청했습니다`, "info");
};

/** 재시작이 수락되었음을 처리합니다. */
const handleRestartAccepted = (payload) => {
  messages.value = []; // 채팅 초기화
  isRestartRequested.value = false;
  restartRequester.value = "";

  // 게임 상태가 payload에 포함되어 있으면 업데이트
  if (payload.gameState) {
    gameState.value = payload.gameState;
  }

  showToast("게임이 재시작됩니다!", "success");

  // 돌 선택 모달 다시 표시
  isSelectedColor.value = false;
  myColor.value = null;
  enemyColor.value = null;
};

/** 재시작 요청 중 플레이어가 나간 경우를 처리합니다. */
const handleRestartCancelled = (payload) => {
  isRestartRequested.value = false;
  restartRequester.value = "";

  const message =
    payload.reason === "playerLeft" || payload.reason === "playerDisconnected"
      ? "상대방이 나갔습니다"
      : "재시작 요청이 취소되었습니다";

  showToast(message, "error");
  isEnemyLeaved.value = true;
};

/**
 * 타이머 업데이트를 처리합니다.
 * @param {Object} payload - { black, white, currentPlayer }
 */
const handleTimerUpdate = (payload) => {
  if (gameState.value.playerTimers) {
    gameState.value.playerTimers.black = payload.black;
    gameState.value.playerTimers.white = payload.white;
  }
};

/**
 * 시간 초과를 처리합니다.
 * @param {Object} payload - { winner, reason }
 */
const handleTimeout = (payload) => {
  gameState.value.gameOver = true;
  gameState.value.winner = payload.winner;
  showToast("시간이 초과되었습니다!", "warning");
};

/**
 * WebSocket 이벤트 핸들러들을 등록합니다.
 */
const setupSocketHandlers = () => {
  socketStore.registerHandler("game:initialState", handleInitialState);
  socketStore.registerHandler("game:updateState", handleUpdateState);
  socketStore.registerHandler("chat:message", handleChatMessage);
  socketStore.registerHandler("game:restart:requested", handleRestartRequested);
  socketStore.registerHandler("game:restart:accepted", handleRestartAccepted);
  socketStore.registerHandler("game:restart:cancelled", handleRestartCancelled);
  socketStore.registerHandler("game:selectColor", handleColorSelection);
  socketStore.registerHandler("game:timerUpdate", handleTimerUpdate);
  socketStore.registerHandler("game:timeout", handleTimeout);
};

/**
 * 등록된 WebSocket 이벤트 핸들러들을 모두 해제합니다.
 */
const cleanupSocketHandlers = () => {
  Object.keys(socketStore.messageHandlers.value).forEach((type) => {
    if (type.startsWith("game:")) {
      socketStore.unregisterHandler(type);
    }
  });
  socketStore.unregisterHandler("chat:message");
};

// --- Lifecycle Hooks ---
onMounted(() => {
  if (!socketStore.isConnected) {
    // 소켓이 연결되지 않은 상태에서 페이지에 접근한 경우
    alert("잘못된 접근입니다. 게임 로비로 돌아갑니다.");
    router.push({ name: "game-rooms", params: { gameId: props.gameId } });
    return;
  }

  setupSocketHandlers();

  // 서버에 이 화면이 준비되었음을 알리고 초기 게임 상태를 요청
  sendGameAction("player:loaded");

  // 게임 데이터가 있고 아직 색상이 선택되지 않았다면 돌 선택 모달 표시
  if (gameState.value && gameState.value.status === "waiting") {
    isSelectedColor.value = true;
  }
});

onUnmounted(() => {
  cleanupSocketHandlers();
});
</script>

<style scoped>
/* 여기에 GomokuGame.vue에만 해당하는 스타일을 넣습니다. */
/* 기존의 GomokuGame.vue에 있던 스타일을 그대로 가져오면 됩니다. */
.layout {
  display: grid;
  width: 100%;
  height: 100vh;
  gap: 0.625rem;
  grid-template-columns: 1fr 3fr 2fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas: "enemy-comment enemy-info chat" "status gomoku chat" "player-comment player-info chat";
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

.retry-btn {
  padding-left: 1.5rem;
  padding-right: 1.5rem;

  padding-top: 0.75rem;
  padding-bottom: 0.75rem;

  background-color: #2563eb;

  color: white;

  border-radius: 0.5rem;

  font-size: 1.25rem;

  font-weight: bold;

  transition: all 0.3s;
}

.retry-btn:hover {
  background-color: #1e40af;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.retry-btn:disabled {
  background-color: #9ea7b5;
  pointer-events: none;
  transform: none;
  box-shadow: none;
}

.retry-btn.restart-requested {
  background-color: #10b981;
  animation: pulse 1.5s infinite;
}

.retry-btn.restart-requested:hover {
  background-color: #059669;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
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
  box-shadow: 0 0 20px rgba(37, 99, 235, 0.7);
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
  transition: width 1s linear;
}

.timer-display {
  font-weight: bold;
  color: #333;
  min-width: 50px;
  text-align: right;
}

.timer-display.warning {
  color: #f59e0b;
}

.timer-display.danger {
  color: #ef4444;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0.5;
  }
}
</style>
