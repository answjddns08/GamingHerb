import Phaser from "phaser";

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" }); // key는 Phaser에서 Scene을 식별하기 위한 값
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
    this.add.image(400, 300, "sky");
    this.add.image(400, 300, "star");

    const platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, "ground").setScale(2).refreshBody();
    platforms.create(600, 400, "ground");
    platforms.create(50, 250, "ground");
    platforms.create(750, 220, "ground");

    const player = this.physics.add.sprite(100, 450, "dude").setName("player");

    let score = 0;
    const scoreText = this.add.text(16, 16, "score: 0", { fontSize: "32px", fill: "#000" });

    let gameOver = false;

    const bombs = this.physics.add.group();

    this.physics.add.collider(bombs, platforms);

    function hitBomb(player, bomb) {
      this.physics.pause();

      player.setTint(0xff0000);

      player.anims.play("turn");

      gameOver = true;
    }

    this.physics.add.collider(player, bombs, hitBomb, null, this);

    //#region Player Physics & Animations

    // player가 바닥에 닿았을 때, 약간 튕기는 느낌을 설정
    player.setBounce(0.15); // y값을 생략하면 x와 y모두 동일한 값을 적용하는 것과 같음

    // player가 게임 화면 밖으로 나가지 않게 설정
    player.setCollideWorldBounds(true);

    this.physics.add.collider(player, platforms); // player와 platforms 간의 충돌 처리

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

    //#region Stars Creation

    // 별 생성
    const stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });

    this.physics.add.collider(stars, platforms);

    // 별 이미지 요소 튕김 효과
    stars.children.iterate((child) => {
      /**
       * @type {Phaser.Physics.Arcade.Image}
       */
      const image = child;

      image.setBounceY(Phaser.Math.FloatBetween(0.2, 0.5));
      return null;
    });

    /**
     *
     * @param {*} player
     * @param {Phaser.Physics.Arcade.Image} star
     */
    function collectStar(player, star) {
      star.disableBody(true, true);

      score += 10;
      scoreText.setText("Score: " + score);

      if (stars.countActive(true) === 0) {
        stars.children.iterate(function (child) {
          child.enableBody(true, child.x, 0, true, true);
        });

        var x = player.x < 400 ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, "bomb");
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
      }
    }

    this.physics.add.overlap(player, stars, collectStar, null, this);

    //#endregion
  }

  update() {
    const cursors = this.input.keyboard?.createCursorKeys();

    /**
     * @type {Phaser.Types.Physics.Arcade.SpriteWithDynamicBody}
     */
    const player = this.children.getByName("player");
    if (!cursors || !player) return;
    if (cursors.left.isDown) {
      player.setVelocityX(-160); // 프레임마다 움직일 속도
      player.anims.play("left", true); // 애니메이션 실행 메서드(애니메이션 키, 반복여부)
    } else if (cursors.right.isDown) {
      player.setVelocityX(160);
      player.anims.play("right", true);
    } else {
      player.setVelocityX(0);
      player.anims.play("turn");
    }

    if (cursors.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }
  }
}

export default GameScene;
