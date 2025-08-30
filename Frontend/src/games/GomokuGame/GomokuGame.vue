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
      <div class="enemyIcon" :class="{ active: gameState.currentPlayer !== myColor && !gameState.gameOver }"></div>
      <div class="flex flex-col gap-3 flex-1">
        <div class="bg-gray-300 rounded-lg w-auto h-2"></div>
        <div class="flex justify-between">
          <span>상대방</span>
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
      <div class="playerIcon" :class="{ active: gameState.currentPlayer === myColor && !gameState.gameOver }"></div>
      <div class="flex flex-col gap-3 flex-1">
        <div class="bg-gray-300 rounded-lg w-auto h-2"></div>
        <div class="flex justify-between">
          <span>나</span>
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
          <div v-else-if="(gameState.winner === myColor)">승리했습니다!</div>
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
  board: Array(15).fill(null).map(() => Array(15).fill(null)),
  currentPlayer: null,
  gameOver: true, // 초기에는 게임오버 상태로 시작
  winner: null,
});
const messages = ref([]);
const tempMsg = ref("");
const chatContainer = ref(null);
const myColor = ref(null);

// --- WebSocket Actions ---
function sendGameAction(type, payload = {}) {
  socketStore.sendMessage("inGame", {
    gameId: props.gameId,
    roomName: props.roomId,
    userId: userStore.id,
    userName: userStore.name,
    action: { type, payload },
  });
}

const makeMove = (row, col) => {
  sendGameAction("game:move", { row, col });
};

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

// --- WebSocket Handlers ---
const handleUpdateState = (payload) => {
  gameState.value = payload;
};

const handleChatMessage = (payload) => {
  messages.value.push(payload);
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

const handleInitialState = (payload) => {
    gameState.value = payload.gameState;
    const playerIds = Object.keys(payload.players);
    const myIndex = playerIds.indexOf(userStore.id);
    myColor.value = myIndex === 0 ? 'black' : 'white';
};

// --- Lifecycle Hooks ---
onMounted(() => {
  if (!socketStore.socket || socketStore.socket.readyState !== WebSocket.OPEN) {
    router.push("/gamerooms");
    return;
  }

  socketStore.registerHandler("game:initialState", handleInitialState);
  socketStore.registerHandler("game:updateState", handleUpdateState);
  socketStore.registerHandler("chat:message", handleChatMessage);

  // 서버에 이 화면이 준비되었음을 알리고 초기 게임 상태를 요청
  sendGameAction("player:loaded");
});

onUnmounted(() => {
  socketStore.unregisterHandler("game:initialState");
  socketStore.unregisterHandler("game:updateState");
  socketStore.unregisterHandler("chat:message");
});

</script>

<style scoped>
/* 여기에 GomokuGame.vue에만 해당하는 스타일을 넣습니다. */
/* 기존의 GomokuGame.vue에 있던 스타일을 그대로 가져오면 됩니다. */
.layout { display: grid; width: 100%; height: 100vh; gap: 0.625rem; grid-template-columns: 1fr 3fr 2fr; grid-template-rows: auto 1fr auto; grid-template-areas: "enemy-comment enemy-info chat" "status gomoku chat" "player-comment player-info chat"; }
.status-container { grid-area: status; display: flex; flex-direction: column; align-items: center; padding: 1.25rem; gap: 3rem; margin-top: auto; margin-bottom: auto; margin-left: 1.5rem; border: 0.125rem solid #333; border-radius: 1.125rem; }
.enemy-info { grid-area: enemy-info; display: flex; align-items: center; justify-content: space-between; margin-left: 5%; margin-right: 5%; border-bottom: 0.125rem solid #333; border-left: 0.125rem solid #333; border-right: 0.125rem solid #333; border-radius: 0 0 1.5rem 1.5rem; gap: 2.5rem; padding: 1.25rem; }
.enemyIcon { background-color: red; border-radius: 50%; width: 5rem; height: 5rem; transition: all 0.3s ease; }
.enemyIcon.active { box-shadow: 0 0 0 0.5rem greenyellow; }
.player-info { grid-area: player-info; display: flex; align-items: center; justify-content: space-between; margin-left: 2.5%; margin-right: 2.5%; border-top: 0.125rem solid #333; border-left: 0.125rem solid #333; border-right: 0.125rem solid #333; border-radius: 1.5rem 1.5rem 0 0; gap: 2.5rem; padding: 1.25rem; }
.playerIcon { background-color: aqua; border-radius: 50%; width: 5rem; height: 5rem; transition: all 0.3s ease; }
.playerIcon.active { box-shadow: 0 0 0 0.5rem greenyellow; }
.chat-container { grid-area: chat; display: flex; flex-direction: column; padding: 1.25rem; border: 2px solid #333; border-radius: 2.125rem; margin: 1.75rem; }
.chat-area { display: flex; flex-direction: column; gap: 0.625rem; flex-grow: 1; overflow-y: auto; }
.my-message { align-self: flex-end; background: #2563eb; color: #fff; border-radius: 1rem 1rem 0.25rem 1rem; padding: 0.5rem 1rem; margin: 0.25rem 0; max-width: 70%; }
.other-message { align-self: flex-start; background: #e5e7eb; color: #222; border-radius: 1rem 1rem 1rem 0.25rem; padding: 0.5rem 1rem; margin: 0.25rem 0; max-width: 70%; }
.board { grid-area: gomoku; display: flex; justify-content: center; align-items: center; }
.board-container { position: relative; background: #d4a574; padding: 1.875rem; border-radius: 0.5rem; box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.2); border-collapse: collapse; }
.display { border: 0.125rem solid #333; display: flex; flex-direction: column; }
.grid-row { display: flex; }
.grid-cell { width: 2.5rem; height: 2.5rem; border: 0.0625rem solid #333; display: flex; align-items: center; justify-content: center; }
.interaction { position: absolute; top: 0%; left: 0%; width: 100%; height: 100%; padding: 0.625rem; display: flex; flex-direction: column; }
.interaction-row { display: flex; justify-content: center; }
.cell { width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; border-radius: 50%; cursor: pointer; }
.cell:hover { background-color: #e0e0e0a1; }
.cell.disabled { cursor: not-allowed; }
.stone { width: 2rem; height: 2rem; border-radius: 50%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); }
.stone.black { background-color: #1a1a1a; border: 1px solid #333; }
.stone.white { background-color: #f5f5f5; border: 1px solid #ccc; }
.game-end-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background-color: rgba(0, 0, 0, 0.7); z-index: 1000; }
.game-end-modal-content { background-color: white; display: flex; flex-direction: column; justify-content: center; border-radius: 1rem; padding: 2rem; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3); text-align: center; min-width: 400px; }
</style>