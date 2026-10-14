import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle2, FileText, Save, Flame } from 'lucide-react';
import { formatDateDisplay } from '../utils/date';
import { db } from '../db';

export default function DayDetailModal({
  dateStr,
  dayRecord,
  tereaPrice = 6.0,
  onClose,
  onUpdateDayNote
}) {
  const [logs, setLogs] = useState([]);
  const [note, setNote] = useState(dayRecord?.note || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!dateStr) return;
    setNote(dayRecord?.note || '');

    // Fetch logs for this date from IndexedDB
    db.logs
      .where('date')
      .equals(dateStr)
      .toArray()
      .then((records) => {
        setLogs(records);
      });
  }, [dateStr, dayRecord]);

  if (!dateStr) return null;

  const score = dayRecord?.totalScore || 0;
  const target = dayRecord?.targetScore || 100;
  const percentage = Math.round((score / target) * 100);
  const tereaSticks = dayRecord?.tereaCount || 0;
  const tereaSpent = (tereaSticks * tereaPrice).toFixed(1);
  const tereaPacks = (tereaSticks / 20).toFixed(1);

  const handleSaveNote = async () => {
    setIsSaving(true);
    await onUpdateDayNote(dateStr, note);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#17181d] border border-[#262832] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#23252e]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#23252e] text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium">Günlük Değerlendirme</p>
              <h3 className="text-sm font-bold text-white">
                {formatDateDisplay(dateStr)}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#23252e] text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Highlight Stats Row (Routine Score + Terea Spent) */}
        <div className="my-4 grid grid-cols-2 gap-2.5">
          {/* Routine Score Card */}
          <div className="p-3.5 rounded-2xl bg-[#121316] border border-[#262832]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Rutin Performansı
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-white font-mono">{score}</span>
              <span className="text-xs text-neutral-400 font-medium">/ {target} P</span>
            </div>
            <p className={`text-[11px] font-bold mt-0.5 ${score >= target ? 'text-emerald-400' : 'text-neutral-400'}`}>
              %{percentage} Başarı
            </p>
          </div>

          {/* Terea Daily Expense Card */}
          <div className="p-3.5 rounded-2xl bg-[#121316] border border-[#262832]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" /> Terea Tüketimi
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-amber-300 font-mono">{tereaSticks}</span>
              <span className="text-xs text-neutral-400 font-medium">Dal</span>
              <span className="text-[10px] text-neutral-500">({tereaPacks} Pkt)</span>
            </div>
            <p className="text-[11px] font-bold text-amber-400 mt-0.5 font-mono">
              {tereaSpent} TL Harcama
            </p>
          </div>
        </div>

        {/* Completed Routines List */}
        <div className="space-y-2 mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">
            Tamamlanan Rutinler ({logs.length})
          </h4>

          {logs.length === 0 ? (
            <p className="text-xs text-neutral-500 py-3 text-center italic bg-[#121316] rounded-xl border border-[#262832]">
              Bu gün için kayıtlı rutin bulunmuyor.
            </p>
          ) : (
            <div className="space-y-1.5">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#121316] border border-[#262832] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="font-semibold text-neutral-200">{log.title}</span>
                  </div>
                  <span className="font-bold text-emerald-400 bg-[#1c1e26] px-2 py-0.5 rounded-lg border border-[#2e313e]">
                    +{log.weight}P
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Day Reflective Note */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-neutral-400" /> Gün Sonu Notu
            </h4>
            {note !== (dayRecord?.note || '') && (
              <span className="text-[10px] text-amber-400">Kaydedilmedi</span>
            )}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Bugün nasıl geçti? Özel bir gelişme, antrenman veya ders notu yazın..."
            rows={3}
            className="w-full bg-[#121316] border border-[#262832] rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors resize-none"
          />
          <button
            onClick={handleSaveNote}
            disabled={isSaving}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-all spring-click"
          >
            <Save className="w-3.5 h-3.5" /> {isSaving ? 'Kaydediliyor...' : 'Notu Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
