<template>
  <main>
    <header class="flex justify-between items-center p-4">
      <div>
        <h1 class="text-2xl font-bold mb-4">Welcome to the Game Hub</h1>
        <p class="text-gray-700 mb-4">
          Explore a variety of games and start playing with your friends!
        </p>
      </div>
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
          src="https://studiomeal.com/wp-content/uploads/2020/01/02-2.jpg"
          alt="Placeholder Image"
          class="w-full object-cover rounded-lg mb-2"
        />
        <h2 class="text-lg font-semibold mb-1">{{ game.name }}</h2>
        <p class="text-gray-700 mb-2">
          {{ game.description }}
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
