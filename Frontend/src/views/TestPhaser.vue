<template>
  <main class="test-phaser">
    <div ref="gameContainer"></div>
  </main>
</template>

<script setup>
import Phaser from "phaser";
import { onMounted, ref, onUnmounted } from "vue";

const gameContainer = ref(null);
let gameInstance = null;

onMounted(() => {
  const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: gameContainer.value, // Attach to the div ref
    scene: {
      preload: function () {
        // Load assets here
        this.load.image("sky", "/assets/logo.svg");
      },
      create: function () {
        // Create game objects here
        this.add.image(400, 300, "sky");

        this.add.text(10, 10, "Phaser Game in Vue 3", {
          font: "16px Arial",
          fill: "#ffffff",
        });
      },
      update: function () {
        // Game logic per frame
      },
    },
  };

  gameInstance = new Phaser.Game(config);
});

onUnmounted(() => {
  if (gameInstance) {
    gameInstance.destroy(true); // Destroy the Phaser game instance
  }
});
</script>

<style scoped></style>
