<template>
  <main>
    <header class="flex justify-between items-center p-4">
      <div class="flex items-center">
        <SettingIcon />
        <userBoard />
      </div>
      <div class="flex flex-col items-center gap-4">
        <span class="text-4xl font-bold">Game Rooms</span>
        <!-- <div>
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
        </div> -->
      </div>
      <div>
        <div class="flex flex-col items-end gap-4">
          <RouterLink :to="{ name: 'make-room', params: { gameId: props.gameId } }">
            <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
              Make New Room
            </button>
          </RouterLink>
          <button
            @click="refreshRooms"
            :disabled="isRefreshing"
            class="refresh-button text-white px-4 py-2 rounded transition relative overflow-hidden min-w-[120px]"
            :class="{
              'bg-gray-500 hover:bg-gray-600': !isRefreshing,
              'cursor-not-allowed cooldown-active': isRefreshing,
            }"
          >
            <!-- CSS 애니메이션으로 처리되는 쿨타임 오버레이 -->
            <div v-if="isRefreshing" class="cooldown-overlay"></div>

            <!-- 버튼 내용 -->
            <div class="relative flex items-center justify-center gap-2" style="z-index: 3">
              <span>{{ isRefreshing ? "새로고침 중..." : "Refresh" }}</span>
            </div>
          </button>
        </div>
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
        <h2 class="text-2xl font-semibold mb-1">{{ roomName }}</h2>
        <div>
          <p class="text-gray-500 text-sm">
            Players: {{ Object.keys(rooms[roomName].players || {}).length }} /
            {{ rooms[roomName].settings.maxPlayerCount }}
          </p>
          <p class="text-gray-500 text-sm">Status: {{ rooms[roomName].status }}</p>
          <p class="text-gray-500 text-sm">Created by: {{ rooms[roomName].host }}</p>
        </div>
        <RouterLink
          :to="{ name: 'waiting-room', params: { gameId: props.gameId, roomId: roomName } }"
        >
          <button
            v-if="
              rooms[roomName].status === 'waiting' &&
              Object.keys(rooms[roomName].players || {}).length <
                rooms[roomName].settings.maxPlayerCount
            "
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition mt-2"
          >
            참가 하기
          </button>
          <button
            v-else
            class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition mt-2"
          >
            관전 하기
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
/**
 * @file GameRooms.vue
 * @description 특정 게임의 방 목록을 보여주는 페이지 컴포넌트입니다.
 *              방 생성, 검색, 참여 기능을 제공합니다.
 */
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import SettingIcon from "../components/settingIcon.vue";
import userBoard from "../components/userBoard.vue";

/**
 * @todo 간단한 게임 설명 추가
 * @todo 방장 표시 안됨
 */

/** @type {import('vue').Ref<Object>} 게임 방 목록을 저장하는 객체 */
const rooms = ref([]);

/** @type {import('vue').Ref<boolean>} 리프레시 진행 중 여부 */
const isRefreshing = ref(false);

/** @type {number} 쿨타임 지속 시간 (밀리초) - CSS 애니메이션과 동기화 */
const COOLDOWN_DURATION = 5000;

const props = defineProps({
  /** @type {String} 현재 선택된 게임의 ID */
  gameId: {
    type: String,
    default: "GomokuGame",
    required: true,
  },
});

async function refreshRooms() {
  // 이미 리프레시 중이면 실행하지 않음
  if (isRefreshing.value) {
    return;
  }

  try {
    // 리프레시 시작 - CSS 애니메이션이 자동으로 시작됨
    isRefreshing.value = true;

    // CSS 애니메이션 완료 후 쿨타임 해제 (5초)
    setTimeout(() => {
      isRefreshing.value = false;
    }, COOLDOWN_DURATION);

    const fetchRooms = await fetch(`/api/rooms/list/${props.gameId}`);

    if (!fetchRooms.ok) {
      console.error("Error occurred", { status: fetchRooms.status });
      return;
    }

    console.log("fetch complete", fetchRooms);
    rooms.value = (await fetchRooms.json()).rooms;
    console.log("Rooms fetched:", rooms.value);
  } catch (error) {
    console.error("방 목록을 가져오는 데 실패했습니다:", error);

    // 에러 발생 시 쿨타임 즉시 해제
    isRefreshing.value = false;
  }
}

onMounted(async () => {
  console.log("Game ID:", props.gameId);

  await refreshRooms();
});
</script>

<style scoped>
.goBack-card {
  position: fixed;
  bottom: 20px;
  left: 20px;
  padding: 10px;
}

/* 리프레시 버튼 기본 스타일 */
.refresh-button {
  position: relative;
  z-index: 1; /* 낮은 z-index로 모달 아래에 위치 */
}

/* 쿨타임 활성화 상태 */
.cooldown-active {
  background-color: #9ca3af !important; /* 어두운 회색 */
}

/* CSS로만 처리되는 쿨타임 오버레이 */
.cooldown-overlay {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background-color: #6b7280; /* 원래 회색 */
  transform-origin: left;
  animation: cooldown-progress 5s ease-out forwards;
  z-index: 2; /* 버튼 내용보다는 위에, 모달보다는 아래에 */
}

/* 쿨타임 프로그레스 애니메이션 */
@keyframes cooldown-progress {
  0% {
    transform: scaleX(0);
  }
  100% {
    transform: scaleX(1);
  }
}

/* 추가 시각적 효과 - 펄스 */
.cooldown-active::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  animation: pulse-subtle 2s ease-in-out infinite;
  border-radius: inherit;
  z-index: 1; /* 낮은 z-index */
}

@keyframes pulse-subtle {
  0%,
  100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

/* 버튼 호버 효과 */
button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

button:not(:disabled):active {
  transform: translateY(0);
}

/* 쿨타임 완료 시 글로우 효과 */
.cooldown-overlay {
  animation:
    cooldown-progress 5s ease-out forwards,
    cooldown-glow 5s ease-out forwards;
}

@keyframes cooldown-glow {
  0% {
    box-shadow: inset 0 0 0 rgba(59, 130, 246, 0);
  }
  80% {
    box-shadow: inset 0 0 0 rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.5);
  }
}
</style>
