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
import { getAdjustedAIMove, AIType, AIMove } from "@/utils/tetrisAI";
import { useGameSettings } from "@/components/GameSettingsProvider";

export default function AIvsAI() {
  const { playPlace, playFlip, playError, is3D, setIs3D } = useGameSettings();

  const [aiLevel1, setAiLevel1] = useState<AIType>("hard");
  const [aiLevel2, setAiLevel2] = useState<AIType>("hard");
  const [gameSpeed, setGameSpeed] = useState<number>(80);

  // AI 1 state (Left)
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

  // AI 2 state (Right)
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

  // AI autopilot trackers
  const aiThinking1 = useRef<boolean>(false);
  const aiTarget1 = useRef<{ x: number; rotCount: number } | null>(null);
  const aiCurrentRot1 = useRef<number>(0);
  const aiLockBlocker1 = useRef<boolean>(false);

  const aiThinking2 = useRef<boolean>(false);
  const aiTarget2 = useRef<{ x: number; rotCount: number } | null>(null);
  const aiCurrentRot2 = useRef<number>(0);
  const aiLockBlocker2 = useRef<boolean>(false);

  // Refs for state access
  const stateRef = useRef({
    board1, activePiece1, nextQueue1, holdPiece1, canHold1, score1, level1, lines1, garbageQueue1, isGameOver1, aiLevel1,
    board2, activePiece2, nextQueue2, holdPiece2, canHold2, score2, level2, lines2, garbageQueue2, isGameOver2, aiLevel2,
    isPaused, gameSpeed
  });

  useEffect(() => {
    stateRef.current = {
      board1, activePiece1, nextQueue1, holdPiece1, canHold1, score1, level1, lines1, garbageQueue1, isGameOver1, aiLevel1,
      board2, activePiece2, nextQueue2, holdPiece2, canHold2, score2, level2, lines2, garbageQueue2, isGameOver2, aiLevel2,
      isPaused, gameSpeed
    };
  }, [
    board1, activePiece1, nextQueue1, holdPiece1, canHold1, score1, level1, lines1, garbageQueue1, isGameOver1, aiLevel1,
    board2, activePiece2, nextQueue2, holdPiece2, canHold2, score2, level2, lines2, garbageQueue2, isGameOver2, aiLevel2,
    isPaused, gameSpeed
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

    aiThinking1.current = false;
    aiTarget1.current = null;
    aiCurrentRot1.current = 0;
    aiLockBlocker1.current = false;

    aiThinking2.current = false;
    aiTarget2.current = null;
    aiCurrentRot2.current = 0;
    aiLockBlocker2.current = false;

    setIsPaused(false);
    setShowWinnerModal(false);
    setWinnerName("");
  }, [replenishQueue]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Handle game termination
  useEffect(() => {
    if (isGameOver1 || isGameOver2) {
      if (isGameOver1 && isGameOver2) {
        setWinnerName("DRAW");
      } else if (isGameOver1) {
        setWinnerName("AI CORE 2 (RIGHT)");
      } else {
        setWinnerName("AI CORE 1 (LEFT)");
      }
      setShowWinnerModal(true);
    }
  }, [isGameOver1, isGameOver2]);

  // Lock function P1
  const lockPiece1 = useCallback((piece: ActivePiece, currentBoard: BoardState) => {
    if (aiLockBlocker1.current) return;
    aiLockBlocker1.current = true;

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

      let attack = getGarbageLinesToSend(clearedCount);
      if (attack > 0) {
        const incoming = stateRef.current.garbageQueue1;
        if (incoming > 0) {
          const counter = Math.min(incoming, attack);
          setGarbageQueue1(prev => prev - counter);
          attack -= counter;
        }
        if (attack > 0) {
          setGarbageQueue2(prev => prev + attack);
        }
      }
    } else {
      playPlace();
    }

    const pendingGarbage = stateRef.current.garbageQueue1;
    if (pendingGarbage > 0) {
      clearedBoard = addGarbageLines(clearedBoard, pendingGarbage);
      setGarbageQueue1(0);
    }

    setBoard1(clearedBoard);

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

      aiTarget1.current = null;
      aiCurrentRot1.current = 0;
      aiThinking1.current = false;
      aiLockBlocker1.current = false;
    }
  }, [playPlace, replenishQueue]);

  // Lock function P2
  const lockPiece2 = useCallback((piece: ActivePiece, currentBoard: BoardState) => {
    if (aiLockBlocker2.current) return;
    aiLockBlocker2.current = true;

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

      let attack = getGarbageLinesToSend(clearedCount);
      if (attack > 0) {
        const incoming = stateRef.current.garbageQueue2;
        if (incoming > 0) {
          const counter = Math.min(incoming, attack);
          setGarbageQueue2(prev => prev - counter);
          attack -= counter;
        }
        if (attack > 0) {
          setGarbageQueue1(prev => prev + attack);
        }
      }
    } else {
      playPlace();
    }

    const pendingGarbage = stateRef.current.garbageQueue2;
    if (pendingGarbage > 0) {
      clearedBoard = addGarbageLines(clearedBoard, pendingGarbage);
      setGarbageQueue2(0);
    }

    setBoard2(clearedBoard);

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

      aiTarget2.current = null;
      aiCurrentRot2.current = 0;
      aiThinking2.current = false;
      aiLockBlocker2.current = false;
    }
  }, [playPlace, replenishQueue]);

  // AI 1 Solver
  const triggerAIDecision1 = useCallback(() => {
    const s = stateRef.current;
    if (s.isPaused || s.isGameOver1 || s.isGameOver2 || !s.activePiece1 || aiThinking1.current || aiTarget1.current) return;

    aiThinking1.current = true;

    // Latency weight based on AIType
    let factor = 1;
    if (s.aiLevel1 === 'easy') factor = 6;
    else if (s.aiLevel1 === 'normal') factor = 3;
    else if (s.aiLevel1 === 'hard') factor = 1;
    else if (s.aiLevel1 === 'aggressive') factor = 0.8;
    else if (s.aiLevel1 === 'defensive') factor = 0.8;

    const baseDelay = s.gameSpeed * factor;

    setTimeout(() => {
      const state = stateRef.current;
      if (state.isPaused || state.isGameOver1 || state.isGameOver2 || !state.activePiece1) {
        aiThinking1.current = false;
        return;
      }

      const piece = state.activePiece1;
      const b = state.board1;

      const decision = getAdjustedAIMove(
        b,
        piece.type,
        state.nextQueue1[0],
        state.holdPiece1,
        state.canHold1,
        state.aiLevel1
      );

      if (decision.shouldHold && state.canHold1) {
        playFlip();
        const currType = piece.type;
        const heldType = state.holdPiece1;
        const nextQ = [...state.nextQueue1];

        setHoldPiece1(currType);
        if (heldType) {
          setActivePiece1(spawnPiece(heldType));
        } else {
          const nextType = nextQ.shift()!;
          setActivePiece1(spawnPiece(nextType));
          setNextQueue1(replenishQueue(nextQ));
        }
        setCanHold1(false);

        aiThinking1.current = false;
        aiTarget1.current = null;
        aiCurrentRot1.current = 0;
      } else {
        aiTarget1.current = {
          x: decision.x,
          rotCount: decision.rotationCount
        };
        aiCurrentRot1.current = 0;
        aiThinking1.current = false;
      }
    }, baseDelay);
  }, [playFlip, replenishQueue]);

  // AI 2 Solver
  const triggerAIDecision2 = useCallback(() => {
    const s = stateRef.current;
    if (s.isPaused || s.isGameOver1 || s.isGameOver2 || !s.activePiece2 || aiThinking2.current || aiTarget2.current) return;

    aiThinking2.current = true;

    // Latency weight based on AIType
    let factor = 1;
    if (s.aiLevel2 === 'easy') factor = 6;
    else if (s.aiLevel2 === 'normal') factor = 3;
    else if (s.aiLevel2 === 'hard') factor = 1;
    else if (s.aiLevel2 === 'aggressive') factor = 0.8;
    else if (s.aiLevel2 === 'defensive') factor = 0.8;

    const baseDelay = s.gameSpeed * factor;

    setTimeout(() => {
      const state = stateRef.current;
      if (state.isPaused || state.isGameOver1 || state.isGameOver2 || !state.activePiece2) {
        aiThinking2.current = false;
        return;
      }

      const piece = state.activePiece2;
      const b = state.board2;

      const decision = getAdjustedAIMove(
        b,
        piece.type,
        state.nextQueue2[0],
        state.holdPiece2,
        state.canHold2,
        state.aiLevel2
      );

      if (decision.shouldHold && state.canHold2) {
        playFlip();
        const currType = piece.type;
        const heldType = state.holdPiece2;
        const nextQ = [...state.nextQueue2];

        setHoldPiece2(currType);
        if (heldType) {
          setActivePiece2(spawnPiece(heldType));
        } else {
          const nextType = nextQ.shift()!;
          setActivePiece2(spawnPiece(nextType));
          setNextQueue2(replenishQueue(nextQ));
        }
        setCanHold2(false);

        aiThinking2.current = false;
        aiTarget2.current = null;
        aiCurrentRot2.current = 0;
      } else {
        aiTarget2.current = {
          x: decision.x,
          rotCount: decision.rotationCount
        };
        aiCurrentRot2.current = 0;
        aiThinking2.current = false;
      }
    }, baseDelay);
  }, [playFlip, replenishQueue]);

  // Unified AI Actuator Loop
  useEffect(() => {
    if (isPaused || isGameOver1 || isGameOver2) return;

    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.isPaused || s.isGameOver1 || s.isGameOver2) return;

      // AI 1 Step
      if (s.activePiece1) {
        const piece = s.activePiece1;
        const b = s.board1;

        if (!aiTarget1.current && !aiThinking1.current) {
          triggerAIDecision1();
        } else if (aiTarget1.current && !aiThinking1.current) {
          const target = aiTarget1.current;
          let acted = false;

          if (aiCurrentRot1.current < target.rotCount) {
            const rotated = rotatePiece(b, piece, true);
            if (rotated) {
              setActivePiece1({ ...piece, ...rotated });
              aiCurrentRot1.current++;
              acted = true;
            } else {
              aiCurrentRot1.current = target.rotCount;
            }
          }

          if (!acted && piece.x !== target.x) {
            const dx = target.x - piece.x;
            const step = dx > 0 ? 1 : -1;
            if (!checkCollision(b, piece.matrix, piece.x + step, piece.y)) {
              setActivePiece1({ ...piece, x: piece.x + step });
              acted = true;
            } else {
              target.x = piece.x;
            }
          }

          if (!acted && aiCurrentRot1.current === target.rotCount && piece.x === target.x) {
            const finalY = getGhostPosition(b, piece);
            lockPiece1({ ...piece, y: finalY }, b);
          }
        }
      }

      // AI 2 Step
      if (s.activePiece2) {
        const piece = s.activePiece2;
        const b = s.board2;

        if (!aiTarget2.current && !aiThinking2.current) {
          triggerAIDecision2();
        } else if (aiTarget2.current && !aiThinking2.current) {
          const target = aiTarget2.current;
          let acted = false;

          if (aiCurrentRot2.current < target.rotCount) {
            const rotated = rotatePiece(b, piece, true);
            if (rotated) {
              setActivePiece2({ ...piece, ...rotated });
              aiCurrentRot2.current++;
              acted = true;
            } else {
              aiCurrentRot2.current = target.rotCount;
            }
          }

          if (!acted && piece.x !== target.x) {
            const dx = target.x - piece.x;
            const step = dx > 0 ? 1 : -1;
            if (!checkCollision(b, piece.matrix, piece.x + step, piece.y)) {
              setActivePiece2({ ...piece, x: piece.x + step });
              acted = true;
            } else {
              target.x = piece.x;
            }
          }

          if (!acted && aiCurrentRot2.current === target.rotCount && piece.x === target.x) {
            const finalY = getGhostPosition(b, piece);
            lockPiece2({ ...piece, y: finalY }, b);
          }
        }
      }

    }, gameSpeed);

    return () => clearInterval(interval);
  }, [isPaused, isGameOver1, isGameOver2, gameSpeed, triggerAIDecision1, triggerAIDecision2, lockPiece1, lockPiece2]);

  const handleDismissWinner = () => {
    setShowWinnerModal(false);
  };

  return (
    <section className="w-full max-w-7xl flex flex-col items-center justify-center z-10 transition-all duration-500 my-auto">
      
      {/* Simulation Dashboard Panel */}
      <div className="w-full max-w-5xl flex flex-col space-y-4 mb-6 px-4 select-none bg-slate-900/40 border border-slate-800 p-4 rounded-3xl backdrop-blur-md">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <span className="text-xs font-orbitron font-black tracking-widest text-cyan-400 uppercase bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full animate-pulse">
            EVE SYSTEM SYNC
          </span>

          <div className="flex items-center space-x-3">
            {/* Speed slider */}
            <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs">
              <span className="text-slate-400 font-orbitron font-bold">SPEED:</span>
              <input 
                type="range" 
                min="10" 
                max="300" 
                value={gameSpeed} 
                onChange={(e) => setGameSpeed(Number(e.target.value))}
                className="w-24 accent-pink-500 cursor-pointer"
              />
              <span className="text-white font-orbitron font-bold w-12 text-right">{gameSpeed}ms</span>
            </div>

            {/* Pause */}
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
              <span>{is3D ? "3D" : "2D"}</span>
            </button>

            {/* Reset */}
            <button
              onClick={initGame}
              className="text-xs px-3.5 py-1.5 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
            >
              <i className="fa-solid fa-arrow-rotate-left mr-1.5"></i>
              <span>RESET</span>
            </button>
          </div>
        </div>

        {/* 5 columns selection */}
        <div className="flex flex-wrap gap-4 justify-around border-t border-slate-800/80 pt-3 text-[10px] font-orbitron font-bold">
          <div className="flex items-center space-x-2">
            <span className="text-cyan-400">AI 1 (LEFT) LEVEL:</span>
            <div className="flex space-x-1 bg-white/5 border border-white/10 rounded-full p-0.5">
              {(["easy", "normal", "hard", "aggressive", "defensive"] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setAiLevel1(level)}
                  className={`px-2 py-0.5 rounded-full uppercase transition-all ${
                    aiLevel1 === level 
                      ? level === 'aggressive'
                        ? "bg-red-500 text-white"
                        : level === 'defensive'
                        ? "bg-emerald-500 text-white"
                        : "bg-cyan-500 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-pink-400">AI 2 (RIGHT) LEVEL:</span>
            <div className="flex space-x-1 bg-white/5 border border-white/10 rounded-full p-0.5">
              {(["easy", "normal", "hard", "aggressive", "defensive"] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setAiLevel2(level)}
                  className={`px-2 py-0.5 rounded-full uppercase transition-all ${
                    aiLevel2 === level 
                      ? level === 'aggressive'
                        ? "bg-red-500 text-white"
                        : level === 'defensive'
                        ? "bg-emerald-500 text-white"
                        : "bg-pink-500 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dual Fields Grid */}
      <div className="w-full grid lg:grid-cols-2 gap-8 items-start relative px-4">
        {/* Left: AI 1 */}
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
            playerName={`AI CORE 1 (${aiLevel1.toUpperCase()})`}
            isAI={true}
          />
        </div>

        {/* Right: AI 2 */}
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
            playerName={`AI CORE 2 (${aiLevel2.toUpperCase()})`}
            isAI={true}
          />
        </div>

        {/* Floating Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-40 rounded-3xl border border-slate-800 m-4">
            <span className="font-orbitron font-black text-4xl tracking-widest text-cyan-400 animate-pulse">
              SIMULATION PAUSED
            </span>
            <p className="text-xs text-slate-400 mt-2 tracking-widest uppercase">
              Press RESUME to reload simulation
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
          p1Name="AI CORE 1"
          p2Name="AI CORE 2"
          onDismiss={handleDismissWinner}
          onReset={initGame}
        />
      )}
    </section>
  );
}