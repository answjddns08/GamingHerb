<template>
  <main class="test-phaser">
    <div ref="gameContainer"></div>
  </main>
</template>

<script setup>
import Phaser from "phaser";
import { onMounted, ref, onUnmounted } from "vue";
import GameScene from "@/games/testGame";

const gameContainer = ref(null);
let gameInstance = null;

onMounted(() => {
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#B23A3A",
    parent: gameContainer.value, // Attach to the div ref
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 325 },
        debug: false,
      },
    },
    scene: GameScene,
  };

  gameInstance = new Phaser.Game(config);

  if (gameInstance.sound.context.state !== "closed") {
    gameInstance.sound.context.suspend();
  }
});

onUnmounted(() => {
  if (gameInstance) {
    gameInstance.destroy(true); // Destroy the Phaser game instance
  }
});
</script>

<style scoped></style>
