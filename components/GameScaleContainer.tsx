"use client";

import React from "react";
import { useGameSettings } from "./GameSettingsProvider";

export const GameScaleContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { screenScale } = useGameSettings();

  return (
    <main
      className="flex-grow flex flex-col justify-center items-center py-4 px-4 relative max-w-7xl w-full mx-auto z-10 transition-all duration-300 origin-top"
      style={{
        zoom: screenScale,
      }}
    >
      {children}
    </main>
  );
};

export default GameScaleContainer;
