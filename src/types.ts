export type GameState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type Difficulty = 'NORMAL' | 'FAST';

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  isGrounded: boolean;
  jumpCount: number;
  maxJumps: number;
  runFrame: number;
  runTimer: number;
  isDead: boolean;
  deathVy: number;
  deathRotation: number;
  busted: boolean;
  fellIntoPit?: boolean;
  deathReason?: 'BUSTED' | 'PIT';
  isDucking: boolean;
  isSkateboarding?: boolean;
  isMagnetActive?: boolean;
  coyoteTimer?: number;
  jumpBufferTimer?: number;
}

export interface GroundPit {
  id: number;
  x: number;
  width: number;
  passed?: boolean;
  hasWarningCone?: boolean;
}

export interface PoliceOfficer {
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  runFrame: number;
  runTimer: number;
  isTackling: boolean;
  whistleTimer: number;
}

export type ObstacleType = 'TRAFFIC_CONE' | 'TRASH_CAN' | 'ROADBLOCK' | 'POLICE_DRONE' | 'OVERHEAD_BARRIER' | 'CONSTRUCTION_SCAFFOLD';

export interface Obstacle {
  id: number;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  passed: boolean;
  animFrame: number;
  animTimer: number;
  lightState?: boolean;
}

export type LootType = 'GOLD_COIN' | 'CASH_STACK' | 'MONEY_BAG' | 'DIAMOND' | 'SKATEBOARD' | 'MAGNET' | 'HEART_COIN';

export interface LootItem {
  id: number;
  type: LootType;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
  animFrame: number;
  animTimer: number;
  value: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'dust' | 'sparkle' | 'star' | 'money' | 'siren' | 'skate_trail' | 'skate_spark' | 'magnet_spark' | 'magnet_wave' | 'heart_sparkle' | 'fever_burst';
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface CityBuilding {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  windowRows: number;
  windowCols: number;
  hasAntenna: boolean;
  windows: boolean[][];
}

export interface StreetLight {
  x: number;
  y: number;
}
