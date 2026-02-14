import {
  Sprite,
  SpriteMaterial,
  TextureLoader,
  NearestFilter,
  RepeatWrapping,
  Vector2,
  Vector3,
  Scene,
  Texture,
} from "three";

/**
 * VFX 애니메이션 클래스
 * 스프라이트 시트 기반 스프라이트 애니메이션을 처리
 */
export class VFX {
  /**
   * Creates a new VFX instance.
   * @param {String} texturePath
   * @param {Number} frameWidth
   * @param {Number} frameHeight
   * @param {Number} frameCount
   * @param {Number} fps
   * @param {Vector3} position
   * @param {Vector2} scale
   * @param {Scene} scene
   * @param {Boolean} loop
   */
  constructor(
    texturePath,
    frameWidth,
    frameHeight,
    frameCount,
    fps,
    position,
    scale,
    scene,
    loop = false,
  ) {
    this.texturePath = texturePath;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frameCount = frameCount;
    this.fps = fps;
    this.frameTime = 1000 / fps;
    this.currentFrame = 0;
    this.lastFrameTime = Date.now();
    this.isPlaying = false;
    this.isFinished = false;
    this.loop = loop;
    this.isLoaded = false;
    this.pendingPlay = false;

    this.scene = scene;
    this.position = position;
    this.scale = scale;

    this.texture = null;
    this.sprite = null;
    this.loadTexture();
  }

  /**
   * load the texture and create the sprite
   * @returns {Promise<void>}
   */
  async loadTexture() {
    const loader = new TextureLoader();
    try {
      /**
       * @type {Texture}
       */
      this.texture = await new Promise((resolve, reject) => {
        loader.load(this.texturePath, resolve, undefined, reject);
      });

      this.texture.magFilter = NearestFilter;
      this.texture.minFilter = NearestFilter;
      this.texture.wrapS = RepeatWrapping;
      this.texture.wrapT = RepeatWrapping;

      await new Promise((resolve) => {
        if (this.texture.image.complete) {
          resolve();
        } else {
          this.texture.image.onload = resolve;
        }
      });

      this.imageWidth = this.texture.image.width;
      this.imageHeight = this.texture.image.height;
      this.framesPerRow = Math.floor(this.imageWidth / this.frameWidth);

      const material = new SpriteMaterial({
        map: this.texture,
        transparent: true,
        alphaTest: 0.6,
      });
      this.sprite = new Sprite(material);
      this.sprite.position.copy(this.position);
      this.sprite.scale.set(this.scale.x, this.scale.y, 1);

      this.updateFrame(0);
      this.isLoaded = true;
      if (this.pendingPlay) {
        this.pendingPlay = false;
        this.play();
      }
    } catch (error) {
      console.error("Effect 텍스처 로딩 실패:", error);
    }
  }

  /**
   * Update the sprite to show the correct frame
   * @param {Number} frame
   * @returns {void}
   */
  updateFrame(frame) {
    if (!this.texture || !this.sprite || !this.imageWidth || !this.imageHeight) return;

    this.currentFrame = frame % this.frameCount;

    const row = Math.floor(this.currentFrame / this.framesPerRow);
    const col = this.currentFrame % this.framesPerRow;

    const offsetX = (col * this.frameWidth) / this.imageWidth;
    const offsetY = (row * this.frameHeight) / this.imageHeight;
    const repeatX = this.frameWidth / this.imageWidth;
    const repeatY = this.frameHeight / this.imageHeight;

    this.texture.offset.x = offsetX;
    this.texture.offset.y = 1 - offsetY - repeatY;
    this.texture.repeat.x = repeatX;
    this.texture.repeat.y = repeatY;
  }

  play() {
    if (!this.sprite || !this.texture || !this.isLoaded) {
      this.pendingPlay = true;
      return;
    }

    this.isPlaying = true;
    this.isFinished = false;
    this.currentFrame = 0;
    this.lastFrameTime = Date.now();
    this.scene.add(this.sprite);
    this.updateFrame(0);
  }

  update() {
    if (!this.isPlaying || this.isFinished) return;

    const now = Date.now();
    if (now - this.lastFrameTime >= this.frameTime) {
      let nextFrame = this.currentFrame + 1;

      if (nextFrame >= this.frameCount) {
        if (this.loop) {
          nextFrame = 0;
        } else {
          this.isFinished = true;
          this.stop();
          return;
        }
      }

      this.updateFrame(nextFrame);
      this.lastFrameTime = now;
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.sprite && this.sprite.parent) {
      this.scene.remove(this.sprite);
    }
  }

  setPosition(position) {
    this.position.copy(position);
    if (this.sprite) {
      this.sprite.position.copy(position);
    }
  }
}
