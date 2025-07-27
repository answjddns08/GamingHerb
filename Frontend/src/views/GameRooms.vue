<template>
  <main>
    <header class="flex justify-between items-center p-4">
      <div class="flex items-center">
        <SettingIcon />
        <userBoard />
      </div>
      <div class="flex flex-col items-center gap-4">
        <span class="text-4xl font-bold">Game Rooms</span>
        <div>
          <input
            type="text"
            placeholder="search game rooms"
            class="border border-gray-300 rounded px-3 py-2 mr-2"
          />
          <button
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            type="submit"
            @click.prevent
          >
            search
          </button>
        </div>
      </div>
      <div>
        <RouterLink :to="{ name: 'make-room', params: { gameId: props.gameId } }">
          <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
            Make New Room
          </button>
        </RouterLink>
      </div>
    </header>
    <div class="grid grid-cols-4 gap-5 p-4">
      <div
        v-for="roomName in Object.keys(rooms)"
        :key="roomName"
        class="bg-gray-300 p-4 rounded-lg shadow-md"
      >
        <img
          src="https://i.namu.wiki/i/Z4ZyjNsQ1Fvlz8QQHhfcrrTo4xgEyAf_D4S7J1p3LGT7wh-zIo_74MpSFAM0PUwyPOy5qpnQZGXM-bbqCKtJTA.webp"
          alt="Placeholder Image"
          class="w-full object-cover rounded-lg mb-2"
        />
        <h2 class="text-lg font-semibold mb-1">{{ roomName }}</h2>
        <div>
          <p class="text-gray-500 text-sm">Players: {{ rooms[roomName].playerCount }}</p>
          <p class="text-gray-500 text-sm">Status: Waiting for players</p>
          <p class="text-gray-500 text-sm">Created by: User {{ roomName }}</p>
          <p class="text-gray-500 text-sm">TimeStamp: {{ new Date().toLocaleString() }}</p>
        </div>
        <RouterLink
          :to="{ name: 'waiting-room', params: { gameId: props.gameId, roomId: roomName } }"
        >
          <button
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition mt-2"
          >
            Join Game
          </button>
        </RouterLink>
      </div>
      <div
        v-show="Object.keys(rooms).length === 0"
        class="col-span-4 text-center text-2xl font-bold text-gray-500"
      >
        흠.... 방이 없네요. 새로운 방을 만들어보세요!
      </div>
    </div>
  </main>
  <div class="goBack-card">
    <RouterLink :to="{ name: 'home' }">
      <button class="bg-red-300 text-black px-4 py-2 rounded hover:bg-red-400 transition">
        Go Back
      </button>
    </RouterLink>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import SettingIcon from "../components/settingIcon.vue";
import userBoard from "../components/userBoard.vue";
import { useUserStore } from "@/stores/user";

const rooms = ref([]);

const userStore = useUserStore();

const props = defineProps({
  gameId: {
    type: String,
    default: "GomokuGame",
    required: true,
  },
});

onMounted(async () => {
  console.log("Game ID:", props.gameId);

  const fetchRooms = await fetch(`${userStore.apiPrefix}/api/rooms/list/${props.gameId}`);
  rooms.value = (await fetchRooms.json()).rooms;

  console.log("Rooms fetched:", rooms.value);
});
</script>

<style scoped>
.goBack-card {
  position: fixed;

  bottom: 20px;
  left: 20px;
  padding: 10px;
}
</style>
