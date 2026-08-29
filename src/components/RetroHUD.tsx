import React from 'react';
import { Trophy, Volume2, VolumeX, Pause, Play, Flame, Zap, DollarSign, Siren } from 'lucide-react';
import { Difficulty, GameState } from '../types';

interface RetroHUDProps {
  score: number;
  highScore: number;
  stolenCash: number;
  speed: number;
  difficulty: Difficulty;
  gameState: GameState;
  isMuted: boolean;
  skateboardTimer?: number;
  magnetTimer?: number;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onChangeDifficulty: (diff: Difficulty) => void;
}

export const RetroHUD: React.FC<RetroHUDProps> = ({
  score,
  highScore,
  stolenCash,
  speed,
  difficulty,
  gameState,
  isMuted,
  skateboardTimer = 0,
  magnetTimer = 0,
  onToggleMute,
  onTogglePause,
  onChangeDifficulty,
}) => {
  const isNewRecord = score > 0 && score >= highScore;
  const isSkateActive = skateboardTimer > 0;
  const isMagnetActive = magnetTimer > 0;

  return (
    <div id="retro-hud-container" className="w-full bg-slate-950/90 border-2 border-amber-500/60 rounded-xl p-3 sm:p-4 text-white shadow-xl backdrop-blur-md">
      {/* Top Row: Distance & Stolen Loot Cash */}
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono">
        {/* Escape Distance / Score */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-amber-500/15 border border-amber-500/40 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-inner">
            <span className="text-amber-400 text-xs sm:text-sm font-['Press_Start_2P'] uppercase">
              DISTANCE
            </span>
            <span className="text-lg sm:text-2xl font-bold font-['Press_Start_2P'] text-amber-300 tracking-wider">
              {String(Math.floor(score)).padStart(6, '0')}m
            </span>
          </div>

          {/* Stolen Money Loot Badge */}
          <div className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/50 px-2.5 py-1.5 rounded-lg shadow-inner">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-xs sm:text-sm font-bold font-['Press_Start_2P'] text-emerald-300">
              ${stolenCash.toLocaleString()}
            </span>
          </div>

          {/* Skateboard Buff Countdown Badge */}
          {isSkateActive && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-red-500/30 border border-amber-400 px-3 py-1.5 rounded-lg shadow-lg shadow-amber-500/20 animate-pulse">
              <span className="text-base">🛹</span>
              <span className="text-xs sm:text-sm font-bold font-['Press_Start_2P'] text-amber-300">
                SKATE {(skateboardTimer).toFixed(1)}s
              </span>
              <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/50">
                1.5x SPD + อมตะ!
              </span>
            </div>
          )}

          {/* Coin Magnet Buff Countdown Badge */}
          {isMagnetActive && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500/30 via-sky-500/30 to-indigo-500/30 border border-cyan-400 px-3 py-1.5 rounded-lg shadow-lg shadow-cyan-500/20 animate-pulse">
              <span className="text-base">🧲</span>
              <span className="text-xs sm:text-sm font-bold font-['Press_Start_2P'] text-cyan-300">
                MAGNET {(magnetTimer).toFixed(1)}s
              </span>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/50">
                ดูดเหรียญอัตโนมัติ!
              </span>
            </div>
          )}
        </div>

        {/* High Score Record */}
        <div className="flex items-center space-x-2">
          <div
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 border transition-all ${
              isNewRecord
                ? 'bg-red-500/30 border-red-400 text-red-300 animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <Trophy className={`w-4 h-4 sm:w-5 sm:h-5 ${isNewRecord ? 'text-amber-400 animate-bounce' : 'text-yellow-400'}`} />
            <div className="flex flex-col items-start">
              <span className="text-[9px] text-slate-400 font-['Press_Start_2P']">RECORD</span>
              <span className="text-sm sm:text-base font-bold font-['Press_Start_2P'] text-yellow-400">
                {String(Math.floor(highScore)).padStart(6, '0')}m
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Chase Speed, Difficulty Selector, & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800 text-xs">
        {/* Speed & Mode */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md">
            <Siren className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="text-slate-400">Chase:</span>
            <span className="text-amber-300 font-bold font-mono">{speed.toFixed(2)}x</span>
          </div>

          {/* Difficulty Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              id="diff-normal-btn"
              type="button"
              disabled={gameState === 'PLAYING'}
              onClick={() => onChangeDifficulty('NORMAL')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                difficulty === 'NORMAL'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              } ${gameState === 'PLAYING' ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              Normal (เล่นง่าย)
            </button>
            <button
              id="diff-fast-btn"
              type="button"
              disabled={gameState === 'PLAYING'}
              onClick={() => onChangeDifficulty('FAST')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                difficulty === 'FAST'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              } ${gameState === 'PLAYING' ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Flame className="w-3 h-3 text-amber-300" />
              Fast (ท้าทาย)
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {gameState === 'PLAYING' && (
            <button
              id="pause-btn"
              type="button"
              onClick={onTogglePause}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition flex items-center gap-1 px-2.5"
              title="พักเกม (Pause)"
            >
              <Pause className="w-4 h-4 text-amber-400" />
              <span className="text-xs">พักเกม</span>
            </button>
          )}

          {gameState === 'PAUSED' && (
            <button
              id="resume-btn"
              type="button"
              onClick={onTogglePause}
              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 border border-emerald-500 rounded-lg text-white transition flex items-center gap-1 px-2.5"
              title="เล่นต่อ (Resume)"
            >
              <Play className="w-4 h-4 fill-current" />
              <span className="text-xs">เล่นต่อ</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            id="sound-toggle-btn"
            type="button"
            onClick={onToggleMute}
            className={`p-1.5 rounded-lg border transition active:scale-95 ${
              isMuted
                ? 'bg-slate-800/80 border-slate-700 text-slate-500'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
            }`}
            title={isMuted ? 'เปิดเสียง (Unmute)' : 'ปิดเสียง (Mute)'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
