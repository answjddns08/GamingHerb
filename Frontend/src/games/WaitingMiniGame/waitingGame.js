import Phaser from "phaser";
import { useUserStore } from "@/stores/user";

// 모든 클라이언트가 공유하는 고정된 게임 월드 크기
export const WORLD_WIDTH = 1600; // 게임 월드 가로 크기 (고정값, 모든 클라이언트 동일)
export const WORLD_HEIGHT = 1200; // 게임 월드 세로 크기 (고정값, 모든 클라이언트 동일)
export const WORLD_CENTER_X = WORLD_WIDTH / 2; // 800
export const WORLD_CENTER_Y = WORLD_HEIGHT / 2; // 600

class MiniGameScene extends Phaser.Scene {
  constructor() {
    super({ key: "MiniGameScene" });
    this.userStore = useUserStore();
    this.targetPositions = new Map(); // 원격 플레이어 목표 위치 저장
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
    // 고정된 월드 센터를 사용 (모든 클라이언트가 동일해야 함)
    const centerX = WORLD_CENTER_X;
    const centerY = WORLD_CENTER_Y;

    // 물리 월드 경계 설정 (고정된 게임 월드 크기)
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // 카메라 경계 설정 (고정된 게임 월드 크기)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // 지역(땅) 정의: 이 영역 안이면 "서 있음", 밖이면 낭떠러지 컨셉
    const groundWidth = 600;
    const groundHeight = 600;
    const ground = this.add
      .rectangle(centerX, centerY, groundWidth, groundHeight, 0xff0000)
      .setName("ground");

    // 플레이어 생성 및 물리 설정
    this.playerId = this.userStore.id;

    // 땅의 화면상 바운딩을 한 번 캐싱해 두고 사용(정적이면 문제 없음)
    this.groundRect = ground.getBounds();

    // 로컬 플레이어를 추적하기 위한 참조
    this.localPlayer = null;

    // 원격 플레이어 무기들을 저장하는 맵
    this.remoteWeapons = new Map();

    // 멀티플레이 확장 대비: 그룹과 충돌(서로 밀치기) 준비
    this.players = this.physics.add.group();
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

    // 마우스 클릭으로 스윙 공격 - sendSwingAttack은 mutli.js에서 주입됨
    this.input.on("pointerdown", () => {
      // sendSwingAttack이 주입되어 있으면 사용, 아니면 로컬만
      if (this.sendSwingAttack) {
        this.sendSwingAttack();
      } else {
        this.trySwing();
      }
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

    // Scene 종료 시 키 입력 정리
    this.events.on("shutdown", () => {
      this.cleanup();
    });

    this.events.on("sleep", () => {
      this.cleanup();
    });
  }

  /**
   * 씬 종료 시 입력 리스너 및 리소스 정리
   */
  cleanup() {
    console.log("MiniGameScene cleanup starting...");

    // 키보드 입력 완전 비활성화
    if (this.input && this.input.keyboard) {
      if (this.keys) {
        Object.values(this.keys).forEach((key) => {
          if (key) {
            key.reset();
          }
        });
      }
      // 키보드 전체 비활성화
      this.input.keyboard.enabled = false;
    }

    // 마우스 입력 이벤트 제거
    if (this.input) {
      this.input.off("pointerdown");
      this.input.enabled = false;
    }

    // 모든 tweens 중지
    if (this.tweens) {
      this.tweens.killAll();
    }

    // 모든 타이머 제거
    if (this.time) {
      this.time.removeAllEvents();
    }

    // 모든 이벤트 리스너 제거
    if (this.events) {
      this.events.off("shutdown");
      this.events.off("sleep");
    }

    console.log("MiniGameScene cleanup completed - All inputs removed and disabled");
  }

  update() {
    // 쿨다운 감소
    if (this.swingCooldown > 0) {
      this.swingCooldown -= this.game.loop.delta;
    }

    // 입력 이동 및 애니메이션
    this.playerMovement();

    // 원격 플레이어 위치 보간
    this.lerpRemotePlayers();

    // 스윙 중일 때 충돌 체크만 수행 (위치는 trySwing에서 한 번만 설정)
    if (this.isSwinging) {
      this.checkWeaponHit();
    }

    // 영역 판정: 모든 플레이어(로컬 + 원격)에 대해 낙하 체크
    this.players.getChildren().forEach((player) => {
      // 이미 떨어지는 중이면 스킵
      if (player.isFalling) return;

      // 땅 안에 있으면 스킵
      if (this.isInsideGround(player)) return;

      // 땅 밖이면 떨어지는 연출
      this.handleFallOut(player);
    });

    // 모든 플레이어의 닉네임 위치 업데이트
    this.players.getChildren().forEach((player) => {
      if (player.nameText) {
        player.nameText.setPosition(player.x, player.y - 40);
      }
    });

    if (this.CurrentInvincibleTime > 0) {
      this.CurrentInvincibleTime -= this.game.loop.delta;
    }

    //console.log("player falling status:", this.isFalling, this.isInsideGround(this.player));
  }

  /**
   * 플레이어 추가
   * @param {String} id
   * @param {Number} x - 게임 월드 절대 좌표 X (기본값: 월드 중심)
   * @param {Number} y - 게임 월드 절대 좌표 Y (기본값: 월드 중심)
   * @param {Boolean} isRelativeCoord - 상대좌표 여부 (기본값: false)
   * @param {String} userName - 플레이어 닉네임 (기본값: 'Player')
   * @returns
   */
  addPlayer(
    id,
    x = WORLD_CENTER_X,
    y = WORLD_CENTER_Y,
    isRelativeCoord = false,
    userName = "Player",
  ) {
    // 상대좌표면 절대좌표로 변환
    const posX = isRelativeCoord ? WORLD_CENTER_X + x : x;
    const posY = isRelativeCoord ? WORLD_CENTER_Y + y : y;

    const newPlayer = this.physics.add.sprite(posX, posY, "dude").setName(`player_${id}`);
    newPlayer.setCollideWorldBounds(true);
    newPlayer.setDrag(200, 200);
    newPlayer.lastDirection = { x: 0, y: 1 };

    // 플레이어 닉네임 텍스트 생성
    const nameText = this.add.text(posX, posY - 40, userName, {
      fontSize: "16px",
      fill: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
      align: "center",
    });
    nameText.setOrigin(0.5, 0.5); // 텍스트 중앙 정렬
    newPlayer.nameText = nameText; // 플레이어 객체에 텍스트 참조 저장

    this.players.add(newPlayer);

    // 로컬 플레이어 참조 저장
    if (id === this.playerId) {
      this.localPlayer = newPlayer;
      // 카메라가 즉시 로컬 플레이어를 따라가도록
      this.cameras.main.startFollow(newPlayer, true);
    } else {
      // targetPositions 설정하지 않음 - 첫 MoveOtherPlayer 호출 시 설정됨
      newPlayer.hasInitialTarget = false; // 아직 목표가 없음을 표시
    }
    console.log(`Player ${id} (${userName}) added at position (${posX}, ${posY}).`);
    return newPlayer;
  }

  /**
   * 플레이어 삭제
   * @param {String} id
   */
  deletePlayer(id) {
    const targetPlayer = this.players.getChildren().find((p) => p.name === `player_${id}`);
    if (!targetPlayer) return;

    this.targetPositions.delete(id);

    // 원격 무기도 삭제
    const weapon = this.remoteWeapons.get(id);
    if (weapon) {
      weapon.destroy();
      this.remoteWeapons.delete(id);
    }

    // 닉네임 텍스트 제거
    if (targetPlayer.nameText) {
      targetPlayer.nameText.destroy();
    }

    targetPlayer.destroy();
  }

  /**
   * 다른 플레이어 이동
   * @param {String} id
   * @param {Number} x
   * @param {Number} y
   * @param {Number} dirX - 이동 방향 X
   * @param {Number} dirY - 이동 방향 Y
   * @returns
   */
  MoveOtherPlayer(id, x, y, dirX = 0, dirY = 1) {
    const targetPlayer = this.players.getChildren().find((p) => p.name === `player_${id}`);
    if (!targetPlayer) return;

    // 원격 플레이어 목표 위치 갱신 (프레임마다 lerp로 보간)
    this.targetPositions.set(id, { x, y });

    // 방향 정보 저장
    targetPlayer.lastDirection = { x: dirX, y: dirY };

    // 첫 수신 시 또는 hasInitialTarget이 false면 즉시 위치 동기화
    if (!targetPlayer.hasInitialTarget) {
      targetPlayer.setPosition(x, y);
      targetPlayer.hasInitialTarget = true;
      console.log(`Player ${id} initial position set to (${x}, ${y})`);
    }
  }

  /**
   * 원격 플레이어를 목표 위치로 lerp 보간 이동
   */
  lerpRemotePlayers() {
    const deltaSec = this.game.loop.delta / 1000;
    // k 값이 클수록 빨리 따라감. 30이면 약 33ms 에 거의 다 도달
    const k = 30;
    const lerpFactor = 1 - Math.exp(-k * deltaSec);

    const snapThreshold = 2; // px. 아주 근접하면 스냅으로 마감
    const movingThreshold = 5; // px. 이동 중으로 판단하는 거리

    this.players.getChildren().forEach((player) => {
      if (player.name === `player_${this.playerId}`) return;

      const target = this.targetPositions.get(player.name.replace("player_", ""));

      // 넉백 상태일 때는 velocity로 처리, lerp 스킵
      if (player.knockbackState) {
        player.knockbackState.duration -= this.game.loop.delta;
        if (player.knockbackState.duration <= 0) {
          // 넉백 종료, 다시 lerp 모드로 전환
          player.knockbackState = null;
          player.setVelocity(0, 0);
          // ✅ 넉백 종료 후 현재 위치를 타겟 위치로 설정 (자연스러운 전환)
          this.targetPositions.set(player.name.replace("player_", ""), {
            x: player.x,
            y: player.y,
          });
          // ✅ 넉백 종료 표시 - 다음 동기화에서 위치를 강제 동기화하도록 함
          player.knockbackEnded = true;
        }
        return; // 넉백 중에는 lerp 적용 안 함
      }

      if (!target) return;

      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 거리가 아주 가까우면 스냅
      if (distance <= snapThreshold) {
        player.setPosition(target.x, target.y);
        // 정지 애니메이션은 거리가 충분히 작을 때만
        player.anims.play("turn", true);
      } else {
        // lerp로 이동
        const nextX = Phaser.Math.Linear(player.x, target.x, lerpFactor);
        const nextY = Phaser.Math.Linear(player.y, target.y, lerpFactor);
        player.setPosition(nextX, nextY);

        // 거리가 movingThreshold보다 크면 이동 중으로 판단하여 애니메이션 적용
        if (distance > movingThreshold) {
          const dir = player.lastDirection || { x: 0, y: 1 };
          if (Math.abs(dir.x) > Math.abs(dir.y)) {
            // 좌우 이동이 더 큼
            if (dir.x < 0) {
              player.anims.play("left", true);
            } else if (dir.x > 0) {
              player.anims.play("right", true);
            }
          } else {
            // 상하 이동이 더 크거나 이동하지 않음
            // 기본적으로 좌우 방향 우선, 없으면 turn
            if (dir.x < 0) {
              player.anims.play("left", true);
            } else if (dir.x > 0) {
              player.anims.play("right", true);
            } else {
              player.anims.play("turn", true);
            }
          }
        }
        // distance가 movingThreshold 이하면 애니메이션을 유지 (깜빡임 방지)
      }

      // 물리 속도는 사용하지 않으니 정지시켜 둔다
      player.setVelocity(0, 0);
    });
  }

  playerMovement() {
    /** @type {Phaser.Physics.Arcade.Sprite} */
    const player = this.players.getChildren().find((p) => p.name === `player_${this.playerId}`);
    const KeyWASD = this.keys;

    let moving = false;
    let dirX = 0;
    let dirY = 0;

    if (!player) return;

    // 넉백 상태일 때는 입력 무시 (velocity가 덮어씌워지는 것 방지)
    if (player.knockbackState) {
      return;
    }

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
    player.isFalling = true; // 플레이어별 낙하 플래그

    // 로컬 플레이어인지 확인
    const isLocalPlayer = player.name === `player_${this.playerId}`;

    if (isLocalPlayer) {
      // 로컬 플레이어는 전역 플래그도 설정 (호환성)
      this.isFalling = true;
    }

    player.setVelocity(0, 0);
    player.disableInteractive?.();

    // 플레이어가 낙하하는 연출(크기가 작아짐과 동시에 투명해짐)
    this.tweens.add({
      targets: player,
      duration: 450,
      alpha: 0,
      scaleX: 0.6,
      scaleY: 0.6,
      onStart: () => {
        // 닉네임 텍스트도 숨김
        if (player.nameText) {
          player.nameText.setVisible(false);
        }
      },
      onComplete: () => {
        if (isLocalPlayer) {
          // 로컬 플레이어만 리스폰 처리
          console.log("Player has fallen out and will respawn in 1 second.");
          setTimeout(() => {
            // 시간 지나고 리스폰
            player.setPosition(this.respawnPoint.x, this.respawnPoint.y);
            player.setVelocity(0, 0);
            player.setAlpha(1);
            player.setScale(1, 1);
            this.isFalling = false;
            player.isFalling = false;
            console.log("Player has respawned.");
            this.GiveInvincibility(player, 1000);

            // ✅ 플래그 초기화 (넉백 상태 및 동기화 플래그 정리)
            player.knockbackState = null;
            player.knockbackEnded = true; // 다음 동기화에서 위치 강제 동기화

            // 닉네임 텍스트 다시 표시
            if (player.nameText) {
              player.nameText.setVisible(true);
            }

            // 서버에 부활 이벤트 전송 (다른 클라이언트에게 무적 효과 동기화)
            this.events.emit("local-respawn", {
              x: 0, // 상대좌표 (월드 중심)
              y: 0,
            });
          }, 1000);
        } else {
          // 원격 플레이어는 보이지 않게만 하고 대기 (부활 이벤트 수신 시 복원)
          console.log(`Remote player ${player.name} has fallen out.`);
          player.setVisible(false);
        }
      },
    });
  }

  /**
   * 스윙 공격 시도 (공개 메서드)
   */
  trySwing() {
    if (this.isSwinging || this.swingCooldown > 0) return;

    this.isSwinging = true;
    this.swingCooldown = this.SWING_COOLDOWN;

    const player = this.players.getChildren().find((p) => p.name === `player_${this.playerId}`);
    if (!player) return;

    const dir = player.lastDirection;
    const distance = 60; // 플레이어로부터의 거리

    // 스윙 애니메이션: 플레이어를 중심으로 원호 회전
    const swingAngle = Math.atan2(dir.y, dir.x);

    // 시작 각도와 끝 각도 (120도 회전)
    const startAngle = swingAngle - Math.PI / 3; // -60도
    const endAngle = swingAngle + Math.PI / 3; // +60도

    // 시작 위치 설정 (플레이어 기준 원호의 시작점)
    const startX = player.x + Math.cos(startAngle) * distance;
    const startY = player.y + Math.sin(startAngle) * distance;

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
          player.x + Math.cos(currentAngle) * distance,
          player.y + Math.sin(currentAngle) * distance,
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

    const player = this.players.getChildren().find((p) => p.name === `player_${this.playerId}`);
    if (!player) return;

    this.players.getChildren().forEach((target) => {
      if (target === player) return; // 자기 자신은 제외
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
    const player = this.players.getChildren().find((p) => p.name === `player_${this.playerId}`);
    if (!player) return;

    const dir = player.lastDirection;

    // 넉백 방향으로 강한 속도 적용
    target.setVelocity(dir.x * this.KNOCKBACK_FORCE, dir.y * this.KNOCKBACK_FORCE);

    // 넉백 상태 설정 (500ms 동안 velocity 모드)
    target.knockbackState = {
      duration: 500, // 500ms 동안 넉백 상태 유지
    };

    // 짧은 시간 동안 다시 맞지 않도록 플래그 설정
    target.hitRecently = true;
    this.time.delayedCall(300, () => {
      target.hitRecently = false;
    });

    console.log("Player hit! Knockback applied.");

    // 서버에 넉백 이벤트 전송 (다른 클라이언트들도 볼 수 있도록)
    // mutli.js에서 처리할 수 있도록 이벤트 발생
    const targetId = target.name.replace("player_", "");
    this.events.emit("local-knockback", {
      targetId: targetId,
      knockbackX: dir.x * this.KNOCKBACK_FORCE,
      knockbackY: dir.y * this.KNOCKBACK_FORCE,
    });
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

  /**
   * 원격 플레이어의 방망이 휘두르기 표시
   * @param {string} id - 플레이어 ID
   * @param {number} dirX - 방향 X
   * @param {number} dirY - 방향 Y
   */
  ShowRemotePlayerSwing(id, dirX, dirY) {
    const player = this.players.getChildren().find((p) => p.name === `player_${id}`);
    if (!player) {
      console.warn(`Player ${id} not found for swing animation`);
      return;
    }

    // 해당 플레이어의 무기 가져오기 또는 생성
    let weapon = this.remoteWeapons.get(id);
    if (!weapon) {
      weapon = this.add.rectangle(0, 0, 60, 20, 0x8b4513);
      weapon.setDepth(10);
      this.remoteWeapons.set(id, weapon);
    }

    const distance = 60;
    const swingAngle = Math.atan2(dirY, dirX);
    const startAngle = swingAngle - Math.PI / 3;
    const endAngle = swingAngle + Math.PI / 3;

    const startX = player.x + Math.cos(startAngle) * distance;
    const startY = player.y + Math.sin(startAngle) * distance;

    weapon.setPosition(startX, startY);
    weapon.setRotation(startAngle);
    weapon.setVisible(true);

    const swingData = { progress: 0 };

    this.tweens.add({
      targets: swingData,
      progress: 1,
      duration: this.SWING_DURATION, // 로컬 스윙시간과 동일
      ease: "Cubic.easeOut",
      onUpdate: () => {
        // 플레이어 위치가 업데이트될 수 있으므로 매 프레임 다시 가져오기
        const currentPlayer = this.players.getChildren().find((p) => p.name === `player_${id}`);
        if (!currentPlayer) return;

        const progress = swingData.progress;
        const currentAngle = startAngle + (endAngle - startAngle) * progress;

        weapon.setPosition(
          currentPlayer.x + Math.cos(currentAngle) * distance,
          currentPlayer.y + Math.sin(currentAngle) * distance,
        );
        weapon.setRotation(currentAngle);
      },
      onComplete: () => {
        weapon.setVisible(false);
      },
    });
  }

  /**
   * 원격 플레이어에게 넉백 적용
   * @param {string} id - 플레이어 ID
   * @param {number} knockbackX - 넉백 X 속도
   * @param {number} knockbackY - 넉백 Y 속도
   */
  ApplyRemoteKnockback(id, knockbackX, knockbackY) {
    const player = this.players.getChildren().find((p) => p.name === `player_${id}`);
    if (!player) {
      console.warn(`Player ${id} not found for knockback`);
      return;
    }

    // 넉백 속도 적용
    player.setVelocity(knockbackX, knockbackY);

    // 넉백 상태 설정 (500ms 동안 velocity 모드, lerp 비활성화)
    player.knockbackState = {
      duration: 500,
    };

    console.log(`Applied knockback to player ${id}`);
  }

  /**
   * 원격 플레이어 부활 처리 (무적 효과 표시)
   * @param {string} id - 플레이어 ID
   * @param {number} x - 부활 위치 X (절대좌표)
   * @param {number} y - 부활 위치 Y (절대좌표)
   */
  ShowRemotePlayerRespawn(id, x, y) {
    const player = this.players.getChildren().find((p) => p.name === `player_${id}`);
    if (!player) {
      console.warn(`Player ${id} not found for respawn`);
      return;
    }

    // 위치 업데이트
    player.setPosition(x, y);
    player.setAlpha(1);
    player.setScale(1, 1);
    player.setVisible(true); // 떨어져서 숨겨진 경우 다시 표시
    player.isFalling = false; // 낙하 플래그 해제

    // 닉네임 텍스트도 다시 표시
    if (player.nameText) {
      player.nameText.setVisible(true);
    }

    // 무적 효과 적용
    this.GiveInvincibility(player, 1000);

    console.log(`Player ${id} respawned with invincibility`);
  }
}

export default MiniGameScene;
