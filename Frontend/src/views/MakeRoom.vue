<template>
  <main class="layout">
    <div class="desc" v-if="game">
      <h1>{{ game.name }}</h1>
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
        <input
          class="border rounded-lg p-1"
          type="text"
          id="roomName"
          v-model="gameSetting.roomName"
        />
      </div>
      <div v-for="(value, key) in gameSetting.settings" :key="key" class="setting-item">
        <label :for="key">{{ key }}</label>
        <!-- Boolean: 토글 버튼 -->
        <template v-if="typeof value === 'boolean'">
          <button
            :id="key"
            @click="gameSetting.settings[key] = !gameSetting.settings[key]"
            :class="{ active: gameSetting.settings[key] }"
            class="toggle-btn"
          >
            {{ gameSetting.settings[key] ? "ON" : "OFF" }}
          </button>
        </template>
        <!-- Number: 슬라이더 -->
        <!-- 숫자형: 객체로 min/max/step 접근 -->
        <template v-else-if="typeof value === 'object' && value !== null && 'value' in value">
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
        </template>
        <!-- 기타 타입은 필요시 추가 -->
      </div>
      <button class="start-btn" @click="StartGame">Start Game</button>
    </div>
  </main>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { RouterLink } from "vue-router";
import { getGameInfo, getGameDescription, getGameConfig } from "../utils/gameLoader.js";

const route = useRoute();

const game = ref(null);

const gameSetting = ref(null);

const gameDes = ref("");

onMounted(async () => {
  game.value = getGameInfo(route.params.gameId);

  gameSetting.value = await getGameConfig(route.params.gameId);

  gameDes.value = await getGameDescription(route.params.gameId);

  console.log("Game Info:", game.value);
});

function StartGame() {
  // 게임 시작 로직 구현
  console.log("게임 시작!");

  // 현재 설정에 따른 플레이어 수 계산
  const playerCount = gameSetting.value.getCurrentPlayerCount();

  console.log("게임 설정:", gameSetting.value);
  console.log(
    `플레이어 수: ${playerCount}명 (솔로모드: ${gameSetting.value.settings.soloEnabled ? "ON" : "OFF"})`,
  );

  // 예: 게임 방으로 이동
  // router.push({ name: 'game-room', params: { gameId: game.value.id } });
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
  gap: 1rem;

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

  transition: background-color 0.3s ease;

  margin-top: auto; /* 버튼을 맨 아래로 밀어줌 */
}

.start-btn:hover {
  background-color: #2c7930;
}

.goBack-btn {
  margin-top: auto;
}
</style>
