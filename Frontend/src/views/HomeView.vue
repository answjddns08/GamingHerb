<template>
  <main>
    <header class="flex justify-between items-center p-4">
      <div class="flex flex-row items-center">
        <SettingIcon />
        <userBoard />
      </div>
      <span class="text-5xl font-bold">Gaming Herb</span>
      <div>
        <form>
          <input
            type="text"
            placeholder="Enter game code"
            class="border border-gray-300 rounded px-3 py-2 mr-2"
          />
          <button
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            type="submit"
            @click.prevent
          >
            Join with a code
          </button>
        </form>
      </div>
    </header>
    <div class="grid grid-cols-4 gap-5 p-4">
      <div v-for="game in games" :key="game.id" class="bg-gray-300 p-4 rounded-lg shadow-md">
        <img
          src="https://i.namu.wiki/i/Z4ZyjNsQ1Fvlz8QQHhfcrrTo4xgEyAf_D4S7J1p3LGT7wh-zIo_74MpSFAM0PUwyPOy5qpnQZGXM-bbqCKtJTA.webp"
          alt="Placeholder Image"
          class="w-full object-cover rounded-lg mb-2"
        />
        <h2 class="text-lg font-semibold mb-1">{{ game.name }}</h2>
        <p class="text-gray-700 mb-2">
          {{ game.summary }}
        </p>
        <div class="text-sm text-gray-600 mb-2">
          <span>👥 {{ game.minPlayers }}-{{ game.maxPlayers }}명</span>
          <span class="ml-2">📂 {{ game.category.join(", ") }}</span>
        </div>
        <RouterLink :to="{ name: 'game-rooms', params: { gameId: game.id } }">
          <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
            View Details
          </button>
        </RouterLink>
      </div>
    </div>
  </main>
</template>

<script setup>
import { RouterLink } from "vue-router";
import { onMounted, ref } from "vue";
import { getAvailableGames } from "../utils/gameLoader.js";
import userBoard from "../components/userBoard.vue";
import SettingIcon from "../components/settingIcon.vue";

const games = ref([]);

onMounted(() => {
  try {
    games.value = getAvailableGames();
    console.log(`Total games available: ${games.value.length}`);
    console.log("Games:", games.value);
  } catch (error) {
    console.error("게임 목록 로드 실패:", error);
  }
});
</script>

<style scoped></style>
