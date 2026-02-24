<template>
  <main class="game-rooms-main">
    <header class="header-container">
      <div class="header-left">
        <!-- <SettingIcon /> -->
        <userBoard />
      </div>
      <span class="header-title">Game Rooms</span>
      <div class="header-actions">
        <RouterLink :to="{ name: 'make-room', params: { gameId: props.gameId } }">
          <button class="btn-create">Create Room</button>
        </RouterLink>
        <button
          @click="refreshRooms"
          :disabled="isRefreshing"
          class="btn-refresh"
          :class="{ refreshing: isRefreshing }"
        >
          <div v-if="isRefreshing" class="cooldown-overlay"></div>
          <span>{{ isRefreshing ? "Refreshing..." : "Refresh" }}</span>
        </button>
      </div>
    </header>

    <div class="content-wrapper">
      <!-- 왼쪽: 게임 설명 -->
      <aside class="description-panel">
        <div class="description-card">
          <h2 class="description-title">{{ gameName }}</h2>
          <div v-html="gameDescription" class="description-content"></div>
        </div>
      </aside>

      <!-- 오른쪽: 게임 방 목록 -->
      <section class="rooms-section">
        <div v-if="Object.keys(rooms).length === 0" class="empty-state">
          <p>흠.... 방이 없네요. 새로운 방을 만들어보세요!</p>
        </div>
        <div v-else class="rooms-list">
          <RouterLink
            v-for="roomName in Object.keys(rooms)"
            :key="roomName"
            :to="{ name: 'waiting-room', params: { gameId: props.gameId, roomId: roomName } }"
            class="room-card-link"
          >
            <div class="room-card">
              <div class="room-header">
                <h3 class="room-name">{{ roomName }}</h3>
              </div>
              <div class="room-info">
                <div class="info-item">
                  <span class="info-label">Host:</span>
                  <span class="info-value">{{ rooms[roomName].host }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Players:</span>
                  <span class="info-value">
                    {{ Object.keys(rooms[roomName].players || {}).length }} /
                    {{ rooms[roomName].settings.maxPlayerCount }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status:</span>
                  <span class="info-value">{{ rooms[roomName].status }}</span>
                </div>
              </div>
              <button
                class="room-action-button"
                :class="{
                  'btn-join':
                    rooms[roomName].status === 'waiting' &&
                    Object.keys(rooms[roomName].players || {}).length <
                      rooms[roomName].settings.maxPlayerCount,
                  'btn-spectate': !(
                    rooms[roomName].status === 'waiting' &&
                    Object.keys(rooms[roomName].players || {}).length <
                      rooms[roomName].settings.maxPlayerCount
                  ),
                }"
                @click.prevent
              >
                {{
                  rooms[roomName].status === "waiting" &&
                  Object.keys(rooms[roomName].players || {}).length <
                    rooms[roomName].settings.maxPlayerCount
                    ? "Join"
                    : "Spectate"
                }}
              </button>
            </div>
          </RouterLink>
        </div>
      </section>
    </div>

    <div class="goback-container">
      <RouterLink :to="{ name: 'home' }">
        <button class="btn-goback">Go Back</button>
      </RouterLink>
    </div>
  </main>
</template>

<script setup>
/**
 * @file GameRooms.vue
 * @description 특정 게임의 방 목록을 보여주는 페이지 컴포넌트입니다.
 *              방 생성, 검색, 참여 기능을 제공합니다.
 */
import { onMounted, ref, computed } from "vue";
import { RouterLink } from "vue-router";
import { getGameById, getGameDescription } from "@/games/index.js";
import userBoard from "../components/userBoard.vue";

/**
 * @todo 간단한 게임 설명 추가
 * @todo 방장 표시 안됨
 */

/** @type {import('vue').Ref<Object>} 게임 방 목록을 저장하는 객체 */
const rooms = ref([]);

/** @type {import('vue').Ref<boolean>} 리프레시 진행 중 여부 */
const isRefreshing = ref(false);

/** @type {import('vue').Ref<string>} 게임 설명 HTML */
const gameDescription = ref("");

/** @type {number} 쿨타임 지속 시간 (밀리초) - CSS 애니메이션과 동기화 */
const COOLDOWN_DURATION = 5000;

const props = defineProps({
  /** @type {String} 현재 선택된 게임의 ID */
  gameId: {
    type: String,
    default: "GomokuGame",
    required: true,
  },
});

/** @type {import('vue').ComputedRef<string>} 현재 게임의 이름 */
const gameName = computed(() => {
  const gameInfo = getGameById(props.gameId);
  return gameInfo?.name || "Game Rooms";
});

async function refreshRooms() {
  // 이미 리프레시 중이면 실행하지 않음
  if (isRefreshing.value) {
    return;
  }

  try {
    // 리프레시 시작 - CSS 애니메이션이 자동으로 시작됨
    isRefreshing.value = true;

    // CSS 애니메이션 완료 후 쿨타임 해제 (5초)
    setTimeout(() => {
      isRefreshing.value = false;
    }, COOLDOWN_DURATION);

    const fetchRooms = await fetch(`/api/rooms/list/${props.gameId}`);

    if (!fetchRooms.ok) {
      console.error("Error occurred", { status: fetchRooms.status });
      return;
    }

    console.log("fetch complete", fetchRooms);
    rooms.value = (await fetchRooms.json()).rooms;
    console.log("Rooms fetched:", rooms.value);
  } catch (error) {
    console.error("방 목록을 가져오는 데 실패했습니다:", error);

    // 에러 발생 시 쿨타임 즉시 해제
    isRefreshing.value = false;
  }
}

onMounted(async () => {
  console.log("Game ID:", props.gameId);

  // 게임 설명 로드
  try {
    gameDescription.value = await getGameDescription(props.gameId);
  } catch (error) {
    console.error("게임 설명 로드 실패:", error);
    gameDescription.value = "<p>게임 설명을 불러올 수 없습니다.</p>";
  }

  await refreshRooms();
});
</script>

<style scoped>
.game-rooms-main {
  background: linear-gradient(135deg, #f5e6d3 0%, #e8dcc8 100%);
  min-height: 100vh;
  padding-bottom: 80px;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background-color: rgba(255, 248, 240, 0.95);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-bottom: 2px solid #d4c9b8;
  backdrop-filter: blur(10px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-title {
  font-size: 36px;
  font-weight: 700;
  color: #5a4a3a;
  letter-spacing: -0.5px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-create,
.btn-refresh {
  padding: 10px 20px;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s ease;
}

.btn-create {
  background: linear-gradient(135deg, #c9a86a 0%, #b8956f 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.btn-refresh {
  background-color: #d4c9b8;
  color: #5a4a3a;
  min-width: 100px;
  position: relative;
  overflow: hidden;
}

.btn-refresh:hover:not(.refreshing) {
  background-color: #c9b8a8;
  transform: translateY(-2px);
}

.btn-refresh.refreshing {
  cursor: not-allowed;
  opacity: 0.7;
}

.cooldown-overlay {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: rgba(92, 74, 58, 0.2);
  animation: cooldown-progress 5s ease-out forwards;
}

@keyframes cooldown-progress {
  0% {
    width: 0%;
  }
  100% {
    width: 100%;
  }
}

.content-wrapper {
  display: flex;
  gap: 32px;
  padding: 20px 100px;
  /* max-width: 1600px; */
  margin: 0 auto;
}

.description-panel {
  flex-shrink: 0;
  width: 750px;
}

.description-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  height: fit-content;
  position: sticky;
  top: 32px;
}

.description-title {
  font-size: 20px;
  font-weight: 700;
  color: #5a4a3a;
  margin: 0 0 16px 0;
}

.description-content {
  font-size: 14px;
  color: #5a4a3a;
  line-height: 1.6;
  overflow-y: auto;
  max-height: 600px;
}

.description-content :deep(h1) {
  color: #b8956f;
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 12px 0;
}

.description-content :deep(h2) {
  color: #b8956f;
  font-size: 18px;
  font-weight: 700;
  margin: 12px 0 8px 0;
}

.description-content :deep(h3) {
  color: #b8956f;
  font-size: 16px;
  font-weight: 700;
  margin: 12px 0 8px 0;
}

.description-content :deep(p) {
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.description-content :deep(ul) {
  padding-left: 20px;
  list-style-type: disc;
  margin: 0 0 12px 0;
}

.description-content :deep(li) {
  margin-bottom: 4px;
}

.description-content :deep(strong) {
  color: #3d2f23;
  font-weight: 700;
}

/* 스크롤바 스타일 */
.description-content::-webkit-scrollbar {
  width: 6px;
}

.description-content::-webkit-scrollbar-track {
  background: #f1e5d1;
  border-radius: 3px;
}

.description-content::-webkit-scrollbar-thumb {
  background: #b8956f;
  border-radius: 3px;
}

.description-content::-webkit-scrollbar-thumb:hover {
  background: #a17958;
}

.rooms-section {
  flex: 1;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #5a4a3a;
  font-size: 18px;
  font-weight: 500;
}

.rooms-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.room-card-link {
  text-decoration: none;
  color: inherit;
}

.room-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 18px 24px;
  background: white;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f0e6d8;
}

.room-card:hover {
  /* transform: translateY(-2px); */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #d4c9b8;
}

.room-header {
  flex-shrink: 0;
  min-width: 180px;
}

.room-name {
  font-size: 18px;
  font-weight: 700;
  color: #5a4a3a;
  margin: 0;
}

.room-info {
  flex: 1;
  display: flex;
  gap: 32px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: #a89968;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #5a4a3a;
}

.room-action-button {
  flex-shrink: 0;
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-join {
  background: linear-gradient(135deg, #c9a86a 0%, #b8956f 100%);
  color: white;
}

.btn-join:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(184, 149, 111, 0.3);
}

.btn-spectate {
  background-color: #e8dcc8;
  color: #5a4a3a;
}

.btn-spectate:hover {
  background-color: #dcc9b3;
}

.goback-container {
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 50;
}

.btn-goback {
  padding: 10px 20px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #f5a5a5 0%, #e88888 100%);
  color: white;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.btn-goback:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

@media (max-width: 1024px) {
  .content-wrapper {
    flex-direction: column;
  }

  .description-panel {
    width: 100%;
  }

  .description-card {
    position: static;
  }
}

@media (max-width: 768px) {
  .room-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .room-info {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
