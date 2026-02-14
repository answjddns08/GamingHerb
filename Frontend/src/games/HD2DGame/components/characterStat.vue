<script setup>
import { GameCharacter } from "../utils/gameCharacter";

const props = defineProps({
  /**
   * The character whose stats are to be displayed.
   */
  character: {
    type: GameCharacter,
    required: true,
  },
});
</script>

<template>
  <div class="StatContainer">
    <h1 :class="{ friendly: character.isFriendly, enemy: !character.isFriendly }">
      {{ character.name }}
    </h1>
    <div class="flex">
      <picture>
        <img :src="character.imgSrc" alt="Character Portrait" class="pixel-art" draggable="false" />
      </picture>
      <div
        class="flex flex-col space-y-2 text-shadow-white font-semibold z-10"
        :class="{ 'ml-0': !character.imgSrc }"
      >
        <span>체력 : {{ character.health }}/{{ character.maxHealth }}</span>
        <span>방어력: {{ character.defense }}</span>
        <span>속도: {{ character.speed }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pixel-art {
  image-rendering: pixelated;

  position: relative;

  object-fit: cover;
  object-position: center;

  width: 7.5rem;

  transform: scale(1.25);

  z-index: 2;
}

picture {
  position: relative;

  width: fit-content;
  height: fit-content;

  margin-right: 1rem;

  z-index: 2;
}

picture::after {
  content: "";

  position: absolute;

  inset: 0;

  width: 100%;
  height: 100%;

  border: 3px solid #6c4327;

  background-color: #e5b475;

  border-radius: 0.375rem;

  /* box-shadow: 2px 2px 4px 0px #272727; */
}

.StatContainer {
  width: fit-content;

  position: relative;

  border-radius: 0.5rem;

  padding: 0.75rem 1.25rem 1.25rem 1.25rem;

  background-color: #884e2d;

  user-select: none;

  border: 2px solid #b87e63;
}

.StatContainer h1 {
  font-size: 2.25rem;

  font-weight: 1000;
}

.StatContainer h1.friendly {
  color: #0cd9fd;
}

.StatContainer h1.enemy {
  color: #ff2727;
}

/* background image test */
/* .StatContainer::after {
	content: "";

	position: absolute;

	inset: 0;

	background-image: url("/skillCards/buff.png");

	background-size: 50%;

	background-position: 100% 97.5%;

	background-repeat: no-repeat;
	opacity: 0.2;
} */
</style>
