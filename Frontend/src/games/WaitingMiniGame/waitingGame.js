import Phaser from "phaser";

class MiniGameScene extends Phaser.Scene {
  constructor() {
    super({ key: "MiniGameScene" });
  }

  preload() {
    this.load.image("sky", "/assets/sky.png");
    this.load.image("ground", "/assets/platform.png");
    this.load.spritesheet("dude", "/assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    // 화면 중앙 좌표 계산 (모든 기기에서 동일하게 작동)
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // 지역(땅) 정의: 이 영역 안이면 "서 있음", 밖이면 낭떠러지 컨셉
    const ground = this.add.rectangle(centerX, centerY, 500, 500, 0xff0000).setName("ground");

    // 땅의 화면상 바운딩을 한 번 캐싱해 두고 사용(정적이면 문제 없음)
    this.groundRect = ground.getBounds();

    // 플레이어 생성 및 참조 저장
    this.player = this.physics.add.sprite(centerX, centerY, "dude").setName("player");
    this.player.setCollideWorldBounds(true); // 월드 경계 밖으로 못 나가게(필요시 해제 가능)
    this.player.setDrag(200, 200); // 밀렸을 때 자연스러운 감속
    this.player.lastDirection = { x: 0, y: -1 }; // 초기 방향(위쪽)

    // 멀티플레이 확장 대비: 그룹과 충돌(서로 밀치기) 준비
    this.players = this.physics.add.group();
    this.players.add(this.player);
    // 플레이어끼리 직접 충돌은 제거 (방망이로만 밀어냄)
    // this.physics.add.collider(this.players, this.players);

    // 방망이(무기) 생성 - 사각형으로 단순화 (나중에 스프라이트로 교체 가능)
    // 물리 바디는 붙이지 않습니다(시각 + 수동 판정만 사용).
    this.weapon = this.add.rectangle(0, 0, 60, 20, 0x8b4513);
    this.weapon.setVisible(false); // 기본적으로는 안 보이게
    this.weapon.setDepth(10); // 항상 최상단에 보이도록 크게 설정

    // 스윙 상태
    this.isSwinging = false;
    this.swingCooldown = 0;
    this.SWING_DURATION = 200; // 스윙 지속 시간 (ms)
    this.SWING_COOLDOWN = 500; // 스윙 쿨다운 (ms)
    this.KNOCKBACK_FORCE = 400; // 튕겨내기 힘

    this.CurrentInvincibleTime = 0; // 현재 무적 시간

    // 입력 키는 1회 등록 후 보관
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // 마우스 클릭으로 스윙 공격
    this.input.on("pointerdown", () => {
      this.trySwing();
    });

    // 낙하 처리 중복 방지 플래그
    this.isFalling = false;
    this.respawnPoint = new Phaser.Math.Vector2(centerX, centerY);

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

    // Scene이 완전히 준비되었음을 알림
    console.log("MiniGameScene create() completed - Scene is ready");
    this.events.emit("scene-ready", this);
  }

  update() {
    // 쿨다운 감소
    if (this.swingCooldown > 0) {
      this.swingCooldown -= this.game.loop.delta;
    }

    // 입력 이동 및 애니메이션
    this.playerMovement();

    // 스윙 중일 때 충돌 체크만 수행 (위치는 trySwing에서 한 번만 설정)
    if (this.isSwinging) {
      this.checkWeaponHit();
    }

    // 영역 판정: 영역 밖이면 낙하 연출 후 리스폰(또는 탈락 처리로 변경 가능)
    if (!this.isFalling && !this.isInsideGround(this.player)) {
      this.handleFallOut(this.player);
    }

    if (this.CurrentInvincibleTime > 0) {
      this.CurrentInvincibleTime -= this.game.loop.delta;
    }

    //console.log("player falling status:", this.isFalling, this.isInsideGround(this.player));
  }

  /**
   * 플레이어 추가
   * @param {String} id
   * @param {Number} x
   * @param {Number} y
   * @returns
   */
  addPlayer(id, x, y) {
    const newPlayer = this.physics.add.sprite(x, y, "dude").setName(`player_${id}`);
    newPlayer.setCollideWorldBounds(true);
    newPlayer.setDrag(200, 200);
    newPlayer.lastDirection = { x: 0, y: -1 };
    this.players.add(newPlayer);
    return newPlayer;
  }

  /**
   * 플레이어 삭제
   * @param {String} id
   */
  deletePlayer(id) {
    const targetPlayer = this.players.getChildren().find((p) => p.name === `player_${id}`);
    if (targetPlayer) {
      targetPlayer.destroy();
    }
  }

  MoveOtherPlayer(id, x, y) {
    const targetPlayer = this.players.getChildren().find((p) => p.name === `player_${id}`);

    if (!targetPlayer) return;

    const distance = Phaser.Math.Distance.Between(targetPlayer.x, targetPlayer.y, x, y);

    const duration = distance * 5;

    this.tweens.add({
      targets: targetPlayer,
      x: x,
      y: y,
      duration: duration,
      ease: "Linear",
    });
  }

  playerMovement() {
    /** @type {Phaser.Physics.Arcade.Sprite} */
    const player = this.player;
    const KeyWASD = this.keys;

    let moving = false;
    let dirX = 0;
    let dirY = 0;

    if (KeyWASD.left.isDown) {
      // Move left
      player.setVelocityX(-160);
      player.anims.play("left", true);
      dirX = -1;
      moving = true;
    } else if (KeyWASD.right.isDown) {
      // Move right
      player.setVelocityX(160);
      player.anims.play("right", true);
      dirX = 1;
      moving = true;
    } else {
      // Idle
      player.setVelocityX(0);
      player.anims.play("turn");
    }

    if (KeyWASD.up.isDown) {
      player.setVelocityY(-160);
      dirY = -1;
      moving = true;
    } else if (KeyWASD.down.isDown) {
      player.setVelocityY(160);
      dirY = 1;
      moving = true;
    } else {
      player.setVelocityY(0);
    }

    // 이동 방향 저장 (스윙 방향 결정에 사용)
    if (moving) {
      const len = Math.sqrt(dirX * dirX + dirY * dirY);
      if (len > 0) {
        player.lastDirection = { x: dirX / len, y: dirY / len };
      }
    }
  }

  /**
   * 플레이어의 중심점이 땅 영역 안에 있으면 true(탑뷰 기준 단순/직관 판정)
   * @param {Phaser.GameObjects.GameObject} gameObject - 판별할 게임 오브젝트
   * @returns {boolean} - 땅 영역 안에 있으면 true, 아니면 false
   */
  isInsideGround(gameObject) {
    const p = gameObject.body ? gameObject.body.center : gameObject.getCenter();
    return Phaser.Geom.Rectangle.Contains(this.groundRect, p.x, p.y);
  }

  /**
   * 영역 밖으로 나갔을 때 연출 및 리스폰(필요시 탈락 처리로 대체)
   * @param {Phaser.Physics.Arcade.Sprite} player - 낙하 처리할 플레이어 스프라이트
   */
  handleFallOut(player) {
    this.isFalling = true;

    player.setVelocity(0, 0);
    player.disableInteractive?.();

    // 플레이어가 낙하하는 연출(크기가 작아짐과 동시에 투명해짐)
    this.tweens.add({
      targets: player,
      duration: 450,
      alpha: 0,
      scaleX: 0.6,
      scaleY: 0.6,
      onComplete: () => {
        console.log("Player has fallen out and will respawn in 1 second.");
        setTimeout(() => {
          // 시간 지나고 리스폰
          player.setPosition(this.respawnPoint.x, this.respawnPoint.y);
          player.setVelocity(0, 0);
          player.setAlpha(1);
          player.setScale(1, 1);
          this.isFalling = false;
          console.log("Player has respawned.");
          this.GiveInvincibility(player, 1000);
        }, 1000);
      },
    });
  }

  /**
   * 스윙 공격 시도
   */
  trySwing() {
    if (this.isSwinging || this.swingCooldown > 0) return;

    console.log("Swing attack!");

    this.isSwinging = true;
    this.swingCooldown = this.SWING_COOLDOWN;

    const dir = this.player.lastDirection;
    const distance = 60; // 플레이어로부터의 거리

    // 스윙 애니메이션: 플레이어를 중심으로 원호 회전
    const swingAngle = Math.atan2(dir.y, dir.x);

    // 시작 각도와 끝 각도 (120도 회전)
    const startAngle = swingAngle - Math.PI / 3; // -60도
    const endAngle = swingAngle + Math.PI / 3; // +60도

    // 시작 위치 설정 (플레이어 기준 원호의 시작점)
    const startX = this.player.x + Math.cos(startAngle) * distance;
    const startY = this.player.y + Math.sin(startAngle) * distance;

    this.weapon.setPosition(startX, startY);
    this.weapon.setRotation(startAngle);

    // 방망이 표시 (물리 바디 사용하지 않음)
    this.weapon.setVisible(true);

    // 플레이어를 중심으로 원호를 그리며 스윙
    // onUpdate를 확실히 실행하기 위해 더미 속성(swingProgress)을 트윈
    const swingData = { progress: 0 };

    this.tweens.add({
      targets: swingData,
      progress: 1, // 0에서 1로 진행
      duration: this.SWING_DURATION,
      ease: "Cubic.easeOut",
      onUpdate: () => {
        const progress = swingData.progress;
        const currentAngle = startAngle + (endAngle - startAngle) * progress;

        // 플레이어를 중심으로 원 궤도를 따라 이동
        this.weapon.setPosition(
          this.player.x + Math.cos(currentAngle) * distance,
          this.player.y + Math.sin(currentAngle) * distance,
        );
        // 방망이도 회전 (진행 방향을 향하도록)
        this.weapon.setRotation(currentAngle);
      },
      onComplete: () => {
        this.isSwinging = false;
        this.weapon.setVisible(false);
      },
    });
  }

  /**
   * 방망이가 다른 플레이어를 맞췄는지 체크하고 넉백 적용
   */
  checkWeaponHit() {
    const weaponBounds = this.weapon.getBounds();

    this.players.getChildren().forEach((target) => {
      if (target === this.player) return; // 자기 자신은 제외
      if (target.hitRecently) return; // 이미 맞은 상태면 스킵 (연속 히트 방지)
      if (target.invincible) return; // 무적 상태면 스킵

      const targetBounds = target.getBounds();

      if (Phaser.Geom.Intersects.RectangleToRectangle(weaponBounds, targetBounds)) {
        this.applyKnockback(target);
      }
    });
  }

  /**
   * 타겟에게 넉백 효과 적용
   * @param {Phaser.Physics.Arcade.Sprite} target - 넉백을 받을 대상
   */
  applyKnockback(target) {
    const dir = this.player.lastDirection;

    // 넉백 방향으로 강한 속도 적용
    target.setVelocity(dir.x * this.KNOCKBACK_FORCE, dir.y * this.KNOCKBACK_FORCE);

    // 짧은 시간 동안 다시 맞지 않도록 플래그 설정
    target.hitRecently = true;
    this.time.delayedCall(300, () => {
      target.hitRecently = false;
    });

    console.log("Player hit! Knockback applied.");
  }

  /**
   * 무적 상태 부여 (ex: 부활 시 무적 시간 제공)
   * @param {Phaser.Physics.Arcade.Sprite} target - 무적 상태를 부여할 대상
   * @param {number} duration - 무적 지속 시간 (ms)
   */
  GiveInvincibility(target, duration) {
    target.invincible = true;

    // 깜빡임 효과: 투명 <-> 불투명 반복
    const blinkTween = this.tweens.add({
      targets: target,
      alpha: 0.3, // 최소 투명도
      duration: 200, // 깜빡임 속도 (200ms)
      yoyo: true, // 왕복 (0.3 -> 1 -> 0.3)
      repeat: -1, // 무한 반복
    });

    // 무적 시간 종료 시 깜빡임 중지 및 완전 불투명으로 복원
    this.time.delayedCall(duration, () => {
      target.invincible = false;
      blinkTween.stop();
      target.setAlpha(1); // 완전 불투명으로 복원
    });
  }
}

export default MiniGameScene;
