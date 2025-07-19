<template>
  <main>
    <header class="flex items-center px-3 justify-between">
      <div>
        <h1 class="text-2xl font-bold mb-4">This place is Game Rooms</h1>
        <p class="text-gray-700 mb-4">Explore a Game Rooms and start playing with your friends!</p>
      </div>
      <div>
        <RouterLink :to="{ name: 'make-room', params: { gameId: route.params.gameId } }">
          <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
            Make New Room
          </button>
        </RouterLink>
      </div>
    </header>
    <div class="grid grid-cols-4 gap-5 p-4">
      <div v-for="i in 10" :key="i" class="bg-gray-300 p-4 rounded-lg shadow-md">
        <img
          src="https://studiomeal.com/wp-content/uploads/2020/01/02-2.jpg"
          alt="Placeholder Image"
          class="w-full object-cover rounded-lg mb-2"
        />
        <h2 class="text-lg font-semibold mb-1">Game Title {{ i }}</h2>
        <div>
          <p class="text-gray-700 mb-2">
            This is a description of game {{ i }}. It has some interesting details.
          </p>
          <p class="text-gray-500 text-sm">Players: 4</p>
          <p class="text-gray-500 text-sm">Status: Waiting for players</p>
          <p class="text-gray-500 text-sm">Created by: User {{ i }}</p>
          <p class="text-gray-500 text-sm">TimeStamp: {{ new Date().toLocaleString() }}</p>
        </div>
        <RouterLink
          :to="{ name: 'waiting-room', params: { gameId: route.params.gameId, roomId: i } }"
        >
          <button
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition mt-2"
          >
            Join Game
          </button>
        </RouterLink>
      </div>
    </div>
  </main>
</template>

<script setup>
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { RouterLink } from "vue-router";

const route = useRoute();

onMounted(() => {
  const gameId = route.params.gameId;
  console.log("Game ID:", gameId);
  // Fetch game details using the gameId
  // For example, you can use an API call to get the game details
});
</script>

<style scoped></style>
