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

export default function VsAI() {
  const { playPlace, playFlip, playError, is3D, setIs3D } = useGameSettings();

  const [aiLevel, setAiLevel] = useState<AIType>("normal");

  // Payment Unlock state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [playsCount, setPlaysCount] = useState<number>(0);

  const playsCountRef = useRef(playsCount);
  useEffect(() => { playsCountRef.current = playsCount; }, [playsCount]);

  // Player state
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

  // AI state
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

  // AI control refs
  const aiThinkingRef = useRef<boolean>(false);
  const aiTargetRef = useRef<{ x: number; rotCount: number } | null>(null);
  const aiCurrentRotRef = useRef<number>(0);
  const aiLockBlockerRef = useRef<boolean>(false);

  // Refs for state tracking in handlers
  const stateRef = useRef({
    board1, activePiece1, nextQueue1, holdPiece1, canHold1, score1, level1, lines1, garbageQueue1, isGameOver1,
    board2, activePiece2, nextQueue2, holdPiece2, canHold2, score2, level2, lines2, garbageQueue2, isGameOver2,
    isPaused, aiLevel, isUnlocked, playsCount
  });

  useEffect(() => {
    stateRef.current = {
      board1, activePiece1, nextQueue1, holdPiece1, canHold1, score1, level1, lines1, garbageQueue1, isGameOver1,
      board2, activePiece2, nextQueue2, holdPiece2, canHold2, score2, level2, lines2, garbageQueue2, isGameOver2,
      isPaused, aiLevel, isUnlocked, playsCount
    };
  }, [
    board1, activePiece1, nextQueue1, holdPiece1, canHold1, score1, level1, lines1, garbageQueue1, isGameOver1,
    board2, activePiece2, nextQueue2, holdPiece2, canHold2, score2, level2, lines2, garbageQueue2, isGameOver2,
    isPaused, aiLevel, isUnlocked, playsCount
  ]);

  // Payment Verification & Auto checkout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const plays = parseInt(localStorage.getItem('tetris_vsai_plays_count') || '0', 10);
      setPlaysCount(plays);

      const isAlreadyUnlocked = localStorage.getItem('tetris_vsai_unlocked') === 'true';
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      const checkoutTrigger = params.get('checkout');

      if (sessionId) {
        localStorage.setItem('tetris_vsai_unlocked', 'true');
        setIsUnlocked(true);
        window.history.replaceState(null, "", window.location.pathname);
      } else if (isAlreadyUnlocked) {
        setIsUnlocked(true);
      }

      if (checkoutTrigger === 'true' && !isAlreadyUnlocked) {
        handleStripeCheckout();
      }
    }
  }, []);

  async function handleStripeCheckout() {
    setIsPaying(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('決済セッションの生成に失敗しました。');
        setIsPaying(false);
      }
    } catch (error) {
      console.error(error);
      alert('ネットワークエラーが発生しました。');
      setIsPaying(false);
    }
  }

  const handleMockUnlock = () => {
    localStorage.setItem('tetris_vsai_unlocked', 'true');
    setIsUnlocked(true);
  };

  const replenishQueue = useCallback((queue: TetrominoType[]) => {
    let q = [...queue];
    while (q.length < 8) {
      q = [...q, ...generateBag()];
    }
    return q;
  }, []);

  // Initialize Game
  const initGame = useCallback(() => {
    const isAlreadyUnlocked = stateRef.current.isUnlocked;
    const currentPlays = parseInt(localStorage.getItem('tetris_vsai_plays_count') || '0', 10);
    
    if (!isAlreadyUnlocked && currentPlays >= 2) {
      return;
    }

    if (!isAlreadyUnlocked) {
      const nextPlays = currentPlays + 1;
      localStorage.setItem('tetris_vsai_plays_count', nextPlays.toString());
      setPlaysCount(nextPlays);
    }

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

    aiThinkingRef.current = false;
    aiTargetRef.current = null;
    aiCurrentRotRef.current = 0;
    aiLockBlockerRef.current = false;

    setIsPaused(false);
    setShowWinnerModal(false);
    setWinnerName("");
  }, [replenishQueue]);

  // Trigger init on unlock or trial
  useEffect(() => {
    const isAlreadyUnlocked = localStorage.getItem('tetris_vsai_unlocked') === 'true';
    const currentPlays = parseInt(localStorage.getItem('tetris_vsai_plays_count') || '0', 10);
    if (isUnlocked || (currentPlays < 2)) {
      initGame();
    }
  }, [isUnlocked, initGame]);

  // Handle game termination
  useEffect(() => {
    if (isGameOver1 || isGameOver2) {
      if (isGameOver1 && isGameOver2) {
        setWinnerName("DRAW");
      } else if (isGameOver1) {
        setWinnerName("CPU");
      } else {
        setWinnerName("PLAYER");
      }
      setShowWinnerModal(true);
    }
  }, [isGameOver1, isGameOver2]);

  // Lock function for Human (P1)
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
    }
  }, [playPlace, replenishQueue]);

  // Lock function for AI (P2)
  const lockPiece2 = useCallback((piece: ActivePiece, currentBoard: BoardState) => {
    if (aiLockBlockerRef.current) return;
    aiLockBlockerRef.current = true;

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
      
      aiTargetRef.current = null;
      aiCurrentRotRef.current = 0;
      aiThinkingRef.current = false;
      aiLockBlockerRef.current = false;
    }
  }, [playPlace, replenishQueue]);

  // Tick gravity for Human (P1)
  const handleTick1 = useCallback(() => {
    const s = stateRef.current;
    if (!(s.isUnlocked || playsCountRef.current <= 2) || s.isPaused || s.isGameOver1 || s.isGameOver2 || !s.activePiece1) return;

    const piece = s.activePiece1;
    const currBoard = s.board1;

    if (!checkCollision(currBoard, piece.matrix, piece.x, piece.y + 1)) {
      setActivePiece1({ ...piece, y: piece.y + 1 });
    } else {
      lockPiece1(piece, currBoard);
    }
  }, [lockPiece1]);

  // Interval for Human gravity
  useEffect(() => {
    if (!(isUnlocked || playsCount <= 2) || isPaused || isGameOver1 || isGameOver2) return;
    const interval1 = setInterval(handleTick1, getGravitySpeed(level1));
    return () => clearInterval(interval1);
  }, [isUnlocked, playsCount, level1, isPaused, isGameOver1, isGameOver2, handleTick1]);

  // --- AI DECISION & ACTION LOOP ---
  
  // AI Decision Solver
  const triggerAIDecision = useCallback(() => {
    const s = stateRef.current;
    if (!(s.isUnlocked || playsCountRef.current <= 2) || s.isPaused || s.isGameOver1 || s.isGameOver2 || !s.activePiece2 || aiThinkingRef.current || aiTargetRef.current) return;

    aiThinkingRef.current = true;

    let delay = 400;
    if (s.aiLevel === 'easy') delay = 800;
    else if (s.aiLevel === 'normal') delay = 400;
    else if (s.aiLevel === 'hard') delay = 150;
    else if (s.aiLevel === 'aggressive') delay = 120;
    else if (s.aiLevel === 'defensive') delay = 120;

    setTimeout(() => {
      const state = stateRef.current;
      if (!(state.isUnlocked || playsCountRef.current <= 2) || state.isPaused || state.isGameOver1 || state.isGameOver2 || !state.activePiece2) {
        aiThinkingRef.current = false;
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
        state.aiLevel
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

        aiThinkingRef.current = false;
        aiTargetRef.current = null;
        aiCurrentRotRef.current = 0;
      } else {
        aiTargetRef.current = {
          x: decision.x,
          rotCount: decision.rotationCount
        };
        aiCurrentRotRef.current = 0;
        aiThinkingRef.current = false;
      }
    }, delay);
  }, [playFlip, replenishQueue]);

  // AI Autopilot Actuator Loop
  useEffect(() => {
    if (!(isUnlocked || playsCount <= 2) || isPaused || isGameOver1 || isGameOver2) return;

    const interval = setInterval(() => {
      const s = stateRef.current;
      if (!(s.isUnlocked || playsCountRef.current <= 2) || s.isPaused || s.isGameOver1 || s.isGameOver2 || !s.activePiece2) return;

      const piece = s.activePiece2;
      const b = s.board2;

      if (!aiTargetRef.current && !aiThinkingRef.current) {
        triggerAIDecision();
        return;
      }

      if (aiTargetRef.current && !aiThinkingRef.current) {
        const target = aiTargetRef.current;
        let movedOrRotated = false;

        // Perform rotation first
        if (aiCurrentRotRef.current < target.rotCount) {
          const rotated = rotatePiece(b, piece, true);
          if (rotated) {
            setActivePiece2({ ...piece, ...rotated });
            aiCurrentRotRef.current++;
            movedOrRotated = true;
          } else {
            aiCurrentRotRef.current = target.rotCount;
          }
        }

        // Perform horizontal movement
        if (!movedOrRotated && piece.x !== target.x) {
          const dx = target.x - piece.x;
          const step = dx > 0 ? 1 : -1;
          if (!checkCollision(b, piece.matrix, piece.x + step, piece.y)) {
            setActivePiece2({ ...piece, x: piece.x + step });
            movedOrRotated = true;
          } else {
            target.x = piece.x;
          }
        }

        // Reached targets: drop lock
        if (!movedOrRotated && aiCurrentRotRef.current === target.rotCount && piece.x === target.x) {
          const finalY = getGhostPosition(b, piece);
          const finalPiece = { ...piece, y: finalY };
          lockPiece2(finalPiece, b);
        }
      }
    }, 75);

    return () => clearInterval(interval);
  }, [isUnlocked, playsCount, isPaused, isGameOver1, isGameOver2, triggerAIDecision, lockPiece2]);

  // Keys control handler for Human
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const s = stateRef.current;
    if (!(s.isUnlocked || playsCountRef.current <= 2) || s.isPaused || s.isGameOver1 || s.isGameOver2 || !s.activePiece1) return;

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
  }, [lockPiece1, playFlip, playError, replenishQueue]);

  // Keyboard binding
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleDismissWinner = () => {
    setShowWinnerModal(false);
  };

  // Render Stripe Payment Wall Overlay if not unlocked and trial limit reached
  if (!isUnlocked && playsCount >= 2) {
    return (
      <section className="w-full max-w-md p-8 rounded-3xl border border-cyan-500/30 bg-slate-900/60 backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-center text-center select-none z-10 my-auto">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-3xl text-cyan-400 mb-6 animate-pulse">
          <i className="fa-solid fa-lock" />
        </div>

        <span className="text-[10px] font-orbitron font-bold tracking-widest text-pink-500 uppercase block mb-1">
          ACCESS CONTROL PROTOCOL
        </span>
        <h2 className="font-orbitron font-black text-2xl text-white tracking-wider mb-3 leading-snug">
          VS AI対戦へのアクセス制限
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed mb-6 max-w-xs">
          高度な落下軌道探索AIを搭載したシミュレータに接続するには、Stripeによる安全な決済手続き（300円）が必要です。
        </p>

        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
          <span className="text-[9px] text-slate-500 tracking-wider font-orbitron block">CONNECTION FEE</span>
          <span className="font-orbitron text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-200">
            ¥300 <span className="text-xs font-normal text-slate-400">(税込 / 永続アンロック)</span>
          </span>
        </div>

        <button
          onClick={handleStripeCheckout}
          disabled={isPaying}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white tracking-wider text-sm flex items-center justify-center space-x-2 hover:opacity-90 transition-all shadow-[0_4px_20px_rgba(6,182,212,0.4)] disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isPaying ? (
            <>
              <i className="fa-solid fa-spinner animate-spin" />
              <span>接続認証中...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-credit-card" />
              <span>Stripeで決済手続きを行う</span>
            </>
          )}
        </button>

        {/* Mock testing fallback button */}
        <button
          onClick={handleMockUnlock}
          className="mt-6 text-[10px] text-slate-500 hover:text-cyan-400 font-orbitron tracking-widest border border-dashed border-slate-700/50 hover:border-cyan-500/40 rounded-full px-4 py-1.5 transition-all bg-transparent"
        >
          DEVELOPER BYPASS (MOCK CHECKOUT)
        </button>
      </section>
    );
  }

  return (
    <section className="w-full max-w-7xl flex flex-col items-center justify-center z-10 transition-all duration-500 my-auto">
      {/* Control panel */}
      <div className="w-full max-w-5xl flex flex-wrap justify-between items-center mb-6 gap-4 px-4 select-none">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-orbitron font-bold tracking-widest text-cyan-400 uppercase bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-1.5 rounded-full">
            HUMAN vs AI PROTOCOL
          </span>
          {!isUnlocked && (
            <div className="flex items-center space-x-2 bg-pink-500/10 border border-pink-500/20 px-3.5 py-1.5 rounded-full select-none text-[10px] font-orbitron font-bold text-pink-400">
              <span>TRIAL: {Math.max(0, 2 - playsCount)}/2 LEFT</span>
              <button 
                onClick={handleStripeCheckout} 
                className="bg-pink-500 text-slate-950 font-black px-2 py-0.5 rounded hover:bg-pink-400 transition-all text-[9px] uppercase tracking-wider"
              >
                UNLOCK
              </button>
            </div>
          )}
          <div className="flex space-x-1 bg-white/5 border border-white/10 rounded-full p-0.5 text-[9px] font-orbitron font-bold">
            {(["easy", "normal", "hard", "aggressive", "defensive"] as const).map(level => (
              <button
                key={level}
                onClick={() => setAiLevel(level)}
                className={`px-2.5 py-1 rounded-full uppercase transition-all ${
                  aiLevel === level 
                    ? level === 'aggressive' 
                      ? "bg-red-500 text-white shadow-[0_0_8px_#ef4444]"
                      : level === 'defensive'
                      ? "bg-emerald-500 text-white shadow-[0_0_8px_#10b981]"
                      : "bg-purple-500 text-white shadow-[0_0_8px_#a855f7]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="flex space-x-2">
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

          <button
            onClick={initGame}
            className="text-xs px-3.5 py-1.5 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
          >
            <i className="fa-solid fa-arrow-rotate-left mr-1.5"></i>
            <span>RESET</span>
          </button>
        </div>
      </div>

      <div className="w-full grid lg:grid-cols-2 gap-8 items-start relative px-4">
        {/* Left: Player */}
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
            playerName="YOU (PILOT)"
          />
        </div>

        {/* Right: AI */}
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
            playerName={`CPU (${aiLevel.toUpperCase()})`}
            isAI={true}
          />
          {aiThinkingRef.current && (
            <div className="absolute top-10 right-10 flex items-center space-x-1 bg-purple-500/20 border border-purple-500/40 text-purple-300 font-orbitron font-bold text-[9px] px-2 py-0.5 rounded-full animate-pulse select-none z-30">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
              <span>AI CALCULATING</span>
            </div>
          )}
        </div>

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

      {showWinnerModal && (
        <WinnerAnnouncePop
          winnerName={winnerName}
          score1={score1}
          score2={score2}
          p1Name="YOU"
          p2Name="AI CORE"
          isPlayerWinner={winnerName === "PLAYER"}
          onDismiss={handleDismissWinner}
          onReset={initGame}
        />
      )}
    </section>
  );
}
