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
  getGarbageLinesToSend, 
  addGarbageLines, 
  getGravitySpeed 
} from "@/utils/tetrisLogic";
import { useGameSettings } from "@/components/GameSettingsProvider";

export default function Match() {
  const { playPlace, playFlip, playError, is3D, setIs3D } = useGameSettings();

  // Player 1 state
  const [board1, setBoard1] = useState<BoardState>(createEmptyBoard());
  const [activePiece1, setActivePiece1] = useState<ActivePiece | null>(null);
  const [nextQueue1, setNextQueue1] = useState<TetrominoType[]>([]);
  const [holdPiece1, setHoldPiece1] = useState<TetrominoType | null>(null);
  const [canHold1, setCanHold1] = useState<boolean>(true);
  const [score1, setScore1] = useState<number>(0);
  const [level1, setLevel1] = useState<number>(1);
  const [lines1, setLines1] = useState<number>(0);
  const [garbageQueue1, setGarbageQueue1] = useState<number>(0);
  const [isGameOver1, setIsGameOver1] = useState<boolean>(false);

  // Player 2 state
  const [board2, setBoard2] = useState<BoardState>(createEmptyBoard());
  const [activePiece2, setActivePiece2] = useState<ActivePiece | null>(null);
  const [nextQueue2, setNextQueue2] = useState<TetrominoType[]>([]);
  const [holdPiece2, setHoldPiece2] = useState<TetrominoType | null>(null);
  const [canHold2, setCanHold2] = useState<boolean>(true);
  const [score2, setScore2] = useState<number>(0);
  const [level2, setLevel2] = useState<number>(1);
  const [lines2, setLines2] = useState<number>(0);
  const [garbageQueue2, setGarbageQueue2] = useState<number>(0);
  const [isGameOver2, setIsGameOver2] = useState<boolean>(false);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showWinnerModal, setShowWinnerModal] = useState<boolean>(false);
  const [winnerName, setWinnerName] = useState<string>("");

  // Refs to access states in the event listeners
  const stateRef = useRef({
    board1, activePiece1, nextQueue1, holdPiece1, canHold1, score1, level1, lines1, garbageQueue1, isGameOver1,
    board2, activePiece2, nextQueue2, holdPiece2, canHold2, score2, level2, lines2, garbageQueue2, isGameOver2,
    isPaused
  });

  useEffect(() => {
    stateRef.current = {
      board1, activePiece1, nextQueue1, holdPiece1, canHold1, score1, level1, lines1, garbageQueue1, isGameOver1,
      board2, activePiece2, nextQueue2, holdPiece2, canHold2, score2, level2, lines2, garbageQueue2, isGameOver2,
      isPaused
    };
  }, [
    board1, activePiece1, nextQueue1, holdPiece1, canHold1, score1, level1, lines1, garbageQueue1, isGameOver1,
    board2, activePiece2, nextQueue2, holdPiece2, canHold2, score2, level2, lines2, garbageQueue2, isGameOver2,
    isPaused
  ]);

  const replenishQueue = useCallback((queue: TetrominoType[]) => {
    let q = [...queue];
    while (q.length < 8) {
      q = [...q, ...generateBag()];
    }
    return q;
  }, []);

  // Initialize Game
  const initGame = useCallback(() => {
    const q1 = replenishQueue([]);
    const first1 = q1.shift()!;
    const q2 = replenishQueue([]);
    const first2 = q2.shift()!;

    setBoard1(createEmptyBoard());
    setActivePiece1(spawnPiece(first1));
    setNextQueue1(replenishQueue(q1));
    setHoldPiece1(null);
    setCanHold1(true);
    setScore1(0);
    setLevel1(1);
    setLines1(0);
    setGarbageQueue1(0);
    setIsGameOver1(false);

    setBoard2(createEmptyBoard());
    setActivePiece2(spawnPiece(first2));
    setNextQueue2(replenishQueue(q2));
    setHoldPiece2(null);
    setCanHold2(true);
    setScore2(0);
    setLevel2(1);
    setLines2(0);
    setGarbageQueue2(0);
    setIsGameOver2(false);

    setIsPaused(false);
    setShowWinnerModal(false);
    setWinnerName("");
  }, [replenishQueue]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Handle game termination when a gameover occurs
  useEffect(() => {
    if (isGameOver1 || isGameOver2) {
      if (isGameOver1 && isGameOver2) {
        setWinnerName("DRAW");
      } else if (isGameOver1) {
        setWinnerName("PLAYER 2");
      } else {
        setWinnerName("PLAYER 1");
      }
      setShowWinnerModal(true);
    }
  }, [isGameOver1, isGameOver2]);

  // Lock function for P1
  const lockPiece1 = useCallback((piece: ActivePiece, currentBoard: BoardState) => {
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
            if (boardY >= 4) lockedAboveVisible = false;
          }
        }
      }
    }

    if (lockedAboveVisible) {
      setIsGameOver1(true);
      setActivePiece1(null);
      return;
    }

    // Line clearing & attack calculation
    let { board: clearedBoard, clearedCount } = clearLines(nextBoard);
    
    if (clearedCount > 0) {
      playPlace();
      setLines1(prev => {
        const nextLines = prev + clearedCount;
        if (nextLines >= stateRef.current.level1 * 10) {
          setLevel1(l => l + 1);
        }
        return nextLines;
      });
      setScore1(prev => prev + getScoreForLines(clearedCount, stateRef.current.level1));

      // Garbage Attack logic
      let attack = getGarbageLinesToSend(clearedCount);
      if (attack > 0) {
        // Counter incoming garbage first
        const incoming = stateRef.current.garbageQueue1;
        if (incoming > 0) {
          const counter = Math.min(incoming, attack);
          setGarbageQueue1(prev => prev - counter);
          attack -= counter;
        }
        // Send remainder to opponent
        if (attack > 0) {
          setGarbageQueue2(prev => prev + attack);
        }
      }
    } else {
      playPlace();
    }

    // Apply pending garbage lines for P1
    const pendingGarbage = stateRef.current.garbageQueue1;
    if (pendingGarbage > 0) {
      clearedBoard = addGarbageLines(clearedBoard, pendingGarbage);
      setGarbageQueue1(0); // cleared from queue
    }

    setBoard1(clearedBoard);

    // Spawn next
    const nextQ = [...stateRef.current.nextQueue1];
    const nextType = nextQ.shift()!;
    const spawned = spawnPiece(nextType);

    if (checkCollision(clearedBoard, spawned.matrix, spawned.x, spawned.y)) {
      setIsGameOver1(true);
      setActivePiece1(null);
    } else {
      setActivePiece1(spawned);
      setNextQueue1(replenishQueue(nextQ));
      setCanHold1(true);
    }
  }, [playPlace, replenishQueue]);

  // Lock function for P2
  const lockPiece2 = useCallback((piece: ActivePiece, currentBoard: BoardState) => {
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
            if (boardY >= 4) lockedAboveVisible = false;
          }
        }
      }
    }

    if (lockedAboveVisible) {
      setIsGameOver2(true);
      setActivePiece2(null);
      return;
    }

    let { board: clearedBoard, clearedCount } = clearLines(nextBoard);

    if (clearedCount > 0) {
      playPlace();
      setLines2(prev => {
        const nextLines = prev + clearedCount;
        if (nextLines >= stateRef.current.level2 * 10) {
          setLevel2(l => l + 1);
        }
        return nextLines;
      });
      setScore2(prev => prev + getScoreForLines(clearedCount, stateRef.current.level2));

      // Garbage Attack logic
      let attack = getGarbageLinesToSend(clearedCount);
      if (attack > 0) {
        // Counter incoming
        const incoming = stateRef.current.garbageQueue2;
        if (incoming > 0) {
          const counter = Math.min(incoming, attack);
          setGarbageQueue2(prev => prev - counter);
          attack -= counter;
        }
        // Send remainder
        if (attack > 0) {
          setGarbageQueue1(prev => prev + attack);
        }
      }
    } else {
      playPlace();
    }

    // Apply pending garbage lines for P2
    const pendingGarbage = stateRef.current.garbageQueue2;
    if (pendingGarbage > 0) {
      clearedBoard = addGarbageLines(clearedBoard, pendingGarbage);
      setGarbageQueue2(0);
    }

    setBoard2(clearedBoard);

    // Spawn next
    const nextQ = [...stateRef.current.nextQueue2];
    const nextType = nextQ.shift()!;
    const spawned = spawnPiece(nextType);

    if (checkCollision(clearedBoard, spawned.matrix, spawned.x, spawned.y)) {
      setIsGameOver2(true);
      setActivePiece2(null);
    } else {
      setActivePiece2(spawned);
      setNextQueue2(replenishQueue(nextQ));
      setCanHold2(true);
    }
  }, [playPlace, replenishQueue]);

  // Tick gravity for P1
  const handleTick1 = useCallback(() => {
    const s = stateRef.current;
    if (s.isPaused || s.isGameOver1 || s.isGameOver2 || !s.activePiece1) return;

    const piece = s.activePiece1;
    const currBoard = s.board1;

    if (!checkCollision(currBoard, piece.matrix, piece.x, piece.y + 1)) {
      setActivePiece1({ ...piece, y: piece.y + 1 });
    } else {
      lockPiece1(piece, currBoard);
    }
  }, [lockPiece1]);

  // Tick gravity for P2
  const handleTick2 = useCallback(() => {
    const s = stateRef.current;
    if (s.isPaused || s.isGameOver1 || s.isGameOver2 || !s.activePiece2) return;

    const piece = s.activePiece2;
    const currBoard = s.board2;

    if (!checkCollision(currBoard, piece.matrix, piece.x, piece.y + 1)) {
      setActivePiece2({ ...piece, y: piece.y + 1 });
    } else {
      lockPiece2(piece, currBoard);
    }
  }, [lockPiece2]);

  // Gravity intervals
  useEffect(() => {
    if (isPaused || isGameOver1 || isGameOver2) return;
    const interval1 = setInterval(handleTick1, getGravitySpeed(level1));
    return () => clearInterval(interval1);
  }, [level1, isPaused, isGameOver1, isGameOver2, handleTick1]);

  useEffect(() => {
    if (isPaused || isGameOver1 || isGameOver2) return;
    const interval2 = setInterval(handleTick2, getGravitySpeed(level2));
    return () => clearInterval(interval2);
  }, [level2, isPaused, isGameOver1, isGameOver2, handleTick2]);

  // Key Event Listener
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const s = stateRef.current;
    if (s.isPaused || s.isGameOver1 || s.isGameOver2) return;

    // --- PLAYER 1 (Left Field) CONTROLS ---
    if (s.activePiece1) {
      const p = s.activePiece1;
      const b = s.board1;

      switch (e.key.toLowerCase()) {
        case "a":
          if (!checkCollision(b, p.matrix, p.x - 1, p.y)) setActivePiece1({ ...p, x: p.x - 1 });
          else playError();
          e.preventDefault();
          break;
        case "d":
          if (!checkCollision(b, p.matrix, p.x + 1, p.y)) setActivePiece1({ ...p, x: p.x + 1 });
          else playError();
          e.preventDefault();
          break;
        case "s":
          if (!checkCollision(b, p.matrix, p.x, p.y + 1)) {
            setActivePiece1({ ...p, y: p.y + 1 });
            setScore1(prev => prev + 1);
          }
          e.preventDefault();
          break;
        case "w":
          const ghostY = getGhostPosition(b, p);
          const dropDist = ghostY - p.y;
          setScore1(prev => prev + dropDist * 2);
          lockPiece1({ ...p, y: ghostY }, b);
          e.preventDefault();
          break;
        case "q":
          const rotQ = rotatePiece(b, p, false);
          if (rotQ) {
            playFlip();
            setActivePiece1({ ...p, ...rotQ });
          } else playError();
          e.preventDefault();
          break;
        case "e":
          const rotE = rotatePiece(b, p, true);
          if (rotE) {
            playFlip();
            setActivePiece1({ ...p, ...rotE });
          } else playError();
          e.preventDefault();
          break;
        case " ":
          if (!s.canHold1) {
            playError();
            return;
          }
          playFlip();
          const currType = p.type;
          const heldType = s.holdPiece1;
          const nextQ = [...s.nextQueue1];
          setHoldPiece1(currType);
          if (heldType) {
            setActivePiece1(spawnPiece(heldType));
          } else {
            const nextType = nextQ.shift()!;
            setActivePiece1(spawnPiece(nextType));
            setNextQueue1(replenishQueue(nextQ));
          }
          setCanHold1(false);
          e.preventDefault();
          break;
        default:
          break;
      }
    }

    // --- PLAYER 2 (Right Field) CONTROLS ---
    if (s.activePiece2) {
      const p = s.activePiece2;
      const b = s.board2;

      switch (e.key) {
        case "ArrowLeft":
          if (!checkCollision(b, p.matrix, p.x - 1, p.y)) setActivePiece2({ ...p, x: p.x - 1 });
          else playError();
          e.preventDefault();
          break;
        case "ArrowRight":
          if (!checkCollision(b, p.matrix, p.x + 1, p.y)) setActivePiece2({ ...p, x: p.x + 1 });
          else playError();
          e.preventDefault();
          break;
        case "ArrowDown":
          if (!checkCollision(b, p.matrix, p.x, p.y + 1)) {
            setActivePiece2({ ...p, y: p.y + 1 });
            setScore2(prev => prev + 1);
          }
          e.preventDefault();
          break;
        case "ArrowUp":
          const ghostY = getGhostPosition(b, p);
          const dropDist = ghostY - p.y;
          setScore2(prev => prev + dropDist * 2);
          lockPiece2({ ...p, y: ghostY }, b);
          e.preventDefault();
          break;
        case ".":
          const rotDot = rotatePiece(b, p, false);
          if (rotDot) {
            playFlip();
            setActivePiece2({ ...p, ...rotDot });
          } else playError();
          e.preventDefault();
          break;
        case "/":
          const rotSlash = rotatePiece(b, p, true);
          if (rotSlash) {
            playFlip();
            setActivePiece2({ ...p, ...rotSlash });
          } else playError();
          e.preventDefault();
          break;
        case "Enter":
        case "Shift":
          // Right Shift or Enter (filtered if it's P1 Shift)
          if (e.code === "ShiftLeft") break;
          
          if (!s.canHold2) {
            playError();
            return;
          }
          playFlip();
          const currType = p.type;
          const heldType = s.holdPiece2;
          const nextQ = [...s.nextQueue2];
          setHoldPiece2(currType);
          if (heldType) {
            setActivePiece2(spawnPiece(heldType));
          } else {
            const nextType = nextQ.shift()!;
            setActivePiece2(spawnPiece(nextType));
            setNextQueue2(replenishQueue(nextQ));
          }
          setCanHold2(false);
          e.preventDefault();
          break;
        default:
          break;
      }
    }
  }, [lockPiece1, lockPiece2, playFlip, playError, replenishQueue]);

  // Key Event binding
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleDismissWinner = () => {
    setShowWinnerModal(false);
  };

  return (
    <section className="w-full max-w-7xl flex flex-col items-center justify-center z-10 transition-all duration-500 my-auto">
      {/* Control / Config bar */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-6 px-4 select-none">
        <span className="text-xs font-orbitron font-bold tracking-widest text-cyan-400 uppercase bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-1.5 rounded-full">
          DUAL MATRIX SPLIT
        </span>
        <div className="flex space-x-2">
          {/* Pause Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`text-xs px-3.5 py-1.5 rounded-full border transition-all ${
              isPaused 
                ? "bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold" 
                : "border-slate-700 text-slate-400 hover:bg-white/5"
            }`}
          >
            <i className={`fa-solid ${isPaused ? "fa-play mr-1.5" : "fa-pause mr-1.5"}`}></i>
            <span>{isPaused ? "RESUME" : "PAUSE"}</span>
          </button>
          
          {/* 3D view toggle */}
          <button 
            onClick={() => setIs3D(!is3D)} 
            className={`text-xs flex items-center space-x-1 px-3.5 py-1.5 rounded-full border transition-all ${
              is3D
                ? "bg-pink-500/10 border-pink-500/50 text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.2)]"
                : "border-slate-700 text-slate-400 hover:bg-white/5"
            }`}
          >
            <i className="fa-solid fa-cube mr-1.5"></i>
            <span>{is3D ? "3D ON" : "3D OFF"}</span>
          </button>

          {/* Reset */}
          <button
            onClick={initGame}
            className="text-xs px-3.5 py-1.5 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all animate-pulse"
          >
            <i className="fa-solid fa-arrow-rotate-left mr-1.5"></i>
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Duel Fields Grid */}
      <div className="w-full grid lg:grid-cols-2 gap-8 items-start relative px-4">
        {/* Left Side: P1 */}
        <div className="flex justify-center relative">
          <TetrisBoard
            board={board1}
            activePiece={activePiece1}
            nextQueue={nextQueue1}
            holdPiece={holdPiece1}
            canHold={canHold1}
            score={score1}
            level={level1}
            lines={lines1}
            garbageQueueCount={garbageQueue1}
            isGameOver={isGameOver1 && showWinnerModal}
            playerName="PLAYER 1"
          />
        </div>

        {/* Right Side: P2 */}
        <div className="flex justify-center relative">
          <TetrisBoard
            board={board2}
            activePiece={activePiece2}
            nextQueue={nextQueue2}
            holdPiece={holdPiece2}
            canHold={canHold2}
            score={score2}
            level={level2}
            lines={lines2}
            garbageQueueCount={garbageQueue2}
            isGameOver={isGameOver2 && showWinnerModal}
            playerName="PLAYER 2"
          />
        </div>

        {/* Floating Pause Screen Overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-40 rounded-3xl border border-slate-800 m-4">
            <span className="font-orbitron font-black text-4xl tracking-widest text-cyan-400 animate-pulse">
              SIMULATION PAUSED
            </span>
            <p className="text-xs text-slate-400 mt-2 tracking-widest uppercase">
              Press RESUME to restart game loop
            </p>
          </div>
        )}
      </div>

      {/* Winner Popup */}
      {showWinnerModal && (
        <WinnerAnnouncePop
          winnerName={winnerName}
          score1={score1}
          score2={score2}
          p1Name="PLAYER 1"
          p2Name="PLAYER 2"
          onDismiss={handleDismissWinner}
          onReset={initGame}
        />
      )}
    </section>
  );
}
