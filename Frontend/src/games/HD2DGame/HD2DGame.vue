<script setup>
import GameScene from "./components/GameScene.vue";

const props = defineProps({
  gameId: { type: String, required: true },
  roomId: { type: String, required: true },
});
</script>

<template>
  <div class="hd2d-root">
    <GameScene :roomName="props.roomId" :game-id="gameId" />
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
