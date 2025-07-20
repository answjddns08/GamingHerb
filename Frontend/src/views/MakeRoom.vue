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
    <div class="settings">
      <h1>Settings</h1>
      <p>Adjust your game settings here.</p>
      <button class="start-btn">Start Game</button>
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

  display: flex;
  flex-direction: column;
  gap: 1rem;

  border: 1px solid #000000;
}

.game-description {
  max-height: 80vh;
  overflow-y: auto;
  padding-right: 8px; /* 스크롤바 공간 확보(선택) */
}

.game-description ::v-deep h1 {
  color: #2196f3;

  font-size: 2rem;
  font-weight: bold;

  margin-bottom: 1rem;
}

.game-description ::v-deep h2 {
  color: #2196f3;

  font-size: 1.5rem;
  font-weight: bold;

  margin-bottom: 1rem;
}

.game-description ::v-deep h3 {
  color: #2196f3;

  font-size: 1.25rem;
  font-weight: bold;

  margin-bottom: 1rem;
}

.game-description ::v-deep p {
  font-size: 1.1rem;
  line-height: 1.6;
}

.game-description ::v-deep ul {
  padding-left: 1.5rem;
  list-style-type: disc;
}

.game-description ::v-deep strong {
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
