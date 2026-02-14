<template>
  <div class="flex gap-3 select-none mb-1">
    <button
      class="card"
      v-bind:class="[{ disabled: !isFriendly || isProgressing }, skill.type]"
      :class="[{ selected: selectedSkillName === skill.name }, skill.type]"
      v-for="skill in skills"
      :key="skill.name"
      @click="selectSkill(skill)"
    >
      <h2>{{ skill.name }}</h2>
      <img :alt="skill.name" :src="skill.image" />
      <!-- 긴 스킬 설명: 스크롤 효과 적용 -->
      <div v-if="skill.description.length > 50" class="text-container">
        <span class="scrolling-text">
          {{ skill.description }}
        </span>
      </div>
      <!-- 짧은 스킬 설명: 일반 표시 -->
      <span v-else class="short-description">
        {{ skill.description }}
      </span>
    </button>
  </div>
</template>

<script setup>
import { Skill } from "../utils/skills";
import { ref, watch } from "vue";

/**
 * 선택된 스킬 이름
 * @type {import('vue').Ref<string|null>}
 */
const selectedSkillName = ref(null);
const emit = defineEmits(["unfocus", "select-skill"]);

const props = defineProps({
  /**
   * @type {import("vue").PropType<Skill[]>}
   */
  skills: {
    type: Array,
    default: () => [],
    validator: (value) => {
      // 모든 요소가 특정 조건을 만족하는지 체크 (선택 사항)
      return value.every((item) => item.hasOwnProperty("name"));
    },
  },
  isFriendly: {
    type: Boolean,
    required: false,
    default: false,
  },
  isProgressing: {
    type: Boolean,
    required: false,
    default: false,
  },
});

// 캐릭터가 바뀌면 (skills prop 변경) 선택 초기화
watch(
  () => props.skills,
  () => {
    selectedSkillName.value = null;
  },
);

/**
 * @param {Skill} skill - 선택된 스킬 객체
 */
function selectSkill(skill) {
  if (selectedSkillName.value === skill.name) {
    selectedSkillName.value = null;
    emit("select-skill", null);
    return;
  }

  emit("unfocus");
  selectedSkillName.value = skill.name;
  emit("select-skill", skill);
}
</script>

<style scoped>
h2 {
  text-align: center;
  color: white;
  font-weight: bold;
  font-size: 1.5rem;
}

.text-container {
  width: 90%;
  height: 5rem;

  overflow: hidden;
  text-overflow: ellipsis;

  color: white;
  font-size: 0.75rem;
  text-align: center;
}

.scrolling-text {
  display: block;

  font-size: 0.85rem;

  transition: transform 2s ease; /* 부드러운 이동 효과 */
}

.short-description {
  width: 90%;
  color: white;
  font-size: 0.9rem;
  text-align: center;
  display: block;
}

.card {
  width: 175px;
  height: 225px;

  display: flex;
  flex-direction: column;

  justify-content: stretch;
  align-items: center;

  position: relative;
  overflow: hidden;

  gap: 0.5rem;

  background-color: #884e2d;
  border-radius: 0.5rem;

  box-sizing: border-box;

  transition: all 0.2s ease;

  pointer-events: auto;

  border: 2px solid #b87e63;
}

.card.attack::before {
  content: "";
  position: absolute;

  inset: 0;

  background-image: url("/skillCards/sword.png");

  background-size: 35%;

  /* background-position: 10% -100%;

	rotate: -45deg; */

  transform: rotate(-35deg) translate(32.5%, 60%);

  background-repeat: no-repeat;
  opacity: 0.2;
}

.card.heal::before {
  content: "";
  position: absolute;

  inset: 0;

  background-image: url("/skillCards/heal.png");

  background-size: 50%;

  background-position: 95% 97.5%;

  background-repeat: no-repeat;
  opacity: 0.2;
}

.card.buff::before {
  content: "";
  position: absolute;

  inset: 0;

  background-image: url("/skillCards/buff.png");

  background-size: 75%;

  background-position: 100% 97.5%;

  background-repeat: no-repeat;
  opacity: 0.2;
}

.card.selected {
  box-shadow: 0 0 0 4px #49e422;

  border: 2px solid #49e422;
}

.card.disabled {
  pointer-events: none;
  opacity: 0.75;

  background-color: #b28c8c;
}

.card img {
  width: 90%;
  min-height: 5rem;

  background-color: rgb(191, 191, 191);
  border: black 2px solid;

  z-index: 1;

  border-radius: 0.25rem;
}

.card span {
  z-index: 1;
}

.card:hover {
  background-color: #b87e63;

  margin-right: 10px;
  margin-left: 10px;

  cursor: pointer;

  transform: scale(1.2) translateY(-30px);
}

.card:hover .scrolling-text {
  animation: autoScroll 10s linear infinite;
}

@keyframes autoScroll {
  0% {
    transform: translateY(0);
  }
  95% {
    transform: translateY(-80%);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
