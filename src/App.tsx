import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CityBuilding,
  Difficulty,
  FloatingText,
  GameState,
  GroundPit,
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
  const [totalCoins, setTotalCoins] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [skateboardTimer, setSkateboardTimer] = useState<number>(0);
  const [magnetTimer, setMagnetTimer] = useState<number>(0);
  const [bonusTimer, setBonusTimer] = useState<number>(0);
  const [isBonusPhase, setIsBonusPhase] = useState<boolean>(false);

  // References for mutable game loop state to eliminate React render lag
  const stateRef = useRef<{
    gameState: GameState;
    difficulty: Difficulty;
    score: number;
    highScore: number;
    stolenCash: number;
    totalCoins: number;
    baseSpeed: number;
    currentSpeed: number;
    groundOffset: number;
    sirenTimer: number;
    nextSpawnDistance: number;
    nextLootDistance: number;
    nextPitDistance: number;
    lastSpeedLevel: number;
    hasAnnouncedNewRecord: boolean;
    initialHighScore: number;
    skateboardDuration: number;
    skateboardCooldown: number;
    magnetDuration: number;
    magnetCooldown: number;
    lootPatternIndex: number;
    lastBonusMilestone: number;
    isBonusPhase: boolean;
    bonusDuration: number;
    bonusTransition: number;
    bonusGracePeriod: number;
    bonusPatternStep: number;
  }>({
    gameState: 'IDLE',
    difficulty: 'NORMAL',
    score: 0,
    highScore: 0,
    stolenCash: 0,
    totalCoins: 0,
    baseSpeed: 6.3, // High-Pacing 60fps base speed (~378 px/sec) - fast, thrilling & energetic start
    currentSpeed: 1.0,
    groundOffset: 0,
    sirenTimer: 0,
    nextSpawnDistance: 420,
    nextLootDistance: 260,
    nextPitDistance: 300,
    lastSpeedLevel: 1.0,
    hasAnnouncedNewRecord: false,
    initialHighScore: 0,
    skateboardDuration: 0,
    skateboardCooldown: 16.0,
    magnetDuration: 0,
    magnetCooldown: 12.0,
    lootPatternIndex: 0,
    lastBonusMilestone: 0,
    isBonusPhase: false,
    bonusDuration: 0,
    bonusTransition: 0,
    bonusGracePeriod: 0,
    bonusPatternStep: 0,
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
  const pitsRef = useRef<GroundPit[]>([]);
  const lootItemsRef = useRef<LootItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const buildingsFarRef = useRef<CityBuilding[]>([]);
  const buildingsNearRef = useRef<CityBuilding[]>([]);

  const nextObstacleId = useRef<number>(1);
  const nextPitId = useRef<number>(1);
  const nextLootId = useRef<number>(1);
  const nextParticleId = useRef<number>(1);
  const nextTextId = useRef<number>(1);
  const lastObstacleCategoryRef = useRef<'GROUND' | 'OVERHEAD' | null>(null);

  const lastTimeRef = useRef<number>(0);
  const jumpKeyReleasedRef = useRef<boolean>(true);
  const lastJumpTimeRef = useRef<number>(0);

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
    // Standardized, engaging base speeds across all refresh rates (dt-scaled)
    stateRef.current.baseSpeed = difficulty === 'FAST' ? 5.2 : 4.2;
  }, [difficulty]);

  // Trim excess particles to keep rendering ultra-smooth on mobile
  const trimParticles = () => {
    if (particlesRef.current.length > 35) {
      particlesRef.current.splice(0, particlesRef.current.length - 35);
    }
  };

  // Spawn Dust Particles helper
  const spawnDust = (x: number, y: number, count = 3) => {
    trimParticles();
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: nextParticleId.current++,
        x: x + (Math.random() * 16 - 8),
        y: y - Math.random() * 4,
        vx: -(Math.random() * 2 + 0.8),
        vy: -(Math.random() * 1.2 + 0.2),
        color: '#94a3b8',
        size: Math.random() * 3 + 2,
        alpha: 0.85,
        life: 0,
        maxLife: 16,
        type: 'dust',
      });
    }
  };

  // Spawn Stolen Money Sparkles
  const spawnMoneySparkles = (x: number, y: number, count = 6) => {
    trimParticles();
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
        size: Math.random() * 3 + 2,
        alpha: 1,
        life: 0,
        maxLife: 22,
        type: Math.random() > 0.4 ? 'money' : 'star',
      });
    }
  };

  // Spawn Golden Star Coin Sparkles (radiant bursting stars & gleams on coin pickup)
  const spawnCoinSparkles = (x: number, y: number, count = 6) => {
    trimParticles();
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
        size: Math.random() * 3 + 2,
        alpha: 1,
        life: 0,
        maxLife: 20,
        type: 'star',
      });
    }
  };

  // Spawn Skate Jet Flames & Sparks
  const spawnSkateSparks = (x: number, y: number) => {
    trimParticles();
    const colors = ['#f59e0b', '#ef4444', '#38bdf8', '#fbbf24', '#ffffff'];
    particlesRef.current.push({
      id: nextParticleId.current++,
      x: x - 18,
      y: y - 4 + (Math.random() * 6 - 3),
      vx: -(Math.random() * 3.5 + 2.5),
      vy: -(Math.random() * 1.4 - 0.4),
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 3 + 2,
      alpha: 0.9,
      life: 0,
      maxLife: 14,
      type: 'skate_spark',
    });

    if (Math.random() < 0.3) {
      particlesRef.current.push({
        id: nextParticleId.current++,
        x: x - 24,
        y: y - 20 + Math.random() * 24,
        vx: -(Math.random() * 4 + 3),
        vy: 0,
        color: '#38bdf8',
        size: Math.random() * 6 + 3,
        alpha: 0.6,
        life: 0,
        maxLife: 10,
        type: 'skate_trail',
      });
    }
  };

  // Spawn Coin Magnet Sparkles & Aura Wave Particles
  const spawnMagnetParticles = (x: number, y: number) => {
    trimParticles();
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
      size: Math.random() * 2.5 + 1.5,
      alpha: 0.9,
      life: 0,
      maxLife: 16,
      type: 'magnet_spark',
    });

    if (Math.random() < 0.2) {
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
        maxLife: 12,
        type: 'magnet_wave',
      });
    }
  };

  // Spawn Glowing Ruby-Pink Heart Sparkles on Heart Coin Pickup
  const spawnHeartSparkles = (x: number, y: number, count = 8) => {
    trimParticles();
    const colors = ['#f43f5e', '#fb7185', '#fda4af', '#fde047', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
      const speed = Math.random() * 3.2 + 1.4;
      particlesRef.current.push({
        id: nextParticleId.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 3.5 + 2.5,
        alpha: 1,
        life: 0,
        maxLife: 24,
        type: Math.random() < 0.6 ? 'heart_sparkle' : 'star',
      });
    }
  };

  // Spawn Fever Mode Burst Rings & Starbursts on Bonus Activation
  const spawnFeverBursts = (x: number, y: number, count = 16) => {
    trimParticles();
    const colors = ['#f43f5e', '#ec4899', '#a855f7', '#38bdf8', '#fde047', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Math.random() * 4.5 + 2.5;
      particlesRef.current.push({
        id: nextParticleId.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[i % colors.length],
        size: Math.random() * 5 + 3,
        alpha: 1,
        life: 0,
        maxLife: 32,
        type: i % 3 === 0 ? 'fever_burst' : 'heart_sparkle',
      });
    }
  };

  // Add Floating Text helper
  const addFloatingText = (text: string, x: number, y: number, color = '#fde047', size = 13) => {
    if (floatingTextsRef.current.length > 8) {
      floatingTextsRef.current.splice(0, floatingTextsRef.current.length - 8);
    }
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
      maxLife: 38,
    });
  };

  // Safe Loot Spawner with Strict Distance & Overlap Protection (Prevents Any Bunching / Clumping)
  const spawnSingleRowLoot = (
    items: { x: number; y: number; type: LootType; val: number }[]
  ) => {
    items.forEach((pt, idx) => {
      // Check if any existing uncollected loot is closer than 18px in 2D space (allows dense mountain formations)
      const isTooClose = lootItemsRef.current.some(
        (item) => !item.collected && Math.hypot(item.x - pt.x, item.y - pt.y) < 18
      );
      if (!isTooClose) {
        lootItemsRef.current.push({
          id: nextLootId.current++,
          type: pt.type,
          x: pt.x,
          y: pt.y,
          width: pt.type === 'HEART_COIN' ? 24 : pt.type === 'MAGNET' ? 28 : pt.type === 'DIAMOND' ? 24 : 22,
          height: pt.type === 'HEART_COIN' ? 24 : pt.type === 'MAGNET' ? 28 : pt.type === 'DIAMOND' ? 24 : 22,
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
      spawnDust(p.x, GROUND_Y, 3);

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

  // Jump Action (Fixed Double-Jump Bug: Double jump ONLY occurs if player releases and presses again in mid-air)
  const handleJump = useCallback(() => {
    const now = performance.now();
    // Anti-chatter / duplicate event debounce: block rapid duplicate events within 55ms
    if (now - lastJumpTimeRef.current < 55) return;
    lastJumpTimeRef.current = now;

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

    // Grounded Jump OR Coyote Time Jump (Grace window for comfortable takeoffs)
    const canGroundJump = p.isGrounded || ((p.coyoteTimer ?? 0) > 0 && p.jumpCount === 0);

    if (canGroundJump) {
      p.vy = -10.8; // Snappy, athletic jump takeoff with crisp recovery arc
      p.isGrounded = false;
      p.jumpCount = 1;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      jumpKeyReleasedRef.current = false; // Player is currently holding the jump input
      soundFx.playJump();
      spawnDust(p.x, GROUND_Y, 3);
    } else if (p.jumpCount === 1) {
      // Mid-Air Double Jump: Strictly requires user to have released the button first!
      if (jumpKeyReleasedRef.current) {
        p.vy = -9.4;
        p.jumpCount = 2;
        p.jumpBufferTimer = 0;
        jumpKeyReleasedRef.current = false; // Key is pressed again
        soundFx.playDoubleJump();
        spawnMoneySparkles(p.x, p.y - p.height / 2, 6);
        addFloatingText('DOUBLE JUMP! 💨', p.x, p.y - p.height - 10, '#38bdf8', 12);
      }
    } else {
      // Jump Buffering: Store jump input for 12 ticks (~200ms) if player pressed jump just before landing
      p.jumpBufferTimer = 12;
    }
  }, []);

  // Jump Input Release (Enables double jump eligibility upon lifting finger/key)
  const handleJumpRelease = useCallback(() => {
    jumpKeyReleasedRef.current = true;
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
    const baseSpeed = difficulty === 'FAST' ? 7.6 : 6.3;

    stateRef.current.score = 0;
    stateRef.current.stolenCash = 0;
    stateRef.current.totalCoins = 0;
    stateRef.current.currentSpeed = 1.0;
    stateRef.current.baseSpeed = baseSpeed;
    stateRef.current.groundOffset = 0;
    stateRef.current.sirenTimer = 0;
    stateRef.current.nextSpawnDistance = 420;
    stateRef.current.nextLootDistance = 260;
    stateRef.current.nextPitDistance = 320;
    stateRef.current.lastSpeedLevel = 1.0;
    stateRef.current.hasAnnouncedNewRecord = false;
    stateRef.current.initialHighScore = stateRef.current.highScore;
    stateRef.current.skateboardDuration = 0;
    stateRef.current.skateboardCooldown = 16.0;
    stateRef.current.magnetDuration = 0;
    stateRef.current.magnetCooldown = 12.0;
    stateRef.current.lastBonusMilestone = 0;
    stateRef.current.isBonusPhase = false;
    stateRef.current.bonusDuration = 0;
    stateRef.current.bonusTransition = 0;
    stateRef.current.bonusGracePeriod = 0;
    stateRef.current.bonusPatternStep = 0;

    jumpKeyReleasedRef.current = true;
    lastJumpTimeRef.current = 0;

    setScore(0);
    setStolenCash(0);
    setTotalCoins(0);
    setCurrentSpeed(1.0);
    setSkateboardTimer(0);
    setMagnetTimer(0);
    setBonusTimer(0);
    setIsBonusPhase(false);

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
    pitsRef.current = [];
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

  // Keyboard Event Handlers with full preventDefault for all game keys (Jump, Duck, Pause, Mute)
  useEffect(() => {
    const GAME_ACTION_KEYS = new Set([
      'Space',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'KeyW',
      'KeyS',
      'KeyA',
      'KeyD',
      'KeyP',
      'KeyM',
      'KeyR',
      'PageUp',
      'PageDown',
      'Home',
      'End',
    ]);

    const isGameKey = (e: KeyboardEvent) => {
      if (GAME_ACTION_KEYS.has(e.code)) return true;
      const k = e.key.toLowerCase();
      return (
        k === ' ' ||
        k === 'arrowup' ||
        k === 'arrowdown' ||
        k === 'arrowleft' ||
        k === 'arrowright' ||
        k === 'w' ||
        k === 's' ||
        k === 'a' ||
        k === 'd' ||
        k === 'p' ||
        k === 'm' ||
        k === 'r'
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. ALWAYS prevent default browser scrolling / actions for game keys (including repeated keydown events)
      if (isGameKey(e)) {
        e.preventDefault();
        e.stopPropagation();
      }

      const isJump =
        e.code === 'Space' ||
        e.code === 'ArrowUp' ||
        e.code === 'KeyW' ||
        e.key === ' ' ||
        e.key === 'ArrowUp' ||
        e.key.toLowerCase() === 'w';

      const isDuck =
        e.code === 'ArrowDown' ||
        e.code === 'KeyS' ||
        e.key === 'ArrowDown' ||
        e.key.toLowerCase() === 's';

      const isPause = e.code === 'KeyP' || e.key.toLowerCase() === 'p';
      const isMute = e.code === 'KeyM' || e.key.toLowerCase() === 'm';

      // Ignore key-repeat on Jump to prevent unintended automatic mid-air double jump
      if (e.repeat && isJump) return;

      if (isJump) {
        handleJump();
      } else if (isDuck) {
        handleDuckStart();
      } else if (isPause) {
        if (!e.repeat) togglePause();
      } else if (isMute) {
        if (!e.repeat) toggleSound();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // ALWAYS prevent default browser scrolling / actions for game keys on release
      if (isGameKey(e)) {
        e.preventDefault();
        e.stopPropagation();
      }

      const isJump =
        e.code === 'Space' ||
        e.code === 'ArrowUp' ||
        e.code === 'KeyW' ||
        e.key === ' ' ||
        e.key === 'ArrowUp' ||
        e.key.toLowerCase() === 'w';

      const isDuck =
        e.code === 'ArrowDown' ||
        e.code === 'KeyS' ||
        e.key === 'ArrowDown' ||
        e.key.toLowerCase() === 's';

      if (isJump) {
        handleJumpRelease();
      } else if (isDuck) {
        handleDuckEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleJump, handleJumpRelease, handleDuckStart, handleDuckEnd, gameState]);

  // Main High-Performance Delta-Time Game Loop Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    let animId: number;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const rawDelta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      // Cap delta time to 50ms (prevents physics explosions on tab switch)
      const deltaTime = Math.min(rawDelta, 0.05);
      const dtScale = deltaTime * 60; // 1.0 at standard 60fps

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
          skateMultiplier = 1.45;
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
          if (Math.random() < 0.4) {
            spawnMagnetParticles(p.x, p.y - p.height / 2);
          }

          // Active Magnetic Attraction for All Nearby Uncollected Coins, Money Bags, Diamonds, and Heart Coins
          const playerCenterX = p.x;
          const playerCenterY = p.y - p.height / 2;
          const magnetRadius = 260;

          for (const loot of lootItemsRef.current) {
            if (
              !loot.collected &&
              (loot.type === 'GOLD_COIN' ||
                loot.type === 'CASH_STACK' ||
                loot.type === 'MONEY_BAG' ||
                loot.type === 'DIAMOND' ||
                loot.type === 'HEART_COIN')
            ) {
              const lootCenterX = loot.x + loot.width / 2;
              const lootCenterY = loot.y + loot.height / 2;
              const dx = playerCenterX - lootCenterX;
              const dy = playerCenterY - lootCenterY;
              const dist = Math.hypot(dx, dy);

              if (dist < magnetRadius && dist > 1) {
                // Accelerating magnetic pull speed (stronger suction as item gets closer)
                const pullSpeed = Math.min(18, 7.5 + (1 - dist / magnetRadius) * 12) * dtScale;
                loot.x += (dx / dist) * pullSpeed;
                loot.y += (dy / dist) * pullSpeed;

                if (Math.random() < 0.1) {
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

        // Bonus Phase Active Timers & Transitions
        if (s.isBonusPhase) {
          s.bonusDuration = Math.max(0, s.bonusDuration - deltaTime);
          setBonusTimer(s.bonusDuration);
          s.bonusTransition = Math.min(1.0, s.bonusTransition + deltaTime * 2.5);

          // Subtle ambient gold glints floating from player during bonus mode
          if (Math.random() < 0.3) {
            spawnCoinSparkles(p.x, p.y - p.height / 2, 1);
          }

          if (s.bonusDuration <= 0) {
            s.isBonusPhase = false;
            setIsBonusPhase(false);
            setBonusTimer(0);
            s.bonusTransition = 0;
            s.bonusGracePeriod = 0;
            s.nextLootDistance = 260; // Cut off mountain spawns immediately and restore normal coin spacing
            cop.targetX = 115; // Smoothly return police to standard chase distance
            // Obstacles resume with a fair, generous clear runway (360px) for smooth player readjustment
            s.nextSpawnDistance = 360;
            soundFx.playBonusEnd();
            addFloatingText('BONUS COMPLETE! 🚨 POLICE RESUMING CHASE', CANVAS_WIDTH / 2, 90, '#38bdf8', 14);
            spawnMoneySparkles(CANVAS_WIDTH / 2, 90, 8);
          }
        } else {
          s.bonusTransition = Math.max(0.0, s.bonusTransition - deltaTime * 2.5);
          if (s.bonusGracePeriod > 0) {
            s.bonusGracePeriod = Math.max(0, s.bonusGracePeriod - deltaTime);
          }
        }

        // High-Pacing Dynamic Speed Scaling based on Escaped Distance (score in meters):
        // 0 - 100m: Fast energetic getaway start (1.00x -> 1.08x)
        // 100 - 300m: Immediate acceleration (1.08x -> 1.22x)
        // 300 - 600m: Intense sprint flow (1.22x -> 1.38x)
        // 600 - 1000m: Hardcore high-adrenaline zone (1.38x -> 1.52x)
        // 1000m+: Hardcore Arcade Speed ceiling (1.52x -> 1.62x NORMAL / 1.72x FAST)
        let progressMultiplier = 1.0;
        if (s.score <= 100) {
          progressMultiplier = 1.0 + (s.score / 100) * 0.08;
        } else if (s.score <= 300) {
          progressMultiplier = 1.08 + ((s.score - 100) / 200) * 0.14;
        } else if (s.score <= 600) {
          progressMultiplier = 1.22 + ((s.score - 300) / 300) * 0.16;
        } else if (s.score <= 1000) {
          progressMultiplier = 1.38 + ((s.score - 600) / 400) * 0.14;
        } else {
          // Asymptotic soft approach to hardcore arcade ceiling
          progressMultiplier = 1.52 + Math.min(0.10, ((s.score - 1000) / 1000) * 0.10);
        }

        // Hardcore Arcade Max Speed Cap
        const maxCap = s.difficulty === 'FAST' ? 1.72 : 1.62;
        const rawSpeed = progressMultiplier * skateMultiplier;
        const speedMultiplier = Math.min(maxCap + (skateMultiplier > 1 ? 0.06 : 0), rawSpeed);

        s.currentSpeed = speedMultiplier;
        setCurrentSpeed(speedMultiplier);

        const activeSpeed = s.baseSpeed * speedMultiplier;
        const stepSpeed = activeSpeed * dtScale;
        s.groundOffset += stepSpeed;

        // Escaped Distance calculation (smooth meters) & Real Survival Score
        // Base survival rate: ~10 meters/points per second scaled by speed
        s.score += deltaTime * 10.0 * speedMultiplier;
        setScore(Math.floor(s.score));

        // Check 5000m Distance Milestone Mega Coin Mountain Trigger (Strict 7.0s duration)
        const nextBonusMilestone = (Math.floor(s.lastBonusMilestone / 5000) + 1) * 5000;
        if (s.score >= nextBonusMilestone && !s.isBonusPhase) {
          s.lastBonusMilestone = nextBonusMilestone;
          s.isBonusPhase = true;
          setIsBonusPhase(true);
          s.bonusDuration = 7.0; // Strict 7.0 seconds of Mega Coin Mountain reward
          s.bonusTransition = 1.0;
          s.bonusPatternStep = 0;
          s.nextLootDistance = 0; // Trigger immediate mountain spawn on next frame
          setBonusTimer(7.0);

          // Force clear active obstacles so player enjoys the bonus mountain completely safely
          obstaclesRef.current = [];

          // Police officer peacefully backs away off-screen during bonus celebration
          cop.targetX = -80;
          cop.x = -80;

          // Sound fanfare & high-impact visual particles
          soundFx.playBonusStart();
          spawnFeverBursts(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 28);
          addFloatingText(`🌟 ${nextBonusMilestone}M REACHED! 🌟`, CANVAS_WIDTH / 2, 60, '#fde047', 16);
          addFloatingText(`🏔️ MEGA COIN MOUNTAIN BONUS! 💰`, CANVAS_WIDTH / 2, 90, '#38bdf8', 15);
          addFloatingText(`CLIMB THE COIN PYRAMID & GRAB MAGNET! 🧲`, CANVAS_WIDTH / 2, 118, '#fbbf24', 12);
        }

        // Speed alert announcement (only if speed increases visibly)
        const currentSpeedLevel = Math.floor(speedMultiplier * 10) / 10;
        if (currentSpeedLevel > s.lastSpeedLevel && currentSpeedLevel >= 1.1) {
          s.lastSpeedLevel = currentSpeedLevel;
          soundFx.playSpeedUp();
          addFloatingText('SPEED UP! 🚨', CANVAS_WIDTH / 2, 130, '#fde047', 14);
          spawnMoneySparkles(CANVAS_WIDTH / 2, 130, 6);
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
            spawnMoneySparkles(CANVAS_WIDTH / 2, 100, 7);
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
          if ((p.coyoteTimer ?? 0) > 0) p.coyoteTimer = Math.max(0, (p.coyoteTimer ?? 0) - dtScale);
        }

        if ((p.jumpBufferTimer ?? 0) > 0) {
          p.jumpBufferTimer = Math.max(0, (p.jumpBufferTimer ?? 0) - dtScale);
        }

        // Update Ground Pits position & clean up off-screen pits
        for (let i = pitsRef.current.length - 1; i >= 0; i--) {
          const pit = pitsRef.current[i];
          pit.x -= stepSpeed;
          if (pit.x + pit.width < -120) {
            pitsRef.current.splice(i, 1);
          }
        }

        // Check if player's foot position is directly above a road gap/pit
        const playerFootX = p.x;
        const activePitUnderFoot = !s.isBonusPhase
          ? pitsRef.current.find(
              (pit) => playerFootX >= pit.x + 8 && playerFootX <= pit.x + pit.width - 8
            )
          : null;

        // Robber (Player) Physics: Tight, responsive, snappy jump arc & faster gravity fall
        // Rising gravity: 0.46 for agile takeoff; Falling gravity: 0.68 for swift, snappy landing
        const gravity = (p.vy < 0 ? 0.46 : 0.68) * dtScale;
        p.vy += gravity;
        if (p.vy > 14.0) p.vy = 14.0;
        p.y += p.vy * dtScale;

        // Ground & Pit Collision Handling
        if (activePitUnderFoot) {
          // Player is over a void/pit! No solid footing
          p.isGrounded = false;
          p.coyoteTimer = 0;

          // If the player drops down past the normal road level, they plummet into the abyss!
          if (p.y >= GROUND_Y) {
            p.vy += 0.55 * dtScale; // Accelerate into abyss
            p.y += p.vy * dtScale;

            // Trigger Pit Fall Game Over once player falls into the pit gap
            if (p.y >= GROUND_Y + 16 && !p.isDead) {
              s.gameState = 'GAME_OVER';
              setGameState('GAME_OVER');
              p.isDead = true;
              p.busted = false;
              p.fellIntoPit = true;
              p.deathReason = 'PIT';
              p.deathVy = p.vy;

              // Cop halts before pit edge
              cop.isTackling = false;
              cop.targetX = Math.min(cop.x, activePitUnderFoot.x - 30);

              soundFx.playFallPit();
              spawnDust(p.x, GROUND_Y, 6);
              addFloatingText('FELL INTO PIT! 🕳️', p.x, GROUND_Y - 30, '#f97316', 16);
            }
          }
        } else {
          // Solid Ground: Standard Landing & Jump Buffer Execution
          if (p.y >= GROUND_Y) {
            const wasInAir = !p.isGrounded;
            p.y = GROUND_Y;
            p.vy = 0;
            p.isGrounded = true;
            p.jumpCount = 0;
            p.coyoteTimer = 12;

            if (wasInAir) {
              spawnDust(p.x, GROUND_Y, 3);

              // Execute Buffered Jump if player pressed Jump right before touching down (~200ms window)
              if ((p.jumpBufferTimer ?? 0) > 0) {
                p.jumpBufferTimer = 0;
                p.vy = -10.8;
                p.isGrounded = false;
                p.jumpCount = 1;
                p.coyoteTimer = 0;
                jumpKeyReleasedRef.current = false;
                soundFx.playJump();
                spawnDust(p.x, GROUND_Y, 3);
              }
            }
          }
        }

        // Robber Running Cycle animation (or sliding dust) - Energetic high-frequency sprint
        if (p.isDucking && p.isGrounded) {
          if (Math.random() < 0.2) {
            spawnDust(p.x - 12, GROUND_Y, 1);
          }
        } else {
          p.runTimer += dtScale;
          if (p.runTimer > Math.max(2, 5.5 - Math.floor(speedMultiplier * 1.8))) {
            p.runTimer = 0;
            p.runFrame = (p.runFrame + 1) % 4;
          }
        }

        // Chasing Police Officer Animation - Fast energetic sprint cadence & Pit vaulting
        cop.runTimer += dtScale;
        if (cop.runTimer > Math.max(2, 5.5 - Math.floor(speedMultiplier * 1.8))) {
          cop.runTimer = 0;
          cop.runFrame = (cop.runFrame + 1) % 4;
        }
        cop.whistleTimer += dtScale;

        // Police officer leaps smoothly over pits if chasing behind player
        const isCopOverPit = pitsRef.current.some(
          (pit) => cop.x >= pit.x - 14 && cop.x <= pit.x + pit.width + 14
        );
        if (isCopOverPit && !p.fellIntoPit) {
          cop.y = GROUND_Y - 24; // Athletic leap across pit
        } else if (!isCopOverPit && !p.fellIntoPit) {
          cop.y = GROUND_Y;
        }

        // Periodic runner dust
        if (p.isGrounded && !p.isDucking && Math.random() < 0.12) {
          spawnDust(p.x - p.width / 2, GROUND_Y, 1);
        }
        if (Math.random() < 0.12) {
          spawnDust(cop.x - cop.width / 2, GROUND_Y, 1);
        }

        // Randomly trigger cop whistle sound in background during chase
        if (Math.random() < 0.0016) {
          soundFx.playWhistle();
        }

        // 1. SPAWN OBSTACLES (Balanced 50/50: Ground for Jumping vs Overhead for Ducking - Paused during Bonus Phase)
        if (!s.isBonusPhase) {
          s.nextSpawnDistance -= stepSpeed;
          if (s.nextSpawnDistance <= 0) {
            // Fair Spacing Check: Do NOT spawn an obstacle right on top of or too close to an upcoming pit
            const spawnX = CANVAS_WIDTH + 40;
            const isPitNearObstacle = pitsRef.current.some(
              (pit) => Math.abs(pit.x + pit.width / 2 - spawnX) < 220
            );

            if (isPitNearObstacle) {
              // Delay obstacle spawn until pit runway is clear
              s.nextSpawnDistance = 120;
            } else {
              // 50% Ground Jump obstacles, 50% Overhead Duck obstacles
              const groundTypes: ObstacleType[] = ['TRAFFIC_CONE', 'TRASH_CAN', 'ROADBLOCK'];
              const overheadTypes: ObstacleType[] = ['POLICE_DRONE', 'OVERHEAD_BARRIER', 'CONSTRUCTION_SCAFFOLD'];

              let chosenCategory: 'GROUND' | 'OVERHEAD';
              if (lastObstacleCategoryRef.current === null) {
                chosenCategory = Math.random() < 0.5 ? 'GROUND' : 'OVERHEAD';
              } else if (lastObstacleCategoryRef.current === 'GROUND') {
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
                obsY = GROUND_Y - 46;
              } else if (randType === 'OVERHEAD_BARRIER') {
                obsWidth = 52;
                obsHeight = 26;
                obsY = GROUND_Y - 48;
              } else if (randType === 'CONSTRUCTION_SCAFFOLD') {
                obsWidth = 140;
                obsY = 0;
                obsHeight = GROUND_Y - 26;
              }

              obstaclesRef.current.push({
                id: nextObstacleId.current++,
                type: randType,
                x: spawnX,
                y: obsY,
                width: obsWidth,
                height: obsHeight,
                passed: false,
                animFrame: 0,
                animTimer: 0,
                lightState: true,
              });

              // OBSTACLE-INTEGRATED COIN PATTERNS & BAIT/TRAP PLACEMENTS:
              const obsCenterX = spawnX + obsWidth / 2;
              if (chosenCategory === 'GROUND') {
                const isRoadblock = randType === 'ROADBLOCK';
                const baitRoll = Math.random();

                if (baitRoll < 0.5) {
                  // Config A: Classic 3-Point Parabolic Jump Arc
                  const apexType: LootType = isRoadblock
                    ? (Math.random() < 0.35 ? 'DIAMOND' : Math.random() < 0.65 ? 'MONEY_BAG' : 'GOLD_COIN')
                    : (Math.random() < 0.3 ? 'MONEY_BAG' : 'GOLD_COIN');
                  const apexVal = apexType === 'DIAMOND' ? 50 : apexType === 'MONEY_BAG' ? 20 : 3;

                  const jumpArc = [
                    { x: obsCenterX - 55, y: GROUND_Y - 48, type: 'GOLD_COIN' as LootType, val: 2 },
                    {
                      x: obsCenterX - 11,
                      y: Math.min(obsY - 38, GROUND_Y - 95),
                      type: apexType,
                      val: apexVal,
                    },
                    { x: obsCenterX + 35, y: GROUND_Y - 48, type: 'GOLD_COIN' as LootType, val: 2 },
                  ];
                  spawnSingleRowLoot(jumpArc);
                } else if (baitRoll < 0.75) {
                  // Config B: "Greed Trap / High Bait"
                  const highBait = [
                    { x: obsCenterX - 45, y: GROUND_Y - 50, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: obsCenterX - 11, y: GROUND_Y - 110, type: 'DIAMOND' as LootType, val: 50 },
                    { x: obsCenterX + 25, y: GROUND_Y - 50, type: 'GOLD_COIN' as LootType, val: 2 },
                  ];
                  spawnSingleRowLoot(highBait);
                } else {
                  // Config C: "Low Run Bait Trap"
                  const lowBaitTrap = [
                    { x: obsCenterX - 85, y: GROUND_Y - 22, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: obsCenterX - 50, y: GROUND_Y - 22, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: obsCenterX - 11, y: Math.min(obsY - 38, GROUND_Y - 95), type: 'MONEY_BAG' as LootType, val: 20 },
                  ];
                  spawnSingleRowLoot(lowBaitTrap);
                }
              } else {
                // Overhead Obstacles
                const isScaffold = randType === 'CONSTRUCTION_SCAFFOLD';
                const overheadBaitRoll = Math.random();

                if (overheadBaitRoll < 0.6) {
                  // Config A: Clean Ground Slide Trail inside the tunnel
                  const slideCoins: { x: number; y: number; type: LootType; val: number }[] = [
                    { x: obsCenterX - 45, y: GROUND_Y - 20, type: 'GOLD_COIN', val: 2 },
                    {
                      x: obsCenterX - 11,
                      y: GROUND_Y - 20,
                      type: isScaffold || Math.random() < 0.35 ? 'MONEY_BAG' : 'GOLD_COIN',
                      val: isScaffold || Math.random() < 0.35 ? 18 : 2,
                    },
                    { x: obsCenterX + 25, y: GROUND_Y - 20, type: 'GOLD_COIN', val: 2 },
                  ];
                  spawnSingleRowLoot(slideCoins);
                } else {
                  // Config B: "Air Bait vs Safe Slide Split"
                  const splitRoute: { x: number; y: number; type: LootType; val: number }[] = [
                    { x: obsCenterX - 35, y: GROUND_Y - 20, type: 'GOLD_COIN', val: 2 },
                    { x: obsCenterX + 15, y: GROUND_Y - 20, type: 'GOLD_COIN', val: 2 },
                    { x: obsCenterX - 75, y: GROUND_Y - 70, type: 'DIAMOND', val: 50 },
                  ];
                  spawnSingleRowLoot(splitRoute);
                }
              }

              // Dynamic Fair Obstacle Spacing
              const extraWidthBuffer = randType === 'CONSTRUCTION_SCAFFOLD' ? 120 : 0;
              const minClearRunway = 270 + extraWidthBuffer;
              const randomVariance = Math.random() * 140;
              const baseGap = (obsWidth + minClearRunway + randomVariance) * speedMultiplier;
              s.nextSpawnDistance = baseGap;
            }
          }
        }

        // 2. SPAWN GROUND PITS (Gaps in the road like Cookie Run - Safe, Fair & Jumpable)
        if (!s.isBonusPhase && s.score > 120) {
          s.nextPitDistance -= stepSpeed;
          if (s.nextPitDistance <= 0) {
            const spawnPitX = CANVAS_WIDTH + 60;

            // Safe buffer check: Ensure spawn area is clear of nearby obstacles
            const isObstacleNear = obstaclesRef.current.some(
              (obs) => Math.abs(obs.x + obs.width / 2 - spawnPitX) < 220
            );

            if (isObstacleNear) {
              // Delay pit spawn until obstacle runway has passed
              s.nextPitDistance = 90;
            } else {
              // Pit width: 74px to 96px (Easily jumpable with single jump, generous for double jump)
              const pitW = Math.floor(74 + Math.random() * 22);
              pitsRef.current.push({
                id: nextPitId.current++,
                x: spawnPitX,
                width: pitW,
                passed: false,
              });

              // Cookie Run Style Parabolic Coin Jump Arc right over the pit
              const pitCenter = spawnPitX + pitW / 2;
              const pitApexType: LootType = Math.random() < 0.4 ? 'DIAMOND' : 'MONEY_BAG';
              const pitApexVal = pitApexType === 'DIAMOND' ? 50 : 25;

              const pitCoinArc: { x: number; y: number; type: LootType; val: number }[] = [
                { x: pitCenter - 48, y: GROUND_Y - 36, type: 'GOLD_COIN', val: 3 },
                { x: pitCenter, y: GROUND_Y - 92, type: pitApexType, val: pitApexVal },
                { x: pitCenter + 48, y: GROUND_Y - 36, type: 'GOLD_COIN', val: 3 },
              ];
              spawnSingleRowLoot(pitCoinArc);

              // Set generous safe landing runway before next obstacle can spawn
              s.nextSpawnDistance = Math.max(s.nextSpawnDistance, 280);
              // Next pit distance interval
              s.nextPitDistance = 420 + Math.random() * 280;
            }
          }
        }

        // 2. OPEN-TRACK COLLECTIBLES & POWER-UP GENERATOR
        s.nextLootDistance -= stepSpeed;
        if (s.nextLootDistance <= 0) {
          const startX = CANVAS_WIDTH + 40;

          if (s.isBonusPhase) {
            // MEGA COIN MOUNTAIN MILESTONE REWARD: 3 Staggered Grand Formations (Pyramids, Twin Ridges, Treasure Volcano)
            const patternType = s.bonusPatternStep % 3;
            s.bonusPatternStep++;

            const colSpacing = 28;
            const baseY = GROUND_Y - 22;

            if (patternType === 0) {
              // MOUNTAIN 1: "The Grand Mega Golden Pyramid" (พีระมิดเหรียญทองยักษ์ 5 ชั้น + ยอดแม่เหล็ก Magnet)
              const mountainCoins: { x: number; y: number; type: LootType; val: number }[] = [];

              // Tier 1 (Ground Base - 9 gold coins across)
              for (let c = 0; c < 9; c++) {
                mountainCoins.push({ x: startX + c * colSpacing, y: baseY, type: 'GOLD_COIN', val: 3 });
              }
              // Tier 2 (Slope 2 - 7 gold coins)
              for (let c = 0; c < 7; c++) {
                mountainCoins.push({ x: startX + (c + 1) * colSpacing, y: baseY - 28, type: 'GOLD_COIN', val: 5 });
              }
              // Tier 3 (Slope 3 - 5 items with Money Bags at sides)
              for (let c = 0; c < 5; c++) {
                const isBag = c === 0 || c === 4;
                mountainCoins.push({
                  x: startX + (c + 2) * colSpacing,
                  y: baseY - 56,
                  type: isBag ? 'MONEY_BAG' : 'GOLD_COIN',
                  val: isBag ? 25 : 8,
                });
              }
              // Tier 4 (Near Peak - 3 items: Money Bags & Diamond)
              mountainCoins.push({ x: startX + 3 * colSpacing, y: baseY - 84, type: 'MONEY_BAG', val: 30 });
              mountainCoins.push({ x: startX + 4 * colSpacing, y: baseY - 84, type: 'DIAMOND', val: 50 });
              mountainCoins.push({ x: startX + 5 * colSpacing, y: baseY - 84, type: 'MONEY_BAG', val: 30 });

              // Peak Summit Apex (MAGNET POWER-UP to instantly vacuum all remaining coins in the mountain!)
              mountainCoins.push({
                x: startX + 4 * colSpacing,
                y: baseY - 116,
                type: 'MAGNET',
                val: 100,
              });

              spawnSingleRowLoot(mountainCoins);
              s.nextLootDistance = 340;
            } else if (patternType === 1) {
              // MOUNTAIN 2: "Twin Diamond Peak Ridges" (เทือกเขาเพชรยอดคู่ 2 ลูกติดกัน)
              const ridgeCoins: { x: number; y: number; type: LootType; val: number }[] = [];

              // Peak 1 (Left Mountain)
              for (let c = 0; c < 4; c++) {
                ridgeCoins.push({ x: startX + c * colSpacing, y: baseY, type: 'GOLD_COIN', val: 3 });
              }
              for (let c = 0; c < 2; c++) {
                ridgeCoins.push({ x: startX + (c + 1) * colSpacing, y: baseY - 32, type: 'MONEY_BAG', val: 20 });
              }
              ridgeCoins.push({ x: startX + 1.5 * colSpacing, y: baseY - 68, type: 'DIAMOND', val: 50 });

              // Valley Pass (Center ground reward between the two mountain ridges)
              ridgeCoins.push({ x: startX + 4.2 * colSpacing, y: baseY, type: 'MONEY_BAG', val: 25 });
              ridgeCoins.push({ x: startX + 5.2 * colSpacing, y: baseY, type: 'MONEY_BAG', val: 25 });

              // Peak 2 (Right Mountain - High Double-Jump Summit)
              const m2Offset = 6.5 * colSpacing;
              for (let c = 0; c < 5; c++) {
                ridgeCoins.push({ x: startX + m2Offset + c * colSpacing, y: baseY, type: 'GOLD_COIN', val: 4 });
              }
              for (let c = 0; c < 3; c++) {
                ridgeCoins.push({ x: startX + m2Offset + (c + 1) * colSpacing, y: baseY - 34, type: 'GOLD_COIN', val: 6 });
              }
              ridgeCoins.push({ x: startX + m2Offset + 1 * colSpacing, y: baseY - 70, type: 'MONEY_BAG', val: 35 });
              ridgeCoins.push({ x: startX + m2Offset + 3 * colSpacing, y: baseY - 70, type: 'MONEY_BAG', val: 35 });
              ridgeCoins.push({ x: startX + m2Offset + 2 * colSpacing, y: baseY - 108, type: 'DIAMOND', val: 75 });

              spawnSingleRowLoot(ridgeCoins);
              s.nextLootDistance = 390;
            } else {
              // MOUNTAIN 3: "The Escalating Treasure Mountain" (ภูเขาขุมทรัพย์ทองคำ ถุงเงิน และเพชร)
              const treasureCoins: { x: number; y: number; type: LootType; val: number }[] = [];

              // Base row (8 Gold Coins)
              for (let c = 0; c < 8; c++) {
                treasureCoins.push({ x: startX + c * colSpacing, y: baseY, type: 'GOLD_COIN', val: 4 });
              }
              // Tier 2 (6 Money Bags)
              for (let c = 0; c < 6; c++) {
                treasureCoins.push({ x: startX + (c + 1) * colSpacing, y: baseY - 30, type: 'MONEY_BAG', val: 20 });
              }
              // Tier 3 (4 Diamonds)
              for (let c = 0; c < 4; c++) {
                treasureCoins.push({ x: startX + (c + 2) * colSpacing, y: baseY - 62, type: 'DIAMOND', val: 50 });
              }
              // Tier 4 (2 Giant Bags)
              treasureCoins.push({ x: startX + 3 * colSpacing, y: baseY - 94, type: 'MONEY_BAG', val: 50 });
              treasureCoins.push({ x: startX + 4 * colSpacing, y: baseY - 94, type: 'MONEY_BAG', val: 50 });
              // Peak Apex (Jackpot Diamond on top)
              treasureCoins.push({ x: startX + 3.5 * colSpacing, y: baseY - 126, type: 'DIAMOND', val: 100 });

              spawnSingleRowLoot(treasureCoins);
              s.nextLootDistance = 350;
            }
          } else {
            // NORMAL MODE: Check if an obstacle is immediately occupying this exact coordinate
            const isObstacleDirectlyHere = obstaclesRef.current.some(
              (obs) => Math.abs(obs.x + obs.width / 2 - startX) < 55
            );

            if (isObstacleDirectlyHere) {
              s.nextLootDistance = 80;
            } else {
              const canSpawnSkate =
                s.skateboardCooldown <= 0 &&
                s.skateboardDuration <= 0 &&
                Math.random() < 0.15;

              const canSpawnMagnet =
                !canSpawnSkate &&
                s.magnetCooldown <= 0 &&
                s.magnetDuration <= 0 &&
                Math.random() < 0.22;

              if (canSpawnSkate) {
                lootItemsRef.current.push({
                  id: nextLootId.current++,
                  type: 'SKATEBOARD',
                  x: startX,
                  y: GROUND_Y - 42,
                  width: 32,
                  height: 24,
                  collected: false,
                  animFrame: 0,
                  animTimer: 0,
                  value: 300,
                });
                s.skateboardCooldown = 22.0 + Math.random() * 8.0;
              } else if (canSpawnMagnet) {
                lootItemsRef.current.push({
                  id: nextLootId.current++,
                  type: 'MAGNET',
                  x: startX,
                  y: GROUND_Y - 42,
                  width: 28,
                  height: 28,
                  collected: false,
                  animFrame: 0,
                  animTimer: 0,
                  value: 100,
                });
                s.magnetCooldown = 18.0 + Math.random() * 8.0;
              } else {
                // Switch between 6 distinct fun open-track collectible formations (Geometry, Arcs, Trails, Diamonds, and Staircases):
                const randFormation = Math.floor(Math.random() * 6);

                if (randFormation === 0) {
                  // A) Ground 4-Coin Smooth Horizontal Trail
                  const lineCoins = [
                    { x: startX, y: GROUND_Y - 22, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX + 34, y: GROUND_Y - 22, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX + 68, y: GROUND_Y - 22, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX + 102, y: GROUND_Y - 22, type: 'GOLD_COIN' as LootType, val: 2 },
                  ];
                  spawnSingleRowLoot(lineCoins);
                } else if (randFormation === 1) {
                  // B) Mid-Air Jump Arc leading to Sparkling Diamond / Money Bag
                  const isDiamond = Math.random() < 0.4;
                  const apexType: LootType = isDiamond ? 'DIAMOND' : 'MONEY_BAG';
                  const apexVal = isDiamond ? 50 : 20;

                  const jumpArc = [
                    { x: startX, y: GROUND_Y - 24, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX + 34, y: GROUND_Y - 60, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX + 68, y: GROUND_Y - 96, type: apexType, val: apexVal },
                    { x: startX + 102, y: GROUND_Y - 60, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX + 136, y: GROUND_Y - 24, type: 'GOLD_COIN' as LootType, val: 2 },
                  ];
                  spawnSingleRowLoot(jumpArc);
                } else if (randFormation === 2) {
                  // C) Stepped Staircase Formation (Diagonal Ascension requiring Double Jump)
                  const isDiamondApex = Math.random() < 0.45;
                  const staircase = [
                    { x: startX, y: GROUND_Y - 24, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX + 32, y: GROUND_Y - 54, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX + 64, y: GROUND_Y - 84, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX + 96, y: GROUND_Y - 114, type: (isDiamondApex ? 'DIAMOND' : 'MONEY_BAG') as LootType, val: isDiamondApex ? 50 : 20 },
                  ];
                  spawnSingleRowLoot(staircase);
                } else if (randFormation === 3) {
                  // D) Diamond / Rhombus Geometric Formation (4 outer coins + center Money Bag)
                  const diamondShape = [
                    { x: startX + 36, y: GROUND_Y - 24, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX, y: GROUND_Y - 60, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX + 36, y: GROUND_Y - 60, type: 'MONEY_BAG' as LootType, val: 20 },
                    { x: startX + 72, y: GROUND_Y - 60, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX + 36, y: GROUND_Y - 96, type: 'GOLD_COIN' as LootType, val: 2 },
                  ];
                  spawnSingleRowLoot(diamondShape);
                } else if (randFormation === 4) {
                  // E) Sine Wave / Zig-zag Rhythm (Floaters up & down)
                  const sinePattern = [
                    { x: startX, y: GROUND_Y - 26, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX + 32, y: GROUND_Y - 62, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX + 64, y: GROUND_Y - 26, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX + 96, y: GROUND_Y - 62, type: 'MONEY_BAG' as LootType, val: 18 },
                    { x: startX + 128, y: GROUND_Y - 26, type: 'GOLD_COIN' as LootType, val: 2 },
                  ];
                  spawnSingleRowLoot(sinePattern);
                } else {
                  // F) 2x3 Matrix Grid (Air & Ground split)
                  const matrixGrid = [
                    { x: startX, y: GROUND_Y - 22, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX + 36, y: GROUND_Y - 22, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX + 72, y: GROUND_Y - 22, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX, y: GROUND_Y - 68, type: 'GOLD_COIN' as LootType, val: 2 },
                    { x: startX + 36, y: GROUND_Y - 68, type: 'DIAMOND' as LootType, val: 50 },
                    { x: startX + 72, y: GROUND_Y - 68, type: 'GOLD_COIN' as LootType, val: 2 },
                  ];
                  spawnSingleRowLoot(matrixGrid);
                }
              }

              // Consistent rhythmic pacing for next open collectible
              s.nextLootDistance = 240 + Math.random() * 180;
            }
          }
        }

        // Update Obstacles & Collision Detection
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const obs = obstaclesRef.current[i];
          obs.x -= stepSpeed;

          // Animation
          obs.animTimer += dtScale;
          if (obs.animTimer > 6) {
            obs.animTimer = 0;
            obs.animFrame = (obs.animFrame + 1) % 8;
            obs.lightState = !obs.lightState;
          }

          // Accurate, forgiving hitbox check
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
              // INVINCIBLE SKATEBOARD SMASH: Destroy obstacle
              soundFx.playSmash();
              spawnMoneySparkles(obs.x + obs.width / 2, obs.y + obs.height / 2, 8);
              spawnDust(obs.x + obs.width / 2, obs.y + obs.height / 2, 5);
              addFloatingText('SMASH! 💥', obs.x, obs.y - 10, '#f97316', 14);

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

            spawnMoneySparkles(p.x, p.y - p.height / 2, 10);
            spawnDust(p.x, p.y, 6);
            addFloatingText('BUSTED! 🚨', p.x, p.y - p.height - 20, '#ef4444', 18);
            break;
          }

          // Clean up off-screen
          if (obs.x + obs.width < -100) {
            obstaclesRef.current.splice(i, 1);
          }
        }

        // Update Loot Collectibles & Magnet Pull & Collision Detection
        for (let i = lootItemsRef.current.length - 1; i >= 0; i--) {
          const loot = lootItemsRef.current[i];
          loot.x -= stepSpeed;
          loot.animFrame += 0.6 * dtScale;

          // 🧲 Active Magnet Attraction (Smoothly pull uncollected coins/gems/bags toward player)
          if (!loot.collected && (p.isMagnetActive || s.magnetDuration > 0)) {
            if (
              loot.type === 'GOLD_COIN' ||
              loot.type === 'MONEY_BAG' ||
              loot.type === 'DIAMOND' ||
              loot.type === 'HEART_COIN'
            ) {
              const targetCenterX = p.x;
              const targetCenterY = p.y - p.height / 2;
              const lootCenterX = loot.x + loot.width / 2;
              const lootCenterY = loot.y + loot.height / 2;

              const dx = targetCenterX - lootCenterX;
              const dy = targetCenterY - lootCenterY;
              const dist = Math.hypot(dx, dy);

              if (dist < 280 && dist > 1) {
                const pullSpeed = Math.min(dist, (9.5 + (280 - dist) * 0.05) * dtScale);
                loot.x += (dx / dist) * pullSpeed;
                loot.y += (dy / dist) * pullSpeed;

                if (Math.random() < 0.15) {
                  spawnMagnetParticles(lootCenterX, lootCenterY);
                }
              }
            }
          }

          // Collision Detection between Robber and Collectible Item
          if (!loot.collected) {
            const pLeft = p.x - p.width / 2 - 14;
            const pRight = p.x + p.width / 2 + 14;
            const pTop = p.y - p.height - 14;
            const pBottom = p.y + 12;

            if (
              pRight > loot.x &&
              pLeft < loot.x + loot.width &&
              pBottom > loot.y &&
              pTop < loot.y + loot.height
            ) {
              loot.collected = true;

              if (loot.type === 'SKATEBOARD') {
                s.skateboardDuration = 5.0;
                p.isSkateboarding = true;
                setSkateboardTimer(5.0);

                soundFx.playSkateboard();
                spawnMoneySparkles(loot.x + loot.width / 2, loot.y + loot.height / 2, 8);
                spawnSkateSparks(p.x, p.y);
                addFloatingText('🛹 SKATE POWER! (5s)', p.x, p.y - p.height - 18, '#fbbf24', 14);
              } else if (loot.type === 'MAGNET') {
                s.magnetDuration = 5.0;
                p.isMagnetActive = true;
                setMagnetTimer(5.0);

                soundFx.playMagnet();
                spawnMagnetParticles(p.x, p.y - p.height / 2);
                spawnMagnetParticles(loot.x + loot.width / 2, loot.y + loot.height / 2);
                addFloatingText('🧲 COIN MAGNET! (5s)', p.x, p.y - p.height - 18, '#38bdf8', 14);
              } else if (loot.type === 'HEART_COIN') {
                s.stolenCash += loot.value;
                s.score += 10;
                s.totalCoins += 1;
                setStolenCash(s.stolenCash);
                setScore(Math.floor(s.score));
                setTotalCoins(s.totalCoins);

                soundFx.playHeartCoinPickup();
                spawnHeartSparkles(loot.x + loot.width / 2, loot.y + loot.height / 2, 8);
                addFloatingText(`+$${loot.value} 💖`, loot.x, loot.y - 12, '#fb7185', 13);
              } else if (loot.type === 'GOLD_COIN') {
                s.stolenCash += loot.value;
                s.score += 1;
                s.totalCoins += 1;
                setStolenCash(s.stolenCash);
                setScore(Math.floor(s.score));
                setTotalCoins(s.totalCoins);

                soundFx.playCoinPickup();
                spawnCoinSparkles(loot.x + loot.width / 2, loot.y + loot.height / 2, 5);
                addFloatingText(`+$${loot.value}`, loot.x, loot.y - 12, '#fde047', 12);
              } else if (loot.type === 'DIAMOND') {
                s.stolenCash += loot.value;
                s.score += 25;
                s.totalCoins += 1;
                setStolenCash(s.stolenCash);
                setScore(Math.floor(s.score));
                setTotalCoins(s.totalCoins);

                soundFx.playMoneyPickup();
                spawnCoinSparkles(loot.x + loot.width / 2, loot.y + loot.height / 2, 8);
                addFloatingText(`+$${loot.value} 💎 JACKPOT!`, loot.x, loot.y - 14, '#38bdf8', 14);
              } else {
                s.stolenCash += loot.value;
                s.score += 10;
                s.totalCoins += 1;
                setStolenCash(s.stolenCash);
                setScore(Math.floor(s.score));
                setTotalCoins(s.totalCoins);

                soundFx.playMoneyPickup();
                spawnMoneySparkles(loot.x + loot.width / 2, loot.y + loot.height / 2, 6);
                addFloatingText(`+$${loot.value} 💰 BIG CASH!`, loot.x, loot.y - 12, '#4ade80', 13);
              }
            }
          }

          if (loot.x + loot.width < -60 || loot.collected) {
            lootItemsRef.current.splice(i, 1);
          }
        }
      }

      // 2. UPDATE GAME OVER / BUSTED COPS TACKLE ANIMATION / PIT FALL
      if (s.gameState === 'GAME_OVER') {
        if (p.isDead && p.fellIntoPit) {
          p.vy += 0.55 * dtScale;
          p.y += p.vy * dtScale;
          p.deathRotation += 3.5 * dtScale;
          if (p.y > CANVAS_HEIGHT + 100) {
            p.y = CANVAS_HEIGHT + 100;
          }
        }

        if (cop.x < cop.targetX) {
          cop.x = Math.min(cop.targetX, cop.x + 4.5 * dtScale);
        } else if (cop.x > cop.targetX) {
          cop.x = Math.max(cop.targetX, cop.x - 4.5 * dtScale);
        }
      }

      // 3. UPDATE PARTICLES & FLOATING TEXTS
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const part = particlesRef.current[i];
        part.x += part.vx * dtScale;
        part.y += part.vy * dtScale;
        part.life += dtScale;
        part.alpha = Math.max(0, 1 - part.life / part.maxLife);
        if (part.life >= part.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }

      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const txt = floatingTextsRef.current[i];
        txt.y += txt.vy * dtScale;
        txt.life += dtScale;
        txt.alpha = Math.max(0, 1 - txt.life / txt.maxLife);
        if (txt.life >= txt.maxLife) {
          floatingTextsRef.current.splice(i, 1);
        }
      }

      // 4. RENDER CANVAS SCENE
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background Skyline & Stars & Ambient Siren (Stable 500m milestone tiers)
      CanvasRenderer.drawBackground(
        ctx,
        buildingsFarRef.current,
        buildingsNearRef.current,
        s.groundOffset,
        s.sirenTimer,
        s.isBonusPhase,
        s.bonusTransition,
        s.score
      );

      // City Asphalt Road & Curb with Cookie Run style Pits / Ground Gaps
      CanvasRenderer.drawRoad(ctx, s.groundOffset, s.sirenTimer, s.isBonusPhase, pitsRef.current);

      // Loot Items
      for (const loot of lootItemsRef.current) {
        CanvasRenderer.drawLootItem(ctx, loot);
      }

      // Obstacles
      for (const obs of obstaclesRef.current) {
        CanvasRenderer.drawObstacle(ctx, obs);
      }

      // Police Officer Chasing
      CanvasRenderer.drawPoliceOfficer(ctx, cop, s.isBonusPhase);

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

  // Touch & Pointer Gesture Detection for Canvas Stage
  const touchStartPos = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchDuckingActive = useRef<boolean>(false);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.target !== canvasRef.current && (e.target as HTMLElement).id !== 'game-viewport-container') return;
    touchStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
    };
    handleJump();
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (!touchStartPos.current) return;
    const dy = e.clientY - touchStartPos.current.y;
    const dx = e.clientX - touchStartPos.current.x;

    // Swipe Down -> Duck
    if (dy > 30 && Math.abs(dy) > Math.abs(dx)) {
      touchDuckingActive.current = true;
      handleDuckStart();
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    if (touchDuckingActive.current) {
      touchDuckingActive.current = false;
      handleDuckEnd();
      touchStartPos.current = null;
    }
    handleJumpRelease();
    touchStartPos.current = null;
  };

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-gradient-to-b from-slate-950 via-[#0b101e] to-slate-950 text-slate-100 flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 select-none font-['Prompt',sans-serif]">
      {/* Top Header Banner */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-2 sm:mb-3 shrink-0">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg border border-amber-400/40 text-lg sm:text-xl shrink-0">
            💰
          </div>
          <div>
            <h1 className="text-sm sm:text-lg md:text-xl font-bold font-['Press_Start_2P'] text-amber-400 tracking-tight flex items-center gap-2">
              COPS & ROBBERS
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400">เกมโจรวิ่งหนีตำรวจบนถนนในเมือง (City Chase)</p>
          </div>
        </div>

        {/* Status Mode Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-1 rounded-full border flex items-center gap-1 ${
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
      <div className="w-full max-w-4xl flex flex-col items-center gap-2 sm:gap-3 shrink-0">
        {/* Retro HUD Header */}
        <RetroHUD
          score={score}
          highScore={highScore}
          stolenCash={stolenCash}
          totalCoins={totalCoins}
          bonusTimer={bonusTimer}
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
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerUp}
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

          {/* OVERLAY: BUSTED / PIT FALL / GAME OVER SCREEN */}
          {gameState === 'GAME_OVER' && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-40">
              <div
                className={`bg-slate-900/95 border-2 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl flex flex-col items-center gap-3.5 ${
                  playerRef.current.deathReason === 'PIT'
                    ? 'border-orange-500/80'
                    : 'border-red-500/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  {playerRef.current.deathReason === 'PIT' ? (
                    <>
                      <span className="text-3xl animate-bounce">🕳️</span>
                      <span className="text-3xl">⚠️</span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl animate-bounce">🚨</span>
                      <span className="text-3xl">⛓️</span>
                    </>
                  )}
                </div>

                <div
                  className={`text-white font-['Press_Start_2P'] text-sm sm:text-base px-4 py-1.5 rounded-lg border-2 tracking-wider shadow-lg ${
                    playerRef.current.deathReason === 'PIT'
                      ? 'bg-orange-600 border-orange-400'
                      : 'bg-red-600 border-red-400'
                  }`}
                >
                  {playerRef.current.deathReason === 'PIT' ? 'FELL INTO PIT!' : 'BUSTED!'}
                </div>
                <p
                  className={`text-xs font-semibold ${
                    playerRef.current.deathReason === 'PIT' ? 'text-orange-300' : 'text-red-300'
                  }`}
                >
                  {playerRef.current.deathReason === 'PIT'
                    ? 'คุณสะดุดตกร่องหลุมถนนก่อสร้าง! (Fell into road gap)'
                    : 'คุณโดนตำรวจรวบตัวแล้ว!'}
                </p>

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

          {/* FLOATING ACTIVE POWER-UPS HUD (Zero Layout Shift, Always Floats Elegantly On Canvas) */}
          {gameState === 'PLAYING' && (magnetTimer > 0 || skateboardTimer > 0) && (
            <div className="absolute top-2 right-2 pointer-events-none z-20 flex flex-col items-end gap-1.5 animate-fadeIn">
              {magnetTimer > 0 && (
                <div className="bg-slate-950/85 border border-cyan-400/80 px-2.5 py-1 rounded-full shadow-lg shadow-cyan-950/60 backdrop-blur-xs flex items-center gap-1.5 text-cyan-300">
                  <span className="text-sm animate-bounce">🧲</span>
                  <span className="text-[9px] sm:text-[11px] font-bold font-['Press_Start_2P'] text-cyan-200">
                    MAGNET {magnetTimer.toFixed(1)}s
                  </span>
                  <span className="bg-cyan-500/20 text-cyan-300 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-cyan-400/40">
                    ดูดเหรียญ
                  </span>
                </div>
              )}
              {skateboardTimer > 0 && (
                <div className="bg-slate-950/85 border border-amber-400/80 px-2.5 py-1 rounded-full shadow-lg shadow-amber-950/60 backdrop-blur-xs flex items-center gap-1.5 text-amber-300">
                  <span className="text-sm animate-bounce">🛹</span>
                  <span className="text-[9px] sm:text-[11px] font-bold font-['Press_Start_2P'] text-amber-200">
                    SKATE {skateboardTimer.toFixed(1)}s
                  </span>
                  <span className="bg-amber-500/20 text-amber-300 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-amber-400/40">
                    1.5x SPD
                  </span>
                </div>
              )}
            </div>
          )}

          {/* BONUS PHASE / MEGA COIN MOUNTAIN BANNER OVERLAY (Smooth floating absolute badge, zero layout shift) */}
          {gameState === 'PLAYING' && isBonusPhase && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center gap-1 transition-opacity duration-300">
              <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 px-4 py-1 rounded-full border-2 border-yellow-100 shadow-xl shadow-yellow-500/50 flex items-center gap-2">
                <span className="text-base animate-bounce">🏔️</span>
                <span className="text-xs sm:text-sm font-bold font-['Press_Start_2P'] tracking-wide">
                  5000M MEGA COIN MOUNTAIN!
                </span>
                <span className="bg-slate-950 text-yellow-300 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold">
                  {bonusTimer.toFixed(1)}s
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-bold font-mono text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] bg-black/60 px-2.5 py-0.5 rounded-md backdrop-blur-xs border border-yellow-500/30">
                ✨ ไต่ยอดเขาเหรียญทอง & เก็บแม่เหล็กดูดยกภูเขา! ✨
              </span>
            </div>
          )}

          {/* Quick in-game hint badge */}
          {gameState === 'PLAYING' && !isBonusPhase && (
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
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8 z-30 select-none touch-none pointer-events-auto shrink-0">
            <button
              id="onscreen-jump-btn"
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleJump();
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleJumpRelease();
              }}
              onPointerLeave={() => {
                handleJumpRelease();
              }}
              onPointerCancel={() => {
                handleJumpRelease();
              }}
              className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full bg-emerald-950/45 hover:bg-emerald-900/65 active:bg-emerald-700/85 border-[2px] border-emerald-400/50 hover:border-emerald-300 active:border-emerald-100 shadow-lg shadow-emerald-950/40 backdrop-blur-xs flex flex-col items-center justify-center gap-0.5 text-emerald-300 active:text-white active:scale-90 active:shadow-inner transition-transform duration-75 select-none touch-none cursor-pointer group ring-2 ring-emerald-500/20 shrink-0"
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

          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-30 select-none touch-none pointer-events-auto shrink-0">
            <button
              id="onscreen-slide-btn"
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDuckStart();
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDuckEnd();
              }}
              onPointerLeave={() => {
                handleDuckEnd();
              }}
              onPointerCancel={() => {
                handleDuckEnd();
              }}
              className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full bg-cyan-950/45 hover:bg-cyan-900/65 active:bg-cyan-700/85 border-[2px] border-cyan-400/50 hover:border-cyan-300 active:border-cyan-100 shadow-lg shadow-cyan-950/40 backdrop-blur-xs flex flex-col items-center justify-center gap-0.5 text-cyan-300 active:text-white active:scale-90 active:shadow-inner transition-transform duration-75 select-none touch-none cursor-pointer group ring-2 ring-cyan-500/20 shrink-0"
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

        {/* Dual Responsive Action Buttons Deck (Completely Decoupled, Permanent 100% Static Container) */}
        <div
          id="game-action-controls-deck"
          className="w-full grid grid-cols-2 gap-2.5 sm:gap-3 shrink-0 select-none touch-none pointer-events-auto"
        >
          {/* JUMP BUTTON */}
          <button
            id="mobile-jump-touch-btn"
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              handleJump();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              handleJumpRelease();
            }}
            onPointerLeave={() => {
              handleJumpRelease();
            }}
            onPointerCancel={() => {
              handleJumpRelease();
            }}
            className="py-3 sm:py-3.5 px-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 active:from-emerald-700 active:to-emerald-700 active:scale-96 text-slate-950 font-extrabold font-['Press_Start_2P'] text-[10px] sm:text-xs rounded-2xl shadow-xl shadow-emerald-950/40 border-2 border-emerald-300 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer select-none touch-none shrink-0"
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
            onPointerDown={(e) => {
              e.preventDefault();
              handleDuckStart();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              handleDuckEnd();
            }}
            onPointerLeave={() => {
              handleDuckEnd();
            }}
            onPointerCancel={() => {
              handleDuckEnd();
            }}
            className="py-3 sm:py-3.5 px-3 bg-gradient-to-r from-cyan-900 via-cyan-800 to-cyan-900 hover:from-cyan-800 hover:to-cyan-700 active:from-cyan-950 active:to-cyan-950 active:scale-96 text-cyan-100 font-extrabold font-['Press_Start_2P'] text-[10px] sm:text-xs rounded-2xl shadow-xl shadow-cyan-950/40 border-2 border-cyan-400/80 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer select-none touch-none shrink-0"
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
