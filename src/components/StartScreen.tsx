import React from 'react';
import { Play, Flame, Shield, Monitor, Smartphone, Sparkles, Siren, Zap } from 'lucide-react';
import { Difficulty } from '../types';

interface StartScreenProps {
  difficulty: Difficulty;
  onChangeDifficulty: (diff: Difficulty) => void;
  onStartGame: () => void;
  highScore: number;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  difficulty,
  onChangeDifficulty,
  onStartGame,
  highScore,
}) => {
  return (
    <div
      id="start-screen-overlay"
      className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-6 z-40 overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative bg-gradient-to-b from-slate-900/95 via-slate-900/98 to-slate-950 border-2 border-amber-500/70 rounded-2xl sm:rounded-3xl shadow-2xl shadow-amber-500/10 max-w-4xl w-full p-4 sm:p-6 md:p-8 my-auto overflow-hidden">
        {/* Ambient Police Siren Glow Effects in Background */}
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-red-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* 2-Column Responsive Layout: Left (Visual Model) | Right (Lore & Controls) */}
        <div className="relative grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-8 items-center">
          
          {/* ================= LEFT SIDE: VISUAL DISPLAY ================= */}
          <div className="md:col-span-5 flex flex-col items-center justify-center text-center py-2 sm:py-4">
            
            {/* Siren Alert Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/15 border border-red-500/40 rounded-full text-red-300 text-[11px] font-bold font-mono tracking-wide mb-3 shadow-inner">
              <Siren className="w-3.5 h-3.5 text-red-400 animate-bounce" />
              <span>WANTED LEVEL: ★★★★★</span>
            </div>

            {/* Character Showcase Stage with Floating Animation & Ground Shadow */}
            <div className="relative flex flex-col items-center justify-center w-full max-w-[240px] sm:max-w-[270px] aspect-square">
              {/* Backlight Aura */}
              <div className="absolute inset-4 bg-gradient-to-tr from-amber-500/20 via-cyan-500/10 to-indigo-500/20 rounded-full blur-xl" />

              {/* Floating Animated Robber Figure */}
              <div className="relative z-10 animate-[bounce_3s_ease-in-out_infinite]">
                <svg
                  viewBox="0 0 160 190"
                  className="w-36 h-44 sm:w-44 sm:h-52 drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] filter transition-transform hover:scale-105"
                >
                  {/* Stolen Money Sack (Behind Robber on Left) */}
                  <ellipse cx="44" cy="125" rx="30" ry="26" fill="#854d0e" />
                  <ellipse cx="44" cy="125" rx="27" ry="23" fill="#a16207" />
                  <circle cx="36" cy="100" r="10" fill="#713f12" />
                  <path d="M 32 94 Q 36 86 42 94 Z" fill="#eab308" />
                  {/* Dollar Sign on Bag */}
                  <text
                    x="42"
                    y="133"
                    textAnchor="middle"
                    fill="#fef08a"
                    fontSize="22"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    $
                  </text>

                  {/* Sparkling Gold Coins popping out */}
                  <circle cx="24" cy="98" r="6" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="24" y="101" textAnchor="middle" fill="#78350f" fontSize="7" fontWeight="bold">
                    $
                  </text>
                  <circle cx="62" cy="105" r="5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />

                  {/* Robber Body (Legs & Shoes) */}
                  <rect x="74" y="132" width="12" height="26" fill="#1e293b" rx="4" />
                  <rect x="94" y="132" width="12" height="26" fill="#1e293b" rx="4" />
                  {/* Shoes */}
                  <rect x="68" y="154" width="20" height="12" fill="#0f172a" rx="5" />
                  <rect x="92" y="154" width="20" height="12" fill="#0f172a" rx="5" />
                  <rect x="68" y="162" width="20" height="4" fill="#cbd5e1" rx="2" />
                  <rect x="92" y="162" width="20" height="4" fill="#cbd5e1" rx="2" />

                  {/* Robber Torso (Striped Shirt) */}
                  <rect x="68" y="80" width="44" height="54" fill="#ffffff" rx="8" />
                  {/* Black Stripes */}
                  <rect x="68" y="88" width="44" height="7" fill="#0f172a" />
                  <rect x="68" y="103" width="44" height="7" fill="#0f172a" />
                  <rect x="68" y="118" width="44" height="7" fill="#0f172a" />

                  {/* Left Arm holding Sack */}
                  <rect x="52" y="86" width="18" height="10" fill="#0f172a" rx="4" transform="rotate(-20 52 86)" />
                  <circle cx="48" cy="98" r="6" fill="#fcd34d" />

                  {/* Right Arm swinging */}
                  <rect x="110" y="86" width="18" height="10" fill="#ffffff" rx="4" transform="rotate(25 110 86)" />
                  <circle cx="126" cy="98" r="6" fill="#fcd34d" />

                  {/* Head & Face */}
                  <circle cx="90" cy="56" r="22" fill="#fcd34d" />
                  {/* Ear */}
                  <circle cx="112" cy="58" r="4" fill="#fbbf24" />

                  {/* Black Bandit Eye Mask */}
                  <ellipse cx="90" cy="54" rx="21" ry="8" fill="#0f172a" />
                  {/* Eyes (Mischievous Glint) */}
                  <circle cx="82" cy="54" r="3.5" fill="#ffffff" />
                  <circle cx="83" cy="54" r="2" fill="#0284c7" />
                  <circle cx="98" cy="54" r="3.5" fill="#ffffff" />
                  <circle cx="99" cy="54" r="2" fill="#0284c7" />

                  {/* Sly Smirk Mouth */}
                  <path d="M 84 66 Q 92 72 100 66" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" fill="none" />

                  {/* Knit Beanie Cap (Dark Charcoal) */}
                  <path d="M 68 50 Q 90 20 112 50 Z" fill="#1e293b" />
                  <rect x="66" y="44" width="48" height="9" fill="#0f172a" rx="3" />
                  {/* Beanie Pom-Pom */}
                  <circle cx="90" cy="22" r="6" fill="#ef4444" />
                </svg>
              </div>

              {/* Dynamic Ground Shadow Under Feet */}
              <div className="w-28 sm:w-36 h-4 bg-black/60 rounded-[100%] blur-[3px] scale-y-75 animate-[pulse_3s_ease-in-out_infinite]" />
            </div>

            {/* Role Tag & High Score */}
            <div className="mt-2 flex flex-col items-center">
              <span className="text-xs font-bold text-amber-400 font-mono tracking-wider">
                SHADOW THIEF • จอมโจรเงา
              </span>
              {highScore > 0 && (
                <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>RECORD: <b className="text-amber-300">{highScore}m</b></span>
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT SIDE: LORE, CONTROLS & START ================= */}
          <div className="md:col-span-7 flex flex-col gap-4 text-left">
            
            {/* Game Title Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                  CYBER CITY HEIST ESCAPE
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black font-['Press_Start_2P'] text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 drop-shadow-md tracking-tight leading-tight">
                CITY THIEF RUNNER
              </h1>
            </div>

            {/* Game Lore / Story Box */}
            <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3 sm:p-3.5 text-xs text-slate-300 leading-relaxed shadow-inner">
              <p>
                <span className="text-amber-400 font-bold">ภารกิจ: </span>
                หลังจากปล้นเพชรครั้งใหญ่ในมหานครสำเร็จ สัญญาณเตือนภัยดังลั่น! ตำรวจไซเบอร์ได้ระดมกำลังไล่ล่า คุณต้องรับบทเป็นจอมโจรเงา วิ่งฝ่าอุปสรรคบนท้องถนนในยามค่ำคืนเพื่อหนีการจับกุมให้นานที่สุด!
              </p>
            </div>

            {/* How to Play & Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* PC Controls */}
              <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-3 flex flex-col gap-1.5 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 font-mono">
                  <Monitor className="w-3.5 h-3.5 text-amber-400" />
                  <span>บนคอมพิวเตอร์ (PC)</span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1 font-sans">
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 text-amber-300 text-[10px] font-mono">Space</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 text-amber-300 text-[10px] font-mono">▲</kbd> : กระโดดข้ามสิ่งกีดขวาง <span className="text-amber-400 font-medium">(กดซ้ำเพื่อ Double Jump)</span>
                  </div>
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 text-cyan-300 text-[10px] font-mono">S</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 text-cyan-300 text-[10px] font-mono">▼</kbd> : สไลด์มุดหลบโดรนและคานป้าย
                  </div>
                </div>
              </div>

              {/* Mobile Controls */}
              <div className="bg-slate-950/70 border border-cyan-500/30 rounded-xl p-3 flex flex-col gap-1.5 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 font-mono">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>บนมือถือ (Mobile)</span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1 font-sans">
                  <div>
                    <span className="font-bold text-emerald-400">[JUMP ซ้าย]</span> : แตะกระโดด / กด 2 ครั้งกระโดดสูง
                  </div>
                  <div>
                    <span className="font-bold text-cyan-400">[SLIDE ขวา]</span> : แตะสไลด์มุดหลบอุปสรรคด้านบน
                  </div>
                </div>
              </div>
            </div>

            {/* Power-up Items Highlight Bar */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 bg-slate-800/40 border border-slate-700/50 px-3 py-2 rounded-xl">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> ไอเทมพิเศษ:
              </span>
              <span>🛹 สเก็ตบอร์ด (อมตะ 5s)</span>
              <span>•</span>
              <span>🧲 แม่เหล็กดูดเหรียญ (5s)</span>
              <span>•</span>
              <span>💎 เพชรฟ้า (+$50)</span>
            </div>

            {/* Difficulty Toggle Switch */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-400 font-mono">โหมดความเร็ว:</span>
              <div className="flex items-center gap-1.5 flex-1">
                <button
                  type="button"
                  onClick={() => onChangeDifficulty('NORMAL')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    difficulty === 'NORMAL'
                      ? 'bg-emerald-600 text-white shadow-md border border-emerald-400'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => onChangeDifficulty('FAST')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    difficulty === 'FAST'
                      ? 'bg-red-600 text-white shadow-md border border-red-400'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  <Flame className="w-3 h-3 text-amber-300" />
                  Fast
                </button>
              </div>
            </div>

            {/* Big Prominent Start Chase Button */}
            <button
              id="start-game-btn"
              type="button"
              onClick={onStartGame}
              className="w-full py-4 px-6 mt-1 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-[0.98] text-slate-950 font-black font-['Press_Start_2P'] text-xs sm:text-sm rounded-xl shadow-xl shadow-amber-500/25 border-2 border-amber-200 transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <Play className="w-5 h-5 fill-slate-950 group-hover:translate-x-0.5 transition-transform" />
              <span>START GAME / เริ่มวิ่งหลบหนี</span>
              <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
