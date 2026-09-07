import { 
  BoardState, 
  ActivePiece, 
  TetrominoType, 
  BOARD_WIDTH, 
  TOTAL_HEIGHT, 
  HIDDEN_ROWS,
  TETROMINO_SHAPES,
  checkCollision,
  rotateMatrix,
  clearLines
} from './tetrisLogic';

export type AIType = 'easy' | 'normal' | 'hard' | 'aggressive' | 'defensive';

export interface AIMove {
  x: number;
  rotationCount: number;
  shouldHold: boolean;
  score: number;
}

/**
 * Helper to calculate the heights of all columns on the board.
 * Returns an array of heights for columns 0 to BOARD_WIDTH - 1.
 */
const getColumnHeights = (board: BoardState): number[] => {
  const heights = Array(BOARD_WIDTH).fill(0);
  for (let c = 0; c < BOARD_WIDTH; c++) {
    for (let r = 0; r < TOTAL_HEIGHT; r++) {
      if (board[r][c] !== null) {
        heights[c] = TOTAL_HEIGHT - r;
        break;
      }
    }
  }
  return heights;
};

/**
 * Counts the number of holes on the board.
 * A hole is an empty cell that has at least one block above it in the same column.
 */
const countHoles = (board: BoardState): number => {
  let holes = 0;
  for (let c = 0; c < BOARD_WIDTH; c++) {
    let blockFound = false;
    for (let r = 0; r < TOTAL_HEIGHT; r++) {
      if (board[r][c] !== null) {
        blockFound = true;
      } else if (blockFound && board[r][c] === null) {
        holes++;
      }
    }
  }
  return holes;
};

/**
 * Calculates the bumpiness of the board.
 * Bumpiness is the sum of absolute height differences between adjacent columns.
 */
const getBumpiness = (heights: number[]): number => {
  let bumpiness = 0;
  for (let c = 0; c < BOARD_WIDTH - 1; c++) {
    bumpiness += Math.abs(heights[c] - heights[c + 1]);
  }
  return bumpiness;
};

/**
 * Evaluates the given board state and returns a score.
 * Higher scores are better (less penalty, more lines cleared).
 * Supports different evaluation parameters depending on AIType.
 */
export const evaluateBoard = (board: BoardState, linesCleared: number, aiType: AIType): number => {
  const heights = getColumnHeights(board);
  const aggregateHeight = heights.reduce((sum, h) => sum + h, 0);
  const holes = countHoles(board);
  const bumpiness = getBumpiness(heights);

  // Dynamic parameters based on AI type:
  // a: Height coefficient (negative)
  // b: Holes coefficient (highly negative)
  // c: Bumpiness coefficient (negative)
  // d: Lines cleared coefficient (positive)
  let a = -0.510066;
  let b = -0.35663;
  let c = -0.184483;
  let d = 0.760666;
  let specialBonus = 0;

  if (aiType === 'defensive') {
    // Defensive prioritizes keeping the stack low and flat at all costs
    a = -0.90; // Extremely hate height
    b = -0.40;
    c = -0.30; // Strongly prefer flat board
    d = 0.50;  // Happy to clear even 1 single line to reduce height
  } else if (aiType === 'aggressive') {
    // Aggressive tolerates height and uneven stack to set up big 4-line clears (Tetris)
    a = -0.25; // Don't mind height too much
    b = -0.50; // Still hate holes (don't block the stack)
    c = -0.10; // Don't care about flatness
    d = 0.95;  // Highly value line clears
    
    // Massive bonus for Tetris (4 lines at once)
    if (linesCleared === 4) {
      specialBonus = 8.0;
    }
  }

  return (
    a * aggregateHeight +
    b * holes +
    c * bumpiness +
    d * linesCleared +
    specialBonus
  );
};

/**
 * Simulates dropping a piece on the board at a specific X coordinate and rotation.
 * Returns the resulting board state after placing and clearing lines, or null if invalid.
 */
const simulateDrop = (
  board: BoardState,
  type: TetrominoType,
  targetX: number,
  rotationCount: number
): { board: BoardState; linesCleared: number } | null => {
  let matrix = TETROMINO_SHAPES[type];
  for (let i = 0; i < rotationCount; i++) {
    matrix = rotateMatrix(matrix);
  }

  const size = matrix.length;
  let minPieceX = size;
  let maxPieceX = -1;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] !== 0) {
        if (c < minPieceX) minPieceX = c;
        if (c > maxPieceX) maxPieceX = c;
      }
    }
  }

  if (maxPieceX === -1) return null;

  if (targetX + minPieceX < 0 || targetX + maxPieceX >= BOARD_WIDTH) {
    return null;
  }

  let y = 0;
  if (checkCollision(board, matrix, targetX, y)) {
    return null; // Instantly collides
  }

  while (!checkCollision(board, matrix, targetX, y + 1)) {
    y++;
  }

  const nextBoard = board.map(row => [...row]);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] !== 0) {
        const boardY = y + r;
        const boardX = targetX + c;
        if (boardY >= 0 && boardY < TOTAL_HEIGHT) {
          nextBoard[boardY][boardX] = type;
        }
      }
    }
  }

  const { board: clearedBoard, clearedCount } = clearLines(nextBoard);

  return { board: clearedBoard, linesCleared: clearedCount };
};

/**
 * Searches for the best move (rotation & X coordinate) for the current piece.
 */
export const findBestMoveForPiece = (
  board: BoardState,
  type: TetrominoType,
  aiType: AIType
): { x: number; rotationCount: number; score: number } => {
  let bestScore = -Infinity;
  let bestX = 0;
  let bestRotation = 0;

  const maxRotations = type === 'O' ? 1 : (type === 'I' || type === 'S' || type === 'Z') ? 2 : 4;

  for (let rot = 0; rot < maxRotations; rot++) {
    for (let x = -3; x < BOARD_WIDTH; x++) {
      const simulation = simulateDrop(board, type, x, rot);
      if (simulation) {
        const score = evaluateBoard(simulation.board, simulation.linesCleared, aiType);
        if (score > bestScore) {
          bestScore = score;
          bestX = x;
          bestRotation = rot;
        }
      }
    }
  }

  return { x: bestX, rotationCount: bestRotation, score: bestScore };
};

/**
 * Evaluates options (normal play vs hold play) and decides the best action.
 */
export const getBestMove = (
  board: BoardState,
  currentPiece: TetrominoType,
  nextPiece: TetrominoType,
  holdPiece: TetrominoType | null,
  canHold: boolean,
  aiType: AIType
): AIMove => {
  // Option 1: Play current piece
  const normalMove = findBestMoveForPiece(board, currentPiece, aiType);

  if (!canHold) {
    return {
      x: normalMove.x,
      rotationCount: normalMove.rotationCount,
      shouldHold: false,
      score: normalMove.score
    };
  }

  // Option 2: Play hold piece
  const activeHoldType = holdPiece || nextPiece;
  const holdMove = findBestMoveForPiece(board, activeHoldType, aiType);

  const holdBias = 0.05;

  if (holdMove.score > normalMove.score + holdBias) {
    return {
      x: holdMove.x,
      rotationCount: holdMove.rotationCount,
      shouldHold: true,
      score: holdMove.score
    };
  } else {
    return {
      x: normalMove.x,
      rotationCount: normalMove.rotationCount,
      shouldHold: false,
      score: normalMove.score
    };
  }
};

/**
 * Returns a decision after applying difficulty/style adjustments.
 */
export const getAdjustedAIMove = (
  board: BoardState,
  currentPiece: TetrominoType,
  nextPiece: TetrominoType,
  holdPiece: TetrominoType | null,
  canHold: boolean,
  aiType: AIType
): AIMove => {
  // Hard, Aggressive, Defensive use raw optimized search
  const best = getBestMove(board, currentPiece, nextPiece, holdPiece, canHold, aiType);

  if (aiType !== 'easy' && aiType !== 'normal') {
    return best;
  }

  // For easy & normal, we may choose a non-optimal move or add noise to evaluation
  const rand = Math.random();
  const mistakeProbability = aiType === 'easy' ? 0.3 : 0.1;

  if (rand < mistakeProbability) {
    const validMoves: AIMove[] = [];
    const typesToTry = canHold ? [currentPiece, holdPiece || nextPiece] : [currentPiece];

    for (const t of typesToTry) {
      const isHold = t !== currentPiece;
      const maxRot = t === 'O' ? 1 : (t === 'I' || t === 'S' || t === 'Z') ? 2 : 4;
      for (let rot = 0; rot < maxRot; rot++) {
        for (let x = -3; x < BOARD_WIDTH; x++) {
          const sim = simulateDrop(board, t, x, rot);
          if (sim) {
            const rawScore = evaluateBoard(sim.board, sim.linesCleared, aiType);
            validMoves.push({
              x,
              rotationCount: rot,
              shouldHold: isHold,
              score: rawScore
            });
          }
        }
      }
    }

    if (validMoves.length > 0) {
      if (aiType === 'easy') {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        return randomMove;
      } else {
        // Normal picks from top 3 moves
        validMoves.sort((a, b) => b.score - a.score);
        const topCount = Math.min(3, validMoves.length);
        const normalMove = validMoves[Math.floor(Math.random() * topCount)];
        return normalMove;
      }
    }
  }

  return best;
};
