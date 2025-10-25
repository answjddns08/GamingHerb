<template>
  <main class="test-phaser">
    <div ref="gameContainer"></div>
  </main>
</template>

<script setup>
import Phaser, { Scale } from "phaser";
import { onMounted, ref, onUnmounted } from "vue";
import MiniGameScene from "@/games/waitingGame";

const gameContainer = ref(null);
let gameInstance = null;

onMounted(() => {
  const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#2BD9FA",
    parent: gameContainer.value, // Attach to the div ref
    physics: {
      default: "arcade",
      arcade: {
        debug: false,
      },
    },
    scene: MiniGameScene,
    scale: {
      mode: Scale.FIT,
      autoCenter: Scale.CENTER_BOTH,
    },
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
