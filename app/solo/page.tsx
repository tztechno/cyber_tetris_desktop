"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { TetrisBoard } from "@/components/TetrisBoard";
import WinnerAnnouncePop from "@/components/WinnerAnnouncePop";
import { 
  BoardState, 
  ActivePiece, 
  TetrominoType, 
  createEmptyBoard, 
  spawnPiece, 
  checkCollision, 
  rotatePiece, 
  getGhostPosition, 
  generateBag, 
  clearLines, 
  getScoreForLines, 
  getGravitySpeed 
} from "@/utils/tetrisLogic";
import { useGameSettings } from "@/components/GameSettingsProvider";

export default function SoloPage() {
  const { playPlace, playFlip, playError, is3D, setIs3D } = useGameSettings();

  const [board, setBoard] = useState<BoardState>(createEmptyBoard());
  const [activePiece, setActivePiece] = useState<ActivePiece | null>(null);
  const [nextQueue, setNextQueue] = useState<TetrominoType[]>([]);
  const [holdPiece, setHoldPiece] = useState<TetrominoType | null>(null);
  const [canHold, setCanHold] = useState<boolean>(true);
  
  const [score, setScore] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [startLevel, setStartLevel] = useState<number>(1);
  const [lines, setLines] = useState<number>(0);
  const [linesForNextLevel, setLinesForNextLevel] = useState<number>(10);

  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showWinnerModal, setShowWinnerModal] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Refs for tracking mutable game state in listeners
  const boardRef = useRef(board);
  const activePieceRef = useRef(activePiece);
  const nextQueueRef = useRef(nextQueue);
  const holdPieceRef = useRef(holdPiece);
  const canHoldRef = useRef(canHold);
  const isGameOverRef = useRef(isGameOver);
  const isPausedRef = useRef(isPaused);
  const levelRef = useRef(level);
  const startLevelRef = useRef(startLevel);

  // Sync refs
  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { activePieceRef.current = activePiece; }, [activePiece]);
  useEffect(() => { nextQueueRef.current = nextQueue; }, [nextQueue]);
  useEffect(() => { holdPieceRef.current = holdPiece; }, [holdPiece]);
  useEffect(() => { canHoldRef.current = canHold; }, [canHold]);
  useEffect(() => { isGameOverRef.current = isGameOver; }, [isGameOver]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { startLevelRef.current = startLevel; }, [startLevel]);

  // Fill tetromino queue if it gets low
  const replenishQueue = useCallback((currentQueue: TetrominoType[]) => {
    let q = [...currentQueue];
    while (q.length < 8) {
      q = [...q, ...generateBag()];
    }
    return q;
  }, []);

  // Initialize Game
  const initGame = useCallback(() => {
    const initialQueue = replenishQueue([]);
    const firstType = initialQueue.shift()!;
    
    setBoard(createEmptyBoard());
    setActivePiece(spawnPiece(firstType));
    setNextQueue(replenishQueue(initialQueue));
    setHoldPiece(null);
    setCanHold(true);
    setScore(0);
    setLevel(startLevel);
    setLines(0);
    setLinesForNextLevel(10);
    setIsGameOver(false);
    setShowWinnerModal(false);
    setIsPaused(false);
  }, [replenishQueue, startLevel]);

  // Initial load
  useEffect(() => {
    initGame();
  }, [initGame]);

  // Lock active piece to board
  const lockPiece = useCallback((piece: ActivePiece, currentBoard: BoardState) => {
    const nextBoard = currentBoard.map(row => [...row]);
    const size = piece.matrix.length;
    let lockedAboveVisible = true;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (piece.matrix[r][c] !== 0) {
          const boardY = piece.y + r;
          const boardX = piece.x + c;
          if (boardY >= 0 && boardY < nextBoard.length && boardX >= 0 && boardX < nextBoard[0].length) {
            nextBoard[boardY][boardX] = piece.type;
            if (boardY >= 4) { // visible rows index >= 4 (HIDDEN_ROWS)
              lockedAboveVisible = false;
            }
          }
        }
      }
    }

    if (lockedAboveVisible) {
      // Piece locked entirely in hidden zone = Game Over
      setIsGameOver(true);
      setShowWinnerModal(true);
      setActivePiece(null);
      return;
    }

    // Line clearing
    const { board: clearedBoard, clearedCount } = clearLines(nextBoard);
    
    if (clearedCount > 0) {
      playPlace();
      setLines(prev => {
        const nextLines = prev + clearedCount;
        // Level up check: level up every 10 lines from startLevel
        const levelUpsEarned = Math.floor(nextLines / 10);
        const newLevel = startLevelRef.current + levelUpsEarned;
        if (newLevel > levelRef.current) {
          setLevel(newLevel);
        }
        return nextLines;
      });
      setScore(prev => prev + getScoreForLines(clearedCount, levelRef.current));
    } else {
      playPlace();
    }

    setBoard(clearedBoard);

    // Spawn next piece
    const nextQ = [...nextQueueRef.current];
    const nextType = nextQ.shift()!;
    const spawned = spawnPiece(nextType);

    // Collision check at spawn
    if (checkCollision(clearedBoard, spawned.matrix, spawned.x, spawned.y)) {
      setIsGameOver(true);
      setShowWinnerModal(true);
      setActivePiece(null);
    } else {
      setActivePiece(spawned);
      setNextQueue(replenishQueue(nextQ));
      setCanHold(true);
    }
  }, [replenishQueue, playPlace]);

  // Tick gravity step
  const handleTick = useCallback(() => {
    if (isGameOverRef.current || isPausedRef.current || !activePieceRef.current) return;

    const piece = activePieceRef.current;
    const currentBoard = boardRef.current;

    // Check collision down
    if (!checkCollision(currentBoard, piece.matrix, piece.x, piece.y + 1)) {
      setActivePiece({
        ...piece,
        y: piece.y + 1
      });
    } else {
      lockPiece(piece, currentBoard);
    }
  }, [lockPiece]);

  // Set up gravity interval
  useEffect(() => {
    if (isGameOver || isPaused) return;
    const interval = setInterval(handleTick, getGravitySpeed(level));
    return () => clearInterval(interval);
  }, [level, isGameOver, isPaused, handleTick]);

  // Keys control handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isGameOverRef.current || isPausedRef.current || !activePieceRef.current) return;

    const piece = activePieceRef.current;
    const currentBoard = boardRef.current;

    switch (e.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        if (!checkCollision(currentBoard, piece.matrix, piece.x - 1, piece.y)) {
          setActivePiece({ ...piece, x: piece.x - 1 });
        } else {
          playError();
        }
        e.preventDefault();
        break;

      case "ArrowRight":
      case "d":
      case "D":
        if (!checkCollision(currentBoard, piece.matrix, piece.x + 1, piece.y)) {
          setActivePiece({ ...piece, x: piece.x + 1 });
        } else {
          playError();
        }
        e.preventDefault();
        break;

      case "ArrowDown":
      case "s":
      case "S":
        // Soft drop
        if (!checkCollision(currentBoard, piece.matrix, piece.x, piece.y + 1)) {
          setActivePiece({ ...piece, y: piece.y + 1 });
          setScore(prev => prev + 1);
        }
        e.preventDefault();
        break;

      case "ArrowUp":
      case "w":
      case "W":
        // Hard drop
        const ghostY = getGhostPosition(currentBoard, piece);
        const dropDist = ghostY - piece.y;
        const finalPiece = { ...piece, y: ghostY };
        setScore(prev => prev + dropDist * 2);
        lockPiece(finalPiece, currentBoard);
        e.preventDefault();
        break;

      case ".":
      case "z":
      case "Z":
        // Rotate CCW (Left)
        const rotCCW = rotatePiece(currentBoard, piece, false);
        if (rotCCW) {
          playFlip();
          setActivePiece({ ...piece, ...rotCCW });
        } else {
          playError();
        }
        e.preventDefault();
        break;

      case "/":
      case "x":
      case "X":
        // Rotate CW (Right)
        const rotCW = rotatePiece(currentBoard, piece, true);
        if (rotCW) {
          playFlip();
          setActivePiece({ ...piece, ...rotCW });
        } else {
          playError();
        }
        e.preventDefault();
        break;

      case "c":
      case "C":
      case "Shift":
        // Hold piece
        if (!canHoldRef.current) {
          playError();
          return;
        }

        playFlip();
        const currentType = piece.type;
        const heldType = holdPieceRef.current;
        const nextQ = [...nextQueueRef.current];

        setHoldPiece(currentType);

        if (heldType) {
          setActivePiece(spawnPiece(heldType));
        } else {
          const nextType = nextQ.shift()!;
          setActivePiece(spawnPiece(nextType));
          setNextQueue(replenishQueue(nextQ));
        }
        setCanHold(false);
        e.preventDefault();
        break;

      case "Escape":
        setIsPaused(prev => !prev);
        e.preventDefault();
        break;

      default:
        break;
    }
  }, [playFlip, playError, lockPiece, replenishQueue]);

  // Bind controls listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleDismissWinner = () => {
    setShowWinnerModal(false);
  };

  return (
    <section className="w-full max-w-4xl flex flex-col items-center justify-center z-10 transition-all duration-500 my-auto">
      {/* Settings Action Row */}
      <div className="w-full max-w-[500px] flex justify-between items-center mb-4 px-2 select-none">
        <span className="text-xs font-orbitron font-bold tracking-widest text-cyan-400 uppercase bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
          SOLO MATRIX
        </span>
        <div className="flex space-x-2 items-center">
          {/* Start Level Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-950/40 border border-slate-700/50 rounded-full px-2.5 py-0.5 select-none">
            <span className="text-[9px] text-slate-400 font-orbitron font-bold tracking-wider uppercase">START LV</span>
            <select
              value={startLevel}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setStartLevel(val);
              }}
              disabled={activePiece !== null && !isGameOver && !isPaused}
              className="bg-transparent text-xs font-orbitron text-cyan-400 border-none outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 font-bold"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lv) => (
                <option key={lv} value={lv} className="bg-slate-900 text-slate-100">
                  {lv}
                </option>
              ))}
            </select>
          </div>
          {/* Pause Toggle Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              isPaused 
                ? "bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold" 
                : "border-slate-700 text-slate-400 hover:bg-white/5"
            }`}
          >
            <i className={`fa-solid ${isPaused ? "fa-play mr-1.5" : "fa-pause mr-1.5"}`}></i>
            <span>{isPaused ? "RESUME" : "PAUSE"}</span>
          </button>
          
          {/* 3D toggle */}
          <button 
            onClick={() => setIs3D(!is3D)} 
            className={`text-xs flex items-center space-x-1 px-3 py-1 rounded-full border transition-all ${
              is3D
                ? "bg-pink-500/10 border-pink-500/50 text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.2)]"
                : "border-slate-700 text-slate-400 hover:bg-white/5"
            }`}
          >
            <i className="fa-solid fa-cube mr-1.5"></i>
            <span>{is3D ? "3D ON" : "3D OFF"}</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={initGame}
            className="text-xs px-3 py-1 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
          >
            <i className="fa-solid fa-arrow-rotate-left mr-1.5"></i>
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Main Grid Wrapper */}
      <div className="relative">
        <TetrisBoard
          board={board}
          activePiece={activePiece}
          nextQueue={nextQueue}
          holdPiece={holdPiece}
          canHold={canHold}
          score={score}
          level={level}
          lines={lines}
          garbageQueueCount={0}
          isGameOver={isGameOver && showWinnerModal}
          playerName="PILOT CORE"
        />

        {/* Floating Pause Screen Overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-40 rounded-3xl border border-slate-800">
            <span className="font-orbitron font-black text-3xl tracking-widest text-cyan-400 animate-pulse">
              MATRIX PAUSED
            </span>
            <p className="text-xs text-slate-400 mt-2 tracking-widest uppercase">
              Press ESC or RESUME to reload simulation
            </p>
          </div>
        )}
      </div>

      {/* Winner Pop announcement */}
      {showWinnerModal && (
        <WinnerAnnouncePop
          winnerName="SOLO_COMPLETED"
          score1={score}
          onDismiss={handleDismissWinner}
          onReset={initGame}
        />
      )}
    </section>
  );
}
