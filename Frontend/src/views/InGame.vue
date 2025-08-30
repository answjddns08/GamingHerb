<template>
  <div class="ingame-container">
    <Suspense>
      <template #default>
        <component :is="gameComponent" :game-id="gameId" :room-id="roomId" />
      </template>
      <template #fallback>
        <div class="loading-container">
          <div class="spinner"></div>
          <p>게임을 불러오는 중...</p>
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script setup>
import { shallowRef, onMounted } from "vue";
import { loadGameComponent } from "@/games/index.js";

const props = defineProps({
  gameId: { type: String, required: true },
  roomId: { type: String, required: true },
});

const gameComponent = shallowRef(null);

onMounted(async () => {
  try {
    gameComponent.value = await loadGameComponent(props.gameId);
  } catch (error) {
    console.error("게임 컴포넌트를 불러오는 데 실패했습니다:", error);
    // TODO: 에러 처리 UI 추가 (예: 404 페이지로 리디렉션)
  }
});
</script>

<style scoped>
.ingame-container, .loading-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 1rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(0, 0, 0, 0.1);
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>