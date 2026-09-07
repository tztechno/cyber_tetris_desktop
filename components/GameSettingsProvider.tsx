"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export type ThemeType = "cyber" | "galaxy" | "wood" | "dark";

interface GameSettingsContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  is3D: boolean;
  setIs3D: (val: boolean) => void;
  showHints: boolean;
  setShowHints: (val: boolean) => void;
  muted: boolean;
  setMuted: (val: boolean) => void;
  screenScale: number;
  setScreenScale: (val: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetScale: () => void;
  playPlace: () => void;
  playFlip: () => void;
  playError: () => void;
  playGameOver: (isWinner: boolean) => void;
}

const GameSettingsContext = createContext<GameSettingsContextType | undefined>(undefined);

class CyberSynth {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private init() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playPlace() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5 Sweep
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.warn("Synth place error", e);
    }
  }

  playFlip() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1500, now);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      console.warn("Synth flip error", e);
    }
  }

  playError() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn("Synth error play error", e);
    }
  }

  playGameOver(isWinner: boolean) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = isWinner ? [523.25, 659.25, 783.99, 1046.50] : [392.00, 349.23, 311.13, 246.94];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.4);
      });
    } catch (e) {
      console.warn("Synth game over error", e);
    }
  }
}

export const GameSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>("cyber");
  const [is3D, setIs3DState] = useState<boolean>(false);
  const [showHints, setShowHintsState] = useState<boolean>(true);
  const [muted, setMutedState] = useState<boolean>(false);
  const [screenScale, setScreenScaleState] = useState<number>(1.0);

  const synthRef = useRef<CyberSynth | null>(null);

  if (!synthRef.current) {
    synthRef.current = new CyberSynth();
  }

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("cyber-othello-theme") as ThemeType;
      const storedIs3D = localStorage.getItem("cyber-othello-is3d");
      const storedShowHints = localStorage.getItem("cyber-othello-hints");
      const storedMuted = localStorage.getItem("cyber-othello-muted");
      const storedScale = localStorage.getItem("cyber-tetris-scale") || localStorage.getItem("cyber-othello-scale");

      if (storedTheme) setThemeState(storedTheme);
      if (storedIs3D !== null) setIs3DState(storedIs3D === "true");
      if (storedShowHints !== null) setShowHintsState(storedShowHints === "true");
      if (storedMuted !== null) {
        const isMuted = storedMuted === "true";
        setMutedState(isMuted);
        if (synthRef.current) synthRef.current.muted = isMuted;
      }
      if (storedScale) {
        const parsed = parseFloat(storedScale);
        if (!isNaN(parsed) && parsed >= 0.4 && parsed <= 1.5) {
          setScreenScaleState(parsed);
        }
      }
    }
  }, []);

  // Sync state to body classes and localStorage
  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem("cyber-othello-theme", newTheme);
  };

  const setIs3D = (val: boolean) => {
    setIs3DState(val);
    localStorage.setItem("cyber-othello-is3d", val ? "true" : "false");
  };

  const setShowHints = (val: boolean) => {
    setShowHintsState(val);
    localStorage.setItem("cyber-othello-hints", val ? "true" : "false");
  };

  const setMuted = (val: boolean) => {
    setMutedState(val);
    localStorage.setItem("cyber-othello-muted", val ? "true" : "false");
    if (synthRef.current) {
      synthRef.current.muted = val;
    }
  };

  const setScreenScale = (val: number) => {
    const clamped = Math.max(0.5, Math.min(1.2, Math.round(val * 100) / 100));
    setScreenScaleState(clamped);
    localStorage.setItem("cyber-tetris-scale", clamped.toString());
  };

  const zoomIn = () => {
    setScreenScaleState((prev) => {
      const next = Math.min(1.2, Math.round((prev + 0.1) * 10) / 10);
      localStorage.setItem("cyber-tetris-scale", next.toString());
      return next;
    });
  };

  const zoomOut = () => {
    setScreenScaleState((prev) => {
      const next = Math.max(0.5, Math.round((prev - 0.1) * 10) / 10);
      localStorage.setItem("cyber-tetris-scale", next.toString());
      return next;
    });
  };

  const resetScale = () => {
    setScreenScaleState(1.0);
    localStorage.setItem("cyber-tetris-scale", "1");
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      const body = document.body;
      // Remove other theme classes
      const classesToRemove: string[] = [];
      body.classList.forEach((className) => {
        if (className.startsWith("theme-")) {
          classesToRemove.push(className);
        }
      });
      classesToRemove.forEach((className) => body.classList.remove(className));
      body.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  const playPlace = () => synthRef.current?.playPlace();
  const playFlip = () => synthRef.current?.playFlip();
  const playError = () => synthRef.current?.playError();
  const playGameOver = (isWinner: boolean) => synthRef.current?.playGameOver(isWinner);

  return (
    <GameSettingsContext.Provider
      value={{
        theme,
        setTheme,
        is3D,
        setIs3D,
        showHints,
        setShowHints,
        muted,
        setMuted,
        screenScale,
        setScreenScale,
        zoomIn,
        zoomOut,
        resetScale,
        playPlace,
        playFlip,
        playError,
        playGameOver,
      }}
    >
      {children}
    </GameSettingsContext.Provider>
  );
};

export const useGameSettings = () => {
  const context = useContext(GameSettingsContext);
  if (context === undefined) {
    throw new Error("useGameSettings must be used within a GameSettingsProvider");
  }
  return context;
};
