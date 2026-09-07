"use client";

import React, { useEffect, useRef } from "react";
import { useGameSettings } from "./GameSettingsProvider";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useGameSettings();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const getColors = () => {
      switch (theme) {
        case "galaxy":
          return [
            "rgba(217, 70, 239, 0.4)",  // Magenta-pink
            "rgba(236, 72, 153, 0.4)",  // Pink
            "rgba(99, 102, 241, 0.3)",  // Indigo
          ];
        case "wood":
          return [
            "rgba(245, 158, 11, 0.3)",  // Amber
            "rgba(251, 191, 36, 0.3)",  // Yellow
            "rgba(180, 83, 9, 0.2)",   // Brownish gold
          ];
        case "dark":
          return [
            "rgba(255, 255, 255, 0.15)", // White
            "rgba(161, 161, 170, 0.15)", // Gray
            "rgba(63, 63, 70, 0.15)",   // Dark Gray
          ];
        case "cyber":
        default:
          return [
            "rgba(0, 240, 255, 0.35)",  // Cyan
            "rgba(255, 0, 127, 0.35)",  // Neon Magenta
            "rgba(57, 255, 20, 0.25)",  // Neon Green
          ];
      }
    };

    const initParticles = () => {
      const colors = getColors();
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 100);
      particles = [];

      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Boundary bounce
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
      });

      // Draw faint connections
      ctx.shadowBlur = 0; // Disable shadow for line efficiency
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = theme === "cyber" 
              ? `rgba(0, 240, 255, ${alpha})`
              : theme === "galaxy"
              ? `rgba(217, 70, 239, ${alpha})`
              : theme === "wood"
              ? `rgba(245, 158, 11, ${alpha})`
              : `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none w-full h-full opacity-35 z-0"
    />
  );
};
export default ParticleBackground;
