<template>
  <div class="user-board-container">
    <div class="user-info-card">
      <div class="user-info-content">
        <span class="user-name">{{ userStore.name }}</span>
        <button @click="openModal" class="edit-button" title="닉네임 수정">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="edit-icon">
            <path
              class="fill-current"
              d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-96c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 64z"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- 닉네임 수정 모달 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h4 class="modal-title">프로필 관리</h4>

        <!-- 사용자 정보 -->
        <div class="user-info-section">
          <p class="info-label">
            ID: <span>{{ userStore.id }}</span>
          </p>
          <p class="info-label">
            {{ userStore.isDiscordUser ? "Discord 사용자" : "일반 사용자" }}
          </p>
        </div>

        <!-- 닉네임 수정 -->
        <div class="nickname-section">
          <label class="input-label">닉네임</label>
          <input
            v-model="newNickname"
            type="text"
            placeholder="새 닉네임 입력"
            class="nickname-input"
            @keyup.enter="updateNickname"
            autofocus
          />
        </div>

        <div class="modal-actions">
          <!-- 프로필 초기화 버튼 -->
          <button v-show="!userStore.isDiscordUser" @click="resetProfile" class="btn-reset">
            프로필 초기화
          </button>

          <!-- 취소/저장 버튼 -->
          <div class="button-group">
            <button @click="closeModal" class="btn-cancel">취소</button>
            <button @click="updateNickname" :disabled="!newNickname.trim()" class="btn-save">
              저장
            </button>
          </div>
        </div>

        <button @click="closeModal" class="btn-close">
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
  newNickname.value = userStore.name;
  showModal.value = true;
  setTimeout(() => {
    // autofocus input
    const input = document.querySelector("input[autofocus]");
    if (input) input.focus();
  }, 50);
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
.user-board-container {
  padding: 8px;
}

.user-info-card {
  background: linear-gradient(135deg, #fffbf3 0%, #f5e6d3 100%);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e8dcc8;
  transition: all 0.2s ease;
}

.user-info-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-info-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-weight: 600;
  color: #5a4a3a;
  font-size: 14px;
}

.edit-button {
  padding: 6px;
  border-radius: 8px;
  border: none;
  background-color: rgba(184, 149, 111, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-button:hover {
  background-color: rgba(184, 149, 111, 0.2);
}

.edit-icon {
  width: 16px;
  height: 16px;
  color: #b8956f;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 100;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  min-width: 380px;
  position: relative;
  z-index: 110;
  animation: modal-slide-in 0.3s ease;
}

@keyframes modal-slide-in {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #5a4a3a;
  margin-bottom: 20px;
  margin-top: 0;
}

.user-info-section {
  background-color: #fffbf3;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid #e8dcc8;
}

.info-label {
  font-size: 13px;
  color: #5a4a3a;
  margin: 0 0 8px 0;
}

.info-label:last-child {
  margin-bottom: 0;
}

.info-label span {
  font-weight: 600;
  color: #3d2f23;
}

.nickname-section {
  margin-bottom: 20px;
}

.input-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #5a4a3a;
  margin-bottom: 8px;
}

.nickname-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #d4c9b8;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.2s ease;
  background-color: #fffbf3;
  color: #5a4a3a;
  box-sizing: border-box;
}

.nickname-input:focus {
  outline: none;
  border-color: #b8956f;
  box-shadow: 0 0 0 3px rgba(184, 149, 111, 0.1);
}

.nickname-input::placeholder {
  color: #a89968;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.button-group {
  display: flex;
  gap: 8px;
}

.btn-cancel,
.btn-save,
.btn-reset {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.btn-cancel {
  background-color: #e8dcc8;
  color: #5a4a3a;
}

.btn-cancel:hover {
  background-color: #dcc9b3;
}

.btn-save {
  background: linear-gradient(135deg, #c9a86a 0%, #b8956f 100%);
  color: white;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(184, 149, 111, 0.3);
}

.btn-save:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-reset {
  background-color: #f5d4d4;
  color: #c44444;
}

.btn-reset:hover {
  background-color: #edbfbf;
}

.btn-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a89968;
  transition: all 0.2s ease;
}

.btn-close:hover {
  color: #5a4a3a;
  transform: rotate(90deg);
}

.btn-close svg {
  width: 20px;
  height: 20px;
}
</style>
