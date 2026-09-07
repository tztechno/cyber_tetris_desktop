import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import { cn } from '@/lib/utils';
import { GameSettingsProvider } from "@/components/GameSettingsProvider";
import ParticleBackground from "@/components/ParticleBackground";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import GameScaleContainer from "@/components/GameScaleContainer";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const orbitron = Orbitron({ 
  subsets: ["latin"],
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: "Cyber Tetris - タクティカル・ブロック・マトリクス",
  description: "Tactical AI Hologram Tetris Simulator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={cn(inter.variable, orbitron.variable)}>
      <head>
        {/* Font Awesome Icons CDN */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
        />
      </head>
      <body className="min-h-screen text-slate-100 flex flex-col transition-colors duration-500 overflow-x-hidden scanlines" style={{ backgroundColor: "var(--bg-color)" }}>
        <GameSettingsProvider>
          {/* Animated Matrix Particle Background */}
          <ParticleBackground />
          
          {/* Premium Navbar */}
          <Header />
          
          {/* Main Scalable Gameplay Canvas wrapper */}
          <GameScaleContainer>
            {children}
          </GameScaleContainer>
          
          {/* Futuristic Footer */}
          <Footer />
        </GameSettingsProvider>
      </body>
    </html>
  );
}
