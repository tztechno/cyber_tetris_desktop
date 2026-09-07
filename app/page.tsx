"use client";

import Link from 'next/link';

export default function Home() {
  return (
    <section className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center z-10 transition-all duration-500 my-auto">
      {/* Left side: Cyber Intro details */}
      <div className="space-y-6 select-none">
        <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="text-xs tracking-wider text-cyan-300 font-orbitron font-semibold">SYSTEMS ONLINE</span>
        </div>
        
        <h2 className="text-4xl md:text-5xl font-orbitron font-black tracking-wider leading-tight text-white">
          未体験の<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 neon-text-primary">
            サイバー・テトリス
          </span><br />
          へようこそ
        </h2>
        
        <p className="text-slate-400 text-sm leading-relaxed max-w-md">
          ホログラムのように輝く3D電子グリッド。極限の最適落下ルート探索アルゴリズムを搭載した超知能AI。
          あらゆるテトリス体験を過去にする、最先端のタクティカル・ブロック・シミュレーター。
        </p>

        <div className="pt-2">
          <Link 
            href="/solo" 
            className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white tracking-wider items-center space-x-2 hover:opacity-90 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 shadow-[0_4px_20px_rgba(6,182,212,0.4)]"
          >
            <i className="fa-solid fa-gamepad mr-2"></i>
            <span>ソロプレイを今すぐ開始</span>
          </Link>
        </div>
      </div>

      {/* Right side: High-tech Mode Selector Cards */}
      <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/60 p-6 rounded-3xl border border-cyan-500/20 backdrop-blur-md relative overflow-hidden flex flex-col items-center">
        {/* Glow gradients */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl pointer-events-none"></div>
        
        <h3 className="font-orbitron font-bold text-center text-cyan-400 tracking-wider mb-4 select-none">
          MODE SELECTOR
        </h3>
        
        <div className="w-full space-y-3">
          {/* Solo Card */}
          <Link 
            href="/solo" 
            className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all duration-300"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 group-hover:bg-cyan-500/40 transition-all">
                <i className="fa-solid fa-user text-lg"></i>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">1人遊び（ソロ）</h4>
                <p className="text-[11px] text-slate-400">ハイスコアと重力（落下速度）の限界に挑みます。</p>
              </div>
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all"></i>
          </Link>

          {/* PvP card */}
          <Link 
            href="/match" 
            className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/40 hover:bg-pink-500/5 transition-all duration-300"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-300 group-hover:bg-pink-500/40 transition-all">
                <i className="fa-solid fa-user-group text-lg"></i>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">人間同士のローカル対戦</h4>
                <p className="text-[11px] text-slate-400">1台のキーボードでリアルタイムにブロックを削り合います。</p>
              </div>
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-slate-500 group-hover:text-pink-400 group-hover:translate-x-1 transition-all"></i>
          </Link>

          {/* PvE card */}
          <Link 
            href="/vsAI" 
            className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all duration-300"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300 group-hover:bg-purple-500/40 transition-all">
                <i className="fa-solid fa-robot text-lg"></i>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">人間 vs AI対戦</h4>
                <p className="text-[11px] text-slate-400">3段階の難易度を持つ落下予測AIに戦いを挑みます。</p>
              </div>
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all"></i>
          </Link>

          {/* EvE card */}
          <Link 
            href="/AIvsAI" 
            className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all duration-300"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300 group-hover:bg-emerald-500/40 transition-all">
                <i className="fa-solid fa-microchip text-lg"></i>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">AI vs AI 観戦シミュレート</h4>
                <p className="text-[11px] text-slate-400">最適配置AI同士の極限ハイスピードバトルを観戦します。</p>
              </div>
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all"></i>
          </Link>
        </div>
      </div>
    </section>
  );
}