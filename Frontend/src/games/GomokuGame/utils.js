// 게임 관련 상수들
export const GAME_CONSTANTS = {
  BOARD_SIZE: 16,
  WIN_CONDITION: 5,
};

/**
 * 게임 상태 관리 유틸리티
 */
export class GomokuGameState {
  constructor() {
    this.board = new Array(GAME_CONSTANTS.BOARD_SIZE)
      .fill()
      .map(() => new Array(GAME_CONSTANTS.BOARD_SIZE).fill(null));
    this.currentPlayer = "black";
    this.gameOver = false;
    this.winner = null;
    this.moveCount = 0;
  }

  placeStone(row, col) {
    // 경계 검사 추가
    if (
      row < 0 ||
      row >= GAME_CONSTANTS.BOARD_SIZE ||
      col < 0 ||
      col >= GAME_CONSTANTS.BOARD_SIZE
    ) {
      return false;
    }

    if (this.board[row][col] || this.gameOver) {
      return false;
    }

    this.board[row][col] = this.currentPlayer;
    this.moveCount++;

    if (this.checkWin(row, col)) {
      this.gameOver = true;
      this.winner = this.currentPlayer;
    } else if (this.moveCount >= GAME_CONSTANTS.BOARD_SIZE * GAME_CONSTANTS.BOARD_SIZE) {
      // 무승부 처리
      this.gameOver = true;
      this.winner = "draw";
    } else {
      this.currentPlayer = this.currentPlayer === "black" ? "white" : "black";
    }

    return true;
  }

  checkWin(row, col) {
    const directions = [
      [0, 1], // 가로
      [1, 0], // 세로
      [1, 1], // 대각선 \
      [1, -1], // 대각선 /
    ];

    const player = this.board[row][col];

    for (let [dx, dy] of directions) {
      let count = 1;

      // 양방향으로 확인
      for (let direction of [-1, 1]) {
        let r = row + dx * direction;
        let c = col + dy * direction;

        while (
          r >= 0 &&
          r < GAME_CONSTANTS.BOARD_SIZE &&
          c >= 0 &&
          c < GAME_CONSTANTS.BOARD_SIZE &&
          this.board[r][c] === player
        ) {
          count++;
          r += dx * direction;
          c += dy * direction;
        }
      }

      if (count >= GAME_CONSTANTS.WIN_CONDITION) {
        return true;
      }
    }

    return false;
  }

  reset() {
    this.board = new Array(GAME_CONSTANTS.BOARD_SIZE)
      .fill()
      .map(() => new Array(GAME_CONSTANTS.BOARD_SIZE).fill(null));
    this.currentPlayer = "black";
    this.gameOver = false;
    this.winner = null;
    this.moveCount = 0;
  }

  // 기권 처리
  surrender(player) {
    this.gameOver = true;
    this.winner = player === "black" ? "white" : "black";
  }

  // 특정 위치에 돌이 있는지 확인
  getStoneAt(row, col) {
    // 경계 검사 추가
    if (
      row < 0 ||
      row >= GAME_CONSTANTS.BOARD_SIZE ||
      col < 0 ||
      col >= GAME_CONSTANTS.BOARD_SIZE
    ) {
      return null;
    }
    return this.board[row][col];
  }
}
