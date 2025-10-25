import Phaser from "phaser";

class MiniGameScene extends Phaser.Scene {
  constructor() {
    super({ key: "MiniGameScene" }); // key는 Phaser에서 Scene을 식별하기 위한 값
  }

  // 외부 파일 혹은 assets을 미리 불러오기 위한 작업 처리
  preload() {
    this.load.image("sky", "assets/sky.png");
    this.load.image("ground", "assets/platform.png");
    this.load.image("star", "assets/star.png");
    this.load.image("bomb", "assets/bomb.png");
    this.load.spritesheet("dude", "assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  // 게임 시작시에 필요한 GameObject를 정의
  create() {
    const player = this.physics.add.sprite(100, 450, "dude").setName("player");

    //#region Player Physics & Animations

    // player가 게임 화면 밖으로 나가지 않게 설정
    player.setCollideWorldBounds(true);

    // 애니메이션 생성 - 나중에 key로 애니메이션 식별해서 참조
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10, // 초당 프레임 수를 나타냄(초당 10프레임 설정 의미)
      repeat: -1, // 무한 반복을 의미
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    //#endregion
  }

  update() {
    const keyW = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    const keyA = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    const keyS = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    const keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    /**
     * @type {Phaser.Types.Physics.Arcade.SpriteWithDynamicBody}
     */
    const player = this.children.getByName("player");

    if (!player) return;

    if (keyA.isDown) {
      player.setVelocityX(-160);
      player.anims.play("left", true);
    } else if (keyD.isDown) {
      player.setVelocityX(160);
      player.anims.play("right", true);
    } else {
      player.setVelocityX(0);
      player.anims.play("turn");
    }

    if (keyW.isDown) {
      player.setVelocityY(-160);
    } else if (keyS.isDown) {
      player.setVelocityY(160);
    } else {
      player.setVelocityY(0);
    }
  }
}

export default MiniGameScene;
