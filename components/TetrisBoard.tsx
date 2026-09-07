import React from 'react';
import { 
  BoardState, 
  ActivePiece, 
  TetrominoType, 
  TETROMINO_COLORS, 
  TETROMINO_SHAPES, 
  BOARD_WIDTH, 
  BOARD_HEIGHT, 
  HIDDEN_ROWS,
  TOTAL_HEIGHT,
  getGhostPosition 
} from '@/utils/tetrisLogic';
import { useGameSettings } from './GameSettingsProvider';

type TetrisBoardProps = {
  board: BoardState;
  activePiece: ActivePiece | null;
  nextQueue: TetrominoType[];
  holdPiece: TetrominoType | null;
  canHold: boolean;
  score: number;
  level: number;
  lines: number;
  garbageQueueCount: number; // Opponent sent garbage not yet spawned
  isGameOver: boolean;
  playerName: string;
  isAI?: boolean;
};

// Returns a rich radial gradient style for cyberpunk glow blocks
const getBlockStyle = (type: TetrominoType | 'gray' | 'ghost', baseColor?: string) => {
  if (type === 'ghost') {
    const color = baseColor || 'rgba(255, 255, 255, 0.3)';
    return {
      border: `2px dashed ${color}`,
      backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.15)'),
      boxShadow: `0 0 8px ${color.replace('rgb', 'rgba').replace(')', ', 0.3)')}`,
    };
  }

  const colorMap: Record<TetrominoType | 'gray', { bright: string; base: string; dark: string }> = {
    I: { bright: '#a5f3fc', base: '#06b6d4', dark: '#083344' }, // Cyan
    O: { bright: '#fef08a', base: '#eab308', dark: '#422006' }, // Yellow
    T: { bright: '#e9d5ff', base: '#a855f7', dark: '#3b0764' }, // Purple
    L: { bright: '#fed7aa', base: '#f97316', dark: '#431407' }, // Orange
    J: { bright: '#bfdbfe', base: '#3b82f6', dark: '#172554' }, // Blue
    S: { bright: '#bbf7d0', base: '#22c55e', dark: '#052e16' }, // Green
    Z: { bright: '#fecaca', base: '#ef4444', dark: '#450a0a' }, // Red
    gray: { bright: '#cbd5e1', base: '#64748b', dark: '#1e293b' }, // Garbage Slate
  };

  const palette = colorMap[type];
  return {
    background: `radial-gradient(circle at 35% 35%, ${palette.bright} 0%, ${palette.base} 60%, ${palette.dark} 100%)`,
    border: `1px solid ${palette.bright}88`,
    boxShadow: `0 0 10px ${palette.base}b3, inset 0 2px 4px rgba(255, 255, 255, 0.4)`,
  };
};

export const TetrisBoard: React.FC<TetrisBoardProps> = ({
  board,
  activePiece,
  nextQueue,
  holdPiece,
  canHold,
  score,
  level,
  lines,
  garbageQueueCount,
  isGameOver,
  playerName,
  isAI = false,
}) => {
  const { is3D } = useGameSettings();

  // Create a display grid that merges static board blocks, active piece, and ghost piece
  const displayBoard: (TetrominoType | 'gray' | 'ghost' | null)[][] = board.map(row => [...row]);
  let ghostY = 0;

  if (activePiece) {
    ghostY = getGhostPosition(board, activePiece);
    const size = activePiece.matrix.length;

    // 1. Draw Ghost piece first (so active piece can render on top if overlapping at start)
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (activePiece.matrix[r][c] !== 0) {
          const boardY = ghostY + r;
          const boardX = activePiece.x + c;
          if (boardY >= 0 && boardY < TOTAL_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            // Only draw ghost if the cell is currently empty
            if (displayBoard[boardY][boardX] === null) {
              displayBoard[boardY][boardX] = 'ghost';
            }
          }
        }
      }
    }

    // 2. Draw Active piece
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (activePiece.matrix[r][c] !== 0) {
          const boardY = activePiece.y + r;
          const boardX = activePiece.x + c;
          if (boardY >= 0 && boardY < TOTAL_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            displayBoard[boardY][boardX] = activePiece.type;
          }
        }
      }
    }
  }

  // Slice off hidden rows for the final visible grid
  const visibleGrid = displayBoard.slice(HIDDEN_ROWS);

  // Helper to render mini-grid for Next or Hold
  const renderMiniGrid = (type: TetrominoType | null) => {
    const grid = Array(4).fill(null).map(() => Array(4).fill(null));
    if (type) {
      const matrix = TETROMINO_SHAPES[type];
      const size = matrix.length;
      // Center the shape in the 4x4 box
      const offsetRow = Math.floor((4 - size) / 2);
      const offsetCol = Math.floor((4 - size) / 2);
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (matrix[r][c] !== 0) {
            grid[r + offsetRow][c + offsetCol] = type;
          }
        }
      }
    }

    return (
      <div className="grid grid-cols-4 grid-rows-4 gap-[2px] p-2 bg-slate-900/60 rounded-xl border border-white/10 w-24 h-24">
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className="rounded-[3px] transition-all duration-300"
              style={cell ? getBlockStyle(cell) : { backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
            />
          ))
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      {/* User Header / Status */}
      <div className="w-full flex justify-between items-center mb-3 px-1">
        <div>
          <h4 className="font-orbitron font-black text-lg tracking-wider text-slate-100 uppercase">
            {playerName}
          </h4>
          <span className={`text-[10px] font-semibold font-orbitron px-2 py-0.5 rounded-full border ${
            isAI 
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' 
              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
          }`}>
            {isAI ? 'CPU PILOT' : 'HUMAN OPERATOR'}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-orbitron tracking-widest block">SCORE</span>
          <span className="font-orbitron text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-200">
            {score.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex items-stretch space-x-4">
        
        {/* Left Side: Hold / Stats Panel */}
        <div className="flex flex-col justify-between w-28 select-none space-y-4">
          {/* Hold Card */}
          <div className="rounded-2xl border border-slate-700/50 p-3 bg-slate-900/40 backdrop-blur-md flex flex-col items-center">
            <span className="text-[10px] font-bold font-orbitron tracking-widest text-cyan-400 mb-2 uppercase">
              HOLD
            </span>
            {renderMiniGrid(holdPiece)}
            {!canHold && holdPiece && (
              <span className="text-[9px] font-bold text-pink-500 mt-1 font-orbitron uppercase tracking-wider">
                LOCKED
              </span>
            )}
          </div>

          {/* Stats Card */}
          <div className="rounded-2xl border border-slate-700/50 p-4 bg-slate-900/40 backdrop-blur-md flex-grow flex flex-col justify-around space-y-2">
            <div>
              <span className="text-[9px] text-slate-400 tracking-wider font-orbitron block">LEVEL</span>
              <span className="text-lg font-orbitron font-bold text-white">{level}</span>
            </div>
            <div className="border-t border-slate-800 pt-2">
              <span className="text-[9px] text-slate-400 tracking-wider font-orbitron block">LINES</span>
              <span className="text-lg font-orbitron font-bold text-white">{lines}</span>
            </div>
          </div>
        </div>

        {/* Center: Main Tetris Field Box */}
        <div className="board-container-3d relative flex items-center justify-center">
          
          {/* Holographic Glowing shadow base */}
          <div 
            id="hologram-glow" 
            className="absolute w-[105%] h-[105%] rounded-3xl blur-[40px] opacity-15 pointer-events-none transition-all duration-1000"
            style={{ 
              background: isAI 
                ? "radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 80%)" 
                : "radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 80%)" 
            }}
          />

          {/* Incoming Garbage Bar (Red LED gauge on the left border) */}
          {garbageQueueCount > 0 && (
            <div className="absolute -left-3 top-0 bottom-0 w-2 flex flex-col justify-end gap-[2px] py-2 z-30">
              {Array(Math.min(garbageQueueCount, 12)).fill(null).map((_, i) => (
                <div 
                  key={i} 
                  className="w-full h-2 rounded-[2px] bg-red-500 border border-red-400 shadow-[0_0_8px_#ef4444] animate-pulse"
                />
              ))}
            </div>
          )}

          {/* The Board Grid */}
          <div
            className={`w-[260px] h-[520px] rounded-2xl p-1.5 border grid grid-cols-10 grid-rows-20 gap-[2px] transition-all duration-700 relative overflow-hidden ${
              is3D ? "board-3d" : "board-2d"
            }`}
            style={{
              backgroundColor: "rgba(14, 28, 45, 0.8)",
              borderColor: isAI ? "rgba(168, 85, 247, 0.2)" : "rgba(6, 182, 212, 0.2)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.9)",
              borderTop: isAI ? "3px solid rgba(168, 85, 247, 0.8)" : "3px solid rgba(6, 182, 212, 0.8)",
              borderBottom: isAI ? "3px solid rgba(168, 85, 247, 0.8)" : "3px solid rgba(6, 182, 212, 0.8)",
            }}
          >
            {/* Grid background cell design */}
            {visibleGrid.map((row, r) =>
              row.map((cell, c) => {
                let cellStyle: React.CSSProperties = {
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.015)'
                };

                if (cell) {
                  const pieceType = activePiece?.type || 'I';
                  const baseColor = TETROMINO_COLORS[pieceType];
                  cellStyle = getBlockStyle(cell, baseColor);
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    className="rounded-[4px] relative"
                    style={cellStyle}
                  >
                    {/* Add cyber neon diagonal texture lines inside empty grid to feel futuristic */}
                    {!cell && (r % 2 === 0 && c % 2 === 0) && (
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,rgba(255,255,255,0.03)_50%,transparent_55%)] bg-[size:10px_10px]" />
                    )}
                  </div>
                );
              })
            )}

            {/* Game Over Screen Overlay inside the board */}
            {isGameOver && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 select-none">
                <span className="font-orbitron font-black text-2xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500 animate-pulse">
                  SYSTEM OVERFLOW
                </span>
                <span className="text-[10px] font-orbitron font-semibold tracking-wider text-slate-400 mt-1 uppercase">
                  GAME OVER
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Next Queue Panel */}
        <div className="flex flex-col w-28 select-none space-y-4">
          <div className="rounded-2xl border border-slate-700/50 p-3 bg-slate-900/40 backdrop-blur-md flex flex-col items-center">
            <span className="text-[10px] font-bold font-orbitron tracking-widest text-pink-500 mb-2 uppercase">
              NEXT 1
            </span>
            {renderMiniGrid(nextQueue[0] || null)}
          </div>

          <div className="rounded-2xl border border-slate-700/50 p-3 bg-slate-900/40 backdrop-blur-md flex flex-col items-center flex-grow">
            <span className="text-[10px] font-bold font-orbitron tracking-widest text-slate-400 mb-2 uppercase">
              QUEUE
            </span>
            <div className="space-y-3 flex flex-col items-center justify-center">
              <div>
                <span className="text-[8px] font-bold font-orbitron tracking-widest text-slate-500 block mb-1">
                  NEXT 2
                </span>
                {renderMiniGrid(nextQueue[1] || null)}
              </div>
              <div>
                <span className="text-[8px] font-bold font-orbitron tracking-widest text-slate-500 block mb-1">
                  NEXT 3
                </span>
                {renderMiniGrid(nextQueue[2] || null)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
