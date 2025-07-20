/**
 * 게임 상태 관리 유틸리티
 */
export class GomokuGameState {
  constructor() {
    this.board = new Array(15).fill().map(() => new Array(15).fill(null));
    this.currentPlayer = "black";
    this.gameOver = false;
    this.winner = null;
  }

  placeStone(row, col) {
    if (this.board[row][col] || this.gameOver) {
      return false;
    }

    this.board[row][col] = this.currentPlayer;

    if (this.checkWin(row, col)) {
      this.gameOver = true;
      this.winner = this.currentPlayer;
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

        while (r >= 0 && r < 15 && c >= 0 && c < 15 && this.board[r][c] === player) {
          count++;
          r += dx * direction;
          c += dy * direction;
        }
      }

      if (count >= 5) {
        return true;
      }
    }

    return false;
  }

  reset() {
    this.board = new Array(15).fill().map(() => new Array(15).fill(null));
    this.currentPlayer = "black";
    this.gameOver = false;
    this.winner = null;
  }
}
