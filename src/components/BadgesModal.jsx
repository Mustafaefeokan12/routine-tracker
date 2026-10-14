import React from 'react';
import { X, Award, Trophy, Star, Shield, Flame, BookOpen, Sparkles } from 'lucide-react';

const BADGES_CONFIG = [
  {
    id: 'perfect_day',
    title: 'Kusursuz Gün',
    desc: 'Bir günde 100 veya daha fazla puan toplandı',
    icon: Trophy,
    color: 'text-amber-400 bg-amber-950/40 border-amber-800/40'
  },
  {
    id: 'early_bird',
    title: 'Şafak Operasyonu',
    desc: 'Sabah saatlerinde 3 rutin başarıyla tamamlandı',
    icon: Sparkles,
    color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40'
  },
  {
    id: 'iron_will',
    title: 'Demir İrade',
    desc: '7 gün üst üste kesintisiz streak başarıldı',
    icon: Flame,
    color: 'text-orange-400 bg-orange-950/40 border-orange-800/40'
  },
  {
    id: 'engineer_mind',
    title: 'Mühendislik Disiplini',
    desc: '45 dakikalık odaklı çalışma rutini tamamlandı',
    icon: Shield,
    color: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/40'
  },
  {
    id: 'book_worm',
    title: 'Zihinsel Derinlik',
    desc: 'Kitap ve makale okuma rutini tamamlandı',
    icon: BookOpen,
    color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
  },
  {
    id: 'terea_control',
    title: 'Dengeli Tüketim',
    desc: 'Günü 10 dalın altında Terea ile kapatma başarısı',
    icon: Star,
    color: 'text-rose-400 bg-rose-950/40 border-rose-800/40'
  }
];

export default function BadgesModal({
  isOpen,
  onClose,
  totalScore,
  streak,
  unlockedBadges = []
}) {
  if (!isOpen) return null;

  // Level & EXP Calculation (1000 EXP per level)
  const currentLevel = Math.floor(totalScore / 100) + 1;
  const currentExp = totalScore % 100;
  const nextLevelExp = 100;

  // Academic Letter Grade
  let letterGrade = 'FF';
  let gradeColor = 'text-rose-400';
  if (totalScore >= 95) {
    letterGrade = 'AA';
    gradeColor = 'text-emerald-400';
  } else if (totalScore >= 85) {
    letterGrade = 'BA';
    gradeColor = 'text-emerald-300';
  } else if (totalScore >= 70) {
    letterGrade = 'BB';
    gradeColor = 'text-cyan-400';
  } else if (totalScore >= 60) {
    letterGrade = 'CB';
    gradeColor = 'text-amber-400';
  } else if (totalScore >= 50) {
    letterGrade = 'CC';
    gradeColor = 'text-amber-500';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#17181d] border border-[#262832] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#23252e]">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Seviye & Rozetler Koleksiyonu
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#23252e] text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Level & Letter Grade Hero Card */}
        <div className="my-4 p-4 rounded-2xl bg-[#121316] border border-[#262832]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Mühendislik Rütbesi
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">
                Seviye {currentLevel} <span className="text-xs font-semibold text-emerald-400">Disiplin Mimarı</span>
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Günün Notu
              </span>
              <p className={`text-2xl font-black ${gradeColor} font-mono leading-none mt-0.5`}>
                {letterGrade}
              </p>
            </div>
          </div>

          {/* EXP Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1 font-mono">
              <span>İlerleme (EXP)</span>
              <span>{currentExp} / {nextLevelExp} P</span>
            </div>
            <div className="w-full bg-[#1e2029] rounded-full h-2 overflow-hidden border border-[#262832]">
              <div
                style={{ width: `${Math.min((currentExp / nextLevelExp) * 100, 100)}%` }}
                className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              ></div>
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">
            Kazanılan Rozetler
          </h4>

          <div className="grid grid-cols-2 gap-2.5">
            {BADGES_CONFIG.map((b) => {
              const Icon = b.icon;
              const isUnlocked = totalScore >= 70 || streak >= 1; // Unlocks with progress

              return (
                <div
                  key={b.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                    isUnlocked
                      ? 'bg-[#121316] border-[#262832]'
                      : 'bg-[#121316]/40 border-[#1f2129] opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-xl border ${b.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">
                        {b.title}
                      </p>
                      <span className="text-[9px] text-emerald-400 font-semibold">
                        {isUnlocked ? 'Kazanıldı' : 'Kilitli'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
