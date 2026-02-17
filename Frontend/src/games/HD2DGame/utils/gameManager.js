import { GameCharacter } from "./gameCharacter";

/**
 * 게임 매니저 클래스
 */
export class GameManager {
  constructor() {
    /**
     * @type {Array<GameCharacter>} - 아군 캐릭터 배열
     */
    this.friendly = [];
    /**
     * @type {Array<GameCharacter>} - 적군 캐릭터 배열
     */
    this.enemy = [];
    /**
     * @type {Array<GameCharacter>} - 턴 순서에 따른 캐릭터 배열
     */
    this.turnOrder = [];
    this.currentTurnIndex = 0;
  }

  /**
   *
   * @param {GameCharacter} character - 추가할 캐릭터 객체
   * @param {boolean} isFriendly - 아군인지 적군인지 여부 (true: 아군, false: 적군)
   */
  addCharacter(character, isFriendly) {
    if (isFriendly) this.friendly.push(character);
    else this.enemy.push(character);
  }

  removeCharacter(character) {
    const friendlyIndex = this.friendly.indexOf(character);
    if (friendlyIndex >= 0) {
      this.friendly.splice(friendlyIndex, 1);
    }

    const enemyIndex = this.enemy.indexOf(character);
    if (enemyIndex >= 0) {
      this.enemy.splice(enemyIndex, 1);
    }

    const turnIndex = this.turnOrder.indexOf(character);
    if (turnIndex >= 0) {
      this.turnOrder.splice(turnIndex, 1);
      if (turnIndex < this.currentTurnIndex) {
        this.currentTurnIndex = Math.max(0, this.currentTurnIndex - 1);
      }
      if (this.currentTurnIndex >= this.turnOrder.length) {
        this.currentTurnIndex = 0;
      }
    }
  }

  startBattle() {
    this.turnOrder = [...this.friendly, ...this.enemy];
    this.turnOrder.sort((a, b) => b.speed - a.speed);
    this.currentTurnIndex = 0;
    console.log("턴 순서:", this.turnOrder.map((c) => `${c.name}(속도:${c.speed})`).join(" → "));
  }

  getCurrentCharacter() {
    return this.turnOrder[this.currentTurnIndex];
  }

  getCurrentTurnIndex() {
    return this.currentTurnIndex;
  }

  nextTurn() {
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
  }
}
