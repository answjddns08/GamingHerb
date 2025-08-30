<template>
  <main class="layout">
    <div class="status-container">
      <h1 class="text-2xl font-bold">리버시</h1>
      <div class="scores">
        <div class="score-box black">⚫ 흑: {{ gameState.scores?.black || 2 }}</div>
        <div class="score-box white">⚪ 백: {{ gameState.scores?.white || 2 }}</div>
      </div>
      <h3>현재 차례: {{ gameState.currentPlayer === "black" ? "흑돌" : "백돌" }}</h3>
      <button
        class="mt-auto p-3 w-1/2 rounded-lg bg-red-300 text-2xl font-bold transition-all hover:bg-red-400"
        @click="surrender"
        :disabled="gameState.gameOver"
      >
        기권
      </button>
    </div>
    <div class="board">
      <div class="board-container-reversi">
        <div v-for="(row, r_idx) in gameState.board" :key="r_idx" class="grid-row-reversi">
          <div
            v-for="(cell, c_idx) in row"
            :key="c_idx"
            class="grid-cell-reversi"
            @click="makeMove(r_idx, c_idx)"
          >
            <div v-if="cell" class="piece" :class="cell"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="chat-container">
      <h1 class="text-5xl font-bold">Chat</h1>
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

    <!-- 게임 종료 모달 -->
    <div v-if="gameState.gameOver" class="game-end-modal">
      <div class="game-end-modal-content">
        <h2 class="text-4xl font-bold mb-6">게임 종료!</h2>
        <div class="text-2xl mb-8">
          <div v-if="gameState.winner === 'draw'">무승부입니다!</div>
          <div v-else-if="gameState.winner === myColor">승리했습니다!</div>
          <div v-else>패배했습니다.</div>
        </div>
        <div class="flex gap-4 justify-center">
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
            로비로
          </button>
        </div>
      </div>
    </div>

    <!-- 재시작 요청 모달 -->
    <div v-if="showRestartRequestModal" class="game-end-modal">
      <div class="game-end-modal-content">
        <h2 class="text-4xl font-bold mb-6">재시작 요청!</h2>
        <p class="text-2xl mb-8">상대방({{ restartRequesterName }})이 재시작을 요청했습니다.</p>
        <div class="flex gap-4 justify-center">
          <button
            class="px-6 py-3 bg-blue-500 text-white rounded-lg text-xl font-bold hover:bg-blue-600 transition-all"
            @click="acceptRestart"
          >
            수락
          </button>
          <button
            class="px-6 py-3 bg-gray-500 text-white rounded-lg text-xl font-bold hover:bg-gray-600 transition-all"
            @click="declineRestart"
          >
            거절
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user.js";
import { useSocketStore } from "@/stores/socket.js";

const props = defineProps({
  gameId: { type: String, required: true },
  roomId: { type: String, required: true },
});

const userStore = useUserStore();
const socketStore = useSocketStore();
const router = useRouter();

const gameState = ref({
  board: Array(8)
    .fill(null)
    .map(() => Array(8).fill(null)),
  currentPlayer: null,
  gameOver: true,
  winner: null,
  scores: { black: 2, white: 2 },
});
const messages = ref([]);
const tempMsg = ref("");
const chatContainer = ref(null);
const myColor = ref(null);

function sendGameAction(type, payload = {}) {
  socketStore.sendMessage("inGame", {
    gameId: props.gameId,
    roomName: props.roomId,
    userId: userStore.id,
    userName: userStore.name,
    action: { type, payload },
  });
}

const makeMove = (row, col) => sendGameAction("game:move", { row, col });
const sendMessage = () => {
  if (!tempMsg.value) return;
  sendGameAction("chat:message", { text: tempMsg.value });
  tempMsg.value = "";
};
const restartGame = () => sendGameAction("game:restart");
const surrender = () => sendGameAction("game:surrender");
const exitGame = () => {
  socketStore.disconnect();
  router.push("/gamerooms");
};

const handleUpdateState = (payload) => {
  gameState.value = payload;
};

const handleChatMessage = (payload) => {
  messages.value.push(payload);
  nextTick(() => {
    if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  });
};

const showRestartRequestModal = ref(false);
const restartRequesterName = ref("");

const acceptRestart = () => {
  sendGameAction("game:restart:accept");
  showRestartRequestModal.value = false;
};

const declineRestart = () => {
  sendGameAction("game:restart:decline");
  showRestartRequestModal.value = false;
};

const handleInitialState = (payload) => {
  gameState.value = payload.gameState;
  const playerIds = Object.keys(payload.players);
  const myIndex = playerIds.indexOf(userStore.id);
  myColor.value = myIndex === 0 ? "black" : "white";
};

const handleRestartRequested = (payload) => {
  restartRequesterName.value = payload.requesterName;
  showRestartRequestModal.value = true;
};

const handleRestartAccepted = () => {
  // 게임 상태는 updateState로 초기화됨
  showRestartRequestModal.value = false;
  // 필요시 사용자에게 알림
};

const handleRestartDeclined = () => {
  showRestartRequestModal.value = false;
  alert(`${restartRequesterName.value}님이 재시작 요청을 거절했습니다.`);
};

onMounted(() => {
  if (!socketStore.socket || socketStore.socket.readyState !== WebSocket.OPEN) {
    router.push("/gamerooms");
    return;
  }
  socketStore.registerHandler("game:initialState", handleInitialState);
  socketStore.registerHandler("game:updateState", handleUpdateState);
  socketStore.registerHandler("chat:message", handleChatMessage);
  socketStore.registerHandler("game:restart:requested", handleRestartRequested);
  socketStore.registerHandler("game:restart:accepted", handleRestartAccepted);
  socketStore.registerHandler("game:restart:declined", handleRestartDeclined);

  sendGameAction("player:loaded");
});

onUnmounted(() => {
  socketStore.unregisterHandler("game:initialState");
  socketStore.unregisterHandler("game:updateState");
  socketStore.unregisterHandler("chat:message");
  socketStore.unregisterHandler("game:restart:requested");
  socketStore.unregisterHandler("game:restart:accepted");
  socketStore.unregisterHandler("game:restart:declined");
});

onMounted(() => {
  if (!socketStore.socket || socketStore.socket.readyState !== WebSocket.OPEN) {
    router.push("/gamerooms");
    return;
  }
  socketStore.registerHandler("game:initialState", handleInitialState);
  socketStore.registerHandler("game:updateState", handleUpdateState);
  socketStore.registerHandler("chat:message", handleChatMessage);
  sendGameAction("player:loaded");
});

onUnmounted(() => {
  socketStore.unregisterHandler("game:initialState");
  socketStore.unregisterHandler("game:updateState");
  socketStore.unregisterHandler("chat:message");
});
</script>

<style scoped>
.layout {
  display: grid;
  width: 100%;
  height: 100vh;
  gap: 1rem;
  grid-template-columns: 1fr 3fr 2fr;
  grid-template-rows: 1fr;
  padding: 1rem;
}
.status-container {
  grid-column: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  gap: 2rem;
  border: 2px solid #333;
  border-radius: 1rem;
}
.scores {
  font-size: 1.25rem;
  text-align: center;
}
.score-box {
  margin: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
}
.score-box.black {
  background-color: #f0f0f0;
  color: #333;
}
.score-box.white {
  background-color: #333;
  color: #f0f0f0;
}
.board {
  grid-column: 2;
  display: flex;
  justify-content: center;
  align-items: center;
}
.board-container-reversi {
  display: grid;
  grid-template-rows: repeat(8, 1fr);
  width: 80vh;
  height: 80vh;
  max-width: 640px;
  max-height: 640px;
  background-color: #008000;
  border: 2px solid #333;
  padding: 5px;
}
.grid-row-reversi {
  display: contents;
}
.grid-cell-reversi {
  background-color: #008000;
  border: 1px solid #004d00;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.grid-cell-reversi:hover {
  background-color: #009900;
}
.piece {
  width: 85%;
  height: 85%;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
.piece.black {
  background-color: #1a1a1a;
}
.piece.white {
  background-color: #f5f5f5;
}
.chat-container {
  grid-column: 3;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  border: 2px solid #333;
  border-radius: 1.5rem;
}
.chat-area {
  flex-grow: 1;
  overflow-y: auto;
  padding-right: 10px;
}
.my-message {
  align-self: flex-end;
  background: #2563eb;
  color: #fff;
  border-radius: 1rem 1rem 0.25rem 1rem;
  padding: 0.5rem 1rem;
  margin: 0.25rem 0;
  max-width: 80%;
}
.other-message {
  align-self: flex-start;
  background: #e5e7eb;
  color: #222;
  border-radius: 1rem 1rem 1rem 0.25rem;
  padding: 0.5rem 1rem;
  margin: 0.25rem 0;
  max-width: 80%;
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
</style>
