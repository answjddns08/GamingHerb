
class GomokuGame {
  constructor() {
    this.reset();
  }

  // 게임 상태 초기화
  reset() {
    this.board = Array(15).fill(null).map(() => Array(15).fill(null));
    this.currentPlayer = 'black'; // 흑돌부터 시작
    this.gameOver = false;
    this.winner = null;
    this.moveCount = 0;
  }

  // 돌 놓기
  placeStone(row, col, player) {
    if (this.gameOver || !this.isValidMove(row, col) || player !== this.currentPlayer) {
      return false; // 놓을 수 없는 경우
    }

    this.board[row][col] = player;
    this.moveCount++;

    if (this.checkWin(row, col)) {
      this.gameOver = true;
      this.winner = player;
    } else if (this.moveCount === 15 * 15) {
      this.gameOver = true;
      this.winner = 'draw'; // 무승부
    } else {
      // 턴 변경
      this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
    }
    
    return true; // 성공적으로 놓음
  }

  isValidMove(row, col) {
      return row >= 0 && row < 15 && col >= 0 && col < 15 && this.board[row][col] === null;
  }

  // 승리 조건 확인
  checkWin(row, col) {
    const player = this.board[row][col];
    if (!player) return false;

    // 4가지 방향 (가로, 세로, 대각선 2개)
    const directions = [
      { x: 1, y: 0 },  // 가로
      { x: 0, y: 1 },  // 세로
      { x: 1, y: 1 },  // 대각선 (오른쪽 아래)
      { x: 1, y: -1 }  // 대각선 (오른쪽 위)
    ];

    for (const dir of directions) {
      let count = 1;
      // 정방향 체크
      for (let i = 1; i < 5; i++) {
        const x = row + i * dir.x;
        const y = col + i * dir.y;
        if (x >= 0 && x < 15 && y >= 0 && y < 15 && this.board[x][y] === player) {
          count++;
        } else {
          break;
        }
      }
      // 역방향 체크
      for (let i = 1; i < 5; i++) {
        const x = row - i * dir.x;
        const y = col - i * dir.y;
        if (x >= 0 && x < 15 && y >= 0 && y < 15 && this.board[x][y] === player) {
          count++;
        } else {
          break;
        }
      }

      if (count >= 5) {
        return true;
      }
    }

    return false;
  }

  // 항복 처리
  surrender(player) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.winner = player === 'black' ? 'white' : 'black'; // 항복한 플레이어의 반대편이 승리
  }

  // 현재 게임 상태 반환
  getState() {
    return {
      board: this.board,
      currentPlayer: this.currentPlayer,
      gameOver: this.gameOver,
      winner: this.winner,
      moveCount: this.moveCount,
    };
  }
}

export default GomokuGame;
