import {
  CityBuilding,
  FloatingText,
  LootItem,
  Obstacle,
  Particle,
  Player,
  PoliceOfficer,
} from '../types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;
export const GROUND_Y = 320;
export const GROUND_HEIGHT = 80;

/**
 * Canvas Renderer for Cops & Robbers City Chase
 * 100% Canvas Pixel Art - Zero External Assets
 */
export class CanvasRenderer {
  // Draw Night Sky, City Skyline, Street, and Police Siren Parallax (or Vibrant Celestial Dream Sky during Bonus Phase)
  static drawBackground(
    ctx: CanvasRenderingContext2D,
    buildingsFar: CityBuilding[],
    buildingsNear: CityBuilding[],
    groundOffset: number,
    sirenTimer: number,
    isBonusPhase = false,
    bonusTransition = 0,
    score = 0
  ) {
    if (bonusTransition > 0) {
      // 1. Radiant Golden Dawn & Mountain Horizon (Golden Mountain Bonus Phase)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      skyGrad.addColorStop(0, '#f59e0b'); // Warm Amber Gold
      skyGrad.addColorStop(0.35, '#fbbf24'); // Brilliant Sunshine Gold
      skyGrad.addColorStop(0.7, '#fef08a'); // Soft Warm Buttercream
      skyGrad.addColorStop(1, '#f97316'); // Radiant Orange Horizon
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Distant Golden Mountain Silhouettes in Horizon
      const mtnOffset = (groundOffset * 0.08) % 400;
      ctx.fillStyle = '#b45309'; // Rich Amber Mountain Silhouette
      ctx.beginPath();
      ctx.moveTo(-100, GROUND_Y);
      for (let mx = -mtnOffset - 100; mx < CANVAS_WIDTH + 300; mx += 260) {
        ctx.lineTo(mx + 60, GROUND_Y - 110);
        ctx.lineTo(mx + 130, GROUND_Y - 60);
        ctx.lineTo(mx + 190, GROUND_Y - 135);
        ctx.lineTo(mx + 260, GROUND_Y);
      }
      ctx.lineTo(CANVAS_WIDTH + 200, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Mountain Peak Snow / Gold Highlights
      ctx.fillStyle = '#fef08a';
      for (let mx = -mtnOffset - 100; mx < CANVAS_WIDTH + 300; mx += 260) {
        // Peak 1 snow
        ctx.beginPath();
        ctx.moveTo(mx + 60, GROUND_Y - 110);
        ctx.lineTo(mx + 48, GROUND_Y - 90);
        ctx.lineTo(mx + 72, GROUND_Y - 90);
        ctx.closePath();
        ctx.fill();

        // Peak 2 snow
        ctx.beginPath();
        ctx.moveTo(mx + 190, GROUND_Y - 135);
        ctx.lineTo(mx + 175, GROUND_Y - 110);
        ctx.lineTo(mx + 205, GROUND_Y - 110);
        ctx.closePath();
        ctx.fill();
      }

      // Giant Glowing Golden Sun
      ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - 120, 52, 54, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - 120, 52, 28, 0, Math.PI * 2);
      ctx.fill();

      // Rotating Sunshine Crown Rays
      ctx.fillStyle = '#fde047';
      const sunRays = 10;
      for (let i = 0; i < sunRays; i++) {
        const ang = (i * Math.PI * 2) / sunRays + sirenTimer * 0.6;
        const rx = CANVAS_WIDTH - 120 + Math.cos(ang) * 42;
        const ry = 52 + Math.sin(ang) * 42;
        ctx.fillRect(rx - 2.5, ry - 2.5, 5, 5);
      }

      // Parallax City Skyline Layer 1 (Far - Golden Amber Silhouette)
      for (const b of buildingsFar) {
        this.drawBuilding(ctx, b, groundOffset * 0.15, '#78350f', '#d97706', false, true);
      }

      // Parallax City Skyline Layer 2 (Near - Warm Honey Gold with glittering windows)
      for (const b of buildingsNear) {
        this.drawBuilding(ctx, b, groundOffset * 0.35, '#451a03', '#f59e0b', true, true);
      }

      // Floating celebratory golden stars and sparkling glints across the sky
      const bonusSparkles = [
        [60, 20, '#ffffff'], [160, 35, '#fde047'], [280, 18, '#fbbf24'],
        [420, 40, '#fef08a'], [560, 24, '#ffffff'], [680, 32, '#fde047']
      ];
      for (const [sx, sy, col] of bonusSparkles) {
        ctx.fillStyle = col as string;
        const pulse = (Math.sin(sirenTimer * 8 + (sx as number)) + 1) / 2;
        ctx.fillRect((sx as number) - 1.5, (sy as number) - 1.5, 3 + pulse * 2.5, 3 + pulse * 2.5);
      }
    } else {
      // Stable Normal Mode Background: Subtle palette shift strictly every 500m milestone
      const tier = Math.floor(score / 500) % 3;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      let farBuildingBase = '#111827';
      let farBuildingEdge = '#1f2937';
      let nearBuildingBase = '#1e293b';
      let nearBuildingEdge = '#334155';

      if (tier === 0) {
        // Tier 0 (0-499m): Classic Midnight Blue City
        skyGrad.addColorStop(0, '#070b14');
        skyGrad.addColorStop(0.5, '#0f172a');
        skyGrad.addColorStop(1, '#1e1b4b');
      } else if (tier === 1) {
        // Tier 1 (500-999m): Deep Neon Violet Skyline
        skyGrad.addColorStop(0, '#0d071b');
        skyGrad.addColorStop(0.5, '#1e0e38');
        skyGrad.addColorStop(1, '#31104f');
        farBuildingBase = '#190b2e';
        farBuildingEdge = '#2e1065';
        nearBuildingBase = '#281347';
        nearBuildingEdge = '#4c1d95';
      } else {
        // Tier 2 (1000m+): Deep Teal Cyber Horizon
        skyGrad.addColorStop(0, '#041619');
        skyGrad.addColorStop(0.5, '#082b2f');
        skyGrad.addColorStop(1, '#0e3f43');
        farBuildingBase = '#022c22';
        farBuildingEdge = '#064e3b';
        nearBuildingBase = '#063f38';
        nearBuildingEdge = '#0d9488';
      }

      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2. Crescent / Full Moon with soft halo
      ctx.fillStyle = 'rgba(254, 240, 138, 0.15)';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - 110, 55, 36, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - 110, 55, 22, 0, Math.PI * 2);
      ctx.fill();

      // Subtle moon craters
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - 116, 50, 4, 0, Math.PI * 2);
      ctx.arc(CANVAS_WIDTH - 105, 62, 5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Stars in the night sky
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      const starCoords = [
        [60, 30], [140, 70], [220, 25], [340, 60],
        [430, 35], [520, 80], [610, 25], [710, 45]
      ];
      for (const [sx, sy] of starCoords) {
        ctx.fillRect(sx, sy, 2, 2);
      }

      // 4. Parallax City Skyline Layer 1 (Far)
      for (const b of buildingsFar) {
        this.drawBuilding(ctx, b, groundOffset * 0.15, farBuildingBase, farBuildingEdge, false);
      }

      // 5. Parallax City Skyline Layer 2 (Near)
      for (const b of buildingsNear) {
        this.drawBuilding(ctx, b, groundOffset * 0.35, nearBuildingBase, nearBuildingEdge, true);
      }

      // 6. Flashing Red & Blue Police Siren Ambient Light (Optimized direct alpha overlay)
      const sirenPhase = (Math.sin(sirenTimer * 12) + 1) / 2; // 0 to 1
      const redIntensity = sirenPhase * 0.14;
      const blueIntensity = (1 - sirenPhase) * 0.14;

      if (redIntensity > 0.01) {
        ctx.fillStyle = `rgba(239, 68, 68, ${redIntensity})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH * 0.45, 120);
      }
      if (blueIntensity > 0.01) {
        ctx.fillStyle = `rgba(59, 130, 246, ${blueIntensity})`;
        ctx.fillRect(CANVAS_WIDTH * 0.55, 0, CANVAS_WIDTH * 0.45, 120);
      }
    }
  }

  // Draw Building Silhouette with Windows (High-performance direct offset, avoiding save/restore overhead)
  private static drawBuilding(
    ctx: CanvasRenderingContext2D,
    b: CityBuilding,
    scrollOffset: number,
    baseColor: string,
    edgeColor: string,
    drawWindows: boolean,
    isBonus = false
  ) {
    const totalW = CANVAS_WIDTH + 300;
    const drawX = ((b.x - scrollOffset) % totalW + totalW) % totalW - 150;
    const drawY = GROUND_Y - b.height;

    // Building body
    ctx.fillStyle = baseColor;
    ctx.fillRect(drawX, drawY, b.width, b.height);

    // Building left edge highlight
    ctx.fillStyle = edgeColor;
    ctx.fillRect(drawX, drawY, 3, b.height);
    ctx.fillRect(drawX, drawY, b.width, 3);

    // Rooftop Antenna with blinking beacon
    if (b.hasAntenna) {
      ctx.fillStyle = isBonus ? '#f472b6' : '#64748b';
      ctx.fillRect(drawX + b.width / 2 - 1, drawY - 22, 2, 22);
      ctx.fillRect(drawX + b.width / 2 - 4, drawY - 12, 8, 2);

      // Blinking beacon at top
      ctx.fillStyle = isBonus ? '#fde047' : '#ef4444';
      ctx.beginPath();
      ctx.arc(drawX + b.width / 2, drawY - 23, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Windows Grid
    if (drawWindows) {
      const winW = 6;
      const winH = 8;
      const padX = (b.width - b.windowCols * winW) / (b.windowCols + 1);
      const padY = (b.height - b.windowRows * winH) / (b.windowRows + 1);

      for (let r = 0; r < b.windowRows; r++) {
        for (let c = 0; c < b.windowCols; c++) {
          if (b.windows[r] && b.windows[r][c]) {
            const wx = drawX + padX + c * (winW + padX);
            const wy = drawY + padY + r * (winH + padY);

            // Lit window color (Warm yellow or cool cyan or bonus pink/gold)
            ctx.fillStyle = isBonus
              ? (r + c) % 2 === 0 ? '#fef08a' : '#f472b6'
              : (r + c) % 3 === 0 ? '#38bdf8' : '#fef08a';
            ctx.fillRect(wx, wy, winW, winH);
          }
        }
      }
    }
  }

  // Draw City Asphalt Road & Curbs (or Glowing Celestial Road during Bonus Phase)
  static drawRoad(ctx: CanvasRenderingContext2D, groundOffset: number, sirenTimer: number, isBonusPhase = false) {
    const y = GROUND_Y;
    const h = GROUND_HEIGHT;

    if (isBonusPhase) {
      // 1. Golden Highway Sidewalk / Glowing Amber Curb
      ctx.fillStyle = '#78350f'; // Deep Amber Brown
      ctx.fillRect(0, y, CANVAS_WIDTH, 10);
      ctx.fillStyle = '#fde047'; // Radiant Gold edge
      ctx.fillRect(0, y, CANVAS_WIDTH, 2);

      const curbTile = 32;
      const curbOff = groundOffset % curbTile;
      ctx.fillStyle = '#b45309';
      for (let x = -curbOff; x < CANVAS_WIDTH + curbTile; x += curbTile) {
        ctx.fillRect(x, y, 2, 10);
      }

      // 2. Golden Highway Asphalt
      ctx.fillStyle = '#451a03'; // Warm Mahogany / Golden Asphalt
      ctx.fillRect(0, y + 10, CANVAS_WIDTH, h - 10);

      // Glowing Double Gold Highway Stripes
      const dashLength = 36;
      const gapLength = 28;
      const totalDash = dashLength + gapLength;
      const dashOffset = groundOffset % totalDash;

      ctx.fillStyle = '#fef08a'; // Radiant Gold
      const lineY = y + 42;
      for (let x = -dashOffset; x < CANVAS_WIDTH + totalDash; x += totalDash) {
        ctx.fillRect(x, lineY, dashLength, 5);
        ctx.fillStyle = '#d97706'; // Amber shadow under stripe
        ctx.fillRect(x, lineY + 4, dashLength, 1.5);
        ctx.fillStyle = '#fef08a';
      }

      // Magical road golden glow wave
      const wave = (Math.sin(sirenTimer * 8) + 1) / 2;
      ctx.fillStyle = `rgba(251, 191, 36, ${0.12 + wave * 0.08})`;
      ctx.fillRect(0, y + 10, CANVAS_WIDTH, h - 10);
    } else {
      // 1. Concrete sidewalk / curb
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, y, CANVAS_WIDTH, 10);
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, y, CANVAS_WIDTH, 2);

      // Curb edge repeating tiles
      const curbTile = 32;
      const curbOff = groundOffset % curbTile;
      ctx.fillStyle = '#1e293b';
      for (let x = -curbOff; x < CANVAS_WIDTH + curbTile; x += curbTile) {
        ctx.fillRect(x, y, 2, 10);
      }

      // 2. Dark Asphalt Road
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, y + 10, CANVAS_WIDTH, h - 10);

      // Road Texture & Asphalt specks
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, y + 10, CANVAS_WIDTH, 2);

      // 3. Yellow Dashed Center Line
      const dashLength = 36;
      const gapLength = 28;
      const totalDash = dashLength + gapLength;
      const dashOffset = groundOffset % totalDash;

      ctx.fillStyle = '#facc15';
      const lineY = y + 42;
      for (let x = -dashOffset; x < CANVAS_WIDTH + totalDash; x += totalDash) {
        ctx.fillRect(x, lineY, dashLength, 5);
        // Subtle shadow under stripe
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(x, lineY + 4, dashLength, 1);
        ctx.fillStyle = '#facc15';
      }

      // 4. Siren reflection on the wet asphalt
      const sirenPhase = (Math.sin(sirenTimer * 12) + 1) / 2;
      ctx.fillStyle = `rgba(239, 68, 68, ${sirenPhase * 0.08})`;
      ctx.fillRect(0, y + 10, CANVAS_WIDTH, h - 10);

      ctx.fillStyle = `rgba(59, 130, 246, ${(1 - sirenPhase) * 0.08})`;
      ctx.fillRect(0, y + 10, CANVAS_WIDTH, h - 10);
    }
  }

  // Draw Player: The Robber / Thief (โจรวิ่งหนี)
  static drawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
    ctx.save();
    ctx.translate(player.x, player.y);

    if (player.isDead) {
      ctx.rotate((player.deathRotation * Math.PI) / 180);
    }

    const pW = player.width;
    const pH = player.height;
    const px = -pW / 2;
    const py = -pH;

    // Electromagnetic Field Aura (when Coin Magnet Buff is Active)
    if (player.isMagnetActive && !player.isDead) {
      const time = Date.now() / 150;
      const pulse1 = (Math.sin(time) + 1) / 2;
      const pulse2 = (Math.cos(time * 1.3) + 1) / 2;

      // Outer Pulsing Magnetic Bubble
      ctx.save();
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + pulse1 * 0.4})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -pH / 2, pW * 1.2 + pulse1 * 8, pH * 0.75 + pulse1 * 8, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Inner Violet Resonant Magnetic Arc Ring
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.35 + pulse2 * 0.45})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, -pH / 2, pW * 0.9 + pulse2 * 6, pH * 0.6 + pulse2 * 6, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Magnetic Attraction Direction Arcs (Curved Field Lines)
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pW * 0.6, -pH / 2, 14, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-pW * 0.6, -pH / 2, 14, Math.PI * 0.6, Math.PI * 1.4);
      ctx.stroke();

      // Mini floating magnet icon above robber head
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-6, -pH - 16 + Math.sin(time * 2) * 2, 12, 4);
      ctx.fillRect(-6, -pH - 12 + Math.sin(time * 2) * 2, 4, 6);
      ctx.fillRect(2, -pH - 12 + Math.sin(time * 2) * 2, 4, 6);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-6, -pH - 7 + Math.sin(time * 2) * 2, 4, 2);
      ctx.fillRect(2, -pH - 7 + Math.sin(time * 2) * 2, 4, 2);

      ctx.restore();
    }

    if (player.isDead || player.busted) {
      this.drawBustedRobber(ctx, px, py, pW, pH);
    } else if (player.isSkateboarding) {
      this.drawSkateboardingRobber(ctx, px, py, pW, pH, player.isGrounded, player.runFrame);
    } else if (player.isDucking && player.isGrounded) {
      this.drawDuckingRobber(ctx, px, py, pW, pH);
    } else if (!player.isGrounded) {
      this.drawJumpingRobber(ctx, px, py, pW, pH, player.jumpCount);
    } else {
      this.drawRunningRobber(ctx, px, py, pW, pH, player.runFrame);
    }

    ctx.restore();
  }

  // Draw Skateboarding Robber (ยืนไถสเก็ตบอร์ด + เปลวไฟ/ประกายไฟพุ่งตามหลัง)
  private static drawSkateboardingRobber(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    isGrounded: boolean,
    frame: number
  ) {
    const scale = w / 34;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Jet / Boost aura glow behind skateboard
    ctx.fillStyle = 'rgba(249, 115, 22, 0.4)';
    ctx.fillRect(-22, 28, 20, 10);
    ctx.fillStyle = 'rgba(234, 179, 8, 0.7)';
    ctx.fillRect(-16, 30, 14, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-10, 32, 8, 3);

    // Wind speedlines
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-28, 14, 18, 2);
    ctx.fillRect(-24, 22, 14, 2);

    // 1. Bulging Money Sack on Back (tilted backward from speed)
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(-14, 8, 18, 18);
    ctx.fillRect(-16, 11, 22, 12);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-9, 15, 7, 2);
    ctx.fillRect(-7, 13, 3, 6);
    ctx.fillRect(-9, 19, 7, 2);
    // Gold coins peeking
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-10, 5, 4, 4);

    // 2. Beanie Hat flying in the wind
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(8, 2, 16, 8);
    ctx.fillRect(4, 6, 22, 4);

    // 3. Robber Face with Cool / Confident grin
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(8, 10, 16, 8);
    ctx.fillRect(21, 11, 4, 4); // Nose

    // Burglar Mask
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, 9, 16, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(11, 10, 3, 3);
    ctx.fillRect(18, 10, 3, 3);
    ctx.fillStyle = '#000000';
    ctx.fillRect(12, 10, 2, 2);
    ctx.fillRect(19, 10, 2, 2);

    // Big Grin
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, 15, 8, 2);
    ctx.fillStyle = '#000000';
    ctx.fillRect(14, 14, 8, 1);

    // 4. Striped Burglar Shirt
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 18, 18, 11);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(6, 20, 18, 3);
    ctx.fillRect(6, 25, 18, 3);

    // Arms balanced for surfing/skating
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(-2, 18, 8, 5); // Back arm reaching back for balance
    ctx.fillRect(20, 16, 8, 5);  // Front arm pointing forward

    // 5. Pants & Skate Stance Legs
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(4, 26, 8, 8);  // Back leg
    ctx.fillRect(18, 26, 8, 8); // Front leg

    // Sneakers on board
    ctx.fillStyle = '#475569';
    ctx.fillRect(2, 33, 10, 4);
    ctx.fillRect(16, 33, 10, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 36, 10, 2);
    ctx.fillRect(16, 36, 10, 2);

    // 6. Neon Gold/Cyan Skateboard Deck
    ctx.fillStyle = '#f59e0b'; // Gold deck
    ctx.fillRect(-8, 37, 42, 4);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-6, 36, 38, 2); // Grip tape highlight
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(6, 38, 14, 2); // Center cyan race stripe

    // Kicktails (curved up ends)
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-10, 35, 3, 3);
    ctx.fillRect(33, 35, 3, 3);

    // Metal Trucks
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-2, 41, 6, 2);
    ctx.fillRect(22, 41, 6, 2);

    // Glowing Speed Wheels (Spinning neon wheels)
    const wheelColor = frame % 2 === 0 ? '#38bdf8' : '#0ea5e9';
    ctx.fillStyle = wheelColor;
    ctx.beginPath();
    ctx.arc(0, 43, 3.5, 0, Math.PI * 2);
    ctx.arc(24, 43, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, 42, 2, 2);
    ctx.fillRect(23, 42, 2, 2);

    ctx.restore();
  }

  // Draw Ducking / Sliding Robber (สไลด์ / ก้มตัวลอดสิ่งกีดขวาง)
  private static drawDuckingRobber(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    const scale = w / 44;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // 1. Skid dust & friction lines behind
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(-16, 16, 14, 2);
    ctx.fillRect(-12, 19, 10, 2);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-8, 17, 4, 2); // spark

    // 2. Money Sack flattened/dragged low behind
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(-14, 8, 18, 11);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-8, 11, 7, 2);
    ctx.fillRect(-5, 9, 2, 6);
    ctx.fillRect(-8, 14, 7, 2);

    // 3. Sliding Body - Striped Shirt tilted low horizontally
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 8, 22, 9);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, 8, 3, 9);
    ctx.fillRect(16, 8, 3, 9);

    // 4. Head & Beanie crouched forward
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(24, 2, 14, 7);
    ctx.fillRect(22, 6, 17, 3);

    // Face & Burglar Mask
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(26, 7, 14, 7);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(26, 7, 14, 4);

    // White eye slit looking ahead focused
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(32, 8, 3, 2);
    ctx.fillStyle = '#000000';
    ctx.fillRect(33, 8, 2, 2);

    // Arms extended forward balancing
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(24, 13, 8, 4);
    ctx.fillRect(30, 14, 5, 3);

    // 5. Sliding Legs extended forward along asphalt
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(2, 12, 16, 6);
    ctx.fillRect(14, 13, 14, 5);

    // Sneakers sliding flat
    ctx.fillStyle = '#475569';
    ctx.fillRect(24, 16, 12, 4);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(24, 19, 12, 2); // White sneaker sole

    ctx.restore();
  }

  // Draw Running Robber Pixel Art
  private static drawRunningRobber(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    frame: number
  ) {
    const scale = w / 32;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // 1. Money Sack on Back (Bulging burlap sack with $)
    const sackBounce = frame % 2 === 0 ? 0 : 2;
    ctx.fillStyle = '#854d0e'; // Brown burlap
    ctx.fillRect(-10, 10 + sackBounce, 16, 20);
    ctx.fillRect(-12, 13 + sackBounce, 20, 14);

    // Sack knot & tie string
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-8, 8 + sackBounce, 5, 4);

    // Green Dollar Sign '$' on Sack
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-5, 16 + sackBounce, 7, 2);
    ctx.fillRect(-3, 14 + sackBounce, 3, 7);
    ctx.fillRect(-5, 20 + sackBounce, 7, 2);

    // Gold coins peeking out top
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-6, 7 + sackBounce, 3, 3);
    ctx.fillRect(-2, 6 + sackBounce, 3, 3);

    // 2. Black Beanie Hat
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(8, 2, 16, 8);
    ctx.fillRect(6, 6, 20, 4);

    // 3. Face with Black Burglar Eye Mask
    ctx.fillStyle = '#fbcfe8'; // Peach skin
    ctx.fillRect(8, 10, 16, 8);
    ctx.fillRect(20, 11, 4, 4); // Nose

    // Black Burglar Mask
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, 9, 16, 5);

    // White eye slits looking back nervously
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 10, 3, 3);
    ctx.fillRect(17, 10, 3, 3);
    ctx.fillStyle = '#000000';
    ctx.fillRect(10, 10, 2, 2); // Pupil looking back
    ctx.fillRect(17, 10, 2, 2);

    // Grin / smirk
    ctx.fillStyle = '#000000';
    ctx.fillRect(15, 15, 6, 2);

    // 4. Black & White Striped Burglar Shirt
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 18, 18, 12);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(6, 20, 18, 3);
    ctx.fillRect(6, 26, 18, 3);

    // Hands holding sack strap
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(4, 21, 5, 5);
    ctx.fillRect(19, 19, 5, 5);

    // 5. Dark Blue Pants & Running Shoes
    ctx.fillStyle = '#1e3a8a';
    ctx.fillStyle = '#0f172a';

    if (frame === 0) {
      // Stride 1
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(6, 28, 6, 8);
      ctx.fillRect(16, 28, 6, 8);
      // Shoes
      ctx.fillStyle = '#475569';
      ctx.fillRect(3, 36, 9, 4);
      ctx.fillRect(17, 36, 9, 4);
    } else if (frame === 1) {
      // Pass frame
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(10, 28, 10, 8);
      ctx.fillStyle = '#475569';
      ctx.fillRect(9, 36, 12, 4);
    } else if (frame === 2) {
      // Stride 2
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(4, 28, 6, 8);
      ctx.fillRect(18, 28, 6, 8);
      ctx.fillStyle = '#475569';
      ctx.fillRect(1, 36, 9, 4);
      ctx.fillRect(19, 36, 9, 4);
    } else {
      // Stride 3
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(8, 28, 12, 8);
      ctx.fillStyle = '#475569';
      ctx.fillRect(6, 36, 9, 4);
      ctx.fillRect(16, 35, 8, 4);
    }

    ctx.restore();
  }

  // Draw Jumping Robber (with Double-Jump air-burst visuals)
  private static drawJumpingRobber(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    jumpCount = 1
  ) {
    const scale = w / 32;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Double-jump Air Burst / Aura below feet
    if (jumpCount >= 2) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.fillRect(-2, 36, 36, 3);
      ctx.fillStyle = 'rgba(14, 165, 233, 0.8)';
      ctx.fillRect(4, 38, 24, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, 36, 12, 2);

      // Boost spark particles
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-6, 32, 4, 3);
      ctx.fillRect(34, 32, 4, 3);
    }

    // Money Sack hoisted high
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(-8, 6, 16, 18);
    ctx.fillRect(-10, 9, 20, 12);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-4, 13, 6, 2);
    ctx.fillRect(-2, 11, 2, 6);
    ctx.fillRect(-4, 16, 6, 2);

    // Beanie
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(8, 0, 16, 8);
    ctx.fillRect(6, 4, 20, 4);

    // Face & Mask
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(8, 8, 16, 8);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, 7, 16, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(11, 8, 3, 3);
    ctx.fillRect(18, 8, 3, 3);

    // Striped Shirt
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 16, 18, 12);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(6, 18, 18, 3);
    ctx.fillRect(6, 24, 18, 3);

    // Arms reaching forward
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(20, 14, 6, 6);

    // Tucked Jumping Legs
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(4, 26, 8, 6);
    ctx.fillRect(16, 24, 8, 6);
    ctx.fillStyle = '#475569';
    ctx.fillRect(2, 30, 9, 5);
    ctx.fillRect(18, 27, 9, 5);

    ctx.restore();
  }

  // Draw Busted / Caught Robber
  private static drawBustedRobber(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    const scale = w / 32;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Dropped Money Sack on ground
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(-16, 26, 18, 12);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-10, 30, 6, 2);

    // Beanie knocked crooked
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(10, 2, 16, 6);

    // Face with X Eyes (Shocked)
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(8, 8, 16, 10);
    ctx.fillStyle = '#000000';
    ctx.fillRect(10, 11, 4, 4); // X eye
    ctx.fillRect(18, 11, 4, 4);
    ctx.fillRect(14, 16, 6, 3); // O mouth

    // Striped Shirt
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 18, 18, 12);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(6, 20, 18, 3);
    ctx.fillRect(6, 26, 18, 3);

    // Hands locked together in Silver Handcuffs
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(10, 22, 12, 6);

    // Metallic Handcuffs
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(10, 24, 4, 4);
    ctx.fillRect(18, 24, 4, 4);
    ctx.fillRect(14, 25, 4, 2); // Chain

    // Legs fallen
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(4, 30, 10, 6);
    ctx.fillRect(18, 30, 10, 6);

    ctx.restore();
  }

  // Draw Police Officer Chasing (ตำรวจวิ่งไล่ตาม)
  static drawPoliceOfficer(ctx: CanvasRenderingContext2D, cop: PoliceOfficer, isBonusPhase = false) {
    ctx.save();
    ctx.translate(cop.x, cop.y);

    const cW = cop.width;
    const cH = cop.height;
    const px = -cW / 2;
    const py = -cH;
    const scale = cW / 34;

    ctx.scale(scale, scale);

    // If Bonus Phase, draw cute floating sweatdrop / peace hearts above police head!
    if (isBonusPhase) {
      const heartBob = Math.sin(cop.runTimer * 0.4) * 4;
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('♥', px + 14, py - 6 + heartBob);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('💦', px + 28, py - 4);
    }

    // 1. Navy Police Peaked Cap
    ctx.fillStyle = '#1e3a8a'; // Deep Navy
    ctx.fillRect(px + 6, py + 2, 22, 8);
    ctx.fillRect(px + 4, py + 6, 26, 4);

    // Black Visor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px + 18, py + 8, 14, 3);

    // Gold Police Hat Badge
    ctx.fillStyle = '#eab308';
    ctx.fillRect(px + 14, py + 3, 5, 5);

    // 2. Face with determined eyes
    ctx.fillStyle = '#fed7aa'; // Skin tone
    ctx.fillRect(px + 8, py + 10, 18, 8);
    ctx.fillRect(px + 22, py + 11, 4, 4); // Nose

    // Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(px + 17, py + 11, 3, 3);
    ctx.fillRect(px + 15, py + 10, 6, 2); // Eyebrow

    // Whistle in mouth
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(px + 23, py + 15, 6, 3);
    ctx.fillRect(px + 27, py + 13, 2, 5);

    // Whistle Sound waves
    if (cop.whistleTimer % 12 < 6) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px + 32, py + 14, 4, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px + 35, py + 14, 7, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
    }

    // 3. Navy Police Uniform Shirt with Gold Badge
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(px + 6, py + 18, 20, 12);

    // Gold Chest Badge
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(px + 18, py + 22, 3, 0, Math.PI * 2);
    ctx.fill();

    // Black Duty Belt
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px + 6, py + 27, 20, 4);
    ctx.fillStyle = '#e2e8f0'; // Belt buckle
    ctx.fillRect(px + 14, py + 27, 4, 4);

    // 4. Arms & Police Nightstick (Baton)
    ctx.fillStyle = '#1e3a8a';
    if (cop.isTackling) {
      // Reaching forward to grab / handcuff
      ctx.fillRect(px + 20, py + 16, 14, 6);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(px + 32, py + 16, 6, 6);
      // Handcuffs ready
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(px + 34, py + 20, 6, 4);
    } else {
      // Swinging Nightstick
      ctx.fillRect(px + 20, py + 18, 8, 6);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(px + 26, py + 17, 5, 5);

      // Nightstick / Baton
      ctx.fillStyle = '#0f172a';
      if (cop.runFrame % 2 === 0) {
        ctx.fillRect(px + 27, py + 8, 4, 16);
      } else {
        ctx.fillRect(px + 28, py + 14, 14, 4);
      }
    }

    // 5. Navy Trousers & Black Police Boots (Animated Sprint)
    ctx.fillStyle = '#172554';
    if (cop.runFrame === 0) {
      ctx.fillRect(px + 6, py + 30, 7, 7);
      ctx.fillRect(px + 18, py + 30, 7, 7);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 3, py + 36, 10, 4);
      ctx.fillRect(px + 19, py + 36, 10, 4);
    } else if (cop.runFrame === 1) {
      ctx.fillRect(px + 10, py + 30, 11, 7);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 9, py + 36, 13, 4);
    } else if (cop.runFrame === 2) {
      ctx.fillRect(px + 4, py + 30, 7, 7);
      ctx.fillRect(px + 20, py + 30, 7, 7);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 1, py + 36, 10, 4);
      ctx.fillRect(px + 21, py + 36, 10, 4);
    } else {
      ctx.fillRect(px + 8, py + 30, 13, 7);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 7, py + 36, 10, 4);
      ctx.fillRect(px + 18, py + 35, 9, 4);
    }

    ctx.restore();
  }

  // Draw Obstacles (Traffic Cone, Trash Can, Police Roadblock, Police Drone)
  static drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle) {
    ctx.save();
    ctx.translate(obs.x, obs.y);

    switch (obs.type) {
      case 'TRAFFIC_CONE':
        this.drawTrafficCone(ctx, obs.width, obs.height);
        break;
      case 'TRASH_CAN':
        this.drawTrashCan(ctx, obs.width, obs.height);
        break;
      case 'ROADBLOCK':
        this.drawPoliceRoadblock(ctx, obs.width, obs.height, obs.lightState);
        break;
      case 'POLICE_DRONE':
        this.drawPoliceDrone(ctx, obs.width, obs.height, obs.animFrame);
        break;
      case 'OVERHEAD_BARRIER':
        this.drawOverheadBarrier(ctx, obs.width, obs.height, obs.lightState);
        break;
      case 'CONSTRUCTION_SCAFFOLD':
        this.drawConstructionScaffold(ctx, obs.width, obs.height, obs.lightState, obs.animFrame);
        break;
    }

    ctx.restore();
  }

  // 1. Traffic Cone (กรวยจราจรสีส้มสะท้อนแสง)
  private static drawTrafficCone(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Base plate (Black rubber)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, h - 6, w, 6);

    // Orange Cone body
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(4, h - 6);
    ctx.lineTo(w / 2 - 4, 2);
    ctx.lineTo(w / 2 + 4, 2);
    ctx.lineTo(w - 4, h - 6);
    ctx.closePath();
    ctx.fill();

    // Top rounded tip
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(w / 2, 3, 4, 0, Math.PI * 2);
    ctx.fill();

    // Reflective Silver / White Band 1 (Top)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(w / 2 - 6, h * 0.35, 12, 6);

    // Reflective Silver / White Band 2 (Bottom)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(w / 2 - 10, h * 0.65, 20, 7);

    // Specular Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(w / 2 - 2, 4, 2, h - 10);
  }

  // 2. Trash Can (ถังขยะเหล็กข้างทาง)
  private static drawTrashCan(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Metal Body (Galvanized Steel)
    ctx.fillStyle = '#475569';
    ctx.fillRect(2, 8, w - 4, h - 8);

    ctx.fillStyle = '#64748b';
    ctx.fillRect(4, 10, w - 8, h - 10);

    // Corrugated vertical ribs
    ctx.fillStyle = '#334155';
    for (let rx = 8; rx < w - 6; rx += 7) {
      ctx.fillRect(rx, 10, 2, h - 12);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(rx + 2, 10, 1, h - 12);
      ctx.fillStyle = '#334155';
    }

    // Metal Handles on sides
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-2, 18, 4, 10);
    ctx.fillRect(w - 2, 18, 4, 10);

    // Metal Lid (Slightly tilted)
    ctx.save();
    ctx.translate(w / 2, 6);
    ctx.rotate(-0.06);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-w / 2, -4, w, 7);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-w / 2 + 2, -3, w - 4, 5);

    // Handle on lid
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-4, -8, 8, 4);
    ctx.restore();

    // Spilled trash / banana peel peeking out
    ctx.fillStyle = '#facc15';
    ctx.fillRect(4, 2, 6, 6);
    ctx.fillStyle = '#84cc16';
    ctx.fillRect(w - 12, 3, 5, 4);
  }

  // 3. Police Roadblock Barricade (แผงกั้นตำรวจ)
  private static drawPoliceRoadblock(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    lightState = true
  ) {
    // A-frame Legs (Left and Right)
    ctx.fillStyle = '#334155';
    // Left Leg
    ctx.fillRect(4, 8, 5, h - 8);
    ctx.fillRect(0, h - 6, 12, 6);
    // Right Leg
    ctx.fillRect(w - 9, 8, 5, h - 8);
    ctx.fillRect(w - 12, h - 6, 12, 6);

    // Horizontal Barrier Planks (Yellow & Black Hazard Stripes)
    const plankH = 14;
    const p1Y = 8;
    const p2Y = 24;

    // Plank 1
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, p1Y, w, plankH);
    ctx.fillStyle = '#0f172a';
    for (let sx = -10; sx < w; sx += 16) {
      ctx.beginPath();
      ctx.moveTo(sx, p1Y + plankH);
      ctx.lineTo(sx + 8, p1Y + plankH);
      ctx.lineTo(sx + 16, p1Y);
      ctx.lineTo(sx + 8, p1Y);
      ctx.closePath();
      ctx.fill();
    }

    // Plank 2
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, p2Y, w, plankH);
    ctx.fillStyle = '#0f172a';
    for (let sx = -10; sx < w; sx += 16) {
      ctx.beginPath();
      ctx.moveTo(sx, p2Y + plankH);
      ctx.lineTo(sx + 8, p2Y + plankH);
      ctx.lineTo(sx + 16, p2Y);
      ctx.lineTo(sx + 8, p2Y);
      ctx.closePath();
      ctx.fill();
    }

    // Blue & White "POLICE / CAUTION" sign in center
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(w / 2 - 18, p1Y + 2, 36, plankH - 4);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('POLICE', w / 2, p1Y + 10);

    // Flashing Warning Light on Top
    ctx.fillStyle = '#475569';
    ctx.fillRect(w / 2 - 4, 2, 8, 6);

    ctx.fillStyle = lightState ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(w / 2, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    if (lightState) {
      // Flash Glow
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.arc(w / 2, 0, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Police Scanner Drone (โดรนสแกนเนอร์ของตำรวจ)
  private static drawPoliceDrone(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    frame: number
  ) {
    const cx = w / 2;
    const cy = h / 2;

    // Downward Scanner Searchlight Cone
    const grad = ctx.createLinearGradient(cx, cy + 8, cx, cy + 90);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy + 8);
    ctx.lineTo(cx - 30, cy + 80);
    ctx.lineTo(cx + 30, cy + 80);
    ctx.lineTo(cx + 6, cy + 8);
    ctx.closePath();
    ctx.fill();

    // Quadcopter Arms
    ctx.fillStyle = '#334155';
    ctx.fillRect(cx - 22, cy - 3, 44, 4);

    // Propeller Hubs
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 24, cy - 8, 6, 6);
    ctx.fillRect(cx + 18, cy - 8, 6, 6);

    // Spinning Propeller Blades (Animated)
    const bladeOffset = (frame % 2 === 0 ? 10 : 2);
    ctx.fillStyle = 'rgba(203, 213, 225, 0.8)';
    ctx.fillRect(cx - 24 - bladeOffset / 2, cy - 8, bladeOffset + 6, 2);
    ctx.fillRect(cx + 18 - bladeOffset / 2, cy - 8, bladeOffset + 6, 2);

    // Drone Main Chassis
    ctx.fillStyle = '#1e3a8a'; // Police Blue Body
    ctx.beginPath();
    ctx.ellipse(cx, cy, 16, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // White Stripe
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 10, cy - 2, 20, 3);

    // Blinking Police Siren Lights (Left Red, Right Blue)
    const isRed = frame % 4 < 2;
    ctx.fillStyle = isRed ? '#ef4444' : '#3b82f6';
    ctx.beginPath();
    ctx.arc(cx - 8, cy - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isRed ? '#3b82f6' : '#ef4444';
    ctx.beginPath();
    ctx.arc(cx + 8, cy - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Camera Eye lens in center
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy + 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx, cy + 4, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Overhead Street Laser / Traffic Sign Barrier (คานป้ายจราจรลอยต่ำ - มุด/ก้มหลบ)
  private static drawOverheadBarrier(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    lightState = true
  ) {
    // Metal Hanging Struts from top of screen
    ctx.fillStyle = '#475569';
    ctx.fillRect(8, -120, 4, 120);
    ctx.fillRect(w - 12, -120, 4, 120);

    // Cross brace truss
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, -40);
    ctx.lineTo(w - 8, -10);
    ctx.moveTo(w - 8, -40);
    ctx.lineTo(8, -10);
    ctx.stroke();

    // Overhead Signboard Body
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, h);

    // Hazard Stripes (Yellow / Black)
    ctx.fillStyle = '#eab308';
    ctx.fillRect(2, 2, w - 4, 6);
    ctx.fillStyle = '#0f172a';
    for (let x = 4; x < w - 6; x += 10) {
      ctx.fillRect(x, 2, 5, 6);
    }

    // Sign Message "DUCK ▼" / Low Clearance Indicator
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(4, 10, w - 8, h - 14);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('▼ DUCK ▼', w / 2, 19);

    // Flashing Warning Lights on corners
    ctx.fillStyle = lightState ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(4, h / 2, 3.5, 0, Math.PI * 2);
    ctx.arc(w - 4, h / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    if (lightState) {
      // Glow beam
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.beginPath();
      ctx.arc(4, h / 2, 8, 0, Math.PI * 2);
      ctx.arc(w - 4, h / 2, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 6. High Long Overhead Construction Scaffold & Security Lasers (คานซุ้มนั่งร้านเหล็กยาว 100% บังคับสไลด์มุด)
  private static drawConstructionScaffold(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    lightState = true,
    frame = 0
  ) {
    // Solid Overhead Steel Truss Canopy (Fills screen from top y=0 down to the clearance height)
    // 1. Heavy Industrial Metallic Roof Frame
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // 2. Heavy Steel Plate Panels
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(2, 2, w - 4, h - 4);

    // 3. Diagonal Steel Truss X-Bracing Grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let bx = 0; bx < w; bx += 28) {
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx + 28, h);
      ctx.moveTo(bx + 28, 0);
      ctx.lineTo(bx, h);
      // Vertical struts
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx, h);
    }
    ctx.stroke();

    // 4. Yellow & Black Caution Hazard Stripes at the bottom edge
    const stripeH = 8;
    ctx.fillStyle = '#eab308'; // Safety Yellow
    ctx.fillRect(0, h - stripeH, w, stripeH);

    ctx.fillStyle = '#0f172a'; // Black hazard stripes
    for (let sx = -10; sx < w + 20; sx += 16) {
      ctx.beginPath();
      ctx.moveTo(sx, h);
      ctx.lineTo(sx + 8, h);
      ctx.lineTo(sx + 14, h - stripeH);
      ctx.lineTo(sx + 6, h - stripeH);
      ctx.closePath();
      ctx.fill();
    }

    // 5. High-Voltage Laser Grid Emitter Beam across the canopy
    const laserY = h - stripeH - 3;
    const laserPulse = (Math.sin(frame * 0.3) + 1) / 2;
    ctx.strokeStyle = `rgba(239, 68, 68, ${0.7 + laserPulse * 0.3})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, laserY);
    ctx.lineTo(w - 4, laserY);
    ctx.stroke();

    // 6. Overhead Warning LED Neon Display Boards (SLIDE / ก้มสไลด์)
    const signW = 90;
    const signH = 18;
    const signX = (w - signW) / 2;
    const signY = h - stripeH - 24;

    ctx.fillStyle = '#020617';
    ctx.fillRect(signX, signY, signW, signH);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(signX, signY, signW, signH);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('▼ SLIDE ONLY ▼', w / 2, signY + 12);

    // 7. Flashing Industrial Strobe Warning Beacons on bottom corners
    const beaconY = h - stripeH / 2;
    // Left Beacon
    ctx.fillStyle = lightState ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(6, beaconY, 4, 0, Math.PI * 2);
    ctx.fill();
    // Center Beacon
    ctx.fillStyle = !lightState ? '#eab308' : '#713f12';
    ctx.beginPath();
    ctx.arc(w / 2, beaconY, 4, 0, Math.PI * 2);
    ctx.fill();
    // Right Beacon
    ctx.fillStyle = lightState ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(w - 6, beaconY, 4, 0, Math.PI * 2);
    ctx.fill();

    if (lightState) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.beginPath();
      ctx.arc(6, beaconY, 10, 0, Math.PI * 2);
      ctx.arc(w - 6, beaconY, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw Stolen Loot (Gold Coins, Cash Stacks, Money Bags, Diamonds, Skateboard)
  static drawLootItem(ctx: CanvasRenderingContext2D, loot: LootItem) {
    if (loot.collected) return;

    ctx.save();
    ctx.translate(loot.x + loot.width / 2, loot.y + loot.height / 2);

    // Gentle floating bob
    const bob = Math.sin(loot.animFrame * 0.18) * 3;
    ctx.translate(0, bob);

    if (loot.type === 'GOLD_COIN') {
      // Golden Coin with 3D horizontal spin & gleam
      const spin = Math.cos(loot.animFrame * 0.12);
      const scaleX = Math.max(0.18, Math.abs(spin));
      const radius = 9;

      // Soft golden outer glow
      ctx.fillStyle = 'rgba(250, 204, 21, 0.22)';
      ctx.beginPath();
      ctx.arc(0, 0, radius + 4, 0, Math.PI * 2);
      ctx.fill();

      // Outer rim edge
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * scaleX, radius, 0, 0, Math.PI * 2);
      ctx.fill();

      // Coin base face
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.ellipse(0, 0, (radius - 1.5) * scaleX, radius - 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner highlight rim
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(0, 0, (radius - 3) * scaleX, radius - 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Embossed Star or $ symbol in center (scales with spin)
      if (scaleX > 0.4) {
        ctx.fillStyle = '#92400e';
        ctx.font = `bold ${Math.floor(8 * scaleX + 2)}px 'Press Start 2P', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 0, 0.5);
      }

      // Rotating Gleam Sparkle (appears periodically)
      const gleamCycle = (loot.animFrame + loot.id * 7) % 40;
      if (gleamCycle < 10) {
        const glAlpha = Math.sin((gleamCycle / 10) * Math.PI);
        ctx.save();
        ctx.globalAlpha = glAlpha;
        ctx.translate(-radius * 0.5 * scaleX, -radius * 0.6);
        ctx.fillStyle = '#ffffff';
        // 4-point sparkle
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(1.2, -1.2);
        ctx.lineTo(4, 0);
        ctx.lineTo(1.2, 1.2);
        ctx.lineTo(0, 4);
        ctx.lineTo(-1.2, 1.2);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-1.2, -1.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    } else if (loot.type === 'CASH_STACK') {
      // Stack of green hundred-dollar bills
      ctx.fillStyle = '#15803d';
      ctx.fillRect(-12, -7, 24, 14);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-11, -6, 22, 12);

      // Money band
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-3, -7, 6, 14);

      // Dollar sign
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', 0, 3);
    } else if (loot.type === 'DIAMOND') {
      // Sparkling Blue Diamond
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(10, -3);
      ctx.lineTo(0, 10);
      ctx.lineTo(-10, -3);
      ctx.closePath();
      ctx.fill();

      // Diamond facets
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(4, -3);
      ctx.lineTo(0, 10);
      ctx.closePath();
      ctx.fill();

      // Diamond sparkle
      const dGleam = (loot.animFrame + loot.id * 5) % 30;
      if (dGleam < 8) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(1, -7, 3, 3);
      }
    } else if (loot.type === 'SKATEBOARD') {
      // Golden/Cyan Neon Skateboard powerup with spinning wheels and sparkles
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-16, -2, 32, 5);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-14, -3, 28, 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(-6, -1, 12, 3); // cyan core

      // Curved tails
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-18, -4, 3, 3);
      ctx.fillRect(15, -4, 3, 3);

      // Trucks
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-10, 3, 5, 2);
      ctx.fillRect(5, 3, 5, 2);

      // Neon wheels
      const wCol = (Math.floor(loot.animFrame / 4)) % 2 === 0 ? '#38bdf8' : '#f43f5e';
      ctx.fillStyle = wCol;
      ctx.beginPath();
      ctx.arc(-8, 6, 3, 0, Math.PI * 2);
      ctx.arc(8, 6, 3, 0, Math.PI * 2);
      ctx.fill();

      // Mini pulsing beacon / speed wings
      ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
    } else if (loot.type === 'MAGNET') {
      // 🧲 Horseshoe Coin Magnet Power-up with Glowing Magnetic Field & Silver Tips
      const magPulse = (Math.sin(loot.animFrame * 0.2) + 1) / 2;

      // Pulsing Cyan / Blue Magnetic Field Ring
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + magPulse * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 16 + magPulse * 4, 0, Math.PI * 2);
      ctx.stroke();

      // Magnetic field flux lines
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.3 + magPulse * 0.4})`;
      ctx.beginPath();
      ctx.arc(0, -12, 6, 0, Math.PI, true);
      ctx.stroke();

      // Red Horseshoe U-Arch Body
      ctx.fillStyle = '#dc2626'; // Vibrant Red
      // Left limb
      ctx.fillRect(-11, -8, 6, 15);
      // Right limb
      ctx.fillRect(5, -8, 6, 15);
      // Curved bottom arch
      ctx.beginPath();
      ctx.arc(0, 5, 11, 0, Math.PI);
      ctx.fill();

      // Inner hollow cutout
      ctx.fillStyle = '#0f172a'; // Background cutout simulation
      ctx.beginPath();
      ctx.arc(0, 5, 5, 0, Math.PI);
      ctx.fill();
      ctx.fillRect(-5, -8, 10, 13);

      // Red Arch Highlight
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-10, -7, 2, 14);
      ctx.fillRect(8, -7, 2, 14);

      // Silver / Chrome Metallic Pole Tips (North & South)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-11, -14, 6, 6);
      ctx.fillRect(5, -14, 6, 6);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-11, -10, 6, 2);
      ctx.fillRect(5, -10, 6, 2);

      // 'N' and 'S' indicators
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(-9, -13, 2, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(7, -13, 2, 4);

      // Sparkling magnetic lightning gleam
      if ((loot.animFrame + loot.id * 3) % 15 < 6) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -15, 4, 2);
        ctx.fillRect(0, -17, 2, 6);
      }
    } else if (loot.type === 'HEART_COIN') {
      // 💖 Adorable Sparkling 3D Heart Coin (Bonus Fever Special Loot - Value $10 / 10x)
      const spin = Math.cos(loot.animFrame * 0.14);
      const scaleX = Math.max(0.2, Math.abs(spin));
      const r = 11;

      // Radiant Hot Pink / Ruby Aura Glow
      const glowPulse = (Math.sin(loot.animFrame * 0.25) + 1) / 2;
      ctx.fillStyle = `rgba(244, 63, 94, ${0.3 + glowPulse * 0.3})`;
      ctx.beginPath();
      ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
      ctx.fill();

      // Outer Golden Rim Ellipse (3D tilt)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(0, 0, (r + 2) * scaleX, r + 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(0, 0, (r + 1) * scaleX, r + 1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner Ruby-Pink Heart Shape Facet
      ctx.save();
      ctx.scale(scaleX, 1);
      ctx.fillStyle = '#e11d48'; // Deep Crimson Ruby
      ctx.beginPath();
      ctx.moveTo(0, 7);
      ctx.bezierCurveTo(-9, 1, -11, -6, -5, -9);
      ctx.bezierCurveTo(-1, -10, 0, -5, 0, -4);
      ctx.bezierCurveTo(0, -5, 1, -10, 5, -9);
      ctx.bezierCurveTo(11, -6, 9, 1, 0, 7);
      ctx.fill();

      // Bright Glossy Rose Highlight Layer
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.bezierCurveTo(-6, 0, -8, -5, -4, -7);
      ctx.bezierCurveTo(-1, -8, 0, -4, 0, -3);
      ctx.bezierCurveTo(0, -4, 1, -8, 4, -7);
      ctx.bezierCurveTo(8, -5, 6, 0, 0, 4);
      ctx.fill();

      // White Shine on Top Left Lobe
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-3.5, -6, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Center Gold Sparkle or Heart $ sign
      if (scaleX > 0.45) {
        ctx.fillStyle = '#fff1f2';
        ctx.font = "bold 8px 'Press Start 2P', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♥', 0, -0.5);
      }
      ctx.restore();

      // Rotating Gleam Sparkle
      const gleam = (loot.animFrame + loot.id * 4) % 24;
      if (gleam < 8) {
        const gAlpha = Math.sin((gleam / 8) * Math.PI);
        ctx.save();
        ctx.globalAlpha = gAlpha;
        ctx.translate(-r * 0.4 * scaleX, -r * 0.5);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(1.2, -1.2);
        ctx.lineTo(5, 0);
        ctx.lineTo(1.2, 1.2);
        ctx.lineTo(0, 5);
        ctx.lineTo(-1.2, 1.2);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-1.2, -1.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    } else {
      // Money Sack with gold $
      ctx.fillStyle = '#854d0e';
      ctx.beginPath();
      ctx.arc(0, 2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-5, -10, 10, 6);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-4, -6, 8, 2);

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', 0, 6);
    }

    ctx.restore();
  }

  // Draw Particles
  static drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.type === 'money') {
        // Floating mini green bill
        ctx.translate(p.x, p.y);
        ctx.fillRect(-5, -3, 10, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -1, 2, 2);
      } else if (p.type === 'star') {
        const r = p.size;
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color;
        // 4-point glowing star sparkle
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.28, -r * 0.28);
        ctx.lineTo(r, 0);
        ctx.lineTo(r * 0.28, r * 0.28);
        ctx.lineTo(0, r);
        ctx.lineTo(-r * 0.28, r * 0.28);
        ctx.lineTo(-r, 0);
        ctx.lineTo(-r * 0.28, -r * 0.28);
        ctx.closePath();
        ctx.fill();

        // White glint center
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -1, 2, 2);
      } else if (p.type === 'skate_trail') {
        // Speed wind trail line
        ctx.fillRect(p.x - p.size * 2, p.y - 1, p.size * 3, 2);
      } else if (p.type === 'skate_spark') {
        // Glowing wheel spark
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.type === 'magnet_spark') {
        // Cyan / Electric Violet Magnetic Sparkle
        const r = p.size;
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -1, 2, 2);
      } else if (p.type === 'magnet_wave') {
        // Expanding Magnetic Ripple Circle
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'heart_sparkle') {
        // 💖 Floating / Bursting mini glowing Ruby-Pink Heart
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color;
        const hr = p.size;
        ctx.beginPath();
        ctx.moveTo(0, hr * 0.7);
        ctx.bezierCurveTo(-hr * 0.9, hr * 0.1, -hr * 1.1, -hr * 0.6, -hr * 0.5, -hr * 0.9);
        ctx.bezierCurveTo(-hr * 0.1, -hr, 0, -hr * 0.5, 0, -hr * 0.4);
        ctx.bezierCurveTo(0, -hr * 0.5, hr * 0.1, -hr, hr * 0.5, -hr * 0.9);
        ctx.bezierCurveTo(hr * 1.1, -hr * 0.6, hr * 0.9, hr * 0.1, 0, hr * 0.7);
        ctx.fill();

        // White sparkle highlight
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -hr * 0.5, 2, 2);
      } else if (p.type === 'fever_burst') {
        // Multi-colored rainbow starburst ring
        ctx.translate(p.x, p.y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -2, 4, 4);
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }

      ctx.restore();
    }
  }

  // Draw Floating Texts
  static drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
    for (const t of texts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.font = `bold ${t.size}px 'Press Start 2P', monospace`;
      ctx.textAlign = 'center';

      // Outline
      ctx.fillStyle = '#000000';
      ctx.fillText(t.text, t.x + 2, t.y + 2);

      // Fill
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);

      ctx.restore();
    }
  }
}
