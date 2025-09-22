/**
 * @file GomokuGame/utils.js
 * @description 오목 게임의 핵심 로직과 상태 관리를 담당하는 유틸리티입니다.
 *              게임 보드, 승리 조건, 게임 상태 등을 정의하고 관리합니다.
 */

/**
 * @constant {Object} GAME_CONSTANTS - 게임 관련 상수 객체
 * @property {number} BOARD_SIZE - 게임 보드의 크기 (15x15)
 * @property {number} WIN_CONDITION - 승리하기 위해 필요한 연속된 돌의 개수
 */
export const GAME_CONSTANTS = {
  BOARD_SIZE: 15, // 오목은 일반적으로 15x15 보드를 사용합니다.
  WIN_CONDITION: 5,
};

/**
 * @class GomokuGameState
 * @description 오목 게임의 상태를 관리하는 클래스입니다.
 */
export class GomokuGameState {
  constructor() {
    this.reset();
  }

  /**
   * 지정된 위치에 돌을 놓습니다.
   * @param {number} row - 돌을 놓을 행 인덱스
   * @param {number} col - 돌을 놓을 열 인덱스
   * @returns {boolean} 돌을 놓는 데 성공했는지 여부
   */
  placeStone(row, col) {
    if (this.gameOver || row < 0 || row >= GAME_CONSTANTS.BOARD_SIZE || col < 0 || col >= GAME_CONSTANTS.BOARD_SIZE || this.board[row][col]) {
      return false;
    }

    this.board[row][col] = this.currentPlayer;
    this.moveCount++;

    if (this.checkWin(row, col)) {
      this.gameOver = true;
      this.winner = this.currentPlayer;
    } else if (this.moveCount >= GAME_CONSTANTS.BOARD_SIZE * GAME_CONSTANTS.BOARD_SIZE) {
      this.gameOver = true;
      this.winner = "draw"; // 무승부
    } else {
      this.currentPlayer = this.currentPlayer === "black" ? "white" : "black";
    }

    return true;
  }

  /**
   * 지정된 위치에 대해 승리 조건을 만족했는지 확인합니다.
   * @param {number} row - 마지막으로 돌을 놓은 행
   * @param {number} col - 마지막으로 돌을 놓은 열
   * @returns {boolean} 승리 여부
   */
  checkWin(row, col) {
    const player = this.board[row][col];
    if (!player) return false;

    const directions = [
      [0, 1], // 가로
      [1, 0], // 세로
      [1, 1], // 대각선 (\)
      [1, -1], // 대각선 (/)
    ];

    for (const [dx, dy] of directions) {
      let count = 1;
      // 양방향으로 검사
      for (const dir of [-1, 1]) {
        for (let i = 1; i < GAME_CONSTANTS.WIN_CONDITION; i++) {
          const r = row + dx * i * dir;
          const c = col + dy * i * dir;
          if (r >= 0 && r < GAME_CONSTANTS.BOARD_SIZE && c >= 0 && c < GAME_CONSTANTS.BOARD_SIZE && this.board[r][c] === player) {
            count++;
          } else {
            break;
          }
        }
      }
      if (count >= GAME_CONSTANTS.WIN_CONDITION) return true;
    }

    return false;
  }

  /**
   * 게임 상태를 초기 상태로 리셋합니다.
   */
  reset() {
    this.board = Array(GAME_CONSTANTS.BOARD_SIZE).fill(null).map(() => Array(GAME_CONSTANTS.BOARD_SIZE).fill(null));
    this.currentPlayer = "black";
    this.gameOver = false;
    this.winner = null;
    this.moveCount = 0;
  }

  /**
   * 특정 플레이어의 기권을 처리합니다.
   * @param {string} player - 기권한 플레이어 ('black' 또는 'white')
   */
  surrender(player) {
    this.gameOver = true;
    this.winner = player === "black" ? "white" : "black";
  }
}
