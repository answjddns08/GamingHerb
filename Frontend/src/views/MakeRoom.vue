<template>
  <main class="layout">
    <div class="desc" v-if="gameId">
      <h1>{{ gameName }}</h1>
      <div v-html="gameDes" class="game-description"></div>
      <RouterLink :to="{ name: 'game-rooms', params: { gameId: gameId } }" class="goBack-btn">
        <button class="btn-goback">Go Back</button>
      </RouterLink>
    </div>
    <div class="desc" v-else>
      <h1>Loading...</h1>
    </div>
    <div class="settings" v-if="gameSetting">
      <h1>Settings</h1>
      <div class="room-name-input">
        <label for="roomName">Room Name</label>
        <input type="text" id="roomName" v-model="roomName" />
      </div>
      <div v-for="(value, key) in gameSetting.settings" :key="key" class="setting-item">
        <label :for="key">{{ key }}</label>
        <!-- Boolean: 토글 버튼 -->
        <div v-if="typeof value === 'boolean'">
          <button
            :id="key"
            @click="gameSetting.settings[key] = !gameSetting.settings[key]"
            :class="{ active: gameSetting.settings[key] }"
            class="toggle-btn"
          >
            {{ gameSetting.settings[key] ? "ON" : "OFF" }}
          </button>
        </div>
        <!-- Number: 슬라이더 -->
        <!-- 숫자형: 객체로 min/max/step 접근 -->
        <div
          v-else-if="typeof value === 'object' && value !== null && 'value' in value"
          class="flex items-center"
        >
          <input
            type="range"
            :id="key"
            v-model.number="gameSetting.settings[key].value"
            :min="value.min"
            :max="value.max"
            :step="value.step"
          />
          <input
            type="number"
            v-model.number="gameSetting.settings[key].value"
            style="width: 60px; margin-left: 8px"
          />
          <span style="margin-left: 8px">{{ value.unit || "seconds" }}</span>
        </div>
        <!-- 기타 타입은 필요시 추가 -->
      </div>
      <div class="actions-container">
        <p class="alarm-message">
          {{ alarm }}
        </p>
        <button class="start-btn" @click="StartGame">Start Game</button>
      </div>
    </div>
  </main>
</template>

<script setup>
/**
 * @file MakeRoom.vue
 * @description 새로운 게임 방을 생성하는 페이지 컴포넌트입니다.
 *              게임 설명 표시, 방 이름 및 게임별 세부 설정 기능을 제공합니다.
 */
import { onMounted, ref, computed } from "vue";
import { useRoute, RouterLink, useRouter } from "vue-router";
import { getSettingDescription, getGameSettings, getGameById } from "@/games/index.js";
import { useUserStore } from "../stores/user.js";

/**
 * @todo
 * - 게임별 설정 UI 개선 (예: 드롭다운, 체크박스 등)
 * - 방 이름 중복 체크
 */

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

/** @type {import('vue').Ref<String>} 사용자에게 표시될 알림 메시지 */
const alarm = ref("");
/** @type {import('vue').Ref<String|null>} 현재 게임의 ID */
const gameId = ref(null);
/** @type {import('vue').Ref<Object|null>} 현재 게임의 설정 객체 */
const gameSetting = ref(null);
/** @type {import('vue').Ref<String>} 현재 게임의 설명을 담는 HTML 문자열 */
const gameDes = ref("");
/** @type {import('vue').Ref<String>} 생성할 방의 이름 */
const roomName = ref("");

/** @type {import('vue').ComputedRef<string>} 현재 게임의 이름 */
const gameName = computed(() => {
  if (!gameId.value) return "Loading...";
  const gameInfo = getGameById(gameId.value);
  return gameInfo?.name || gameId.value;
});

onMounted(async () => {
  gameId.value = route.params.gameId;

  try {
    // games/index.js의 getGameSettings 함수 사용
    gameSetting.value = await getGameSettings(route.params.gameId);
    // games/index.js의 getSettingDescription 함수 사용
    gameDes.value = await getSettingDescription(route.params.gameId);
  } catch (error) {
    console.error("게임 데이터 로드 실패:", error);
    alarm.value = "게임 데이터를 불러오는 중 오류가 발생했습니다.";
  }
});

/**
 * 'Start Game' 버튼 클릭 시 호출됩니다.
 * 입력된 정보로 새로운 게임 방 생성을 서버에 요청하고,
 * 성공 시 대기방으로 이동합니다.
 */
async function StartGame() {
  alarm.value = ""; // 초기화

  if (!roomName.value.trim()) {
    alarm.value = "방 이름을 입력해주세요.";
    return;
  }

  try {
    const response = await fetch(`/api/rooms/create?gameId=${gameId.value}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        host: userStore.name,
        hostId: userStore.id, // for checking host in waiting room
        status: "Waiting for players",
        settings: gameSetting.value.settings,
        roomName: roomName.value,
        maxPlayerCount: gameSetting.value.maxPlayers,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("게임 방 생성 실패:", response.status, errorData);
      alarm.value = `방 생성에 실패했습니다: ${errorData.message || response.statusText}`;
      return;
    }

    const data = await response.json();
    console.log("게임 방 생성 성공:", data);
    alarm.value = "게임 방이 생성되었습니다.";

    router.push({
      name: "waiting-room",
      params: { gameId: gameId.value, roomId: roomName.value },
    });
  } catch (error) {
    console.error("방 생성 요청 중 예외 발생:", error);
    alarm.value = "서버와 통신 중 오류가 발생했습니다.";
  }
}
</script>

<style scoped>
.layout {
  height: 100vh;
  gap: 24px;
  display: grid;
  grid-template-columns: 2fr 1fr;
  background: linear-gradient(135deg, #f5e6d3 0%, #e8dcc8 100%);
  padding: 24px;
  box-sizing: border-box;
}

h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #5a4a3a;
}

.desc {
  padding: 24px;
  height: inherit;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0e6d8;
  box-sizing: border-box;
}

.game-description {
  flex-grow: 1;
  word-break: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  overflow-y: auto;
  padding-right: 8px;
  color: #5a4a3a;
  line-height: 1.6;
}

.game-description :deep(h1) {
  color: #b8956f;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
  margin-top: 0;
}

.game-description :deep(h2) {
  color: #b8956f;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
}

.game-description :deep(h3) {
  color: #b8956f;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
}

.game-description :deep(p) {
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.game-description :deep(ul) {
  padding-left: 20px;
  list-style-type: disc;
}

.game-description :deep(strong) {
  color: #3d2f23;
  font-weight: 700;
}

.settings {
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  padding: 24px;
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0e6d8;
  box-sizing: border-box;
}

.room-name-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.room-name-input label {
  font-weight: 600;
  font-size: 14px;
  color: #5a4a3a;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  color: #5a4a3a;
}

.setting-item label {
  font-weight: 600;
  font-size: 14px;
}

.toggle-btn {
  background: #d4c9b8;
  color: #5a4a3a;
  border: none;
  border-radius: 10px;
  padding: 6px 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: #c9b8a8;
}

.toggle-btn.active {
  background: linear-gradient(135deg, #c9a86a 0%, #b8956f 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.alarm-message {
  color: #d32f2f;
  font-weight: 700;
  font-size: 14px;
  text-align: center;
  min-height: 20px;
  margin: 0;
}

.actions-container {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.start-btn {
  background: linear-gradient(135deg, #c9a86a 0%, #b8956f 100%);
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  width: 100%;
  font-weight: 700;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.start-btn:active {
  transform: translateY(0);
}

.goBack-btn {
  margin-top: auto;
}

.btn-goback {
  background: linear-gradient(135deg, #f5a5a5 0%, #e88888 100%);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  width: 100%;
}

.btn-goback:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

input[type="text"],
input[type="range"],
input[type="number"] {
  padding: 8px 12px;
  border: 2px solid #d4c9b8;
  border-radius: 10px;
  font-size: 14px;
  color: #5a4a3a;
  transition: all 0.2s ease;
  background-color: #fffbf3;
}

input[type="text"]:focus,
input[type="range"]:focus,
input[type="number"]:focus {
  outline: none;
  border-color: #b8956f;
  box-shadow: 0 0 0 3px rgba(184, 149, 111, 0.1);
}

input[type="range"] {
  cursor: pointer;
  accent-color: #b8956f;
}

/* 스크롤바 스타일 */
.game-description::-webkit-scrollbar {
  width: 6px;
}

.game-description::-webkit-scrollbar-track {
  background: #f1e5d1;
  border-radius: 3px;
}

.game-description::-webkit-scrollbar-thumb {
  background: #b8956f;
  border-radius: 3px;
}

.game-description::-webkit-scrollbar-thumb:hover {
  background: #a17958;
}
</style>
