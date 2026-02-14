<script setup>
import GameScene from "./components/GameScene.vue";
</script>

<template>
  <div class="hd2d-root">
    <GameScene />
  </div>
</template>

<style scoped>
.hd2d-root {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

:global(body) {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
