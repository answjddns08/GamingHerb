<template>
  <main class="layout">
    <div class="desc" v-if="gameId">
      <h1 class="text-3xl font-bold">{{ gameId }}</h1>
      <div v-html="gameDes" class="game-description"></div>
      <RouterLink :to="{ name: 'game-rooms' }" class="goBack-btn">
        <button class="bg-red-300 text-black px-4 py-2 rounded hover:bg-red-400 transition">
          Go Back
        </button>
      </RouterLink>
    </div>
    <div class="desc" v-else>
      <h1>Loading...</h1>
    </div>
    <div class="settings" v-if="gameSetting">
      <h1>Settings</h1>
      <div class="flex gap-2">
        <label for="roomName">Room Name</label>
        <input class="border rounded-lg p-1" type="text" id="roomName" v-model="roomName" />
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
        <div v-else-if="typeof value === 'object' && value !== null && 'value' in value">
          <input
            type="range"
            :id="key"
            v-model.number="gameSetting.settings[key].value"
            :min="value.min"
            :max="value.max"
            :step="value.step"
          />
          <input type="number" v-model.number="gameSetting.settings[key].value" class="w-15" />
          <span>{{ value.unit || "seconds" }}</span>
        </div>
        <!-- 기타 타입은 필요시 추가 -->
      </div>
      <div class="mt-auto flex flex-col gap-2 items-center">
        <p class="text-red-500 font-bold text-2xl">
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
import { onMounted, ref } from "vue";
import { useRoute, RouterLink, useRouter } from "vue-router";
import { getGameDescription, getGameSettings } from "@/games/index.js";
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

onMounted(async () => {
  gameId.value = route.params.gameId;

  try {
    // games/index.js의 getGameSettings 함수 사용
    gameSetting.value = await getGameSettings(route.params.gameId);
    // games/index.js의 getGameDescription 함수 사용
    gameDes.value = await getGameDescription(route.params.gameId);
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

  gap: 1rem;

  display: grid;
  grid-template-columns: 2fr 1fr;
}

h1 {
  font-size: 2rem;

  font-weight: bold;

  margin-bottom: 1rem;
}

.desc {
  padding: 1rem;

  height: inherit;

  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  border: 1px solid #000000;
}

.game-description {
  flex-grow: 1;

  word-break: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;

  overflow-y: auto;
  padding-right: 8px; /* 스크롤바 공간 확보(선택) */
}

.game-description :deep(h1) {
  color: #2196f3;

  font-size: 2rem;
  font-weight: bold;

  margin-bottom: 1rem;
}

.game-description :deep(h2) {
  color: #2196f3;

  font-size: 1.5rem;
  font-weight: bold;

  margin-bottom: 1rem;
}

.game-description :deep(h3) {
  color: #2196f3;

  font-size: 1.25rem;
  font-weight: bold;

  margin-bottom: 1rem;
}

.game-description :deep(p) {
  font-size: 1.1rem;
  line-height: 1.6;
  word-break: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.game-description :deep(ul) {
  padding-left: 1.5rem;
  list-style-type: disc;
}

.game-description :deep(strong) {
  color: #e91e63;
}

.settings {
  border: 1px solid #000000;

  display: flex;
  flex-direction: column;
  gap: 1rem;

  flex: 1;

  padding: 1rem;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.toggle-btn.active {
  background: #4caf50;
  color: #fff;
}

.toggle-btn {
  background: #ccc;
  color: #333;
  border: none;
  border-radius: 5px;
  padding: 0.3rem 1rem;
  cursor: pointer;
}

.start-btn {
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  width: 100%;

  transition: background-color 0.3s ease;
}

.start-btn:hover {
  background-color: #2c7930;
}

.goBack-btn {
  margin-top: auto;
}
</style>
