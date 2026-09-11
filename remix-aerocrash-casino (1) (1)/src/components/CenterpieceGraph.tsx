import React, { useRef, useEffect, useState } from 'react';
import { GamePhase, AccountMode } from '../types';
import { FaceAvatar } from './FaceAvatar';
import { FACE_AVATARS } from '../utils/avatars';

interface CenterpieceGraphProps {
  phase: GamePhase;
  multiplier: number;
  countdown: number; // 0 to 5 seconds
  crashMultiplier: number;
  flightProgress: number; // 0 to 1 normalized time
  bettorCount: number;
  accountMode?: AccountMode;
  onToggleChat?: () => void;
}

export const CenterpieceGraph: React.FC<CenterpieceGraphProps> = ({
  phase,
  multiplier,
  countdown,
  crashMultiplier,
  flightProgress,
  bettorCount,
  accountMode = 'demo',
  onToggleChat
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });
  const waveOffsetRef = useRef<number>(0);

  // Update canvas dimensions on container resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({
            width: Math.floor(width),
            height: Math.floor(height)
          });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update wave motion: advance ONLY when IN_FLIGHT, stop/freeze on CRASHED or WAITING
  useEffect(() => {
    if (phase === 'IN_FLIGHT') {
      waveOffsetRef.current += 2.0 + Math.min(6.0, flightProgress * 3.5);
    }
  }, [phase, flightProgress, multiplier]);

  // Render the squared graph grid, red curve, and plane
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background: dark void
    ctx.fillStyle = '#0b0f17';
    ctx.fillRect(0, 0, width, height);

    // Baseline coordinates for flight start (Spribe origin)
    const startX = 20;
    const startY = height - 16;
    const maxFlightX = width - 75;
    const minFlightY = 45;

    // 1. Draw Spribe Sunburst Radiating Rays from bottom-left corner with moving wave flow
    ctx.save();
    const rayOriginX = startX;
    const rayOriginY = startY;
    const rayRadius = Math.sqrt(width * width + height * height) * 1.25;
    const totalRays = 28;
    const minAngle = -Math.PI / 2; // Straight up
    const maxAngle = 0; // Horizontal right
    const angleStep = (maxAngle - minAngle) / totalRays;

    // Wave offset moves when IN_FLIGHT, and stops/freezes when plane flies away (CRASHED) or waits
    const waveOffset = waveOffsetRef.current;
    const rayAngleShift = (waveOffset * 0.002) % angleStep;

    for (let i = 0; i < totalRays; i++) {
      const a1 = minAngle + i * angleStep + rayAngleShift;
      const a2 = a1 + angleStep;
      // Moving wave pulsation in beam colors
      const waveSine = Math.sin(i * 0.5 + waveOffset * 0.06);
      const isAlt = i % 2 === 0;
      ctx.fillStyle = isAlt
        ? waveSine > 0 ? '#121827' : '#0e1422'
        : waveSine > 0 ? '#172235' : '#141d2f';
      ctx.beginPath();
      ctx.moveTo(rayOriginX, rayOriginY);
      ctx.lineTo(rayOriginX + Math.cos(a1) * rayRadius, rayOriginY + Math.sin(a1) * rayRadius);
      ctx.lineTo(rayOriginX + Math.cos(a2) * rayRadius, rayOriginY + Math.sin(a2) * rayRadius);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 2. Draw Moving Concentric Sound/Radar Wave Arcs expanding from origin
    ctx.save();
    const numWaveArcs = 7;
    const maxWaveDist = Math.sqrt(width * width + height * height);
    for (let w = 0; w < numWaveArcs; w++) {
      const arcDist = ((waveOffset * 2.8 + w * (maxWaveDist / numWaveArcs)) % maxWaveDist);
      const arcAlpha = Math.max(0, (1 - arcDist / maxWaveDist) * 0.22);
      if (arcAlpha > 0.01) {
        ctx.strokeStyle = `rgba(239, 68, 68, ${arcAlpha})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([10, 14]);
        ctx.beginPath();
        ctx.arc(rayOriginX, rayOriginY, arcDist, -Math.PI / 2, 0);
        ctx.stroke();

        // Secondary subtle cyan harmonic ripple
        ctx.strokeStyle = `rgba(56, 189, 248, ${arcAlpha * 0.4})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.arc(rayOriginX, rayOriginY, Math.max(0, arcDist - 12), -Math.PI / 2, 0);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Subtle dark grid overlay for Spribe style
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    const gridSize = 45;
    for (let x = startX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // If waiting or starting without flight yet, draw resting plane at start point
    if (phase === 'WAITING' || phase === 'STARTING') {
      drawAirplane(ctx, startX + 15, startY - 10, -0.15, false);
      return;
    }

    // Current flight position calculation
    // Non-linear upward and rightward parabolic/exponential curve:
    const progress = Math.min(1, Math.max(0, flightProgress));

    // Dynamic easing curve:
    const currentX = startX + (maxFlightX - startX) * Math.min(1, progress * 1.12);
    const easeY = Math.pow(progress, 1.4);
    const currentY = startY - (startY - minFlightY) * easeY;

    const isFlewAway = phase === 'CRASHED';

    // 2. Draw Solid Spribe Red Fill Under Curve (Matching user photo)
    ctx.save();
    const redGradient = ctx.createLinearGradient(0, currentY, 0, startY);
    redGradient.addColorStop(0, '#e52b50');
    redGradient.addColorStop(0.3, '#dc2626');
    redGradient.addColorStop(1, '#b91c1c');

    ctx.fillStyle = redGradient;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Build arc using quadratic curve
    const cpX = startX + (currentX - startX) * 0.58;
    const cpY = startY;

    ctx.quadraticCurveTo(cpX, cpY, currentX, currentY);
    ctx.lineTo(currentX, startY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Draw Bright Razor-sharp Red Arc Line on Top Edge
    ctx.save();
    ctx.strokeStyle = '#ff334b'; // Vivid glowing neon red
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(255, 51, 75, 0.9)';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(cpX, cpY, currentX, currentY);
    ctx.stroke();
    ctx.restore();

    // 4. Calculate Tangent Angle for Airplane Rotation
    const dx = 2 * (1 - progress) * (cpX - startX) + 2 * progress * (currentX - cpX);
    const dy = 2 * (1 - progress) * (cpY - startY) + 2 * progress * (currentY - cpY);
    const angle = Math.atan2(dy, dx);

    // 5. Draw Spribe Red Propeller Airplane
    if (!isFlewAway) {
      drawAirplane(ctx, currentX, currentY, angle, true);
    } else {
      drawFlewAwayEffect(ctx, currentX, currentY);
    }
  }, [dimensions, phase, multiplier, flightProgress]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full min-h-[300px] flex items-center justify-center overflow-hidden bg-[#0b0f17] select-none"
    >
      {/* Underlying Canvas: Grid, Red Arc, and Airplane */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ width: dimensions.width, height: dimensions.height }}
      />

      {/* Top Center Mode Banner */}
      <div className="absolute top-2 inset-x-0 flex justify-center pointer-events-none z-20">
        {accountMode === 'real' ? (
          <div className="px-3.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-white font-extrabold text-[10px] tracking-wider uppercase shadow-md border border-emerald-300/40 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>REAL MONEY PLAY</span>
          </div>
        ) : (
          <div className="px-4 py-0.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 text-black font-extrabold text-[10px] tracking-wider uppercase shadow-md border border-amber-200/50">
            FUN MODE (DEMO)
          </div>
        )}
      </div>

      {/* Prominent Center Overlays */}

      {/* 1. WAITING / COUNTDOWN STATE */}
      {phase === 'WAITING' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] z-10 transition-all">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-zinc-300 text-xs sm:text-sm font-semibold tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              Waiting for next round
            </div>
            {/* Countdown bar */}
            <div className="w-56 sm:w-72 h-2.5 bg-[#161d2a] rounded-full overflow-hidden border border-[#2b3547] p-0.5 shadow-lg">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                style={{ width: `${Math.max(0, Math.min(100, (countdown / 5) * 100))}%` }}
              />
            </div>
            <div className="text-xl sm:text-2xl font-mono-num font-bold text-white tracking-wider">
              {countdown.toFixed(1)}s
            </div>
          </div>
        </div>
      )}

      {/* 2. IN_FLIGHT STATE: Large bold stark white multiplier number in the void */}
      {phase === 'IN_FLIGHT' && (
        <div className="absolute top-[28%] sm:top-[30%] inset-x-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold font-mono-num text-white tracking-tight drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] scale-100 transition-transform">
            {multiplier.toFixed(2)}x
          </div>
        </div>
      )}

      {/* 3. CRASHED STATE: Flew away notification and frozen red multiplier */}
      {phase === 'CRASHED' && (
        <div className="absolute top-[28%] sm:top-[30%] inset-x-0 flex flex-col items-center justify-center pointer-events-none z-10 animate-shake">
          <div className="text-xs sm:text-sm md:text-base uppercase tracking-[0.25em] font-extrabold text-red-500 mb-1 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]">
            FLEW AWAY!
          </div>
          <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold font-mono-num text-red-500 tracking-tight drop-shadow-[0_0_35px_rgba(239,68,68,0.6)]">
            {crashMultiplier.toFixed(2)}x
          </div>
        </div>
      )}

      {/* Bottom Right: Active Bettors Count with Face Profile Pictures */}
      <div className="absolute bottom-3 right-4 z-20 flex items-center gap-2">
        <button
          onClick={onToggleChat}
          title="Round bets placed"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#121824]/90 hover:bg-[#1c2436] border border-[#2b3547] text-xs font-semibold text-zinc-300 shadow-md transition-all active:scale-95"
        >
          {/* Overlapping small face profile pictures */}
          <div className="flex -space-x-2">
            <FaceAvatar src={FACE_AVATARS[0]} name="Player 1" size="xs" />
            <FaceAvatar src={FACE_AVATARS[1]} name="Player 2" size="xs" />
            <FaceAvatar src={FACE_AVATARS[2]} name="Player 3" size="xs" />
          </div>
          <span className="text-[11px] font-mono-num font-bold text-zinc-200">
            {bettorCount} bets
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
        </button>
      </div>
    </div>
  );
};

/**
 * Draws the iconic Spribe Aviator red vintage airplane with spinning propeller
 */
function drawAirplane(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angleRad: number,
  isActive: boolean
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);

  // Engine exhaust trail glow
  if (isActive) {
    ctx.save();
    const trailGrad = ctx.createLinearGradient(-40, 0, 0, 0);
    trailGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
    trailGrad.addColorStop(0.6, 'rgba(251, 146, 60, 0.4)');
    trailGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
    ctx.fillStyle = trailGrad;
    ctx.beginPath();
    ctx.moveTo(-40, -2.5);
    ctx.lineTo(-4, -1);
    ctx.lineTo(-4, 1);
    ctx.lineTo(-40, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Airplane Body: Sleek racing vintage propeller plane in Spribe red
  ctx.shadowColor = 'rgba(239, 68, 68, 0.85)';
  ctx.shadowBlur = 12;

  // Main fuselage in vivid Spribe Red
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  // Nose
  ctx.moveTo(20, 0);
  // Upper cowl and cockpit windshield
  ctx.quadraticCurveTo(10, -7, -8, -6);
  // Tail fin top
  ctx.lineTo(-18, -16);
  ctx.lineTo(-24, -15);
  ctx.lineTo(-18, -2);
  // Rudder rear
  ctx.lineTo(-24, 0);
  ctx.lineTo(-18, 2);
  // Horizontal stabilizer bottom
  ctx.lineTo(-21, 8);
  ctx.lineTo(-17, 7);
  // Belly
  ctx.quadraticCurveTo(6, 7, 20, 0);
  ctx.closePath();
  ctx.fill();

  // White fuselage racing stripe (characteristic of Spribe Aviator plane)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(14, -1);
  ctx.lineTo(-14, -1);
  ctx.stroke();

  // Cockpit glass (Cyan-tinted canopy)
  ctx.fillStyle = '#bae6fd';
  ctx.beginPath();
  ctx.moveTo(8, -2);
  ctx.quadraticCurveTo(2, -6, -4, -5);
  ctx.lineTo(-3, -1.5);
  ctx.lineTo(8, -1.5);
  ctx.closePath();
  ctx.fill();

  // Swept aerodynamic main wing
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.moveTo(2, -1);
  ctx.lineTo(-12, 16);
  ctx.lineTo(-17, 14);
  ctx.lineTo(-5, -1);
  ctx.closePath();
  ctx.fill();

  // Upper wing highlight line
  ctx.strokeStyle = '#fca5a5';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(1, -0.5);
  ctx.lineTo(-14, 15);
  ctx.stroke();

  // Spinning front propeller (Propeller blades & blur disc)
  if (isActive) {
    // Spinning disc blur
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(21, 0, 2, 11, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Crossing propeller blades
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(21, -10);
    ctx.lineTo(21, 10);
    ctx.stroke();
  } else {
    // Stationary vertical propeller blade
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, -8, 2, 16);
  }

  // Red Propeller spinner nose cone
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(21, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws fleeing zoom trail when plane flies away
 */
function drawFlewAwayEffect(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 140, y - 100);
  ctx.stroke();
  ctx.restore();
}
