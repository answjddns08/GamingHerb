import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  HemisphereLight,
  DirectionalLight,
  Vector3,
  HemisphereLightHelper,
  PCFShadowMap,
  DirectionalLightHelper,
  CameraHelper,
  BoxGeometry,
  MeshBasicMaterial,
  BackSide,
  Mesh,
  TextureLoader,
  NearestFilter,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { LIGHTING_CONFIG, SPRITE_PATHS } from "../constants/gameConfig.js";

/**
 * 스카이박스 로드
 */
function loadSkybox(scene) {
  const skyGeometry = new BoxGeometry(288, 324, 288);

  const loader = new TextureLoader();

  const textures = [
    loader.load(SPRITE_PATHS.leftHalf),
    loader.load(SPRITE_PATHS.leftHalf),
    loader.load(SPRITE_PATHS.upAndDown),
    loader.load(SPRITE_PATHS.upAndDown),
    loader.load(SPRITE_PATHS.rightHalf),
    loader.load(SPRITE_PATHS.rightHalf),
  ];

  textures.map((texture) => {
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
  });

  const materials = textures.map((texture) => {
    const material = new MeshBasicMaterial({ map: texture, side: BackSide });

    material.color.addScalar(0.1); // 약간 밝게

    return material;
  });

  const skybox = new Mesh(skyGeometry, materials);
  scene.add(skybox);
}

/**
 * 씬 초기화
 */
export function initScene() {
  const scene = new Scene();
  loadSkybox(scene);
  return scene;
}

/**
 * 카메라 초기화
 */
export function initCamera(initialCameraPos) {
  const sizes = { width: window.innerWidth, height: window.innerHeight };
  const camera = new PerspectiveCamera(80, sizes.width / sizes.height);
  camera.position.set(initialCameraPos.x, initialCameraPos.y, initialCameraPos.z);
  camera.lookAt(0, 0, 0);
  return camera;
}

/**
 * 렌더러 초기화
 */
export function initRenderer(canvas) {
  const sizes = { width: window.innerWidth, height: window.innerHeight };
  const renderer = new WebGLRenderer({ canvas });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // 그림자 활성화
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  return renderer;
}

/**
 * 라이팅 설정
 */
export function setupLighting(scene) {
  const config = LIGHTING_CONFIG;

  // 환경광
  /* const ambientLight = new AmbientLight(
		config.ambientLight.color,
		config.ambientLight.intensity,
	);
	scene.add(ambientLight); */

  // 반구 조명
  const hemisphereLight = new HemisphereLight(
    config.hemisphereLight.skyColor,
    config.hemisphereLight.groundColor,
    config.hemisphereLight.intensity,
  );
  scene.add(hemisphereLight);

  // 방향성 조명
  const light = new DirectionalLight(
    config.directionalLight.color,
    config.directionalLight.intensity,
  );
  light.position.copy(config.directionalLight.position);

  light.castShadow = true;

  // 조명 카메라 범위 설정 (빛 렌더링할 영역)
  light.shadow.camera.left = -20;
  light.shadow.camera.right = 20;
  light.shadow.camera.top = 20;
  light.shadow.camera.bottom = -20;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 40;

  // 그림자 품질(해상도) 설정
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.bias = -0.002; // 그림자 acne 방지

  scene.add(light);

  /* const lightHelper = new DirectionalLightHelper(light, 5);
	scene.add(lightHelper);

	const lightCameraHelper = new CameraHelper(light.shadow.camera);
	scene.add(lightCameraHelper); */
}

/**
 * Post-processing Composer 초기화
 */
export function initComposer(renderer, scene, camera) {
  const sizes = { width: window.innerWidth, height: window.innerHeight };
  const composer = new EffectComposer(renderer);
  const { RenderPass } = require("three/examples/jsm/postprocessing/RenderPass.js");
  composer.addPass(new RenderPass(scene, camera));
  return composer;
}

/**
 * 윈도우 리사이즈 핸들러 생성
 */
export function createResizeHandler(camera, renderer, composer) {
  return function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    composer.setSize(w, h);
  };
}
