<template>
  <main>
    <header class="flex justify-between items-center p-4">
      <div class="flex items-center">
        <button class="bg-gray-200 rounded-lg p-2 mr-4 hover:bg-gray-300 transition">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-8 h-8">
            <path
              d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"
            />
          </svg>
        </button>
        <div class="flex items-center gap-3 bg-gray-300 rounded-lg p-2">
          <span class="text-gray-700 font-semibold">User 1972711</span>
          <button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              class="w-6 h-8 text-gray-500 hover:text-gray-900 transition"
            >
              <path
                class="fill-current"
                d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-96c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 64z"
              />
            </svg>
          </button>
        </div>
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
