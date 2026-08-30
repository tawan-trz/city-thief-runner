import React from 'react';
import { Smartphone, Keyboard, ShieldAlert, Sparkles, Siren } from 'lucide-react';

export const HowToPlay: React.FC = () => {
  return (
    <div id="how-to-play-card" className="w-full bg-slate-950/85 border border-slate-800 rounded-2xl p-4 sm:p-6 text-slate-200 shadow-xl backdrop-blur-md mt-2">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
        <Siren className="w-6 h-6 text-amber-400 animate-pulse" />
        <h2 className="text-sm sm:text-base font-bold font-['Press_Start_2P'] text-amber-300">
          วิธีเล่น: โจรวิ่งหนีตำรวจ (HOW TO PLAY)
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        {/* Card 1: Keyboard Controls */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-2">
              <Keyboard className="w-4 h-4" />
              <span>คีย์บอร์ด (คอมพิวเตอร์)</span>
            </div>
            
            {/* Jump controls */}
            <div className="mb-2.5">
              <div className="text-[11px] text-emerald-400 font-bold mb-1">⬆️ กระโดด (Jump / Double Jump):</div>
              <div className="flex flex-wrap gap-1.5">
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-[11px] font-mono font-bold text-amber-300 shadow">
                  Space
                </kbd>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-[11px] font-mono font-bold text-amber-300 shadow">
                  ▲ Up
                </kbd>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-[11px] font-mono font-bold text-amber-300 shadow">
                  W
                </kbd>
              </div>
            </div>

            {/* Duck controls */}
            <div className="mb-2">
              <div className="text-[11px] text-cyan-300 font-bold mb-1">⬇️ ก้มตัว / มุดสไลด์ (Duck / Slide):</div>
              <div className="flex flex-wrap gap-1.5">
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-[11px] font-mono font-bold text-cyan-300 shadow">
                  ▼ Down
                </kbd>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-[11px] font-mono font-bold text-cyan-300 shadow">
                  S
                </kbd>
              </div>
            </div>
          </div>
          <span className="text-[11px] text-amber-400 font-medium">💡 กระโดดวิถีโค้งพุ่งไปข้างหน้าและตกสู่พื้นอย่างกระชับ เหรียญวางตามแนวโค้งให้กระโดดเก็บได้พอดี!</span>
        </div>

        {/* Card 2: Mobile Touch Controls */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
              <Smartphone className="w-4 h-4" />
              <span>หน้าจอสัมผัส (มือถือ / แท็บเล็ต)</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 mb-2">
              <li>
                <span className="text-emerald-300 font-bold">ปุ่ม JUMP (ซ้ายล่าง):</span> แตะเพื่อกระโดดข้าม (แตะ 2 ครั้ง = Double Jump)
              </li>
              <li>
                <span className="text-cyan-300 font-bold">ปุ่ม SLIDE (ขวาล่าง):</span> แตะค้างเพื่อก้มตัวมุดลอดสิ่งกีดขวาง
              </li>
              <li>
                <span className="text-slate-400">Gesture บนหน้าจอเกม:</span> ปัดลง = ก้มมุด, แตะจอ = กระโดด
              </li>
            </ul>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-lg p-2.5 text-[11px] text-emerald-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>ปุ่มเสมือนบนมุมจอสัมผัสติดนิ้ว ไม่ดีเลย์ พร้อมระบบป้องกันหน้าจอเลื่อน</span>
          </div>
        </div>

        {/* Card 3: Cops & Obstacle Rules */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-semibold mb-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>ไอเทม & สิ่งกีดขวาง</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>
                <span className="text-amber-400">กรวย / ถังขยะ / แผงกั้น:</span> <b>กระโดดข้าม</b>
              </li>
              <li>
                <span className="text-cyan-400">โดรนตำรวจ / คานป้าย:</span> <b>ก้มตัวมุดลอด</b>
              </li>
              <li>
                <span className="text-rose-400 font-bold">ซุ้มนั่งร้านเหล็กยาว:</span> <b>บังคับสไลด์มุด 100% (ห้ามกระโดด!)</b>
              </li>
              <li>
                <span className="text-amber-300 font-bold">🏔️ ภูเขาเหรียญทองยักษ์ (ทุก 5000m):</span> <b>ช่วงโบนัสพิเศษ 7 วิ ไม่มีตำรวจ/กับดัก เก็บพีระมิดเหรียญ 5 ชั้น & ยอดแม่เหล็กดูดยกภูเขา!</b>
              </li>
              <li>
                <span className="text-yellow-300 font-bold">🛹 สเก็ตบอร์ด (5s):</span> <b>วิ่งเร็ว 1.5x + อมตะชนทะลุสิ่งกีดขวาง!</b>
              </li>
              <li>
                <span className="text-cyan-300 font-bold">🧲 แม่เหล็กดูดเงิน (5s):</span> <b>ดูดเหรียญและอัญมณีใกล้เคียงอัตโนมัติ!</b>
              </li>
              <li>
                <span className="text-amber-300">เหรียญทอง / ถุงเงิน / เพชร:</span> <b>+$2-$100</b> (มีทั้งเหรียญล่อกับดัก & เส้นทางปลอดภัย)
              </li>
            </ul>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-red-400 mt-2 font-medium bg-red-950/40 p-2 rounded-lg border border-red-900/50">
            <Siren className="w-3.5 h-3.5 shrink-0" />
            <span>หากชนสิ่งกีดขวาง (ตอนไม่ได้เล่นสเก็ตบอร์ด) ตำรวจจะรวบทันที!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
