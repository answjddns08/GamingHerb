class ReversiGame {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    // Initial four pieces
    this.board[3][3] = 'white';
    this.board[3][4] = 'black';
    this.board[4][3] = 'black';
    this.board[4][4] = 'white';
    this.currentPlayer = 'black';
    this.gameOver = false;
    this.winner = null;
    this.skips = 0;
  }

  placeStone(row, col, player) {
    if (this.gameOver || player !== this.currentPlayer) {
      return false;
    }

    const validFlips = this.getValidFlips(row, col, player);
    if (validFlips.length === 0) {
      return false;
    }

    // Place the stone and flip opponent's pieces
    this.board[row][col] = player;
    validFlips.forEach(([r, c]) => {
      this.board[r][c] = player;
    });

    // Switch player
    this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';

    // Check for game end conditions
    if (!this.hasValidMove('black') && !this.hasValidMove('white')) {
      this.endGame();
    } else if (!this.hasValidMove(this.currentPlayer)) {
        // If the new player has no moves, skip their turn
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        if (!this.hasValidMove(this.currentPlayer)) {
            // If the other player also has no moves, end the game
            this.endGame();
        }
    }

    return true;
  }

  getValidFlips(row, col, player) {
    if (this.board[row][col] !== null) {
      return [];
    }

    const opponent = player === 'black' ? 'white' : 'black';
    const directions = [
      { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 0 }, { x: 1, y: -1 },
      { x: 0, y: -1 }, { x: -1, y: -1 }, { x: -1, y: 0 }, { x: -1, y: 1 }
    ];
    let allFlips = [];

    directions.forEach(dir => {
      let line = [];
      let r = row + dir.y;
      let c = col + dir.x;

      while (r >= 0 && r < 8 && c >= 0 && c < 8 && this.board[r][c] === opponent) {
        line.push([r, c]);
        r += dir.y;
        c += dir.x;
      }

      if (r >= 0 && r < 8 && c >= 0 && c < 8 && this.board[r][c] === player) {
        allFlips = allFlips.concat(line);
      }
    });

    return allFlips;
  }

  hasValidMove(player) {
      for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
              if (this.getValidFlips(r, c, player).length > 0) {
                  return true;
              }
          }
      }
      return false;
  }

  endGame() {
      this.gameOver = true;
      let blackCount = 0;
      let whiteCount = 0;
      for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
              if (this.board[r][c] === 'black') blackCount++;
              if (this.board[r][c] === 'white') whiteCount++;
          }
      }

      if (blackCount > whiteCount) this.winner = 'black';
      else if (whiteCount > blackCount) this.winner = 'white';
      else this.winner = 'draw';
  }

  getState() {
    let blackCount = 0;
    let whiteCount = 0;
     for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
              if (this.board[r][c] === 'black') blackCount++;
              if (this.board[r][c] === 'white') whiteCount++;
          }
      }

    return {
      board: this.board,
      currentPlayer: this.currentPlayer,
      gameOver: this.gameOver,
      winner: this.winner,
      scores: {
          black: blackCount,
          white: whiteCount
      }
    };
  }
}

module.exports = ReversiGame;
