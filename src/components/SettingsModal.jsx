import React, { useState } from 'react';
import { X, Moon, Sun, Monitor, Bell, Download, Trash2, Check, Settings as SettingsIcon } from 'lucide-react';
import { triggerHaptic, soundEngine } from '../utils/haptics';
import { exportAllData, clearAllExpenses } from '../db';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSetting,
  onDataReset,
  isDark
}) {
  const [income, setIncome] = useState(settings.monthlyIncome?.toString() || '28000');
  const [salaryDay, setSalaryDay] = useState(settings.salaryDay?.toString() || '20');
  const [iqosPrice, setIqosPrice] = useState(settings.iqosPrice?.toString() || '220');
  const [currentBalance, setCurrentBalance] = useState(settings.currentBalance?.toString() || '7500');
  const [theme, setTheme] = useState(settings.theme || 'dark');
  const [notificationEnabled, setNotificationEnabled] = useState(!!settings.dailyNotification);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleSaveFinancials = () => {
    triggerHaptic('success');
    soundEngine.playSuccess();
    onUpdateSetting('monthlyIncome', Number(income) || 28000);
    onUpdateSetting('salaryDay', Math.min(31, Math.max(1, Number(salaryDay) || 20)));
    onUpdateSetting('iqosPrice', Number(iqosPrice) || 220);
    onUpdateSetting('currentBalance', Number(currentBalance) || 7500);
    onUpdateSetting('balanceSetDate', settings.balanceSetDate || '2026-11-04');
    onClose();
  };

  const handleThemeChange = (newTheme) => {
    triggerHaptic('selection');
    setTheme(newTheme);
    onUpdateSetting('theme', newTheme);
  };

  const handleToggleNotification = async () => {
    triggerHaptic('selection');
    if (!notificationEnabled) {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setNotificationEnabled(true);
          onUpdateSetting('dailyNotification', true);
          new Notification('Budget', {
            body: 'Gün sonu bütçe bildirimleri aktif edildi! (Her akşam 22:00)',
            icon: './icon.svg'
          });
        } else {
          alert('Bildirim izni verilmedi. Tarayıcı ayarlarından bildirimlere izin vermelisiniz.');
        }
      } else {
        alert('Bu tarayıcı bildirimleri desteklemiyor.');
      }
    } else {
      setNotificationEnabled(false);
      onUpdateSetting('dailyNotification', false);
    }
  };

  const handleExport = async () => {
    triggerHaptic('light');
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = async () => {
    triggerHaptic('warning');
    await clearAllExpenses();
    onDataReset();
    setShowConfirmReset(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative w-full max-w-md rounded-3xl p-6 transition-all max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl border ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-800 text-neutral-300">
              <SettingsIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Ayarlar</h2>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Bütçe, Tema ve Standart Fiyatlar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full spring-tap ${
              isDark ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-neutral-100 text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5">
          {/* 1. Finansal Temel Bilgiler */}
          <div className="space-y-3">
            <h3 className={`text-xs font-bold uppercase tracking-wider px-1 ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              Bütçe Ayarları
            </h3>

            <div className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-neutral-800/40 border-neutral-800' : 'bg-neutral-50 border-neutral-200/80'
            }`}>
              <div>
                <label className={`text-xs font-semibold block mb-1 ${
                  isDark ? 'text-neutral-300' : 'text-neutral-700'
                }`}>
                  Mevcut Kalan Nakit (20 Kasım'a Kadar) (₺)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold num-tabular outline-none ${
                    isDark
                      ? 'bg-neutral-900 border border-neutral-700 text-white focus:border-cyan-500'
                      : 'bg-white border border-neutral-300 text-neutral-900 focus:border-cyan-600'
                  }`}
                />
                <span className={`text-[10px] block mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  20 Kasım'a kadar günlük harcaman bu bakiye üzerinden hesaplanır (469 ₺/gün). 20 Kasım'da 28.000 ₺'ye sıfırlanır.
                </span>
              </div>

              <div>
                <label className={`text-xs font-semibold block mb-1 ${
                  isDark ? 'text-neutral-300' : 'text-neutral-700'
                }`}>
                  Aylık Standart Gelir (20'sinde Yenilenen) (₺)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={income}
                  onChange={(e) => setIncome(e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold num-tabular outline-none ${
                    isDark
                      ? 'bg-neutral-900 border border-neutral-700 text-white focus:border-cyan-500'
                      : 'bg-white border border-neutral-300 text-neutral-900 focus:border-cyan-600'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-semibold block mb-1 ${
                    isDark ? 'text-neutral-300' : 'text-neutral-700'
                  }`}>
                    Maaş Günü (Döngü)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={salaryDay}
                    onChange={(e) => setSalaryDay(e.target.value.replace(/\D/g, ''))}
                    placeholder="20"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold num-tabular outline-none ${
                      isDark
                        ? 'bg-neutral-900 border border-neutral-700 text-white focus:border-cyan-500'
                        : 'bg-white border border-neutral-300 text-neutral-900 focus:border-cyan-600'
                    }`}
                  />
                  <span className={`text-[10px] block mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    Her ayın {salaryDay || 20}'sinde sıfırlanır
                  </span>
                </div>

                <div>
                  <label className={`text-xs font-semibold block mb-1 ${
                    isDark ? 'text-neutral-300' : 'text-neutral-700'
                  }`}>
                    IQOS Paket Fiyatı (₺)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={iqosPrice}
                    onChange={(e) => setIqosPrice(e.target.value.replace(/\D/g, ''))}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold num-tabular outline-none ${
                      isDark
                        ? 'bg-neutral-900 border border-neutral-700 text-white focus:border-cyan-500'
                        : 'bg-white border border-neutral-300 text-neutral-900 focus:border-cyan-600'
                    }`}
                  />
                  <span className={`text-[10px] block mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    Butona basınca işlenen tutar
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Tema Seçimi */}
          <div className="space-y-3">
            <h3 className={`text-xs font-bold uppercase tracking-wider px-1 ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              Görünüm & Tema
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border spring-tap ${
                  theme === 'dark'
                    ? isDark
                      ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
                      : 'bg-neutral-900 text-white border-neutral-900 font-bold'
                    : isDark
                      ? 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="text-xs">Saf Koyu</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border spring-tap ${
                  theme === 'light'
                    ? isDark
                      ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
                      : 'bg-white text-neutral-900 border-neutral-400 shadow-sm font-bold'
                    : isDark
                      ? 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span className="text-xs">Açık</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border spring-tap ${
                  theme === 'system'
                    ? isDark
                      ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
                      : 'bg-white text-neutral-900 border-neutral-400 shadow-sm font-bold'
                    : isDark
                      ? 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Monitor className="w-5 h-5" />
                <span className="text-xs">Sistem</span>
              </button>
            </div>
          </div>

          {/* 3. Gün Sonu Bildirimi */}
          <div className="space-y-3">
            <h3 className={`text-xs font-bold uppercase tracking-wider px-1 ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              Bildirim
            </h3>

            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-neutral-800/40 border-neutral-800' : 'bg-neutral-50 border-neutral-200/80'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">22:00 Bütçe Özeti</h4>
                  <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Günün karda/aşma durumunu bildirir
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleNotification}
                className={`w-12 h-7 rounded-full p-1 transition-colors spring-tap ${
                  notificationEnabled ? 'bg-emerald-500' : (isDark ? 'bg-neutral-700' : 'bg-neutral-300')
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  notificationEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          {/* 4. Veri Yönetimi & Dışa Aktarma */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleExport}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-bold spring-tap flex items-center justify-center gap-2 border ${
                isDark
                  ? 'bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:text-white'
                  : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Verileri Yedekle (JSON İndir)</span>
            </button>

            {showConfirmReset ? (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2">
                <p className="text-xs font-semibold text-rose-500">
                  Tüm harcamalar silinecek. Emin misiniz?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResetData}
                    className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold spring-tap"
                  >
                    Evet, Hepsini Sil
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(false)}
                    className="flex-1 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-bold spring-tap"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="w-full py-2.5 px-4 rounded-2xl text-xs font-semibold text-rose-500 hover:text-rose-400 spring-tap transition-colors"
              >
                Harcama Geçmişini Sıfırla
              </button>
            )}
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSaveFinancials}
            className={`w-full py-3.5 rounded-2xl font-bold text-base spring-tap flex items-center justify-center gap-2 shadow-sm transition-all ${
              isDark
                ? 'bg-white text-black hover:bg-neutral-200'
                : 'bg-neutral-900 text-white hover:bg-black'
            }`}
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>Ayarları Kaydet</span>
          </button>
        </div>
      </div>
    </div>
  );
}
