<template>
  <main class="layout">
    <div class="desc">
      <h1>Game Details</h1>
      <p>This section will display the game description and other details.</p>
    </div>
    <div class="start">
      <h2>Start Game</h2>
      <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
        Start Game
      </button>
    </div>
    <div class="settings">
      <h2>Settings</h2>
      <p>Adjust your game settings here.</p>
      <button class="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 transition">
        Change Settings
      </button>
    </div>
  </main>
  <div class="goBack-card">
    <RouterLink :to="{ name: 'game-rooms' }">
      <button class="bg-red-300 text-black px-4 py-2 rounded hover:bg-red-400 transition">
        Go Back
      </button>
    </RouterLink>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

onMounted(() => {
  /* const gameId = route.params.gameId;
  console.log("Game ID:", gameId); */

  console.log("Game Rooms View Mounted:", route.params);
  // Fetch game details using the gameId
  // For example, you can use an API call to get the game details
});
</script>

<style scoped>
.layout {
  height: 100vh;

  gap: 1rem;

  display: grid;
  grid-template-areas:
    "desc desc start"
    "desc desc settings";

  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 2fr;
}

.desc {
  grid-area: desc;

  border: 1px solid #000000;
}
.start {
  grid-area: start;

  border: 1px solid #000000;
}
.settings {
  grid-area: settings;

  border: 1px solid #000000;
}

.goBack-card {
  position: fixed;

  bottom: 20px;
  left: 20px;
  padding: 10px;
}
</style>
