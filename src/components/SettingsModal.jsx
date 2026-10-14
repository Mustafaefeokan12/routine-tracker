import React, { useState } from 'react';
import { X, Download, Upload, RefreshCw, Moon, Clock, Target, ShieldCheck, Sparkles, Flame, Volume2, VolumeX } from 'lucide-react';
import { db, DEFAULT_ROUTINES } from '../db';

export default function SettingsModal({
  isOpen,
  onClose,
  targetScore,
  onUpdateTargetScore,
  resetHour,
  onUpdateResetHour,
  tereaStickPrice,
  onUpdateTereaPrice,
  soundEnabled,
  onToggleSound,
  onSeedDemoData,
  onReloadData
}) {
  const [importStatus, setImportStatus] = useState('');
  const [customPrice, setCustomPrice] = useState(tereaStickPrice || 6.0);

  if (!isOpen) return null;

  // Export all data to JSON
  const handleExport = async () => {
    const routines = await db.routines.toArray();
    const logs = await db.logs.toArray();
    const days = await db.days.toArray();
    const tereaLogs = await db.tereaLogs.toArray();
    const settings = await db.settings.toArray();

    const backup = {
      version: 2,
      exportedAt: new Date().toISOString(),
      routines,
      logs,
      days,
      tereaLogs,
      settings
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `routine_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.routines) {
        await db.routines.clear();
        await db.routines.bulkAdd(data.routines);
      }
      if (data.logs) {
        await db.logs.clear();
        await db.logs.bulkAdd(data.logs);
      }
      if (data.days) {
        await db.days.clear();
        await db.days.bulkAdd(data.days);
      }
      if (data.tereaLogs) {
        await db.tereaLogs.clear();
        await db.tereaLogs.bulkAdd(data.tereaLogs);
      }

      setImportStatus('✅ Yedek başarıyla geri yüklendi!');
      onReloadData();
      setTimeout(() => setImportStatus(''), 3000);
    } catch (err) {
      setImportStatus('❌ Hata: Geçersiz yedek dosyası.');
    }
  };

  const handlePriceSave = (price) => {
    const val = Number(price);
    if (!isNaN(val) && val > 0) {
      setCustomPrice(val);
      onUpdateTereaPrice(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#17181d] border border-[#262832] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#23252e]">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Ayarlar & Kişiselleştirme
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#23252e] text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 mt-4">
          {/* Terea Price Setting (CRITICAL USER REQUEST) */}
          <div className="p-3.5 rounded-2xl bg-[#121316] border border-[#262832]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> 1 Dal Terea Fiyatı (TL)
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">
                {customPrice.toFixed(2)} TL / Dal (Paket: {(customPrice * 20).toFixed(0)} TL)
              </span>
            </div>

            {/* Quick Price Buttons */}
            <div className="grid grid-cols-4 gap-1.5 mb-2.5">
              {[5.0, 5.5, 6.0, 7.0].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePriceSave(p)}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    customPrice === p
                      ? 'bg-amber-500 border-amber-400 text-black shadow-md'
                      : 'bg-[#17181d] border-[#262832] text-neutral-400 hover:text-white'
                  }`}
                >
                  {p.toFixed(1)} TL
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="Örn: 6.25"
                className="flex-1 bg-[#17181d] border border-[#262832] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => handlePriceSave(customPrice)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold spring-click"
              >
                Kaydet
              </button>
            </div>
          </div>

          {/* Target Score */}
          <div className="p-3.5 rounded-2xl bg-[#121316] border border-[#262832]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" /> Günlük Hedef Puan
              </span>
              <span className="text-sm font-black text-white">{targetScore} P</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[80, 100, 120, 150].map((score) => (
                <button
                  key={score}
                  onClick={() => onUpdateTargetScore(score)}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    targetScore === score
                      ? 'bg-white text-black font-bold'
                      : 'bg-[#17181d] border-[#262832] text-neutral-400 hover:text-white'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Hour Setting (Night Owl support) */}
          <div className="p-3.5 rounded-2xl bg-[#121316] border border-[#262832]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Gün Sıfırlama Saati
              </span>
              <span className="text-xs font-semibold text-neutral-400">
                {resetHour === 4 ? 'Sabah 04:00 (Gece Baykuşu - Aktif)' : 'Gece 00:00 (Standart)'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateResetHour(4)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  resetHour === 4
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-[#17181d] border-[#262832] text-neutral-400 hover:text-white'
                }`}
              >
                04:00 Gece Kuşu
              </button>
              <button
                onClick={() => onUpdateResetHour(0)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  resetHour === 0
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-[#17181d] border-[#262832] text-neutral-400 hover:text-white'
                }`}
              >
                00:00 Gece Yarısı
              </button>
            </div>
          </div>

          {/* Sound Effects Toggle */}
          <div className="p-3.5 rounded-2xl bg-[#121316] border border-[#262832] flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-500" />}
              Dokunsal Ses Efektleri
            </span>
            <button
              onClick={onToggleSound}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                soundEnabled
                  ? 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60'
                  : 'bg-[#17181d] text-neutral-500 border-[#262832]'
              }`}
            >
              {soundEnabled ? 'Açık' : 'Kapalı'}
            </button>
          </div>

          {/* Backup & Restore (Offline-First) */}
          <div className="p-3.5 rounded-2xl bg-[#121316] border border-[#262832] space-y-2.5">
            <span className="text-xs font-bold text-neutral-300 block">
              Yerel Veri Yedekleme & Kurtarma (JSON)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExport}
                className="py-2.5 px-3 rounded-xl bg-[#17181d] hover:bg-[#202228] border border-[#262832] text-xs font-semibold text-neutral-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> JSON İndir
              </button>

              <label className="py-2.5 px-3 rounded-xl bg-[#17181d] hover:bg-[#202228] border border-[#262832] text-xs font-semibold text-neutral-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5" /> JSON Yükle
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
            {importStatus && (
              <p className="text-[11px] text-center font-medium">{importStatus}</p>
            )}
          </div>

          {/* Demo Data Seeder */}
          <div className="pt-2">
            <button
              onClick={() => {
                if (window.confirm('Geçmiş 30 gün için örnek rutin ve Terea verileri oluşturulsun mu?')) {
                  onSeedDemoData();
                  onClose();
                }
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-800/40 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> 30 Günlük Örnek Rutin & Terea Verisi Yükle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
