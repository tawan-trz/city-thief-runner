import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CityBuilding,
  Difficulty,
  FloatingText,
  GameState,
  LootItem,
  LootType,
  Obstacle,
  ObstacleType,
  Particle,
  Player,
  PoliceOfficer,
} from './types';
import {
  CanvasRenderer,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GROUND_Y,
} from './utils/canvasRenderer';
import { soundFx } from './utils/audio';
import { RetroHUD } from './components/RetroHUD';
import { HowToPlay } from './components/HowToPlay';
import { StartScreen } from './components/StartScreen';
import { Play, RotateCcw, Flame, Trophy, Siren, DollarSign, Sparkles, ArrowDown, ArrowUp, ChevronsDown, ChevronsUp } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'cops_robbers_runner_high_score';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game States
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [stolenCash, setStolenCash] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [skateboardTimer, setSkateboardTimer] = useState<number>(0);
  const [magnetTimer, setMagnetTimer] = useState<number>(0);

  // References for mutable game loop state to eliminate React render lag
  const stateRef = useRef<{
    gameState: GameState;
    difficulty: Difficulty;
    score: number;
    highScore: number;
    stolenCash: number;
    baseSpeed: number;
    currentSpeed: number;
    groundOffset: number;
    sirenTimer: number;
    nextSpawnDistance: number;
    nextLootDistance: number;
    lastSpeedLevel: number;
    hasAnnouncedNewRecord: boolean;
    initialHighScore: number;
    skateboardDuration: number;
    skateboardCooldown: number;
    magnetDuration: number;
    magnetCooldown: number;
    lootPatternIndex: number;
  }>({
    gameState: 'IDLE',
    difficulty: 'NORMAL',
    score: 0,
    highScore: 0,
    stolenCash: 0,
    baseSpeed: 2.4, // Reduced by 37% for comfortable, clear reaction pacing
    currentSpeed: 1.0,
    groundOffset: 0,
    sirenTimer: 0,
    nextSpawnDistance: 280,
    nextLootDistance: 340,
    lastSpeedLevel: 1.0,
    hasAnnouncedNewRecord: false,
    initialHighScore: 0,
    skateboardDuration: 0,
    skateboardCooldown: 18.0,
    magnetDuration: 0,
    magnetCooldown: 12.0,
    lootPatternIndex: 0,
  });

  // Entities
  const playerRef = useRef<Player>({
    x: 240, // 30% of screen width (800 * 0.3 = 240px)
    y: GROUND_Y,
    width: 34,
    height: 44,
    vy: 0,
    isGrounded: true,
    jumpCount: 0,
    maxJumps: 2,
    runFrame: 0,
    runTimer: 0,
    isDead: false,
    deathVy: 0,
    deathRotation: 0,
    busted: false,
    isDucking: false,
  });

  const copRef = useRef<PoliceOfficer>({
    x: 115, // Chasing comfortably behind player, fully in view on screen
    y: GROUND_Y,
    width: 36,
    height: 46,
    targetX: 115,
    runFrame: 0,
    runTimer: 0,
    isTackling: false,
    whistleTimer: 0,
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const lootItemsRef = useRef<LootItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const buildingsFarRef = useRef<CityBuilding[]>([]);
  const buildingsNearRef = useRef<CityBuilding[]>([]);

  const nextObstacleId = useRef<number>(1);
  const nextLootId = useRef<number>(1);
  const nextParticleId = useRef<number>(1);
  const nextTextId = useRef<number>(1);
  const lastObstacleCategoryRef = useRef<'GROUND' | 'OVERHEAD' | null>(null);

  const lastTimeRef = useRef<number>(0);

  // Initialize High Score & City Skyline Generation
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) {
          setHighScore(parsed);
          stateRef.current.highScore = parsed;
        }
      }
    } catch {
      // LocalStorage safe fallback
    }

    // Generate Background Buildings (Far Layer)
    const far: CityBuilding[] = [];
    let curFarX = 0;
    while (curFarX < CANVAS_WIDTH + 400) {
      const w = 70 + Math.random() * 60;
      const h = 140 + Math.random() * 120;
      const rows = Math.floor(h / 18);
      const cols = Math.floor(w / 14);
      const winGrid: boolean[][] = [];
      for (let r = 0; r < rows; r++) {
        winGrid[r] = [];
        for (let c = 0; c < cols; c++) {
          winGrid[r][c] = Math.random() > 0.4;
        }
      }
      far.push({
        x: curFarX,
        y: GROUND_Y,
        width: w,
        height: h,
        color: '#111827',
        windowRows: rows,
        windowCols: cols,
        hasAntenna: Math.random() > 0.6,
        windows: winGrid,
      });
      curFarX += w + 8;
    }
    buildingsFarRef.current = far;

    // Generate Near Buildings Layer
    const near: CityBuilding[] = [];
    let curNearX = 0;
    while (curNearX < CANVAS_WIDTH + 400) {
      const w = 60 + Math.random() * 70;
      const h = 90 + Math.random() * 110;
      const rows = Math.floor(h / 16);
      const cols = Math.floor(w / 14);
      const winGrid: boolean[][] = [];
      for (let r = 0; r < rows; r++) {
        winGrid[r] = [];
        for (let c = 0; c < cols; c++) {
          winGrid[r][c] = Math.random() > 0.35;
        }
      }
      near.push({
        x: curNearX,
        y: GROUND_Y,
        width: w,
        height: h,
        color: '#1e293b',
        windowRows: rows,
        windowCols: cols,
        hasAntenna: Math.random() > 0.5,
        windows: winGrid,
      });
      curNearX += w + 14;
    }
    buildingsNearRef.current = near;
  }, []);

  // Sync stateRef with React state
  useEffect(() => {
    stateRef.current.gameState = gameState;
  }, [gameState]);

  useEffect(() => {
    stateRef.current.difficulty = difficulty;
    // Casual, comfortable initial speeds (35% slower for crystal clear vision)
    stateRef.current.baseSpeed = difficulty === 'FAST' ? 3.2 : 2.4;
  }, [difficulty]);

  // Spawn Dust Particles helper
  const spawnDust = (x: number, y: number, count = 4) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: nextParticleId.current++,
        x: x + (Math.random() * 16 - 8),
        y: y - Math.random() * 4,
        vx: -(Math.random() * 2 + 0.8),
        vy: -(Math.random() * 1.2 + 0.2),
        color: '#94a3b8',
        size: Math.random() * 4 + 2,
        alpha: 0.85,
        life: 0,
        maxLife: 18,
        type: 'dust',
      });
    }
  };

  // Spawn Stolen Money Sparkles
  const spawnMoneySparkles = (x: number, y: number, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = Math.random() * 2.8 + 1.5;
      particlesRef.current.push({
        id: nextParticleId.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color: Math.random() > 0.5 ? '#22c55e' : '#fde047',
        size: Math.random() * 3 + 3,
        alpha: 1,
        life: 0,
        maxLife: 26,
        type: Math.random() > 0.4 ? 'money' : 'star',
      });
    }
  };

  // Spawn Golden Star Coin Sparkles (radiant bursting stars & gleams on coin pickup)
  const spawnCoinSparkles = (x: number, y: number, count = 8) => {
    const starColors = ['#fde047', '#facc15', '#ffffff', '#38bdf8', '#fbbf24'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
      const speed = Math.random() * 2.8 + 1.6;
      particlesRef.current.push({
        id: nextParticleId.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        size: Math.random() * 3 + 3,
        alpha: 1,
        life: 0,
        maxLife: 22,
        type: 'star',
      });
    }
  };

  // Spawn Skate Jet Flames & Sparks
  const spawnSkateSparks = (x: number, y: number) => {
    const colors = ['#f59e0b', '#ef4444', '#38bdf8', '#fbbf24', '#ffffff'];
    particlesRef.current.push({
      id: nextParticleId.current++,
      x: x - 18,
      y: y - 4 + (Math.random() * 6 - 3),
      vx: -(Math.random() * 3.5 + 2.5),
      vy: -(Math.random() * 1.4 - 0.4),
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 4 + 3,
      alpha: 0.9,
      life: 0,
      maxLife: 16,
      type: 'skate_spark',
    });

    if (Math.random() < 0.4) {
      particlesRef.current.push({
        id: nextParticleId.current++,
        x: x - 24,
        y: y - 20 + Math.random() * 24,
        vx: -(Math.random() * 4 + 3),
        vy: 0,
        color: '#38bdf8',
        size: Math.random() * 8 + 4,
        alpha: 0.6,
        life: 0,
        maxLife: 12,
        type: 'skate_trail',
      });
    }
  };

  // Spawn Coin Magnet Sparkles & Aura Wave Particles
  const spawnMagnetParticles = (x: number, y: number) => {
    const colors = ['#38bdf8', '#818cf8', '#c084fc', '#fde047', '#ffffff'];
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2.2 + 0.8;
    particlesRef.current.push({
      id: nextParticleId.current++,
      x: x + (Math.random() * 24 - 12),
      y: y + (Math.random() * 24 - 12),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 3 + 2,
      alpha: 0.9,
      life: 0,
      maxLife: 18,
      type: 'magnet_spark',
    });

    if (Math.random() < 0.25) {
      particlesRef.current.push({
        id: nextParticleId.current++,
        x,
        y,
        vx: 0,
        vy: 0,
        color: 'rgba(56, 189, 248, 0.6)',
        size: 14,
        alpha: 0.8,
        life: 0,
        maxLife: 14,
        type: 'magnet_wave',
      });
    }
  };

  // Add Floating Text helper
  const addFloatingText = (text: string, x: number, y: number, color = '#fde047', size = 13) => {
    floatingTextsRef.current.push({
      id: nextTextId.current++,
      text,
      x,
      y,
      vy: -1.4,
      color,
      size,
      alpha: 1,
      life: 0,
      maxLife: 42,
    });
  };

  // Safe Single-Row Loot Spawner with Strict Distance & Overlap Protection (Prevents Any Bunching / Clumping)
  const spawnSingleRowLoot = (
    items: { x: number; y: number; type: LootType; val: number }[]
  ) => {
    items.forEach((pt, idx) => {
      // Check if any existing uncollected loot is closer than 40px in x-axis
      const isTooClose = lootItemsRef.current.some(
        (item) => !item.collected && Math.abs(item.x - pt.x) < 40
      );
      if (!isTooClose) {
        lootItemsRef.current.push({
          id: nextLootId.current++,
          type: pt.type,
          x: pt.x,
          y: pt.y,
          width: 22,
          height: 22,
          collected: false,
          animFrame: idx * 3,
          animTimer: 0,
          value: pt.val,
        });
      }
    });
  };

  // Duck / Slide Action Handlers
  const handleDuckStart = useCallback(() => {
    const p = playerRef.current;
    const s = stateRef.current;

    if (s.gameState !== 'PLAYING') return;

    if (!p.isDucking && !p.isDead) {
      p.isDucking = true;
      p.height = 18; // Generous low-clearance hitbox height for effortless slides
      p.width = 46;
      soundFx.playSlide();
      spawnDust(p.x, GROUND_Y, 4);

      // Fast-fall if triggered while in mid-air
      if (!p.isGrounded) {
        p.vy += 3.5;
      }
    }
  }, []);

  const handleDuckEnd = useCallback(() => {
    const p = playerRef.current;
    if (p.isDucking) {
      p.isDucking = false;
      p.height = 44;
      p.width = 34;
    }
  }, []);

  // Jump Action (Airy, buoyant parabolic trajectory with Coyote Time and Jump Buffering support)
  const handleJump = useCallback(() => {
    const p = playerRef.current;
    const s = stateRef.current;

    if (s.gameState === 'IDLE') {
      startGame();
      return;
    }

    if (s.gameState === 'GAME_OVER') {
      resetGame();
      return;
    }

    if (s.gameState !== 'PLAYING') return;

    // Cancel ducking if jumping
    if (p.isDucking) {
      p.isDucking = false;
      p.height = 44;
      p.width = 34;
    }

    // Grounded Jump OR Coyote Time Jump (Grace window for comfortable, stress-free takeoffs)
    const canGroundJump = p.isGrounded || ((p.coyoteTimer ?? 0) > 0 && p.jumpCount === 0);

    if (canGroundJump) {
      p.vy = -8.8; // Soft, buoyant upward lift with extended forward hangtime
      p.isGrounded = false;
      p.jumpCount = 1;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      soundFx.playJump();
      spawnDust(p.x, GROUND_Y, 4);
    } else if (p.jumpCount < p.maxJumps) {
      // Double Jump in mid-air (High-lift agile hop)
      p.vy = -7.6;
      p.jumpCount = 2;
      p.jumpBufferTimer = 0;
      soundFx.playDoubleJump();
      spawnMoneySparkles(p.x, p.y - p.height / 2, 7);
      addFloatingText('DOUBLE JUMP! 💨', p.x, p.y - p.height - 10, '#38bdf8', 12);
    } else {
      // Jump Buffering: Store jump input for 12 frames (~200ms) if player pressed jump just before landing
      p.jumpBufferTimer = 12;
    }
  }, []);

  // Start Game
  const startGame = () => {
    soundFx.playClick();
    resetGameEntities();
    setGameState('PLAYING');
    setIsNewHighScore(false);
  };

  // Reset Game Entities
  const resetGameEntities = () => {
    const baseSpeed = difficulty === 'FAST' ? 3.2 : 2.4;

    stateRef.current.score = 0;
    stateRef.current.stolenCash = 0;
    stateRef.current.currentSpeed = 1.0;
    stateRef.current.baseSpeed = baseSpeed;
    stateRef.current.groundOffset = 0;
    stateRef.current.sirenTimer = 0;
    stateRef.current.nextSpawnDistance = 480;
    stateRef.current.nextLootDistance = 340;
    stateRef.current.lastSpeedLevel = 1.0;
    stateRef.current.hasAnnouncedNewRecord = false;
    stateRef.current.initialHighScore = stateRef.current.highScore;
    stateRef.current.skateboardDuration = 0;
    stateRef.current.skateboardCooldown = 18.0;
    stateRef.current.magnetDuration = 0;
    stateRef.current.magnetCooldown = 12.0;

    setScore(0);
    setStolenCash(0);
    setCurrentSpeed(1.0);
    setSkateboardTimer(0);
    setMagnetTimer(0);

    playerRef.current = {
      x: 240,
      y: GROUND_Y,
      width: 34,
      height: 44,
      vy: 0,
      isGrounded: true,
      jumpCount: 0,
      maxJumps: 2,
      runFrame: 0,
      runTimer: 0,
      isDead: false,
      deathVy: 0,
      deathRotation: 0,
      busted: false,
      isDucking: false,
      isSkateboarding: false,
      isMagnetActive: false,
      coyoteTimer: 10,
      jumpBufferTimer: 0,
    };

    copRef.current = {
      x: 115,
      y: GROUND_Y,
      width: 36,
      height: 46,
      targetX: 115,
      runFrame: 0,
      runTimer: 0,
      isTackling: false,
      whistleTimer: 0,
    };

    obstaclesRef.current = [];
    lootItemsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    lastObstacleCategoryRef.current = null;
  };

  // Reset Game
  const resetGame = () => {
    soundFx.playClick();
    resetGameEntities();
    setGameState('PLAYING');
    setIsNewHighScore(false);
  };

  // Toggle Pause
  const togglePause = () => {
    soundFx.playClick();
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
    }
  };

  // Toggle Sound
  const toggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  // Change Difficulty
  const handleDifficultyChange = (diff: Difficulty) => {
    if (gameState === 'PLAYING') return;
    soundFx.playClick();
    setDifficulty(diff);
  };

  // Keyboard Event Handlers (Jump with Space/Up/W, Duck with Down/S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        handleJump();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        handleDuckStart();
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        togglePause();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleSound();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        handleDuckEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleJump, handleDuckStart, handleDuckEnd, gameState]);

  // Main 60fps Game Loop Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    let animId: number;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      const p = playerRef.current;
      const cop = copRef.current;
      const s = stateRef.current;

      s.sirenTimer += deltaTime;

      // 1. UPDATE GAME STATE WHEN PLAYING
      if (s.gameState === 'PLAYING') {
        // Skateboard Buff & Cooldown Timer
        if (s.skateboardCooldown > 0) {
          s.skateboardCooldown = Math.max(0, s.skateboardCooldown - deltaTime);
        }

        let skateMultiplier = 1.0;
        if (s.skateboardDuration > 0) {
          s.skateboardDuration = Math.max(0, s.skateboardDuration - deltaTime);
          p.isSkateboarding = s.skateboardDuration > 0;
          skateMultiplier = 1.5;
          setSkateboardTimer(s.skateboardDuration);

          // Emit jet flames and wind trail while skateboarding
          spawnSkateSparks(p.x, p.y);
        } else {
          if (p.isSkateboarding) {
            p.isSkateboarding = false;
            setSkateboardTimer(0);
            addFloatingText('SKATE EXPIRED', p.x, p.y - 40, '#94a3b8', 11);
          }
        }

        // Coin Magnet Buff & Cooldown Timer
        if (s.magnetCooldown > 0) {
          s.magnetCooldown = Math.max(0, s.magnetCooldown - deltaTime);
        }

        if (s.magnetDuration > 0) {
          s.magnetDuration = Math.max(0, s.magnetDuration - deltaTime);
          p.isMagnetActive = s.magnetDuration > 0;
          setMagnetTimer(s.magnetDuration);

          // Emit cyan / electric violet sparkle aura around player
          if (Math.random() < 0.45) {
            spawnMagnetParticles(p.x, p.y - p.height / 2);
          }

          // Active Magnetic Attraction for All Nearby Uncollected Coins, Money Bags, and Diamonds
          const playerCenterX = p.x;
          const playerCenterY = p.y - p.height / 2;
          const magnetRadius = 260;

          for (const loot of lootItemsRef.current) {
            if (
              !loot.collected &&
              (loot.type === 'GOLD_COIN' ||
                loot.type === 'CASH_STACK' ||
                loot.type === 'MONEY_BAG' ||
                loot.type === 'DIAMOND')
            ) {
              const lootCenterX = loot.x + loot.width / 2;
              const lootCenterY = loot.y + loot.height / 2;
              const dx = playerCenterX - lootCenterX;
              const dy = playerCenterY - lootCenterY;
              const dist = Math.hypot(dx, dy);

              if (dist < magnetRadius && dist > 1) {
                // Accelerating magnetic pull speed (stronger suction as item gets closer)
                const pullSpeed = Math.min(18, 7.5 + (1 - dist / magnetRadius) * 12);
                loot.x += (dx / dist) * pullSpeed;
                loot.y += (dy / dist) * pullSpeed;

                if (Math.random() < 0.12) {
                  spawnMagnetParticles(lootCenterX, lootCenterY);
                }
              }
            }
          }
        } else {
          if (p.isMagnetActive) {
            p.isMagnetActive = false;
            setMagnetTimer(0);
            addFloatingText('MAGNET EXPIRED', p.x, p.y - 40, '#94a3b8', 11);
          }
        }

        // Ultra-smooth, gradual acceleration (barely noticeable speedup, never rushed)
        // Normal mode caps at 1.20x (~2.88px/frame), Fast mode caps at 1.30x (~4.16px/frame)
        const maxCap = s.difficulty === 'FAST' ? 1.30 : 1.20;
        const progressMultiplier = 1.0 + (s.score / 1500) * 0.02;
        const speedMultiplier = Math.min(maxCap, progressMultiplier) * skateMultiplier;

        s.currentSpeed = speedMultiplier;
        setCurrentSpeed(speedMultiplier);

        const activeSpeed = s.baseSpeed * speedMultiplier;
        s.groundOffset += activeSpeed;

        // Escaped Distance calculation (smooth meters) & Real Survival Score
        // Base survival grants ~6 points per second, plus speed multiplier & skateboard bonus
        s.score += deltaTime * 6.0 * speedMultiplier;
        setScore(Math.floor(s.score));

        // Speed alert announcement (only if speed increases visibly)
        const currentSpeedLevel = Math.floor(speedMultiplier * 10) / 10;
        if (currentSpeedLevel > s.lastSpeedLevel && currentSpeedLevel >= 1.1) {
          s.lastSpeedLevel = currentSpeedLevel;
          soundFx.playSpeedUp();
          addFloatingText('SPEED UP! 🚨', CANVAS_WIDTH / 2, 130, '#fde047', 14);
          spawnMoneySparkles(CANVAS_WIDTH / 2, 130, 8);
        }

        // Check High Score
        if (s.score > s.highScore) {
          s.highScore = Math.floor(s.score);
          setHighScore(s.highScore);

          if (!s.hasAnnouncedNewRecord && s.initialHighScore > 0 && s.score >= s.initialHighScore + 3) {
            s.hasAnnouncedNewRecord = true;
            setIsNewHighScore(true);
            soundFx.playNewRecord();
            addFloatingText('NEW RECORD ESCAPE! 🏆', CANVAS_WIDTH / 2, 100, '#fde047', 15);
            spawnMoneySparkles(CANVAS_WIDTH / 2, 100, 8);
          }

          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, String(s.highScore));
          } catch {
            // LocalStorage safety
          }
        }

        // Update Assist Timers (Coyote Time & Jump Buffering)
        if (p.isGrounded) {
          p.coyoteTimer = 12;
        } else {
          if ((p.coyoteTimer ?? 0) > 0) p.coyoteTimer = (p.coyoteTimer ?? 0) - 1;
        }

        if ((p.jumpBufferTimer ?? 0) > 0) {
          p.jumpBufferTimer = (p.jumpBufferTimer ?? 0) - 1;
        }

        // Robber (Player) Physics with Airy, Buoyant Low-Gravity Arc
        // (Rising gravity: 0.28 for prolonged hangtime & wide flight curve; Falling gravity: 0.38 for smooth landing)
        const gravity = p.vy < 0 ? 0.28 : 0.38;
        p.vy += gravity;
        if (p.vy > 9.5) p.vy = 9.5;
        p.y += p.vy;

        // Ground collision & Jump Buffer Execution
        if (p.y >= GROUND_Y) {
          const wasInAir = !p.isGrounded;
          p.y = GROUND_Y;
          p.vy = 0;
          p.isGrounded = true;
          p.jumpCount = 0;
          p.coyoteTimer = 12;

          if (wasInAir) {
            spawnDust(p.x, GROUND_Y, 4);

            // Execute Buffered Jump if player pressed Jump right before touching down (~200ms window)
            if ((p.jumpBufferTimer ?? 0) > 0) {
              p.jumpBufferTimer = 0;
              p.vy = -8.8;
              p.isGrounded = false;
              p.jumpCount = 1;
              p.coyoteTimer = 0;
              soundFx.playJump();
              spawnDust(p.x, GROUND_Y, 4);
            }
          }
        }

        // Robber Running Cycle animation (or sliding dust)
        if (p.isDucking && p.isGrounded) {
          if (Math.random() < 0.25) {
            spawnDust(p.x - 12, GROUND_Y, 1);
          }
        } else {
          p.runTimer += 1;
          if (p.runTimer > Math.max(4, 9 - Math.floor(speedMultiplier * 2))) {
            p.runTimer = 0;
            p.runFrame = (p.runFrame + 1) % 4;
          }
        }

        // Chasing Police Officer Animation
        cop.runTimer += 1;
        if (cop.runTimer > Math.max(4, 9 - Math.floor(speedMultiplier * 2))) {
          cop.runTimer = 0;
          cop.runFrame = (cop.runFrame + 1) % 4;
        }
        cop.whistleTimer += 1;

        // Periodic runner dust
        if (p.isGrounded && !p.isDucking && Math.random() < 0.14) {
          spawnDust(p.x - p.width / 2, GROUND_Y, 1);
        }
        if (Math.random() < 0.14) {
          spawnDust(cop.x - cop.width / 2, GROUND_Y, 1);
        }

        // Randomly trigger cop whistle sound in background during chase
        if (Math.random() < 0.0018) {
          soundFx.playWhistle();
        }

        // Spawn Obstacles (Balanced 50/50: Ground for Jumping vs Overhead for Ducking)
        s.nextSpawnDistance -= activeSpeed;
        if (s.nextSpawnDistance <= 0) {
          // 50% Ground Jump obstacles, 50% Overhead Duck obstacles
          const groundTypes: ObstacleType[] = ['TRAFFIC_CONE', 'TRASH_CAN', 'ROADBLOCK'];
          const overheadTypes: ObstacleType[] = ['POLICE_DRONE', 'OVERHEAD_BARRIER', 'CONSTRUCTION_SCAFFOLD'];

          let chosenCategory: 'GROUND' | 'OVERHEAD';
          if (lastObstacleCategoryRef.current === null) {
            chosenCategory = Math.random() < 0.5 ? 'GROUND' : 'OVERHEAD';
          } else if (lastObstacleCategoryRef.current === 'GROUND') {
            // Slightly favor alternating to prevent long repetitive streaks
            chosenCategory = Math.random() < 0.6 ? 'OVERHEAD' : 'GROUND';
          } else {
            chosenCategory = Math.random() < 0.6 ? 'GROUND' : 'OVERHEAD';
          }
          lastObstacleCategoryRef.current = chosenCategory;

          const randType: ObstacleType =
            chosenCategory === 'GROUND'
              ? groundTypes[Math.floor(Math.random() * groundTypes.length)]
              : overheadTypes[Math.floor(Math.random() * overheadTypes.length)];

          let obsWidth = 32;
          let obsHeight = 36;
          let obsY = GROUND_Y - obsHeight;

          if (randType === 'TRAFFIC_CONE') {
            obsWidth = 26;
            obsHeight = 30;
            obsY = GROUND_Y - obsHeight;
          } else if (randType === 'TRASH_CAN') {
            obsWidth = 32;
            obsHeight = 38;
            obsY = GROUND_Y - obsHeight;
          } else if (randType === 'ROADBLOCK') {
            obsWidth = 44;
            obsHeight = 38;
            obsY = GROUND_Y - obsHeight;
          } else if (randType === 'POLICE_DRONE') {
            obsWidth = 44;
            obsHeight = 24;
            // Overhead hovering: head-height to require ducking (SLIDE)
            obsY = GROUND_Y - 46;
          } else if (randType === 'OVERHEAD_BARRIER') {
            obsWidth = 52;
            obsHeight = 26;
            // Overhead traffic sign: head-height to require ducking (SLIDE)
            obsY = GROUND_Y - 48;
          } else if (randType === 'CONSTRUCTION_SCAFFOLD') {
            // High Long Overhead Scaffold (100% Slide Mandatory - Impossible to jump over)
            // Extends from y=0 (top edge of game screen) down to GROUND_Y - 26 (clearance height for sliding)
            obsWidth = 140;
            obsY = 0;
            obsHeight = GROUND_Y - 26; // Leaves 26px crawl tunnel underneath (ducking robber is 18px tall)
          }

          obstaclesRef.current.push({
            id: nextObstacleId.current++,
            type: randType,
            x: CANVAS_WIDTH + 40,
            y: obsY,
            width: obsWidth,
            height: obsHeight,
            passed: false,
            animFrame: 0,
            animTimer: 0,
            lightState: true,
          });

          // 1. GUIDING COIN PATHS FOR OBSTACLES (Strict Uniform Spacing of 48px, Zero Overlap):
          // A) Ground Obstacles (Cone / Trash Can / Roadblock): 5-coin Jump Arc following character's natural parabolic jump curve
          if (chosenCategory === 'GROUND') {
            const obsCenterX = CANVAS_WIDTH + 40 + obsWidth / 2;
            // High Tier Loot on Obstacle Apex (Roadblock has rare chance for 💎, Trash/Cone has small chance for 💰)
            const isRoadblock = randType === 'ROADBLOCK';
            const apexType: LootType = isRoadblock
              ? (Math.random() < 0.25 ? 'DIAMOND' : Math.random() < 0.6 ? 'MONEY_BAG' : 'GOLD_COIN')
              : (Math.random() < 0.2 ? 'MONEY_BAG' : 'GOLD_COIN');
            const apexVal = apexType === 'DIAMOND' ? 50 : apexType === 'MONEY_BAG' ? 20 : 3;

            const arcCoins: { x: number; y: number; type: LootType; val: number }[] = [
              { x: obsCenterX - 96 - 11, y: GROUND_Y - 22, type: 'GOLD_COIN', val: 2 },
              { x: obsCenterX - 48 - 11, y: GROUND_Y - 70, type: 'GOLD_COIN', val: 2 },
              {
                x: obsCenterX - 11,
                y: Math.min(obsY - 32, GROUND_Y - 96),
                type: apexType,
                val: apexVal,
              },
              { x: obsCenterX + 48 - 11, y: GROUND_Y - 70, type: 'GOLD_COIN', val: 2 },
              { x: obsCenterX + 96 - 11, y: GROUND_Y - 22, type: 'GOLD_COIN', val: 2 },
            ];
            spawnSingleRowLoot(arcCoins);
          } else {
            // B) Overhead Obstacles (Police Drone / Overhead Barrier / Long Scaffold): Clean Ground Slide Trail directly underneath
            const obsCenterX = CANVAS_WIDTH + 40 + obsWidth / 2;
            if (randType === 'CONSTRUCTION_SCAFFOLD') {
              // 5-coin long continuous slide reward row under the scaffold canopy
              const longSlideCoins: { x: number; y: number; type: LootType; val: number }[] = [
                { x: obsCenterX - 80 - 11, y: GROUND_Y - 20, type: 'GOLD_COIN', val: 2 },
                { x: obsCenterX - 40 - 11, y: GROUND_Y - 20, type: 'GOLD_COIN', val: 2 },
                { x: obsCenterX - 11, y: GROUND_Y - 20, type: Math.random() < 0.35 ? 'MONEY_BAG' : 'GOLD_COIN', val: Math.random() < 0.35 ? 18 : 2 },
                { x: obsCenterX + 40 - 11, y: GROUND_Y - 20, type: 'GOLD_COIN', val: 2 },
                { x: obsCenterX + 80 - 11, y: GROUND_Y - 20, type: 'GOLD_COIN', val: 2 },
              ];
              spawnSingleRowLoot(longSlideCoins);
            } else {
              const slideCoins: { x: number; y: number; type: LootType; val: number }[] = [
                { x: obsCenterX - 72 - 11, y: GROUND_Y - 20, type: 'GOLD_COIN', val: 2 },
                { x: obsCenterX - 24 - 11, y: GROUND_Y - 20, type: 'GOLD_COIN', val: 2 },
                { x: obsCenterX + 24 - 11, y: GROUND_Y - 20, type: Math.random() < 0.2 ? 'MONEY_BAG' : 'GOLD_COIN', val: Math.random() < 0.2 ? 15 : 2 },
                { x: obsCenterX + 72 - 11, y: GROUND_Y - 20, type: 'GOLD_COIN', val: 2 },
              ];
              spawnSingleRowLoot(slideCoins);
            }
          }

          // Relaxed, generous spacing between obstacles (3.3s to 5.2s reaction time)
          const minGap = 480 + Math.random() * 260;
          s.nextSpawnDistance = minGap;
        }

        // 2. OPEN-TRACK LOOT SPAWNER (Only spawns on completely clear track areas with no obstacle overlap)
        s.nextLootDistance -= activeSpeed;
        if (s.nextLootDistance <= 0) {
          const startX = CANVAS_WIDTH + 40;

          // Check if any obstacle is currently in or near the spawn zone [startX - 120, startX + 280]
          const isObstacleNearby = obstaclesRef.current.some(
            (obs) => obs.x > startX - 120 && obs.x < startX + 280
          );

          if (isObstacleNearby) {
            // Postpone open-track spawn to prevent any collision/overlap with obstacle formations
            s.nextLootDistance = 150;
          } else {
            // Rare Skateboard Power-up (10-12% chance with 25-35s cooldown between drops)
            const canSpawnSkate =
              s.skateboardCooldown <= 0 &&
              s.skateboardDuration <= 0 &&
              Math.random() < 0.12;

            // Mid-tier Coin Magnet Power-up (16-18% chance with 20-30s cooldown between drops)
            const canSpawnMagnet =
              !canSpawnSkate &&
              s.magnetCooldown <= 0 &&
              s.magnetDuration <= 0 &&
              Math.random() < 0.18;

            if (canSpawnSkate) {
              lootItemsRef.current.push({
                id: nextLootId.current++,
                type: 'SKATEBOARD',
                x: startX,
                y: GROUND_Y - 45,
                width: 32,
                height: 24,
                collected: false,
                animFrame: 0,
                animTimer: 0,
                value: 300,
              });
              s.skateboardCooldown = 25.0 + Math.random() * 10.0;
            } else if (canSpawnMagnet) {
              lootItemsRef.current.push({
                id: nextLootId.current++,
                type: 'MAGNET',
                x: startX,
                y: GROUND_Y - 45,
                width: 28,
                height: 28,
                collected: false,
                animFrame: 0,
                animTimer: 0,
                value: 100,
              });
              s.magnetCooldown = 20.0 + Math.random() * 10.0;
            } else {
              const currentPattern = s.lootPatternIndex % 2;
              s.lootPatternIndex = (s.lootPatternIndex + 1) % 2;

              if (currentPattern === 0) {
                // Pattern 1: "แถวตรงเรียบพื้น" (Ground Straight Line) - 4 gleaming coins evenly spaced with 48px gap
                const lineCoins = [
                  { x: startX, y: GROUND_Y - 22, type: 'GOLD_COIN' as LootType, val: 2 },
                  { x: startX + 48, y: GROUND_Y - 22, type: 'GOLD_COIN' as LootType, val: 2 },
                  { x: startX + 96, y: GROUND_Y - 22, type: 'GOLD_COIN' as LootType, val: 2 },
                  { x: startX + 144, y: GROUND_Y - 22, type: 'GOLD_COIN' as LootType, val: 2 },
                ];
                spawnSingleRowLoot(lineCoins);
              } else {
                // Pattern 2: "แนวดิ่งนำสายตา" (Double Jump Air Guide) - Parabolic curve ascending to High Apex Cash/Diamond (48px spacing)
                const apexLootType: LootType = Math.random() < 0.2 ? 'DIAMOND' : 'MONEY_BAG';
                const apexLootVal = apexLootType === 'DIAMOND' ? 50 : 20;

                const doubleJumpFormation = [
                  { x: startX, y: GROUND_Y - 22, type: 'GOLD_COIN' as LootType, val: 2 },
                  { x: startX + 48, y: GROUND_Y - 64, type: 'GOLD_COIN' as LootType, val: 2 },
                  { x: startX + 96, y: GROUND_Y - 108, type: apexLootType, val: apexLootVal }, // High Apex Rare Loot
                  { x: startX + 144, y: GROUND_Y - 64, type: 'GOLD_COIN' as LootType, val: 2 },
                  { x: startX + 192, y: GROUND_Y - 22, type: 'GOLD_COIN' as LootType, val: 2 },
                ];
                spawnSingleRowLoot(doubleJumpFormation);
              }
            }

            s.nextLootDistance = 380 + Math.random() * 240;
          }
        }

        // Update Obstacles & Collision Detection
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const obs = obstaclesRef.current[i];
          obs.x -= activeSpeed;

          // Animation
          obs.animTimer += 1;
          if (obs.animTimer > 6) {
            obs.animTimer = 0;
            obs.animFrame = (obs.animFrame + 1) % 8;
            obs.lightState = !obs.lightState;
          }

          // Accurate, forgiving hitbox check (Generous 7px margin so player never suffers unfair edge deaths)
          // Standing: height 44 (pTop = GROUND_Y - 38)
          // Ducking: height 18 (pTop = GROUND_Y - 16) -> Duck passes smoothly and comfortably under drones
          const pLeft = p.x - p.width / 2 + 7;
          const pRight = p.x + p.width / 2 - 7;
          const pTop = p.y - p.height + 6;
          const pBottom = p.y - 3;

          const obsLeft = obs.x + 6;
          const obsRight = obs.x + obs.width - 6;
          const obsTop = obs.y + 6;
          const obsBottom = obs.y + obs.height - 2;

          if (
            pRight > obsLeft &&
            pLeft < obsRight &&
            pBottom > obsTop &&
            pTop < obsBottom
          ) {
            if (p.isSkateboarding) {
              // INVINCIBLE SKATEBOARD SMASH: Destroy obstacle with sparks & smash sound
              soundFx.playSmash();
              spawnMoneySparkles(obs.x + obs.width / 2, obs.y + obs.height / 2, 10);
              spawnDust(obs.x + obs.width / 2, obs.y + obs.height / 2, 6);
              addFloatingText('SMASH! 💥', obs.x, obs.y - 10, '#f97316', 14);

              // Remove smashed obstacle
              obstaclesRef.current.splice(i, 1);
              continue;
            }

            // TRIGGER BUSTED / GAME OVER
            s.gameState = 'GAME_OVER';
            setGameState('GAME_OVER');
            p.busted = true;
            p.isDead = true;

            // Police officer rushes forward to tackle / cuff the robber
            cop.isTackling = true;
            cop.targetX = p.x - 24;

            soundFx.playWhistle();
            soundFx.playBusted();

            spawnMoneySparkles(p.x, p.y - p.height / 2, 14);
            spawnDust(p.x, p.y, 8);
            addFloatingText('BUSTED! 🚨', p.x, p.y - p.height - 20, '#ef4444', 18);
            break;
          }

          // Clean up off-screen
          if (obs.x + obs.width < -100) {
            obstaclesRef.current.splice(i, 1);
          }
        }

        // Update Loot Collectibles
        for (let i = lootItemsRef.current.length - 1; i >= 0; i--) {
          const loot = lootItemsRef.current[i];
          loot.x -= activeSpeed;
          loot.animFrame += 1;

          if (!loot.collected) {
            // Magnetic/forgiving pickup buffer for collecting loot smoothly along jump arcs
            const pLeft = p.x - p.width / 2 - 12;
            const pRight = p.x + p.width / 2 + 12;
            const pTop = p.y - p.height - 12;
            const pBottom = p.y + 10;

            if (
              pRight > loot.x &&
              pLeft < loot.x + loot.width &&
              pBottom > loot.y &&
              pTop < loot.y + loot.height
            ) {
              loot.collected = true;

              if (loot.type === 'SKATEBOARD') {
                // Trigger 5-second Skateboard Buff
                s.skateboardDuration = 5.0;
                p.isSkateboarding = true;
                setSkateboardTimer(5.0);

                soundFx.playSkateboard();
                spawnMoneySparkles(loot.x + loot.width / 2, loot.y + loot.height / 2, 12);
                spawnSkateSparks(p.x, p.y);
                addFloatingText('🛹 SKATEBOARD POWER! (5s)', p.x, p.y - p.height - 18, '#fbbf24', 14);
              } else if (loot.type === 'MAGNET') {
                // Trigger 5-second Coin Magnet Buff
                s.magnetDuration = 5.0;
                p.isMagnetActive = true;
                setMagnetTimer(5.0);

                soundFx.playMagnet();
                spawnMagnetParticles(p.x, p.y - p.height / 2);
                spawnMagnetParticles(loot.x + loot.width / 2, loot.y + loot.height / 2);
                addFloatingText('🧲 COIN MAGNET! (5s)', p.x, p.y - p.height - 18, '#38bdf8', 14);
              } else if (loot.type === 'GOLD_COIN') {
                // Golden Coin collection (Standard Common Loot: +$2 cash, +1 score)
                s.stolenCash += loot.value;
                s.score += 1;
                setStolenCash(s.stolenCash);
                setScore(Math.floor(s.score));

                soundFx.playCoinPickup();
                spawnCoinSparkles(loot.x + loot.width / 2, loot.y + loot.height / 2, 7);
                addFloatingText(`+$${loot.value}`, loot.x, loot.y - 12, '#fde047', 12);
              } else if (loot.type === 'DIAMOND') {
                // Rare Blue Diamond collection (Tier 3 Legendary: +$50 cash, +25 score)
                s.stolenCash += loot.value;
                s.score += 25;
                setStolenCash(s.stolenCash);
                setScore(Math.floor(s.score));

                soundFx.playMoneyPickup();
                spawnCoinSparkles(loot.x + loot.width / 2, loot.y + loot.height / 2, 12);
                addFloatingText(`+$${loot.value} 💎 JACKPOT!`, loot.x, loot.y - 14, '#38bdf8', 14);
              } else {
                // Money Bag / Cash Stacks (Tier 2 Rare Loot: +$15-$20 cash, +10 score)
                s.stolenCash += loot.value;
                s.score += 10;
                setStolenCash(s.stolenCash);
                setScore(Math.floor(s.score));

                soundFx.playMoneyPickup();
                spawnMoneySparkles(loot.x + loot.width / 2, loot.y + loot.height / 2, 8);
                addFloatingText(`+$${loot.value} 💰 BIG CASH!`, loot.x, loot.y - 12, '#4ade80', 13);
              }
            }
          }

          if (loot.x + loot.width < -60 || loot.collected) {
            lootItemsRef.current.splice(i, 1);
          }
        }
      }

      // 2. UPDATE GAME OVER / BUSTED COPS TACKLE ANIMATION
      if (s.gameState === 'GAME_OVER') {
        // Cop smoothly rushes in to handcuff the robber
        if (cop.x < cop.targetX) {
          cop.x += 4.5;
        } else {
          cop.x = cop.targetX;
        }
      }

      // 3. UPDATE PARTICLES & FLOATING TEXTS
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const part = particlesRef.current[i];
        part.x += part.vx;
        part.y += part.vy;
        part.life += 1;
        part.alpha = 1 - part.life / part.maxLife;
        if (part.life >= part.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }

      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const txt = floatingTextsRef.current[i];
        txt.y += txt.vy;
        txt.life += 1;
        txt.alpha = 1 - txt.life / txt.maxLife;
        if (txt.life >= txt.maxLife) {
          floatingTextsRef.current.splice(i, 1);
        }
      }

      // 4. RENDER CANVAS SCENE
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background Skyline & Stars & Ambient Siren
      CanvasRenderer.drawBackground(
        ctx,
        buildingsFarRef.current,
        buildingsNearRef.current,
        s.groundOffset,
        s.sirenTimer
      );

      // City Asphalt Road & Curb
      CanvasRenderer.drawRoad(ctx, s.groundOffset, s.sirenTimer);

      // Loot Items
      for (const loot of lootItemsRef.current) {
        CanvasRenderer.drawLootItem(ctx, loot);
      }

      // Obstacles
      for (const obs of obstaclesRef.current) {
        CanvasRenderer.drawObstacle(ctx, obs);
      }

      // Police Officer Chasing
      CanvasRenderer.drawPoliceOfficer(ctx, cop);

      // Robber (Player)
      CanvasRenderer.drawPlayer(ctx, p);

      // Particles & Floating Text FX
      CanvasRenderer.drawParticles(ctx, particlesRef.current);
      CanvasRenderer.drawFloatingTexts(ctx, floatingTextsRef.current);

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Touch Swipe Gesture Detection for Canvas Stage
  const touchStartPos = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchDuckingActive = useRef<boolean>(false);

  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current || e.touches.length === 0) return;
    const dy = e.touches[0].clientY - touchStartPos.current.y;
    const dx = e.touches[0].clientX - touchStartPos.current.x;

    // Swipe Down -> Duck
    if (dy > 30 && Math.abs(dy) > Math.abs(dx)) {
      touchDuckingActive.current = true;
      handleDuckStart();
    }
  };

  const handleCanvasTouchEnd = (e: React.TouchEvent) => {
    if (touchDuckingActive.current) {
      touchDuckingActive.current = false;
      handleDuckEnd();
      touchStartPos.current = null;
      return;
    }

    if (touchStartPos.current) {
      const dt = Date.now() - touchStartPos.current.time;
      // Quick tap -> Jump
      if (dt < 300) {
        handleJump();
      }
    }
    touchStartPos.current = null;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0b101e] to-slate-950 text-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 select-none font-['Prompt',sans-serif]">
      {/* Top Header Banner */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg border border-amber-400/40 text-xl">
            💰
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold font-['Press_Start_2P'] text-amber-400 tracking-tight flex items-center gap-2">
              COPS & ROBBERS
            </h1>
            <p className="text-xs text-slate-400">เกมโจรวิ่งหนีตำรวจบนถนนในเมือง (City Chase)</p>
          </div>
        </div>

        {/* Status Mode Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
              difficulty === 'FAST'
                ? 'bg-red-500/20 border-red-500/50 text-red-300'
                : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
            }`}
          >
            <Siren className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            MODE: {difficulty}
          </span>
        </div>
      </header>

      {/* Main Game Container */}
      <div className="w-full max-w-4xl flex flex-col items-center gap-3">
        {/* Retro HUD Header */}
        <RetroHUD
          score={score}
          highScore={highScore}
          stolenCash={stolenCash}
          speed={currentSpeed}
          difficulty={difficulty}
          gameState={gameState}
          isMuted={isMuted}
          skateboardTimer={skateboardTimer}
          magnetTimer={magnetTimer}
          onToggleMute={toggleSound}
          onTogglePause={togglePause}
          onChangeDifficulty={handleDifficultyChange}
        />

        {/* Canvas Game Stage with Overlay UI */}
        <div
          id="game-viewport-container"
          onClick={handleJump}
          onTouchStart={handleCanvasTouchStart}
          onTouchMove={handleCanvasTouchMove}
          onTouchEnd={handleCanvasTouchEnd}
          className={`relative w-full ${
            gameState === 'IDLE'
              ? 'min-h-[580px] sm:min-h-[500px] md:min-h-[460px] md:aspect-[2/1]'
              : 'aspect-[2/1]'
          } rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800/90 bg-[#070b14] cursor-pointer group select-none touch-none transition-all duration-300`}
        >
          {/* HTML5 Canvas */}
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full block"
          />

          {/* OVERLAY: START SCREEN (2-COLUMN RESPONSIVE) */}
          {gameState === 'IDLE' && (
            <StartScreen
              difficulty={difficulty}
              onChangeDifficulty={handleDifficultyChange}
              onStartGame={startGame}
              highScore={highScore}
            />
          )}

          {/* OVERLAY: PAUSE SCREEN */}
          {gameState === 'PAUSED' && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-40">
              <div className="bg-slate-900/90 border-2 border-amber-500/60 rounded-2xl p-6 max-w-xs w-full shadow-2xl flex flex-col items-center gap-4">
                <h3 className="text-lg font-bold font-['Press_Start_2P'] text-amber-400">
                  PAUSED
                </h3>
                <p className="text-xs text-slate-400">เกมหยุดชั่วคราว</p>
                <button
                  id="modal-resume-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePause();
                  }}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-['Press_Start_2P'] text-xs rounded-xl shadow-lg border border-emerald-400 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  เล่นต่อ (RESUME)
                </button>
              </div>
            </div>
          )}

          {/* OVERLAY: BUSTED / GAME OVER SCREEN */}
          {gameState === 'GAME_OVER' && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-40">
              <div className="bg-slate-900/95 border-2 border-red-500/80 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl flex flex-col items-center gap-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-3xl animate-bounce">🚨</span>
                  <span className="text-3xl">⛓️</span>
                </div>

                <div className="bg-red-600 text-white font-['Press_Start_2P'] text-sm sm:text-base px-4 py-1.5 rounded-lg border-2 border-red-400 tracking-wider shadow-lg">
                  BUSTED!
                </div>
                <p className="text-xs text-red-300 font-semibold">คุณโดนตำรวจรวบตัวแล้ว!</p>

                {/* Score Summary Box */}
                <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 font-mono">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-400">ระยะทางที่หนีรอด:</span>
                    <span className="font-bold text-amber-300 font-['Press_Start_2P'] text-xs sm:text-sm">
                      {Math.floor(score)}m
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-400">เงินที่กอบโกยได้:</span>
                    <span className="font-bold text-emerald-400 font-['Press_Start_2P'] text-xs sm:text-sm flex items-center">
                      ${stolenCash.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                      สถิติสูงสุด:
                    </span>
                    <span className="font-bold text-yellow-400 font-['Press_Start_2P'] text-xs sm:text-sm">
                      {Math.floor(highScore)}m
                    </span>
                  </div>
                </div>

                {isNewHighScore && (
                  <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg py-1.5 px-3 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>สร้างสถิติหลบหนีสูงสุดใหม่! 🎉</span>
                  </div>
                )}

                {/* Restart Button */}
                <button
                  id="restart-game-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetGame();
                  }}
                  className="w-full py-3 px-5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-98 text-white font-bold font-['Press_Start_2P'] text-xs sm:text-sm rounded-xl shadow-lg border-2 border-emerald-400 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  เริ่มใหม่ (TRY AGAIN)
                </button>

                <span className="text-[11px] text-slate-400">
                  กด <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-amber-300">Spacebar</kbd> เพื่อเริ่มใหม่ทันที
                </span>
              </div>
            </div>
          )}

          {/* Quick in-game hint badge */}
          {gameState === 'PLAYING' && (
            <div className="absolute top-2 left-2 pointer-events-none z-10 flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-mono bg-black/60 backdrop-blur-xs text-white/95 px-2.5 py-1 rounded-md border border-white/20 flex items-center gap-1.5 shadow">
                <Siren className="w-3 h-3 text-red-400 animate-pulse" />
                <span><b className="text-emerald-300">▲ JUMP:</b> กระโดด</span>
                <span className="text-slate-500">|</span>
                <span><b className="text-cyan-300">▼ DUCK:</b> ก้มมุดหลบโดรน</span>
              </span>
            </div>
          )}

          {/* ON-SCREEN MOBILE / VIRTUAL CONTROLS (Cookie Run Style: Left = JUMP, Right = SLIDE, Generous Thumb Offset & Big Circular Tactile Buttons) */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8 z-30 select-none touch-none pointer-events-auto">
            <button
              id="onscreen-jump-btn"
              type="button"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleJump();
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleJump();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleJump();
              }}
              className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full bg-emerald-950/45 hover:bg-emerald-900/65 active:bg-emerald-700/85 border-[2px] border-emerald-400/50 hover:border-emerald-300 active:border-emerald-100 shadow-lg shadow-emerald-950/40 backdrop-blur-xs flex flex-col items-center justify-center gap-0.5 text-emerald-300 active:text-white active:scale-90 active:shadow-inner transition-transform duration-75 select-none touch-none cursor-pointer group ring-2 ring-emerald-500/20"
              title="กระโดดข้ามสิ่งกีดขวาง (JUMP / 2x JUMP)"
            >
              <ChevronsUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300 group-hover:text-emerald-100 group-active:scale-110 transition-transform" />
              <span className="font-['Press_Start_2P'] text-[7.5px] sm:text-[9px] text-emerald-200 tracking-tighter drop-shadow">
                JUMP
              </span>
              <span className="text-[7px] sm:text-[7.5px] font-sans font-bold text-emerald-300/90 -mt-0.5">
                กระโดด
              </span>
            </button>
          </div>

          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-30 select-none touch-none pointer-events-auto">
            <button
              id="onscreen-slide-btn"
              type="button"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleDuckStart();
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                handleDuckEnd();
              }}
              onMouseLeave={() => {
                handleDuckEnd();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDuckStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDuckEnd();
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDuckEnd();
              }}
              className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full bg-cyan-950/45 hover:bg-cyan-900/65 active:bg-cyan-700/85 border-[2px] border-cyan-400/50 hover:border-cyan-300 active:border-cyan-100 shadow-lg shadow-cyan-950/40 backdrop-blur-xs flex flex-col items-center justify-center gap-0.5 text-cyan-300 active:text-white active:scale-90 active:shadow-inner transition-transform duration-75 select-none touch-none cursor-pointer group ring-2 ring-cyan-500/20"
              title="ก้มมุดสไลด์หลบสิ่งกีดขวางระดับสูง (SLIDE)"
            >
              <ChevronsDown className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300 group-hover:text-cyan-100 group-active:scale-110 transition-transform" />
              <span className="font-['Press_Start_2P'] text-[7.5px] sm:text-[9px] text-cyan-200 tracking-tighter drop-shadow">
                SLIDE
              </span>
              <span className="text-[7px] sm:text-[7.5px] font-sans font-bold text-cyan-300/90 -mt-0.5">
                สไลด์มุด
              </span>
            </button>
          </div>
        </div>

        {/* Dual Responsive Action Buttons Deck (Cookie Run Order: Left JUMP & Right SLIDE) */}
        <div className="w-full grid grid-cols-2 gap-3">
          {/* JUMP BUTTON */}
          <button
            id="mobile-jump-touch-btn"
            type="button"
            onClick={handleJump}
            onTouchStart={(e) => {
              e.preventDefault();
              handleJump();
            }}
            className="py-3.5 sm:py-4 px-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 active:from-emerald-700 active:to-emerald-700 active:scale-96 text-slate-950 font-extrabold font-['Press_Start_2P'] text-[10px] sm:text-xs rounded-2xl shadow-xl shadow-emerald-950/40 border-2 border-emerald-300 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer select-none touch-none"
          >
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-950">
              <ArrowUp className="w-4 h-4 text-slate-950" />
              <span>JUMP (กระโดด)</span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-sans font-bold text-emerald-950">
              กระโดดข้ามสิ่งกีดขวาง (กดซ้ำเพื่อกระโดดเบิ้ล) [Space / ▲]
            </span>
          </button>

          {/* DUCK / SLIDE BUTTON */}
          <button
            id="mobile-duck-touch-btn"
            type="button"
            onMouseDown={handleDuckStart}
            onMouseUp={handleDuckEnd}
            onMouseLeave={handleDuckEnd}
            onTouchStart={(e) => {
              e.preventDefault();
              handleDuckStart();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleDuckEnd();
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              handleDuckEnd();
            }}
            className="py-3.5 sm:py-4 px-3 bg-gradient-to-r from-cyan-900 via-cyan-800 to-cyan-900 hover:from-cyan-800 hover:to-cyan-700 active:from-cyan-950 active:to-cyan-950 active:scale-96 text-cyan-100 font-extrabold font-['Press_Start_2P'] text-[10px] sm:text-xs rounded-2xl shadow-xl shadow-cyan-950/40 border-2 border-cyan-400/80 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer select-none touch-none"
          >
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-cyan-300">
              <ArrowDown className="w-4 h-4 text-cyan-300" />
              <span>SLIDE (สไลด์มุด)</span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-sans font-semibold text-cyan-200">
              มุดหลบโดรน / คานป้าย [S / ▼]
            </span>
          </button>
        </div>

        {/* How to Play & Instructions Box */}
        <HowToPlay />
      </div>
    </main>
  );
}
