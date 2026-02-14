<template>
  <div class="battle-sequence">
    <div
      class="scroll-wrapper"
      :class="[
        {
          'show-left-shadow': showLeftShadow,
          'show-right-shadow': showRightShadow,
        },
        { show: battleActions.length > 0 },
      ]"
    >
      <div
        ref="scrollContainerRef"
        class="scroll-container"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseLeave"
        @wheel="handleWheel"
        @scroll="handleScroll"
      >
        <button
          class="items"
          v-for="(action, index) in battleActions"
          :key="index"
          :class="{
            friendly: action.character.isFriendly,
            enemy: !action.character.isFriendly,
          }"
          @mousedown="updatePopUp(action, index, $event)"
        >
          <img
            v-if="action.character?.imgSrc"
            :src="action.character.imgSrc"
            :alt="action.character.name"
            class="character-image"
            draggable="false"
          />
          <div v-else class="placeholder">?</div>
        </button>
      </div>
    </div>
    <Teleport to="body">
      <div
        v-if="visiblePopUp !== null"
        class="popup-items"
        :class="{ 'popup-no-center': visiblePopUp === 0 }"
        :style="{
          top: popupPosition.top + 'px',
          left: popupPosition.left + 'px',
        }"
      >
        <div class="popup-row">
          <div class="popup-col">
            <div class="popup-icon">
              <img
                v-if="activeAction?.character?.imgSrc"
                :src="activeAction.character.imgSrc"
                :alt="activeAction.character.name"
                class="popup-avatar"
                draggable="false"
              />
              <div v-else class="popup-placeholder">?</div>
            </div>
            <div class="popup-name">{{ activeAction?.character?.name }}</div>
          </div>
          <div class="popup-arrow">→</div>
          <div class="popup-col">
            <div class="popup-icon">
              <img
                v-if="activeAction?.skill?.image"
                :src="activeAction.skill.image"
                :alt="activeAction.skill.name"
                class="popup-avatar"
                draggable="false"
              />
              <div v-else class="popup-placeholder">?</div>
            </div>
            <div class="popup-name">{{ activeAction?.skill?.name }}</div>
          </div>
          <div class="popup-arrow">→</div>
          <div class="popup-col">
            <div class="popup-icon">
              <img
                v-if="activeAction?.target?.imgSrc"
                :src="activeAction.target.imgSrc"
                :alt="activeAction.target.name"
                class="popup-avatar"
                draggable="false"
              />
              <div v-else class="popup-placeholder">?</div>
            </div>
            <div class="popup-name">{{ activeAction?.target?.name }}</div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { GameCharacter } from "../utils/gameCharacter";
import { Skill } from "../utils/skills";

const props = defineProps({
  /**
   * @type {import("vue").PropType<Array<{character: GameCharacter, skill: Skill, target: GameCharacter}>>}
   */
  battleActions: {
    type: Array,
    default: () => [],
  },
  /**
   * @type {import("vue").PropType<boolean>}
   */
  isExecutingTurn: {
    type: Boolean,
    default: false,
  },
});

/**
 * 현재 표시 중인 툴팁 (이름으로 식별)
 * @type {import("vue").Ref<string>}
 */
const visiblePopUp = ref(null);
/**
 * 현재 활성화된 액션
 * @type {import("vue").Ref<{character: GameCharacter, skill: Skill, target: GameCharacter} | null>}
 */
const activeAction = ref(null);
const popupPosition = ref({ top: 0, left: 0 });

/**
 * @param {{character: GameCharacter, skill: Skill, target: GameCharacter}} action
 * @param {number} index
 * @param {MouseEvent} event
 */
function updatePopUp(action, index, event) {
  if (visiblePopUp.value === index) {
    visiblePopUp.value = null;
    activeAction.value = null;
    return;
  }

  const rect = event.currentTarget.getBoundingClientRect();
  popupPosition.value = {
    top: rect.top + rect.height / 2,
    left: rect.left + rect.width / 2,
  };
  activeAction.value = action;
  visiblePopUp.value = index;
}

/**
 * 드래그 스크롤 관련 상태 및 핸들러
 * @type {import("vue").Ref<HTMLElement | null>}
 */
const scrollContainerRef = ref(null);
const isDragging = ref(false);
const startX = ref(0);
const scrollLeft = ref(0);

// 그림자 표시 여부
const showLeftShadow = ref(false);
const showRightShadow = ref(false);

const handleMouseDown = (e) => {
  isDragging.value = true;
  startX.value = e.pageX - scrollContainerRef.value.offsetLeft;
  scrollLeft.value = scrollContainerRef.value.scrollLeft;
};

const handleMouseMove = (e) => {
  if (!isDragging.value) return;
  e.preventDefault();
  const x = e.pageX - scrollContainerRef.value.offsetLeft;
  const walk = (x - startX.value) * 1; // 스크롤 속도 조절
  scrollContainerRef.value.scrollLeft = scrollLeft.value - walk;
};

const handleMouseUp = () => {
  isDragging.value = false;
};

const handleMouseLeave = () => {
  isDragging.value = false;
  visiblePopUp.value = null;
  activeAction.value = null;
};

/**
 * 마우스 휠을 가로 스크롤로 변환
 * @param {WheelEvent} e
 */
const handleWheel = (e) => {
  e.preventDefault();
  scrollContainerRef.value.scrollLeft += e.deltaY;
};

/**
 * 스크롤 위치에 따라 그림자 표시 여부 업데이트
 */
const updateShadows = () => {
  if (!scrollContainerRef.value) return;

  const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.value;
  const isScrollable = scrollWidth > clientWidth;

  // 스크롤 가능하고 왼쪽으로 스크롤된 경우 왼쪽 그림자 표시
  showLeftShadow.value = isScrollable && scrollLeft > 5;

  // 스크롤 가능하고 오른쪽 끝이 아닌 경우 오른쪽 그림자 표시
  showRightShadow.value = isScrollable && scrollLeft < scrollWidth - clientWidth - 5;
};

/**
 * 스크롤 이벤트 핸들러
 */
const handleScroll = () => {
  visiblePopUp.value = null;
  activeAction.value = null;
  updateShadows();
};

// battleActions가 변경될 때마다 그림자 업데이트
watch(
  () => props.battleActions,
  async () => {
    await nextTick();
    updateShadows();
  },
  { deep: true },
);

// 컴포넌트 마운트 시 초기화
onMounted(() => {
  updateShadows();

  // 리사이즈 이벤트에도 대응
  window.addEventListener("resize", updateShadows);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateShadows);
});
</script>

<style scoped>
.battle-sequence {
  display: flex;

  gap: 0.35rem;

  padding: 0.5rem 0.75rem;
}

.scroll-wrapper {
  position: relative;
  max-width: min(420px, 70vw);
  padding: 0.2rem 0.35rem;
  background-color: rgba(56, 35, 20, 0.8);
  border-radius: 999px;
  border: 2px solid rgba(255, 233, 198, 0.4);
  opacity: 0;
  transform: translateY(-6px);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.scroll-wrapper.show {
  opacity: 1;
  transform: translateY(0);
}

.scroll-wrapper.show-left-shadow::before,
.scroll-wrapper.show-right-shadow::after {
  content: "";
  position: absolute;
  top: 0.2rem;
  bottom: 0.2rem;
  width: 30px;
  pointer-events: none;
  z-index: 2;
}

.scroll-wrapper.show-left-shadow::before {
  left: 0;
  border-radius: 999px 0 0 999px;
  background: linear-gradient(90deg, rgba(40, 24, 15, 0.9), transparent);
}

.scroll-wrapper.show-right-shadow::after {
  right: 0;
  border-radius: 0 999px 999px 0;
  background: linear-gradient(270deg, rgba(40, 24, 15, 0.9), transparent);
}

.scroll-container {
  display: flex;
  gap: 0.35rem;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  padding: 0.2rem 0.35rem;
  cursor: grab;
}

.scroll-container::-webkit-scrollbar {
  display: none;
}

.items {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  padding: 0;
}

.items.friendly {
  border-color: rgba(12, 217, 253, 0.7);
  background: rgba(12, 217, 253, 0.12);
}

.items.enemy {
  border-color: rgba(255, 39, 39, 0.7);
  background: rgba(255, 39, 39, 0.12);
}

.character-image,
.popup-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.placeholder,
.popup-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.popup-items {
  position: fixed;
  transform: translate(-50%, -50%);
  background: rgba(37, 24, 15, 0.9);
  border: 2px solid rgba(255, 233, 198, 0.5);
  border-radius: 12px;
  padding: 0.5rem 0.75rem;
  z-index: 40;
  pointer-events: none;
  color: #fff;
}

.popup-no-center {
  transform: translate(-10%, -50%);
}

.popup-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.popup-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.popup-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid rgba(255, 233, 198, 0.6);
  overflow: hidden;
}

.popup-name {
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
}

.popup-arrow {
  font-size: 1.1rem;
  color: rgba(255, 233, 198, 0.9);
}
</style>
