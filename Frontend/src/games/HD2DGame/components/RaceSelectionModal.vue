<template>
  <div class="modal-backdrop">
    <div class="modal-card">
      <h2 class="modal-title">종족 선택</h2>
      <p class="modal-subtitle">사용할 집단을 고르세요.</p>
      <div class="option-grid">
        <button
          v-for="option in options"
          :key="option.key"
          class="option-button"
          @click="handleSelect(option)"
        >
          <span class="option-title">{{ option.label }}</span>
          <span class="option-desc">{{ option.description }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  options: {
    type: Array,
    default: () => [
      {
        key: "orc",
        label: "오크 무리",
        description: "거친 돌격과 강력한 타격",
      },
      {
        key: "knight",
        label: "기사단",
        description: "균형 잡힌 방어와 회복",
      },
      {
        key: "wizard",
        label: "마법사 길드",
        description: "원거리 광역 마법의 폭발력",
      },
    ],
  },
});

const emit = defineEmits(["select", "close"]);

function handleSelect(option) {
  emit("select", option.key);
}

function handleClose() {
  emit("close");
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(49, 34, 18, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  pointer-events: auto;
  backdrop-filter: blur(1px);
}

.modal-card {
  width: min(680px, 92vw);
  background: #f7e6c6;
  color: #2b1b0f;
  border: 3px solid #4a2b14;
  border-radius: 20px;
  padding: 1.75rem;
  box-shadow:
    6px 6px 0 rgba(74, 43, 20, 0.9),
    0 16px 30px rgba(0, 0, 0, 0.35);
  /* font-family: "Cooper Black", "Bookman Old Style", "Georgia", serif; */
}

.modal-title {
  margin: 0 0 0.5rem;
  font-size: 1.6rem;
  letter-spacing: 0.02em;

  font-weight: bold;
}

.modal-subtitle {
  margin: 0 0 1.25rem;
  color: rgba(43, 27, 15, 0.7);
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.option-button {
  background: #fff1d6;
  border: 2px solid #4a2b14;
  border-radius: 14px;
  padding: 1rem;
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.option-button:hover {
  transform: translate(-2px, -2px) rotate(-0.5deg);
  box-shadow: 4px 4px 0 rgba(74, 43, 20, 0.7);
}

.option-title {
  display: block;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.option-desc {
  font-size: 0.85rem;
  color: rgba(43, 27, 15, 0.65);
}

.modal-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

.ghost-button {
  background: #ffe9c6;
  border: 2px solid #4a2b14;
  color: inherit;
  padding: 0.5rem 1.25rem;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(74, 43, 20, 0.6);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.ghost-button:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 rgba(74, 43, 20, 0.7);
}
</style>
