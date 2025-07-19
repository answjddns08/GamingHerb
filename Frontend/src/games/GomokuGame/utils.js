/**
 * 게임 설명을 마크다운 파일에서 읽어오는 함수
 */
export async function getGameDescription() {
  try {
    const response = await fetch("/src/games/GomokuGame/README.md");
    const markdown = await response.text();

    // 간단한 마크다운 to HTML 변환
    return markdownToHtml(markdown);
  } catch (error) {
    console.error("마크다운 파일 로드 실패:", error);

    // 기본 설명 반환
    return `
      <h2>오목 게임 (Gomoku)</h2>
      <p>오목은 두 명의 플레이어가 번갈아가며 돌을 놓아 먼저 5개의 돌을 연속으로 배치하는 플레이어가 승리하는 게임입니다.</p>

      <h3>게임 규칙</h3>
      <ul>
        <li>15×15 바둑판에서 진행됩니다</li>
        <li>검은 돌이 먼저 시작합니다</li>
        <li>가로, 세로, 대각선 중 하나로 5개를 연속 배치하면 승리</li>
        <li>6개 이상 연속으로 놓는 것은 금지됩니다 (장연금지)</li>
      </ul>

      <h3>조작 방법</h3>
      <p>바둑판의 교차점을 클릭하여 돌을 놓을 수 있습니다.</p>
    `;
  }
}

/**
 * 간단한 마크다운을 HTML로 변환하는 함수
 */
function markdownToHtml(markdown) {
  return markdown
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^\* (.*$)/gim, "<li>$1</li>")
    .replace(/^- (.*$)/gim, "<li>$1</li>")
    .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*)\*/gim, "<em>$1</em>")
    .replace(/\n\n/gim, "</p><p>")
    .replace(/(<li>.*<\/li>)/gims, "<ul>$1</ul>")
    .replace(/<\/ul>\s*<ul>/gim, "")
    .replace(/^(?!<[hul])/gim, "<p>")
    .replace(/(?<![>])\n$/gim, "</p>");
}

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
