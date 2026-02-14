import { Vector2, Vector3 } from "three";

// 스프라이트 시트 경로
export const SPRITE_PATHS = {
	// Soldier
	soldierPicture: "/characters/soldier/Soldier.webp",
	soldierIdle: "/characters/soldier/Soldier-idle.webp",
	soldierWalk: "/characters/soldier/Soldier-walk.webp",
	soldierAttack1: "/characters/soldier/Soldier-attack1.webp",
	soldierAttack2: "/characters/soldier/Soldier-attack2.webp",
	soldierDeath: "/characters/soldier/Soldier-death.webp",
	soldierHurt: "/characters/soldier/Soldier-hurt.webp",

	// Orc
	orcPicture: "/characters/orc/Orc.webp",
	orcIdle: "/characters/orc/Orc-idle.webp",
	orcWalk: "/characters/orc/Orc-walk.webp",
	orcAttack1: "/characters/orc/Orc-attack1.webp",
	orcAttack2: "/characters/orc/Orc-attack2.webp",
	orcDeath: "/characters/orc/Orc-death.webp",
	orcHurt: "/characters/orc/Orc-hurt.webp",

	// Trees
	treeSize2:
		"/Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_01/Size_02.png",
	treeSize3:
		"/Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_01/Size_03.png",
	treeSize4:
		"/Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_01/Size_04.png",
	treeSize5:
		"/Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_01/Size_05.png",

	//skybox
	upAndDown: "skybox/top.png",
	leftHalf: "skybox/lt1.png",
	rightHalf: "skybox/rt1.png",

	//VFX
	fxTest: "/VFX/fx-test.png",
	heal: "/VFX/heal.png",
};

export const VFX_CONFIGS = {
	fxTest: {
		frameCount: 8,
		fps: 10,
		width: 64,
		height: 64,
	},
	heal: {
		frameCount: 16,
		fps: 12,
		width: 300,
		height: 300,
	},
};

// 나무 설정
export const TREE_CONFIGS = {
	size2: {
		path: SPRITE_PATHS.treeSize2,
		width: 32,
		height: 64,
		offsets: [
			{ x: 0, y: 0 },
			{ x: 32, y: 0 },
			{ x: 64, y: 0 },
			{ x: 96, y: 0 },
		],
	},
	size3: {
		path: SPRITE_PATHS.treeSize3,
		width: 48,
		height: 96,
		offsets: [
			{ x: 0, y: 0 },
			{ x: 48, y: 0 },
			{ x: 96, y: 0 },
			{ x: 144, y: 0 },
		],
	},
	size4: {
		path: SPRITE_PATHS.treeSize4,
		width: 80,
		height: 128,
		offsets: [
			{ x: 0, y: 0 },
			{ x: 80, y: 0 },
			{ x: 160, y: 0 },
			{ x: 240, y: 0 },
		],
	},
	size5: {
		path: SPRITE_PATHS.treeSize5,
		width: 96,
		height: 160,
		offsets: [
			{ x: 0, y: 0 },
			{ x: 96, y: 0 },
			{ x: 192, y: 0 },
			{ x: 288, y: 0 },
		],
	},
};

// 카메라 설정
export const CAMERA_CONFIG = {
	initialCameraPos: new Vector3(-5.16, 4, 4.45),
	focusCameraOffset: new Vector3(-2.5, 2.5, 3.5),
};

// OrbitControls 설정
export const ORBIT_CONTROLS_CONFIG = {
	enablePan: false,
	enableDamping: true,
	enableZoom: true,
	enableRotate: true,
	dampingFactor: 0.1,
	rotateSpeed: 1.0,
	zoomSpeed: 1.2,
	minDistance: 5,
	maxDistance: 17.5,
	minPolarAngle: Math.PI / 4 + 0.05,
	maxPolarAngle: Math.PI / 2 - 0.05,
};

// 라이팅 설정
export const LIGHTING_CONFIG = {
	//ambientLight: { color: 0xffffff, intensity: 2 },
	hemisphereLight: {
		skyColor: 0xbbe0ef,
		groundColor: 0x8c3d20,
		intensity: 7,
	},
	directionalLight: {
		color: 0xfff8de,
		intensity: 8.5,
		position: new Vector3(-10.32, 8, 8.9),
	},
};

// Post-processing 설정
export const POST_PROCESSING_CONFIG = {
	bloom: {
		strength: 0.3, // 빛 번짐 강도
		radius: 0.3, // 번짐 반경
		threshold: 0.5, // 밝기 임계값
	},
	godRays: {
		exposure: 0.18,
		decay: 0.95,
		density: 0.5,
		weight: 0.4,
		samples: 50,
	},
	bokeh: {
		focus: 1.0, // 초점 거리
		aperture: 0.025, // 조리개(값이 작을 수록 더 흐려짐)
		maxblur: 0.02, // 최대 흐림 정도
	},
	vignette: { offset: 0.95, darkness: 1.6 },
};

// 타겟 선택 시각 효과 설정
export const TARGET_SELECTION_CONFIG = {
	emissive: {
		color: 0xffffff,
		intensity: 0.25,
		pulseSpeed: 1.0,
	},
};

// 애니메이션 설정
export const ANIMATION_CONFIGS = {
	soldier: {
		idle: { frameCount: 4, fps: 5 },
		walk: { frameCount: 6, fps: 10 },
		attack1: { frameCount: 6, fps: 10 },
		attack2: { frameCount: 6, fps: 10 },
		death: { frameCount: 6, fps: 10 },
		hurt: { frameCount: 4, fps: 10 },
	},
	orc: {
		idle: { frameCount: 4, fps: 5 },
		walk: { frameCount: 6, fps: 10 },
		attack1: { frameCount: 6, fps: 10 },
		attack2: { frameCount: 6, fps: 10 },
		death: { frameCount: 6, fps: 10 },
		hurt: { frameCount: 4, fps: 10 },
	},
};

// 캐릭터 스탯
export const CHARACTER_STATS = {
	soldiers: [
		{
			name: "병사 1",
			health: 100,
			defense: 10,
			damage: 20,
			speed: 15,
			isFriendly: true,
		},
		{
			name: "병사 2",
			health: 100,
			defense: 10,
			damage: 20,
			speed: 18,
			isFriendly: true,
		},
	],
	orcs: [
		{
			name: "오크 1",
			health: 120,
			defense: 5,
			damage: 15,
			speed: 12,
			isFriendly: false,
		},
		{
			name: "오크 2",
			health: 120,
			defense: 5,
			damage: 15,
			speed: 14,
			isFriendly: false,
		},
		{
			name: "보스 오크",
			health: 250,
			defense: 15,
			damage: 30,
			speed: 8,
			isFriendly: false,
		},
	],
};

// 스프라이트 초기 위치
export const SPRITE_POSITIONS = {
	soldiers: [
		{ position: new Vector3(-2, 0, -1), scale: new Vector3(5, 5, 5) },
		{ position: new Vector3(-2, 0, 1), scale: new Vector3(5, 5, 5) },
	],
	orcs: [
		{ position: new Vector3(2, 0, -1), scale: new Vector3(5, 5, 5) },
		{ position: new Vector3(2, 0, 1), scale: new Vector3(5, 5, 5) },
		{ position: new Vector3(3.5, 0.15, 0), scale: new Vector3(7, 7, 7) }, // Boss
	],
};

// 나무 스폰 위치
export const TREE_SPAWNS = [
	{
		size: "size2",
		variant: 1,
		position: new Vector3(-4, 1, -3),
		scale: new Vector2(1.5, 3),
	},
	{
		size: "size3",
		variant: 0,
		position: new Vector3(4, 1.5, -2),
		scale: new Vector2(2, 4),
	},
	{
		size: "size4",
		variant: 0,
		position: new Vector3(0, 1.75, -4),
		scale: new Vector2(3.125, 5),
	},
	{
		size: "size2",
		variant: 3,
		position: new Vector3(6, 1.5, 3),
		scale: new Vector2(2, 4),
	},
];

// 건강 바 설정
export const HEALTH_BAR_CONFIG = {
	maxWidth: 1,
	height: 0.15,
	offset: new Vector3(0, 1, 0),
};

// 애니메이션 시간
export const ANIMATION_TIMINGS = {
	skillUseDelay: 200,
	skillEffectDelay: 200,
	skillRecoveryDelay: 300,
	skillActionInterval: 2000,
	deathAnimationDuration: 1000,
	hurtAnimationDuration: 400,
	focusingLerpFactor: 0.2,
	focusingDistanceThreshold: 0.075,
};
