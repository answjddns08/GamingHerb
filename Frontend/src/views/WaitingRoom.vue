<template>
  <main class="waiting-room">
    <div class="waiting-content">
      <h1>Waiting Room</h1>
      <p>Please wait for other players to get ready...</p>
    </div>
  </main>
  <div class="player-card">
    <div class="flex justify-between items-end gap-4">
      <p class="font-bold text-3xl">Players</p>
      <p class="text-sm text-gray-400">
        {{ players.size }}
        /
        {{ gameSetting ? gameSetting.maxPlayerCount + " max" : "?" }}
      </p>
    </div>
    <div
      v-for="player in playerList"
      :key="player.userId"
      class="flex items-center justify-between gap-2"
      :class="{ 'opacity-50': player.disconnected }"
    >
      <div class="flex items-center gap-2">
        <p>{{ player.username }}{{ player.disconnected ? " (연결 끊김)" : "" }}</p>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 640"
          style="height: 1.5rem; fill: gold"
          v-if="player.userId === gameSetting.hostId"
        >
          <!-- host icon -->
          <path
            d="M341.5 45.1C337.4 37.1 329.1 32 320.1 32C311.1 32 302.8 37.1 298.7 45.1L225.1 189.3L65.2 214.7C56.3 216.1 48.9 222.4 46.1 231C43.3 239.6 45.6 249 51.9 255.4L166.3 369.9L141.1 529.8C139.7 538.7 143.4 547.7 150.7 553C158 558.3 167.6 559.1 175.7 555L320.1 481.6L464.4 555C472.4 559.1 482.1 558.3 489.4 553C496.7 547.7 500.4 538.8 499 529.8L473.7 369.9L588.1 255.4C594.5 249 596.7 239.6 593.9 231C591.1 222.4 583.8 216.1 574.8 214.7L415 189.3L341.5 45.1z"
          />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 640"
          style="height: 1.5rem"
          v-else-if="player.isReady"
        >
          <!-- status icon -->
          <path
            d="M136 192C136 125.7 189.7 72 256 72C322.3 72 376 125.7 376 192C376 258.3 322.3 312 256 312C189.7 312 136 258.3 136 192zM48 546.3C48 447.8 127.8 368 226.3 368L285.7 368C384.2 368 464 447.8 464 546.3C464 562.7 450.7 576 434.3 576L77.7 576C61.3 576 48 562.7 48 546.3zM612.4 196.7L532.4 324.7C528.2 331.4 521 335.6 513.1 336C505.2 336.4 497.6 332.8 492.9 326.4L444.9 262.4C436.9 251.8 439.1 236.8 449.7 228.8C460.3 220.8 475.3 223 483.3 233.6L510.3 269.6L571.7 171.3C578.7 160.1 593.5 156.6 604.8 163.7C616.1 170.8 619.5 185.5 612.4 196.8z"
          />
        </svg>
      </div>
      <button
        v-if="player.userId !== userStore.id && userStore.id === gameSetting.hostId"
        @click="kickUser(player.userId)"
        class="kick-btn"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" style="height: 1.5rem">
          <!-- user kick icon -->
          <path
            d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM231 231C240.4 221.6 255.6 221.6 264.9 231L319.9 286L374.9 231C384.3 221.6 399.5 221.6 408.8 231C418.1 240.4 418.2 255.6 408.8 264.9L353.8 319.9L408.8 374.9C418.2 384.3 418.2 399.5 408.8 408.8C399.4 418.1 384.2 418.2 374.9 408.8L319.9 353.8L264.9 408.8C255.5 418.2 240.3 418.2 231 408.8C221.7 399.4 221.6 384.2 231 374.9L286 319.9L231 264.9C221.6 255.5 221.6 240.3 231 231z"
          />
        </svg>
      </button>
    </div>
  </div>
  <div class="start-card" v-if="userStore.id === gameSetting?.hostId">
    <button
      @click="ReadyGame"
      :disabled="
        playerList.length < 2 || playerList.some((p) => !p.isReady && p.userId !== userStore.id)
      "
    >
      Start Game
    </button>
  </div>
  <button v-else class="ready-btn" @click="ReadyGame" :class="{ active: isReady }">
    {{ isReady ? "Cancel" : "Ready" }}
  </button>
  <div class="goBack-card">
    <button
      @click="goBack"
      class="bg-red-300 text-black px-4 py-2 rounded hover:bg-red-400 transition"
    >
      Go Back
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user.js";
import { useSocketStore } from "@/stores/socket.js";

const userStore = useUserStore();
const socketStore = useSocketStore();
const router = useRouter();

const props = defineProps({
  gameId: { type: String, required: true },
  roomId: { type: String, required: true },
});

const gameSetting = ref(null);
const players = ref(new Map());
const playerList = computed(() => Array.from(players.value.values()));
const isReady = ref(false);
let isLeaving = false; // 네비게이션 가드로 인한 중복 실행 방지

// --- WebSocket Actions ---
function send(type, action, payload = {}) {
  socketStore.sendMessage(type, {
    gameId: props.gameId,
    roomName: props.roomId,
    userId: userStore.id,
    userName: userStore.name,
    action,
    ...payload,
  });
}

const ReadyGame = () => {
  // 호스트라면 게임 시작 시도
  if (userStore.id === gameSetting.value?.hostId) {
    // 모든 플레이어가 준비되었는지 확인
    const nonHostPlayers = playerList.value.filter((p) => p.userId !== userStore.id);
    const allNonHostReady = nonHostPlayers.every((p) => p.isReady);

    if (playerList.value.length >= 2 && allNonHostReady) {
      send("waiting", { type: "startGame" });
    }
  } else {
    // 일반 플레이어는 준비 상태 토글
    isReady.value = !isReady.value;
    send("waiting", { type: "setReady", payload: { isReady: isReady.value } });
  }
};

const kickUser = (targetUserId) => {
  send("waiting", { type: "kickUser", payload: { targetUserId } });
};

const goBack = () => {
  isLeaving = true;
  router.push({ name: "game-rooms", params: { gameId: props.gameId } });
};

// --- WebSocket Handlers ---
const setupSocketHandlers = () => {
  socketStore.registerHandler("initialize", (data) => {
    gameSetting.value = { ...data.settings, hostId: data.hostId };
    const playerMap = new Map(data.players.map((p) => [p.userId, p]));
    players.value = playerMap;
  });

  socketStore.registerHandler("playerJoined", (data) => {
    players.value.set(data.player.userId, data.player);
  });

  socketStore.registerHandler("playerLeft", (data) => {
    players.value.delete(data.playerId);
  });

  // 플레이어 일시 연결 해제 처리
  socketStore.registerHandler("playerDisconnected", (data) => {
    const player = players.value.get(data.playerId);
    if (player) {
      player.disconnected = true;
      if (data.isTemporary) {
        // 임시 연결 해제 - UI에서 표시만 변경
        console.log(`${data.playerName} temporarily disconnected`);
      }
    }
  });

  // 플레이어 재연결 처리
  socketStore.registerHandler("playerReconnected", (data) => {
    const player = players.value.get(data.playerId);
    if (player) {
      player.disconnected = false;
      console.log(`${data.playerName} reconnected`);
    }
  });

  socketStore.registerHandler("playerReadyState", (data) => {
    const player = players.value.get(data.payload.userId);
    if (player) player.isReady = data.payload.isReady;
  });

  socketStore.registerHandler("playerKicked", (data) => {
    players.value.delete(data.playerId);
    if (data.playerId === userStore.id) {
      isLeaving = true;
      router.push({ name: "game-rooms", params: { gameId: props.gameId } });
    }
  });

  socketStore.registerHandler("gameStart", () => {
    isLeaving = true; // 게임 시작은 정상적인 이탈로 간주
    router.push({
      name: "in-game",
      params: { gameId: props.gameId, roomId: props.roomId },
    });
  });

  socketStore.registerHandler("roomDeleted", (data) => {
    const reason = data?.reason || "unknown";
    if (reason === "Host disconnected") {
      alert("방장의 연결이 끊어져 방이 삭제되었습니다.");
    } else {
      alert("방이 삭제되었습니다.");
    }
    isLeaving = true;
    router.push({ name: "game-rooms", params: { gameId: props.gameId } });
  });

  // 연결 끊김 처리
  socketStore.registerHandler("connectionFailed", () => {
    alert("서버와의 연결이 끊어졌습니다. 게임 로비로 돌아갑니다.");
    isLeaving = true;
    router.push({ name: "game-rooms", params: { gameId: props.gameId } });
  });

  // 에러 메시지 처리
  socketStore.registerHandler("error", (data) => {
    console.error("Server error:", data);
    if (data.message?.includes("Room not found")) {
      alert("방을 찾을 수 없습니다. 게임 로비로 돌아갑니다.");
      isLeaving = true;
      router.push({ name: "game-rooms", params: { gameId: props.gameId } });
    }
  });
};

const cleanupSocketHandlers = () => {
  Object.keys(socketStore.messageHandlers.value).forEach((type) => {
    socketStore.unregisterHandler(type);
  });
};

onMounted(() => {
  isLeaving = false;
  // 소켓이 연결되어 있지 않으면 연결 시도
  if (!socketStore.socket || socketStore.socket.readyState !== WebSocket.OPEN) {
    socketStore.connect(`wss://gamingherb.redeyes.dev/api`);
    socketStore.socket.value.onopen = () => {
      console.log("소켓 연결 성공. 방에 참여합니다.");
      setupSocketHandlers();
      send("join");
    };
  } else {
    // 이미 연결되어 있다면 핸들러만 설정하고 join 메시지 전송
    setupSocketHandlers();
    send("join");
  }
});

onUnmounted(() => {
  cleanupSocketHandlers();
  if (isLeaving) {
    // 게임 시작이 아닌, 의도된 이탈 시에만 연결 종료
    if (router.currentRoute.value.name !== "in-game") {
      socketStore.disconnect();
    }
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
  cursor: pointer;
}

.player-card {
  position: absolute;

  top: 20px;
  left: 20px;

  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  z-index: 10; /* 플레이어 카드가 게임 위에 표시되도록 */
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
}

.start-card {
  position: fixed;
  bottom: 20px;
  right: 20px;
}

.start-card button {
  background-color: #28a745;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;

  cursor: pointer;

  transition: background-color 0.3s ease;
}

.start-card button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.ready-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;

  color: white;
  background-color: rgb(40, 236, 40);

  padding: 10px 20px;
  border-radius: 5px;

  cursor: pointer;

  transition: background-color 0.3s ease;
}

.ready-btn:hover {
  background-color: #26c235;
}

.ready-btn.active {
  background-color: rgb(208, 28, 28);
}

.ready-btn.active:hover {
  background-color: #dc3545;
}

.kick-btn {
  color: white;
  border-radius: 5px;

  cursor: pointer;

  transition: all 0.3s ease;
}

.kick-btn:hover {
  fill: #dc3545;

  scale: 1.25;
}

.goBack-card {
  position: fixed;

  bottom: 20px;
  left: 20px;
  padding: 10px;
}
</style>
