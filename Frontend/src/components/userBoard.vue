<template>
  <div class="p-4 bg-gray-100 rounded-lg">
    <div class="flex items-center gap-3 bg-gray-200 rounded-lg p-3">
      <span class="text-gray-700 font-semibold">{{ userStore.name }}</span>
      <button
        @click="openModal"
        :disabled="userStore.isDiscordUser"
        class="p-1 rounded hover:bg-gray-300 disabled:opacity-50"
        title="닉네임 수정"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          class="w-5 h-5 text-gray-500 hover:text-gray-900"
        >
          <path
            class="fill-current"
            d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-96c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 64z"
          />
        </svg>
      </button>
    </div>

    <!-- 닉네임 수정 모달 -->
    <div v-if="showModal" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <h4 class="text-lg font-semibold mb-3">프로필 관리</h4>

        <!-- 사용자 정보 -->
        <div class="mb-4 p-3 bg-gray-50 rounded">
          <p class="text-sm text-gray-600 mb-1">ID: {{ userStore.id }}</p>
          <p class="text-sm text-gray-600">
            {{ userStore.isDiscordUser ? "Discord 사용자" : "일반 사용자" }}
          </p>
        </div>

        <!-- 닉네임 수정 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">닉네임</label>
          <input
            v-model="newNickname"
            type="text"
            placeholder="새 닉네임 입력"
            class="w-full px-3 py-2 border border-gray-300 rounded mb-3"
            @keyup.enter="updateNickname"
            autofocus
          />
        </div>

        <div class="flex justify-between items-center">
          <!-- 프로필 초기화 버튼 -->
          <button
            @click="resetProfile"
            class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            프로필 초기화
          </button>

          <!-- 취소/저장 버튼 -->
          <div class="flex gap-2">
            <button @click="closeModal" class="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">
              취소
            </button>
            <button
              @click="updateNickname"
              :disabled="!newNickname.trim()"
              class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              저장
            </button>
          </div>
        </div>

        <button
          @click="closeModal"
          class="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useUserStore } from "../stores/user";

const userStore = useUserStore();
const showModal = ref(false);
const newNickname = ref("");

const openModal = () => {
  if (!userStore.isDiscordUser) {
    newNickname.value = userStore.name;
    showModal.value = true;
    setTimeout(() => {
      // autofocus input
      const input = document.querySelector("input[autofocus]");
      if (input) input.focus();
    }, 50);
  }
};

const closeModal = () => {
  showModal.value = false;
  newNickname.value = userStore.name;
};

const updateNickname = () => {
  if (newNickname.value.trim() && !userStore.isDiscordUser) {
    userStore.updateUserName(newNickname.value.trim());
    closeModal();
  }
};

const resetProfile = () => {
  if (confirm("정말로 프로필을 초기화하시겠습니까?")) {
    userStore.resetUser();
    userStore.initializeUser();
    closeModal(); // 프로필 초기화 후 모달 닫기
  }
};

// ESC로 모달 닫기
const handleKeydown = (e) => {
  if (showModal.value && e.key === "Escape") {
    closeModal();
  }
};
onMounted(() => window.addEventListener("keydown", handleKeydown));
onUnmounted(() => window.removeEventListener("keydown", handleKeydown));
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.4);
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-width: 400px;
  position: relative;
}
</style>
