<template>
  <main>
    <h1>another Test Game</h1>
    <p>Welcome to the another Test Game! Get ready to play.</p>
  </main>
</template>

<script setup>
import { onMounted } from "vue";

onMounted(() => {
  console.log("Gomoku Game Mounted");
  // You can add logic here to initialize the game or fetch any necessary data
});
</script>

<style scoped></style>
