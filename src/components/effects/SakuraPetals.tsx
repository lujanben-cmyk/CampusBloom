import React, { useEffect, useRef } from 'react';
import { ThemeId } from '../../types';

interface SakuraPetalsProps {
  isActive: boolean;
  themeId?: ThemeId;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
}

export const SakuraPetals: React.FC<SakuraPetalsProps> = ({ isActive, themeId = 'sakura-matcha' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const getThemeColors = () => {
      switch (themeId) {
        case 'bosque-nocturno':
          return ['#34D399', '#10B981', '#059669', '#6EE7B7', '#A7F3D0'];
        case 'azul-pizarra':
          return ['#38BDF8', '#0284C7', '#7DD3FC', '#E0F2FE', '#BAE6FD'];
        case 'grafito-monocromo':
          return ['#FFFFFF', '#E4E4E7', '#A1A1AA', '#71717A', '#D4D4D8'];
        case 'sakura-matcha':
        default:
          return ['#FFB7C5', '#FFD1DC', '#FFCCD5', '#FFA6B9', '#FFFFFF'];
      }
    };

    const colors = getThemeColors();
    const particleCount = 32;
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 5,
      speedX: Math.random() * 1.2 - 0.3,
      speedY: Math.random() * 1.4 + 0.8,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.03,
      opacity: Math.random() * 0.5 + 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const drawParticle = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (themeId === 'bosque-nocturno') {
        // Pine needle / Leaf shape
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.5, p.size * 1.3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (themeId === 'azul-pizarra') {
        // Diamond crystal spark
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.6, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.6, 0);
        ctx.closePath();
        ctx.fill();
      } else if (themeId === 'grafito-monocromo') {
        // Minimal round & star dust
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Sakura Petal
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(p.size / 2, -p.size / 2, p.size, 0, 0, p.size);
        ctx.bezierCurveTo(-p.size, 0, -p.size / 2, -p.size / 2, 0, 0);
        ctx.fill();
      }

      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.speedX + Math.sin(p.y * 0.01) * 0.4;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        if (p.x > canvas.width + 20) p.x = -20;
        if (p.x < -20) p.x = canvas.width + 20;

        drawParticle(p);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, themeId]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
