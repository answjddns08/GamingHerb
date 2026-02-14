<template>
	<button class="menu-btn" @click="toggleMenu" :class="{ enable: isPressed }">
		menu
		<div class="menu-container" @click.stop="">
			<div class="soundContainer">
				<span>Sound</span>
				<input type="range" min="0" max="100" />
			</div>
			<div class="test-actions">
				<button class="test-btn" @click="openRaceModal">종족 선택 모달</button>
				<button class="test-btn" @click="openResultModal">결과 모달</button>
			</div>
			<button class="giveUp-btn" @click="() => console.log('test')">
				기권
			</button>
		</div>
	</button>
</template>

<script setup>
import { ref } from "vue";

const emit = defineEmits(["open-race-modal", "open-result-modal"]);

const isPressed = ref(false);

function toggleMenu() {
	isPressed.value = !isPressed.value;
}

function openRaceModal() {
	emit("open-race-modal");
}

function openResultModal() {
	emit("open-result-modal");
}
</script>

<style scoped>
.menu-btn {
	position: relative;

	cursor: pointer;

	pointer-events: auto;

	display: flex;

	background-color: chocolate;

	transition: transform 0.3s ease;

	padding: 0.25rem;
}

.menu-btn::after {
	content: "";

	position: absolute;

	left: 100%;
	top: 50%;

	transform: translateY(-50%);

	background-color: transparent;

	border-style: solid;

	border-width: 1rem 0 1rem 1rem;

	border-color: transparent transparent transparent chocolate;
}

.menu-container {
	position: absolute;

	background-color: chocolate;

	display: flex;
	flex-direction: column;

	align-items: center;

	gap: 0.5rem;

	width: fit-content;

	align-self: center;

	right: 100%;

	padding: 0.5rem;

	border-radius: 0.5rem;

	width: 8rem;

	pointer-events: none;
}

.menu-btn.enable {
	transform: translateX(8.5rem); /*  menu-container의 width와 동일하게 설정 */
}

.soundContainer {
	display: flex;

	flex-direction: column;
	align-items: center;

	gap: 0.25rem;

	pointer-events: auto;
}

.soundContainer input[type="range"] {
	width: 100%;
}

.test-actions {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	width: 100%;
	pointer-events: auto;
}

.test-btn {
	background-color: #2c2218;
	border-radius: 0.25rem;
	padding: 0.25rem 0.5rem;
	color: #f6ede1;
	font-size: 0.75rem;
	border: 1px solid rgba(246, 237, 225, 0.4);
	cursor: pointer;
}

.giveUp-btn {
	margin-top: 0.5rem;

	background-color: #e61c1c;

	border-radius: 0.25rem;

	padding: 0.25rem 0.75rem;

	font-size: larger;
	font-weight: bold;

	pointer-events: auto;

	cursor: pointer;
}
</style>
