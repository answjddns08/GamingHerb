<template>
  <main>
    <header class="header-container">
      <div class="flex flex-row items-center">
        <!-- <SettingIcon /> -->
        <userBoard />
      </div>
      <span class="header-title">Gaming Herb</span>
      <div>
        <form>
          <input type="text" placeholder="Enter code" class="code-input" />
          <button class="code-button" type="submit" @click.prevent>Join with a code</button>
        </form>
      </div>
    </header>
    <div class="games-grid">
      <RouterLink
        v-for="game in games"
        :key="game.id"
        :to="{ name: 'game-rooms', params: { gameId: game.id } }"
        class="game-card"
      >
        <div class="game-card-inner">
          <img :src="game.thumbnail" :alt="game.name" class="game-thumbnail" />
          <h2 class="game-name">{{ game.name }}</h2>
        </div>
      </RouterLink>
    </div>
  </main>
</template>

<script setup>
/**
 * @file HomeView.vue
 * @description 메인 페이지 컴포넌트입니다.
 *              플레이 가능한 전체 게임 목록을 보여줍니다.
 */
import { RouterLink } from "vue-router";
import { onMounted, ref } from "vue";
import { getAvailableGames } from "@/games/index.js";
import userBoard from "../components/userBoard.vue";

/** @type {import('vue').Ref<Array<Object>>} 이용 가능한 게임 목록 */
const games = ref([]);

onMounted(() => {
  try {
    games.value = getAvailableGames();
    console.log(`Total games available: ${games.value.length}`);
    console.log("Games:", games.value);
  } catch (error) {
    console.error("게임 목록 로드 실패:", error);
  }
});
</script>

<style scoped>
main {
  background: linear-gradient(135deg, #f5e6d3 0%, #e8dcc8 100%);
  min-height: 100vh;
  padding-bottom: 40px;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background-color: rgba(255, 248, 240, 0.95);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-bottom: 2px solid #d4c9b8;
}

.header-title {
  font-size: 48px;
  font-weight: 700;
  color: #5a4a3a;
  letter-spacing: -1px;
}

.code-input {
  border: 2px solid #d4c9b8;
  border-radius: 12px;
  padding: 10px 14px;
  margin-right: 12px;
  font-size: 14px;
  transition: all 0.2s ease;
  background-color: #fffbf3;
  color: #5a4a3a;
}

.code-input:focus {
  outline: none;
  border-color: #b8956f;
  box-shadow: 0 0 0 3px rgba(184, 149, 111, 0.1);
}

.code-input::placeholder {
  color: #a89968;
}

.code-button {
  background: linear-gradient(135deg, #c9a86a 0%, #b8956f 100%);
  color: white;
  padding: 10px 20px;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.code-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.code-button:active {
  transform: translateY(0);
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 28px;
  padding: 40px 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.game-card {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: block;
}

.game-card-inner {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.game-card:hover .game-card-inner {
  transform: translateY(-10px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.game-thumbnail {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.game-card:hover .game-thumbnail {
  transform: scale(1.05);
}

.game-name {
  padding: 18px 16px;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  color: #5a4a3a;
  margin: 0;
  background-color: #fffbf3;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.4;
}

.game-card:hover .game-name {
  background-color: #f5e6d3;
  color: #3d2f23;
}
</style>
