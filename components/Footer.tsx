"use client";

import React, { useState } from "react";

export const Footer: React.FC = () => {
  const [modalType, setModalType] = useState<"RULE" | "AI" | null>(null);

  const handleInfoClose = () => setModalType(null);

  return (
    <footer className="py-6 border-t border-cyan-500/20 backdrop-blur-md z-10 w-full select-none" style={{ backgroundColor: "var(--panel-color)" }}>
      <div className="max-w-7xl mx-auto px-4 text-center space-y-3">
        <p className="text-[11px] text-slate-500 uppercase tracking-widest font-orbitron">
          Cyber Tetris Matrix Simulator &copy; 2026. Designed for Immersive Entertainment.
        </p>
        <div className="flex justify-center space-x-6 text-xs text-slate-400">
          <span 
            className="hover:text-cyan-400 cursor-pointer transition-colors" 
            onClick={() => setModalType("RULE")}
          >
            <i className="fa-solid fa-circle-question mr-1"></i> ルール & 操作方法
          </span>
          <span 
            className="hover:text-pink-400 cursor-pointer transition-colors" 
            onClick={() => setModalType("AI")}
          >
            <i className="fa-solid fa-microchip mr-1"></i> AIアルゴリズム解説
          </span>
        </div>
      </div>

      {/* Info Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center transition-all duration-300">
          <div className="max-w-lg w-full mx-4 p-6 rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 relative shadow-2xl">
            <button 
              onClick={handleInfoClose} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
            <h3 className="font-orbitron font-bold text-lg text-cyan-400 mb-4 uppercase">
              {modalType === "RULE" ? "Game Rules & Controls" : "AI Heuristic Solver"}
            </h3>
            <div className="text-sm text-slate-300 leading-relaxed space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {modalType === "RULE" ? (
                <>
                  <p className="font-bold text-white text-base">基本ルール</p>
                  <p>
                    サイバー・テトリスは、上から落下する7種類のブロック（テトロミノ）を左右に移動・回転させながら、下の10×20のマス目に隙間なく敷き詰めるゲームです。
                  </p>
                  <p>
                    横1列が埋まるとその列が消去され、得点と消去ライン数が加算されます。ブロックが画面上部まで積み上がり、新規ブロックが出現できなくなるとゲームオーバーとなります。
                  </p>
                  <p>
                    <strong>お邪魔ブロック（対戦用）:</strong> 一度に複数のラインを消去すると、相手のフィールドの最下部からお邪魔ブロックをせり上げることができます。お邪魔ブロックは、自分のミノが設置したタイミングで「相殺処理」が行われた後、残った分が挿入されます。
                  </p>
                  
                  <p className="font-bold text-white text-base mt-4">操作キー一覧</p>
                  <div className="space-y-2 border-t border-slate-800 pt-2 text-xs">
                    <div>
                      <p className="font-semibold text-cyan-300">1人プレイ時 / Player 2 (対戦時右側)</p>
                      <p>・移動: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">→</kbd></p>
                      <p>・ソフトドロップ (下): <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">↓</kbd></p>
                      <p>・ハードドロップ (一瞬で落下): <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">↑</kbd></p>
                      <p>・左回転: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">.</kbd> (ピリオド)</p>
                      <p>・右回転: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">/</kbd> (スラッシュ)</p>
                      <p>・ホールド (キープ): <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Right Shift</kbd> または <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Enter</kbd></p>
                    </div>
                    <div className="border-t border-slate-800/50 pt-2">
                      <p className="font-semibold text-pink-300">Player 1 (対戦時左側)</p>
                      <p>・移動: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">A</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">D</kbd></p>
                      <p>・ソフトドロップ: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">S</kbd></p>
                      <p>・ハードドロップ: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">W</kbd></p>
                      <p>・左回転: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Q</kbd></p>
                      <p>・右回転: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">E</kbd></p>
                      <p>・ホールド: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Space</kbd></p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-bold text-white text-base">AIソルバーの仕組み</p>
                  <p>
                    本ゲームのAIは、有名なEl-Tetrisアルゴリズムを元にした発見的評価関数（Heuristics）を使用して自律プレイを行います。
                  </p>
                  <p>
                    AIは、現在のテトロミノ（およびホールド中のテトロミノ）の全回転パターン（最大4通り）と、ボード上の全列位置（最大10通り）に配置した場合のシミュレーションを行い、次の項目から「盤面の評価値」を計算します。
                  </p>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li><strong>列の合計高さ（Aggregate Height）:</strong> 積み上がったブロックの高さ。低いほど高評価。</li>
                    <li><strong>穴の数（Holes）:</strong> ブロックの下にある空きスペース。少ないほど高評価。</li>
                    <li><strong>凹凸度（Bumpiness）:</strong> 隣り合う列の高さの差の合計。平らなほど高評価。</li>
                    <li><strong>消去ライン数（Lines Cleared）:</strong> 配置により消えるライン数。多いほど高評価。</li>
                  </ul>
                  <p className="mt-2">
                    最も評価の高い「列」と「回転状態」を選択し、瞬時に配置します。
                  </p>
                  <p className="font-bold text-white text-base mt-4">AIのタイプと設定</p>
                  <p className="space-y-1.5 text-xs text-slate-300">
                    - <strong>Easy (初級):</strong> 配置ディレイ約0.8秒。30%の確率で評価に大きなノイズが発生し、ミス配置を行います。<br />
                    - <strong>Normal (中級):</strong> 配置ディレイ約0.4秒。10%の確率で評価ミスが発生します。<br />
                    - <strong>Hard (上級):</strong> 配置ディレイ約0.15秒。ノイズなしの最適解（Dellacherieモデル）で常に最も平坦で安全な配置を行います。<br />
                    - <strong>Aggressive (攻撃特化):</strong> 配置ディレイ約0.12秒。高さを少し許容し、4ライン消し（テトリス）を極端に優先。端を空けて高く積み上げ、I型で一気に消す大技を狙います。<br />
                    - <strong>Defensive (防御特化):</strong> 配置ディレイ約0.12秒。積み上がる高さを嫌い、1〜2ラインでも消せるタイミングがあればすぐに消し、常に盤面を低く平らに維持します。
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
