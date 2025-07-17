<template>
  <main>
    <header>
      <h1 class="text-2xl font-bold mb-4">Welcome to the Game Hub</h1>
      <p class="text-gray-700 mb-4">
        Explore a variety of games and start playing with your friends!
      </p>
    </header>
    <div class="grid grid-cols-4 gap-5 p-4">
      <div v-for="i in 25" :key="i" class="bg-gray-300 p-4 rounded-lg shadow-md">
        <img
          src="https://studiomeal.com/wp-content/uploads/2020/01/02-2.jpg"
          alt="Placeholder Image"
          class="w-full object-cover rounded-lg mb-2"
        />
        <h2 class="text-lg font-semibold mb-1">Game {{ i }}</h2>
        <p class="text-gray-700 mb-2">
          This is a description of game {{ i }}. It has some interesting details.
        </p>
        <RouterLink :to="{ name: 'game-rooms', params: { gameId: i } }">
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
</script>

<style scoped></style>
