export type TetrominoType = 'I' | 'O' | 'T' | 'L' | 'J' | 'S' | 'Z';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
// We allow pieces to spawn slightly above the visible board
export const HIDDEN_ROWS = 4;
export const TOTAL_HEIGHT = BOARD_HEIGHT + HIDDEN_ROWS;

export const TETROMINO_COLORS: Record<TetrominoType | 'gray', string> = {
  I: 'rgb(34, 211, 238)',   // Cyan
  O: 'rgb(250, 204, 21)',   // Yellow
  T: 'rgb(168, 85, 247)',   // Purple
  L: 'rgb(249, 115, 22)',   // Orange
  J: 'rgb(59, 130, 246)',   // Blue
  S: 'rgb(34, 197, 94)',    // Green
  Z: 'rgb(239, 68, 68)',    // Red
  gray: 'rgb(100, 116, 139)' // Gray (garbage)
};

// Matrices for tetromino shapes (1 represents the piece, 0 represents empty)
export const TETROMINO_SHAPES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ]
};

export interface ActivePiece {
  type: TetrominoType;
  matrix: number[][];
  x: number; // grid column (0 to BOARD_WIDTH - 1)
  y: number; // grid row (0 to TOTAL_HEIGHT - 1, note visible is HIDDEN_ROWS to TOTAL_HEIGHT - 1)
}

export type BoardState = (TetrominoType | 'gray' | null)[][];

/**
 * Creates an empty board of size BOARD_WIDTH x TOTAL_HEIGHT
 */
export const createEmptyBoard = (): BoardState => {
  return Array(TOTAL_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(null));
};

/**
 * Rotate matrix clockwise
 */
export const rotateMatrix = (matrix: number[][]): number[][] => {
  const n = matrix.length;
  const res = Array(n).fill(null).map(() => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      res[c][n - 1 - r] = matrix[r][c];
    }
  }
  return res;
};

/**
 * Rotate matrix counter-clockwise
 */
export const rotateMatrixCCW = (matrix: number[][]): number[][] => {
  const n = matrix.length;
  const res = Array(n).fill(null).map(() => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      res[n - 1 - c][r] = matrix[r][c];
    }
  }
  return res;
};

/**
 * Check if the active piece in the given position/matrix collides with the board or boundaries.
 */
export const checkCollision = (
  board: BoardState,
  matrix: number[][],
  posX: number,
  posY: number
): boolean => {
  const size = matrix.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] !== 0) {
        const nextX = posX + c;
        const nextY = posY + r;

        // Boundaries
        if (nextX < 0 || nextX >= BOARD_WIDTH || nextY >= TOTAL_HEIGHT) {
          return true;
        }

        // Board collision (only if it is within the board boundaries)
        if (nextY >= 0) {
          if (board[nextY][nextX] !== null) {
            return true;
          }
        }
      }
    }
  }
  return false;
};

/**
 * Rotates the piece, applying wall-kicks if necessary.
 * Returns the new matrix, x, and y if rotation is successful, or null if blocked.
 */
export const rotatePiece = (
  board: BoardState,
  piece: ActivePiece,
  clockwise: boolean = true
): { matrix: number[][]; x: number; y: number } | null => {
  const rotatedMatrix = clockwise ? rotateMatrix(piece.matrix) : rotateMatrixCCW(piece.matrix);
  
  // Basic Wall Kick offsets to try in order:
  // [dx, dy]
  const wallKickOffsets = [
    [0, 0],   // 1. Try normal rotation
    [-1, 0],  // 2. Kick left 1
    [1, 0],   // 3. Kick right 1
    [0, -1],  // 4. Kick up 1 (helps rotate against floor)
    [-2, 0],  // 5. Kick left 2 (especially useful for I-piece)
    [2, 0],   // 6. Kick right 2
  ];

  for (const [dx, dy] of wallKickOffsets) {
    const nextX = piece.x + dx;
    const nextY = piece.y + dy;
    if (!checkCollision(board, rotatedMatrix, nextX, nextY)) {
      return { matrix: rotatedMatrix, x: nextX, y: nextY };
    }
  }

  return null;
};

/**
 * Computes the ghost Y position (the lowest possible Y coordinate where the piece can land)
 */
export const getGhostPosition = (board: BoardState, piece: ActivePiece): number => {
  let tempY = piece.y;
  while (!checkCollision(board, piece.matrix, piece.x, tempY + 1)) {
    tempY++;
  }
  return tempY;
};

/**
 * Generates a new shuffled bag of 7 tetromino types (7-bag system)
 */
export const generateBag = (): TetrominoType[] => {
  const bag: TetrominoType[] = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
  // Fisher-Yates Shuffle
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
};

/**
 * Checks for full rows and clears them.
 * Returns the new board and the number of cleared lines.
 */
export const clearLines = (board: BoardState): { board: BoardState; clearedCount: number } => {
  let clearedCount = 0;
  const newBoard = board.filter(row => {
    const isFull = row.every(cell => cell !== null);
    if (isFull) {
      clearedCount++;
      return false; // remove this row
    }
    return true;
  });

  // Re-insert empty rows at the top
  while (newBoard.length < TOTAL_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }

  return { board: newBoard, clearedCount };
};

/**
 * Spawns a new tetromino at the top center.
 */
export const spawnPiece = (type: TetrominoType): ActivePiece => {
  const matrix = TETROMINO_SHAPES[type];
  // Center horizontally
  const size = matrix.length;
  const x = Math.floor((BOARD_WIDTH - size) / 2);
  // Start at the top hidden rows (usually y = 0 or 1, so it descends into the visible board)
  const y = 0;
  return { type, matrix, x, y };
};

/**
 * Calculates score based on lines cleared and current level.
 */
export const getScoreForLines = (lines: number, level: number): number => {
  const baseScores = [0, 100, 300, 500, 800]; // 0, single, double, triple, tetris
  const linesIndex = Math.min(lines, 4);
  return baseScores[linesIndex] * level;
};

/**
 * Calculates how many garbage lines should be sent to the opponent.
 */
export const getGarbageLinesToSend = (lines: number): number => {
  if (lines <= 1) return 0;
  if (lines === 2) return 1;
  if (lines === 3) return 2;
  if (lines === 4) return 4; // Tetris!
  return 0;
};

/**
 * Adds garbage lines to the bottom of the board.
 * Each garbage line has exactly one hole in a random position.
 */
export const addGarbageLines = (board: BoardState, count: number): BoardState => {
  if (count <= 0) return board;

  const newBoard = board.map(row => [...row]);
  // Remove rows from the top to make space for garbage lines at the bottom
  newBoard.splice(0, count);

  for (let i = 0; i < count; i++) {
    const garbageRow: (TetrominoType | 'gray' | null)[] = Array(BOARD_WIDTH).fill('gray');
    const holeIndex = Math.floor(Math.random() * BOARD_WIDTH);
    garbageRow[holeIndex] = null;
    newBoard.push(garbageRow);
  }

  // Ensure board size is maintained
  while (newBoard.length < TOTAL_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }

  return newBoard;
};

/**
 * Converts a level to gravity speed (tick interval in ms)
 * Lower is faster.
 */
export const getGravitySpeed = (level: number): number => {
  // Classic formula approximation: speed = (0.8 - ((level - 1) * 0.007)) ^ (level - 1)
  // Let's use a simpler linear/exponential decay curve for nicer cyber play
  return Math.max(50, 1000 - (level - 1) * 80);
};
