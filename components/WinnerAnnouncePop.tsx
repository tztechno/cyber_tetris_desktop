"use client";

import React, { useEffect, useRef } from "react";
import { useGameSettings } from "./GameSettingsProvider";

type WinnerAnnouncePopProps = {
  winnerName: string; // "PLAYER 1", "PLAYER 2", "CPU", "DRAW", "SOLO_COMPLETED", etc.
  score1: number;
  score2?: number;
  p1Name?: string;
  p2Name?: string;
  isPlayerWinner?: boolean; // Used to determine victory vs defeat sound in vsAI
  onDismiss: () => void;
  onReset?: () => void;
};

const WinnerAnnouncePop = ({ 
  winnerName, 
  score1, 
  score2, 
  p1Name = "PLAYER 1",
  p2Name = "PLAYER 2",
  isPlayerWinner, 
  onDismiss,
  onReset
}: WinnerAnnouncePopProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { playGameOver } = useGameSettings();

  const isSolo = score2 === undefined;
  const isDraw = winnerName.toLowerCase() === 'draw';

  let titleText = "";
  let descText = "";

  if (isSolo) {
    titleText = "シミュレーション完了";
    descText = `ソロプレイが終了しました。最終スコアは ${score1.toLocaleString()} 点です。`;
  } else if (isDraw) {
    titleText = "引き分け";
    descText = "両者のグリッドが同時に溢れ、勝負はドローとなりました。";
  } else {
    titleText = `${winnerName} の勝利！`;
    descText = `白熱したサイバーバトルの結果、${winnerName} が生き残り勝利を収めました。`;
  }

  // Play Synth sound on mount
  useEffect(() => {
    if (isSolo || isDraw) {
      playGameOver(true);
    } else if (isPlayerWinner !== undefined) {
      playGameOver(isPlayerWinner);
    } else {
      playGameOver(true);
    }
  }, [winnerName, isDraw, isPlayerWinner, isSolo, playGameOver]);

  // Canvas confetti/matrix effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 400;
    canvas.height = canvas.parentElement?.clientHeight || 450;

    let animationFrameId: number;
    const sparkles: any[] = [];
    const colors = isPlayerWinner === false ? ['#ef4444', '#f43f5e', '#e11d48'] : ['#00f0ff', '#39ff14', '#0891b2'];

    // Init sparkles
    for (let i = 0; i < 60; i++) {
      sparkles.push({
        x: canvas.width / 2,
        y: canvas.height / 2 - 30,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        radius: Math.random() * 3 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.015 + 0.005
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparkles.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.05; // gravity
        s.alpha -= s.decay;

        if (s.alpha > 0) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = s.alpha;
          ctx.shadowBlur = 8;
          ctx.shadowColor = s.color;
          ctx.fill();
        }
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [winnerName, isPlayerWinner]);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl border border-cyan-500/40 bg-slate-950 shadow-[0_0_50px_rgba(0,240,255,0.2)] text-center relative overflow-hidden select-none">
        {/* Background Sparkles Effect */}
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full" />

        <div className="relative z-10 space-y-6">
          {/* Trophy Icon Badge */}
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl animate-bounce bg-cyan-500/10 border border-cyan-500/30">
            <i className={`fa-solid ${isDraw ? "fa-circle-nodes text-yellow-400" : isPlayerWinner === false ? "fa-circle-xmark text-red-500" : "fa-trophy text-cyan-400"}`} />
          </div>
          
          <div>
            <span className="text-xs uppercase tracking-widest text-pink-500 font-orbitron font-bold">SYSTEM TERMINATED</span>
            <h2 className="text-2xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-200 mt-1">
              {titleText}
            </h2>
          </div>

          {/* Scores Comparison Matrix */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl max-w-xs mx-auto">
            {isSolo ? (
              <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider mb-1">
                  FINAL SCORE
                </span>
                <p className="text-3xl font-orbitron font-bold text-cyan-400">{score1.toLocaleString()}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider mb-1 truncate max-w-full">
                    {p1Name}
                  </span>
                  <p className="text-2xl font-orbitron font-bold text-cyan-400">{score1.toLocaleString()}</p>
                </div>
                <div className="border-l border-white/10 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-pink-300 font-bold uppercase tracking-wider mb-1 truncate max-w-full">
                    {p2Name}
                  </span>
                  <p className="text-2xl font-orbitron font-bold text-pink-400">{(score2 ?? 0).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed px-2">
            {descText}
          </p>

          <div className="flex space-x-3 pt-2">
            <button 
              onClick={onDismiss} 
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-bold tracking-wider transition-all hover:bg-slate-800 text-slate-200 font-sans"
            >
              盤面を確認
            </button>
            {onReset && (
              <button 
                onClick={onReset} 
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-xs font-bold tracking-wider text-white transition-all shadow-[0_4px_15px_rgba(6,182,212,0.3)] font-sans"
              >
                再挑戦
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinnerAnnouncePop;