import { ref } from "vue";
import { Vector3, Camera } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ORBIT_CONTROLS_CONFIG, ANIMATION_TIMINGS } from "../constants/gameConfig.js";

export function useOrbitControls() {
  /**
   * @type {import("vue").Ref<OrbitControls | null>} controlsRef
   */
  const controlsRef = ref(null);

  /**
   * @type {import("vue").Ref<Camera | null>} cameraRef
   */
  const cameraRef = ref(null);

  // 포커싱 관련 상태
  const desiredTarget = new Vector3(0, 0, 0);
  const desiredCameraPos = new Vector3(-2.5, 3, 3.5);
  const initialTarget = new Vector3(0, 0, 0);
  const initialCameraPos = new Vector3(-5.16, 4, 4.45);
  const savedTarget = new Vector3(0, 0, 0);
  const savedCameraPos = new Vector3(-5.16, 4, 4.45);
  const isFocusing = ref(false);

  /**
   * OrbitControls 초기화
   */
  function initOrbitControls(camera, renderer) {
    const controls = new OrbitControls(camera, renderer.domElement);

    // 설정 적용
    const config = ORBIT_CONTROLS_CONFIG;

    controls.enablePan = config.enablePan;
    controls.enableDamping = config.enableDamping;
    controls.enableZoom = config.enableZoom;
    controls.enableRotate = config.enableRotate;

    // 댐핑 계수(얼마나 빨리 회전이나 이동 등이 감쇠되는지)
    controls.dampingFactor = config.dampingFactor;

    controls.rotateSpeed = config.rotateSpeed;

    controls.zoomSpeed = config.zoomSpeed;

    controls.minDistance = config.minDistance;
    controls.maxDistance = config.maxDistance;

    controls.minPolarAngle = config.minPolarAngle;
    controls.maxPolarAngle = config.maxPolarAngle;

    controlsRef.value = controls;
    cameraRef.value = camera;

    // 초기값 저장
    desiredTarget.copy(controls.target);
    desiredCameraPos.copy(camera.position);
    initialTarget.copy(controls.target);
    initialCameraPos.copy(camera.position);

    return controls;
  }

  /**
   * 카메라 포커싱 시작
   * @param {import("three").Vector3} spriteWorldPos - 포커싱할 스프라이트의 월드 좌표
   * @param {import("three").Vector3} cameraOffsetFromTarget - 타겟으로부터 카메라 오프셋 벡터
   */
  function focusOnTarget(spriteWorldPos, cameraOffsetFromTarget, SavePrevious = true) {
    if (!controlsRef.value || !cameraRef.value) return;

    // 포커싱 직전 상태 저장

    if (SavePrevious) {
      savedTarget.copy(controlsRef.value.target);
      savedCameraPos.copy(cameraRef.value.position);
    }

    // 목표 위치 설정
    desiredTarget.copy(spriteWorldPos);
    desiredCameraPos.copy(spriteWorldPos.clone().add(cameraOffsetFromTarget));

    isFocusing.value = true;

    // 회전 비활성화
    controlsRef.value.enableRotate = false;
    controlsRef.value.enableDamping = false;
  }

  /**
   * 포커싱 해제
   */
  function unfocus() {
    if (!controlsRef.value) return;

    desiredTarget.copy(savedTarget);
    desiredCameraPos.copy(savedCameraPos);
    isFocusing.value = true;
  }

  /**
   * 포커싱 애니메이션 업데이트 (animate loop에서 호출)
   */
  function updateFocusing() {
    if (!isFocusing.value || !controlsRef.value || !cameraRef.value) return;

    const targetDist = controlsRef.value.target.distanceTo(desiredTarget);
    const camDist = cameraRef.value.position.distanceTo(desiredCameraPos);
    const threshold = ANIMATION_TIMINGS.focusingDistanceThreshold;

    if (targetDist < threshold && camDist < threshold) {
      // 포커싱 완료
      isFocusing.value = false;
      /* controlsRef.value.target.copy(desiredTarget);
			cameraRef.value.position.copy(desiredCameraPos); */
      controlsRef.value.enableDamping = ORBIT_CONTROLS_CONFIG.enableDamping;
      controlsRef.value.enableRotate = ORBIT_CONTROLS_CONFIG.enableRotate;
    } else {
      // 계속 이동
      const lerpFactor = ANIMATION_TIMINGS.focusingLerpFactor;
      controlsRef.value.target.lerp(desiredTarget, lerpFactor);
      cameraRef.value.position.lerp(desiredCameraPos, lerpFactor);
    }
  }

  /**
   * 초기 위치로 리셋
   */
  function resetCamera() {
    if (!controlsRef.value || !cameraRef.value) return;

    desiredTarget.copy(initialTarget);
    desiredCameraPos.copy(initialCameraPos);
    isFocusing.value = true;
  }

  return {
    controlsRef,
    cameraRef,
    isFocusing,
    desiredTarget,
    desiredCameraPos,
    initialTarget,
    initialCameraPos,
    savedTarget,
    savedCameraPos,
    initOrbitControls,
    focusOnTarget,
    unfocus,
    updateFocusing,
    resetCamera,
  };
}
