import { Raycaster, Scene, Vector2 } from "three";

const raycaster = new Raycaster();
const mouse = new Vector2();

let sceneValue = null;
let cameraValue = null;
let callbackValue = null;

// 텍스처 캔버스 캐시
const textureCanvasCache = new Map();

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

/**
 * 텍스처 이미지를 오프스크린 캔버스에 그림 (캔버스가 화면에 보이지 않음)
 * @param {import("three").Texture} texture
 * @returns {{canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, width: number, height: number} | null}
 */
function getTextureCanvas(texture) {
  if (!texture || !texture.image) return null;
  if (textureCanvasCache.has(texture)) return textureCanvasCache.get(texture);

  const img = texture.image;
  const width = img.width;
  const height = img.height;
  if (!width || !height) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  try {
    ctx.drawImage(img, 0, 0, width, height);
  } catch (e) {
    console.warn("Failed to draw texture to canvas:", e);
    return null;
  }

  const record = { canvas, ctx, width, height };
  textureCanvasCache.set(texture, record);
  return record;
}

/**
 * 스프라이트 클릭 지점이 불투명한지 검사
 * @param {import("three").Intersection} hit - raycaster intersect 결과
 * @param {number} alphaThreshold - 알파값 임계치 (0-255)
 * @returns {boolean} 불투명하면 true, 투명하면 false
 */
function isSpriteHitOpaque(hit, alphaThreshold = 10) {
  const sprite = hit.object;

  /**
   * material(근데 MeshLamber가 아닐 수 있음, 보통은 맞음)
   * @type {import("three").MeshLambertMaterial}
   */
  const mat = sprite.material;

  const texture = mat && mat.map;
  const uv = hit.uv;
  if (!texture || !texture.image || !uv) return true;

  const info = getTextureCanvas(texture);
  if (!info) return true;

  const uAbs = uv.x * texture.repeat.x + texture.offset.x;
  const vAbs = uv.y * texture.repeat.y + texture.offset.y;

  const u = Math.min(0.999999, Math.max(0, uAbs));
  const v = Math.min(0.999999, Math.max(0, vAbs));

  const px = Math.floor(u * info.width);
  const py = Math.floor((1 - v) * info.height);

  if (px < 0 || py < 0 || px >= info.width || py >= info.height) return false;

  const data = info.ctx.getImageData(px, py, 1, 1).data;
  const alpha = data[3];
  return alpha >= alphaThreshold;
}

/**
 * @param {import("three").Scene} scene
 * @param {import("three").Camera} camera
 * @param {(object: import("three").Object3D) => void} callback
 *
 * @return {import("three").Object3D | null} 클릭된 오브젝트 반환 (없으면 null)
 */
function onMouseClick(scene, camera, callback = () => {}) {
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  // 투명하지 않은 첫 번째 오브젝트 찾기
  for (const hit of intersects) {
    // UV 좌표가 있고 텍스처가 있는 경우 투명도 검사
    if (hit.uv && hit.object.material?.map) {
      if (isSpriteHitOpaque(hit)) {
        callback(hit.object);
        return hit.object;
      }
      // 투명한 부분이면 다음 intersect로 넘어감
    } else {
      // UV나 텍스처가 없으면 일반 3D 오브젝트로 간주

      callback(hit.object);
      return hit.object;
    }
  }

  return null;
}

/**
 * 마우스 이벤트 추가
 * @param {import("three").Scene} scene
 * @param {import("three").Camera} camera
 * @param {(object: import("three").Object3D) => void} callback - 클릭된 오브젝트 콜백 함수
 */
function addMouseEvent(scene, camera, callback = () => {}) {
  sceneValue = scene;
  cameraValue = camera;
  callbackValue = callback;
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mousedown", (event) => {
    // UI 요소나 버튼 클릭은 무시 (캔버스에서만 raycasting 수행)
    if (event.target.tagName !== "CANVAS") return;
    onMouseClick(sceneValue, cameraValue, callback);
  });
}

function removeMouseEvent() {
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mousedown", () =>
    onMouseClick(sceneValue, cameraValue, callbackValue),
  );
}

export { onMouseMove, onMouseClick, addMouseEvent, removeMouseEvent };
