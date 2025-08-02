(() => {
  const boardEl = document.getElementById("board");
  const message = document.getElementById("message");
  const playerForm = document.getElementById("playerForm");
  const playerXInput = document.getElementById("playerXName");
  const playerOInput = document.getElementById("playerOName");
  const playerSymbolSelect = document.getElementById("playerSymbol");
  const gameModeSelect = document.getElementById("gameMode");
  const aiDifficultySelect = document.getElementById("aiDifficulty");
  const restartBtn = document.getElementById("restartBtn");
  const resetAllBtn = document.getElementById("resetAllBtn");
  const scoreXLabel = document.getElementById("scoreXLabel");
  const scoreOLabel = document.getElementById("scoreOLabel");
  const scoreX = document.getElementById("scoreX");
  const scoreO = document.getElementById("scoreO");
  const scoreD = document.getElementById("scoreD");

  const soundPlace = document.getElementById("soundPlace");
  const soundWin = document.getElementById("soundWin");
  const soundDraw = document.getElementById("soundDraw");

  let board = Array(9).fill(null);
  let gameOver = false;
  let current; // current symbol ('X' or 'O')
  let playerSymbol = 'X'; // Player 1 symbol
  let gameMode = 'friend'; // 'friend' or 'ai'
  let scores = { X: 0, O: 0, D: 0 };

  // Utility: get opponent symbol
  const opponent = s => (s === 'X' ? 'O' : 'X');

  // Initialize players' names & update UI text for scores
  function updatePlayerNamesAndLabels() {
    let p1Name = playerXInput.value.trim() || "Player 1";
    let p2Name = playerOInput.value.trim() || (gameMode === "ai" ? "AI" : "Player 2");

    // Update score labels depending on playerSymbol
    if (playerSymbol === "X") {
      scoreXLabel.textContent = `${p1Name} (X):`;
      scoreOLabel.textContent = `${p2Name} (O):`;
    } else {
      scoreXLabel.textContent = `${p2Name} (X):`;
      scoreOLabel.textContent = `${p1Name} (O):`;
    }
  }

  // Create board UI
  function createBoard() {
    boardEl.innerHTML = "";
    board.forEach((cell, i) => {
      const cellEl = document.createElement("div");
      cellEl.classList.add("cell");
      cellEl.dataset.i = i;
      cellEl.textContent = cell ? cell : "";
      cellEl.addEventListener("click", pMove);
      boardEl.appendChild(cellEl);
    });
  }

  // Update message to show whose turn it is or game result
  function updateMessage(text) {
    if (text) {
      message.textContent = text;
      return;
    }
    let p1Name = playerXInput.value.trim() || "Player 1";
    let p2Name = playerOInput.value.trim() || (gameMode === "ai" ? "AI" : "Player 2");
    let currentName = (current === playerSymbol) ? p1Name : p2Name;
    message.textContent = `${currentName}'s turn (${current})`;
  }

  // Check for winner or draw: returns 'X', 'O', 'D'(draw) or null (ongoing)
  function checkWin(bd) {
    const lines = [
      [0,1,2],[3,4,5],[6,7,8], // rows
      [0,3,6],[1,4,7],[2,5,8], // cols
      [0,4,8],[2,4,6]          // diagonals
    ];
    for (const [a,b1,c] of lines) {
      if (bd[a] && bd[a] === bd[b1] && bd[b1] === bd[c]) {
        return bd[a];
      }
    }
    if (bd.every(v => v !== null)) return "D";
    return null;
  }

  // Play a move
  function pMove(e) {
    if (gameOver) return;
    const i = +e.target.dataset.i;
    if (board[i]) return;

    board[i] = current;
    soundPlace.play();
    createBoard();

    const winner = checkWin(board);
    if (winner) {
      gameOver = true;
      handleWin(winner);
      return;
    }

    // Turn switching:
    if (gameMode === "friend") {
      current = opponent(current);
      updateMessage();
    } else if (gameMode === "ai") {
      current = opponent(current);
      updateMessage();
      if (!gameOver && current !== playerSymbol) {
        setTimeout(aiMove, 400);
      }
    }
  }

  // Handle a game win or draw
  function handleWin(winner) {
    if (winner === "D") {
      scores.D++;
      updateScores();
      message.textContent = "It's a draw!";
      soundDraw.play();
      animateDraw();
    } else {
      scores[winner]++;
      updateScores();
      let winnerName = (winner === playerSymbol) ? (playerXInput.value.trim() || "Player 1") : (playerOInput.value.trim() || (gameMode === "ai" ? "AI" : "Player 2"));
      message.textContent = `${winnerName} (${winner}) wins!`;
      soundWin.play();
      animateConfetti();
    }
    restartBtn.disabled = false;
  }

  // Reset board for new round
  function resetGame() {
    board = Array(9).fill(null);
    gameOver = false;
    current = playerSymbol; // Player 1 always starts
    restartBtn.disabled = true;
    createBoard();
    updateMessage();

    if (gameMode === "ai" && playerSymbol === "O") {
      // AI starts if player is O
      setTimeout(aiMove, 400);
    }
  }

  // Update score UI
  function updateScores() {
    if (playerSymbol === "X") {
      scoreX.textContent = scores.X;
      scoreO.textContent = scores.O;
    } else {
      scoreX.textContent = scores.O;
      scoreO.textContent = scores.X;
    }
    scoreD.textContent = scores.D;
  }

  // AI move logic based on difficulty
  function aiMove() {
    if (gameOver) return;

    let move;
    switch (aiDifficultySelect.value) {
      case "easy":
        move = easyMove();
        break;
      case "medium":
        move = mediumMove();
        break;
      case "hard":
        move = hardMove();
        break;
      default:
        move = easyMove();
    }

    if (move !== undefined) {
      board[move] = current;
      soundPlace.play();
      createBoard();

      const winner = checkWin(board);
      if (winner) {
        gameOver = true;
        handleWin(winner);
        return;
      }
      current = opponent(current);
      updateMessage();
    }
  }

  // Easy AI: random empty cell
  function easyMove() {
    const empties = board.map((v,i) => v === null ? i : null).filter(v => v !== null);
    if (empties.length === 0) return;
    return empties[Math.floor(Math.random() * empties.length)];
  }

  // Medium AI: try winning or blocking, else random
  function mediumMove() {
    // Try winning move
    for (let i=0; i<9; i++) {
      if (!board[i]) {
        board[i] = current;
        if (checkWin(board) === current) {
          board[i] = null;
          return i;
        }
        board[i] = null;
      }
    }
    // Try blocking opponent win
    const opp = opponent(current);
    for (let i=0; i<9; i++) {
      if (!board[i]) {
        board[i] = opp;
        if (checkWin(board) === opp) {
          board[i] = null;
          return i;
        }
        board[i] = null;
      }
    }
    // Else random
    return easyMove();
  }

  // Hard AI: Minimax
  function hardMove() {
    const best = minimax(board, current);
    return best.index;
  }

  // Minimax algorithm for hard AI
  function minimax(newBoard, player) {
    const availSpots = newBoard.map((v,i) => v === null ? i : null).filter(v => v !== null);

    const winner = checkWin(newBoard);
    if (winner === playerSymbol) return {score: -10};
    else if (winner === opponent(playerSymbol)) return {score: 10};
    else if (winner === "D") return {score: 0};

    const moves = [];
    for (let i=0; i<availSpots.length; i++) {
      const move = {};
      move.index = availSpots[i];
      newBoard[availSpots[i]] = player;

      if (player === opponent(playerSymbol)) {
        const result = minimax(newBoard, playerSymbol);
        move.score = result.score;
      } else {
        const result = minimax(newBoard, opponent(playerSymbol));
        move.score = result.score;
      }

      newBoard[availSpots[i]] = null;
      moves.push(move);
    }

    let bestMove;
    if (player === opponent(playerSymbol)) {
      let bestScore = -Infinity;
      for (let i=0; i<moves.length; i++) {
        if (moves[i].score > bestScore) {
          bestScore = moves[i].score;
          bestMove = moves[i];
        }
      }
    } else {
      let bestScore = Infinity;
      for (let i=0; i<moves.length; i++) {
        if (moves[i].score < bestScore) {
          bestScore = moves[i].score;
          bestMove = moves[i];
        }
      }
    }
    return bestMove;
  }

  // Confetti animation on win
  function animateConfetti() {
    const count = 100;
    for(let i=0; i<count; i++) {
      const confetti = document.createElement('div');
      confetti.classList.add('confetti-piece');
      confetti.style.left = Math.random() * window.innerWidth + 'px';
      confetti.style.backgroundColor = `hsl(${Math.random()*360}, 70%, 60%)`;
      confetti.style.animationDuration = 2 + Math.random() * 2 + 's';
      confetti.style.animationDelay = (Math.random() * 1) + 's';
      document.body.appendChild(confetti);
      setTimeout(() => {
        confetti.remove();
      }, 4000);
    }
  }

  // Animate board flash on draw
  function animateDraw() {
    boardEl.style.animation = 'draw-flash 1.5s ease-in-out 2';
    setTimeout(() => { boardEl.style.animation = ''; }, 3100);
  }

  // Enable or disable AI difficulty select based on mode
  gameModeSelect.addEventListener("change", () => {
    if (gameModeSelect.value === "ai") {
      aiDifficultySelect.disabled = false;
      playerOInput.placeholder = "AI";
      playerOInput.value = "AI";
      playerOInput.disabled = true;
    } else {
      aiDifficultySelect.disabled = true;
      playerOInput.placeholder = "Player 2";
      playerOInput.value = "";
      playerOInput.disabled = false;
    }
  });

  // Reset scores and board
  resetAllBtn.addEventListener("click", () => {
    scores = { X:0, O:0, D:0 };
    updateScores();
    resetGame();
  });

  // Restart round button
  restartBtn.addEventListener("click", () => {
    resetGame();
  });

  // On form submit (start/reset)
  playerForm.addEventListener("submit", e => {
    e.preventDefault();
    playerSymbol = playerSymbolSelect.value;
    gameMode = gameModeSelect.value;
    updatePlayerNamesAndLabels();
    resetGame();
  });

  // Initialize UI and game on page load
  function init() {
    updatePlayerNamesAndLabels();
    updateScores();
    resetGame();
  }

  init();
})();