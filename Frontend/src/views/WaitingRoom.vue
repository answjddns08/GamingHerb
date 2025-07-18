<template>
  <div>
    <h1>Waiting Room</h1>
    <p>Please wait while we set up the game...</p>
    <p>Room ID: {{ roomId }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const roomId = ref(route.params.roomId || "default-room");
</script>

<style scoped></style>
