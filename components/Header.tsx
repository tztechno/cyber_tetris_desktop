"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGameSettings, ThemeType } from "./GameSettingsProvider";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { theme, setTheme, is3D, setIs3D, muted, setMuted, screenScale, setScreenScale, zoomIn, zoomOut, resetScale } = useGameSettings();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scaleDropdownOpen, setScaleDropdownOpen] = useState(false);

  const navItems = [
    { label: "ホーム", href: "/", icon: "fa-house" },
    { label: "ソロプレイ", href: "/solo", icon: "fa-user" },
    { label: "人間同士", href: "/match", icon: "fa-user-group" },
    { label: "人間 vs AI", href: "/vsAI", icon: "fa-robot" },
    { label: "AI vs AI", href: "/AIvsAI", icon: "fa-microchip" },
  ];

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
    setDropdownOpen(false);
  };

  return (
    <header className="border-b border-cyan-500/30 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 select-none" style={{ backgroundColor: "var(--panel-color)" }}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
        {/* Title / Logo */}
        <Link href="/" className="flex items-center space-x-3 cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-500 to-pink-500 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <i className="fa-solid fa-cubes text-xl text-white animate-pulse"></i>
          </div>
          <div>
            <h1 className="font-orbitron text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-pink-500">
              CYBER TETRIS
            </h1>
            <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-semibold block">
              Tactical Block Matrix
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex space-x-1 md:space-x-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-slate-400 hover:text-cyan-300 hover:bg-white/5"
                }`}
              >
                <i className={`fa-solid ${item.icon}`}></i>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sound, Scale & Theme Controls */}
        <div className="flex items-center space-x-2 relative">
          {/* Screen Scale / Zoom Controls */}
          <div className="flex items-center space-x-1 bg-slate-950/60 border border-cyan-500/30 rounded-lg p-0.5 relative shadow-[0_0_10px_rgba(6,182,212,0.15)]">
            {/* Zoom Out / Reduce button */}
            <button
              onClick={zoomOut}
              disabled={screenScale <= 0.5}
              className="w-7 h-7 rounded flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="画面サイズを縮小 (-10%)"
            >
              <i className="fa-solid fa-minus text-xs"></i>
            </button>

            {/* Current scale badge / preset trigger */}
            <button
              onClick={() => setScaleDropdownOpen(!scaleDropdownOpen)}
              className="px-2 h-7 rounded text-[11px] font-orbitron font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all flex items-center space-x-1"
              title="画面倍率の変更・プリセット"
            >
              <i className="fa-solid fa-expand text-[10px] mr-1 text-cyan-400"></i>
              <span>{Math.round(screenScale * 100)}%</span>
            </button>

            {/* Zoom In / Increase button */}
            <button
              onClick={zoomIn}
              disabled={screenScale >= 1.2}
              className="w-7 h-7 rounded flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="画面サイズを拡大 (+10%)"
            >
              <i className="fa-solid fa-plus text-xs"></i>
            </button>

            {/* Preset Dropdown */}
            {scaleDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setScaleDropdownOpen(false)}
                />
                <div className="absolute right-0 top-10 flex flex-col bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 p-2 rounded-xl shadow-2xl space-y-1 w-44 z-50">
                  <span className="text-[9px] font-orbitron font-bold text-cyan-400 px-2 py-1 uppercase tracking-wider border-b border-cyan-500/20">
                    画面サイズ・倍率
                  </span>
                  {[
                    { label: "100% (標準)", value: 1.0 },
                    { label: "90% (やや縮小)", value: 0.9 },
                    { label: "80% (おすすめ)", value: 0.8 },
                    { label: "70% (縮小)", value: 0.7 },
                    { label: "60% (極小)", value: 0.6 },
                    { label: "50% (最小)", value: 0.5 },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        setScreenScale(item.value);
                        setScaleDropdownOpen(false);
                      }}
                      className={`text-left px-3 py-1.5 rounded text-xs transition-all flex items-center justify-between ${
                        Math.abs(screenScale - item.value) < 0.01
                          ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                          : "text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      <span>{item.label}</span>
                      {Math.abs(screenScale - item.value) < 0.01 && (
                        <i className="fa-solid fa-check text-[10px] text-cyan-400"></i>
                      )}
                    </button>
                  ))}
                  <div className="pt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        resetScale();
                        setScaleDropdownOpen(false);
                      }}
                      className="w-full text-center px-2 py-1 rounded text-[10px] font-orbitron font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <i className="fa-solid fa-arrow-rotate-left mr-1"></i> リセット (100%)
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 3D view toggle in header for convenience */}
          <button
            onClick={() => setIs3D(!is3D)}
            className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all duration-200 ${
              is3D
                ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                : "border-slate-700 text-slate-400 hover:bg-white/5"
            }`}
            title={is3D ? "3D表示をOFFにする" : "3D表示をONにする"}
          >
            <i className="fa-solid fa-cube"></i>
          </button>

          {/* Sound Mute Button */}
          <button
            onClick={() => setMuted(!muted)}
            className="w-9 h-9 rounded-lg border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 transition-all duration-200"
            title="音声を切り替え"
          >
            <i className={`fa-solid ${muted ? "fa-volume-xmark" : "fa-volume-high"}`}></i>
          </button>

          {/* Theme Palette Button */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 rounded-lg border border-pink-500/30 flex items-center justify-center text-pink-400 hover:bg-pink-500/20 transition-all duration-200"
              title="テーマ変更"
            >
              <i className="fa-solid fa-palette"></i>
            </button>
            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 top-11 flex flex-col bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-2xl space-y-1 w-40 z-50">
                  <button
                    onClick={() => handleThemeChange("cyber")}
                    className="text-left px-3 py-1.5 rounded text-xs hover:bg-cyan-500/20 text-cyan-300 transition-all animate-fadeIn"
                  >
                    <i className="fa-solid fa-atom mr-1"></i> サイバーネオン
                  </button>
                  <button
                    onClick={() => handleThemeChange("galaxy")}
                    className="text-left px-3 py-1.5 rounded text-xs hover:bg-pink-500/20 text-pink-300 transition-all"
                  >
                    <i className="fa-solid fa-shuttle-space mr-1"></i> 宇宙ギャラクシー
                  </button>
                  <button
                    onClick={() => handleThemeChange("wood")}
                    className="text-left px-3 py-1.5 rounded text-xs hover:bg-amber-500/20 text-amber-300 transition-all"
                  >
                    <i className="fa-solid fa-tree mr-1"></i> クラシックウッド
                  </button>
                  <button
                    onClick={() => handleThemeChange("dark")}
                    className="text-left px-3 py-1.5 rounded text-xs hover:bg-zinc-500/20 text-zinc-300 transition-all"
                  >
                    <i className="fa-solid fa-moon mr-1"></i> ミニマルダーク
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Header;
