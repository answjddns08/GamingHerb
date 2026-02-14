<template>
  <div class="modal-backdrop">
    <div class="modal-card">
      <header class="modal-header">
        <div>
          <h2 class="modal-title">전투 결과</h2>
          <p class="modal-subtitle">승자: {{ result.winner }}</p>
        </div>
      </header>

      <section class="summary">
        <div class="summary-row">
          <span>승리 팀</span>
          <strong>{{ result.winner }}</strong>
        </div>
        <div class="summary-row">
          <span>패배 팀</span>
          <strong>{{ result.loser }}</strong>
        </div>
      </section>

      <section class="stat-table">
        <div class="table-head">
          <span>캐릭터</span>
          <span>팀</span>
          <span>가한 피해</span>
          <span>받은 피해</span>
        </div>
        <div v-for="character in result.characters" :key="character.name" class="table-row">
          <span>{{ character.name }}</span>
          <span>{{ character.team }}</span>
          <span>{{ character.damageDealt }}</span>
          <span>{{ character.damageTaken }}</span>
        </div>
      </section>

      <footer class="modal-actions">
        <button class="primary-button" @click="handleRestart">재시작</button>
        <button class="ghost-button" @click="handleClose">나가기</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  result: {
    type: Object,
    default: () => ({
      winner: "",
      loser: "",
      characters: [],
    }),
  },
});

const emit = defineEmits(["close", "restart"]);

function handleClose() {
  emit("close");
}

function handleRestart() {
  emit("restart");
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(49, 34, 18, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  pointer-events: auto;
  backdrop-filter: blur(1px);
}

.modal-card {
  width: min(760px, 94vw);
  background: #f7e6c6;
  color: #2b1b0f;
  border: 3px solid #4a2b14;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow:
    6px 6px 0 rgba(74, 43, 20, 0.9),
    0 16px 30px rgba(0, 0, 0, 0.35);
  /* font-family: "Cooper Black", "Bookman Old Style", "Georgia", serif; */
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.modal-title {
  margin: 0;
  font-size: 1.7rem;
  font-weight: bold;
}

.modal-subtitle {
  margin: 0.25rem 0 0;
  color: rgba(43, 27, 15, 0.7);
}

.close-button {
  background: transparent;
  border: 1px solid rgba(243, 237, 230, 0.4);
  color: inherit;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  cursor: pointer;
}

.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.summary-row {
  background: #fff2d9;
  border-radius: 12px;
  border: 2px dashed #8d5a2f;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
}

.stat-table {
  border-radius: 14px;
  border: 2px solid #4a2b14;
  overflow: hidden;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: 1.2fr 0.7fr 0.6fr 0.6fr;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
}

.table-head {
  background: #ffd89a;
  font-weight: 600;
}

.table-row {
  background: #fff6e6;
  border-top: 2px dotted rgba(74, 43, 20, 0.4);
}

.modal-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.primary-button {
  background: #ffb34a;
  border: 2px solid #4a2b14;
  color: #2a1b0d;
  padding: 0.55rem 1.4rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(74, 43, 20, 0.7);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.ghost-button {
  background: #ffe9c6;
  border: 2px solid #4a2b14;
  color: inherit;
  padding: 0.55rem 1.4rem;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(74, 43, 20, 0.6);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.primary-button:hover,
.ghost-button:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 rgba(74, 43, 20, 0.7);
}
</style>
