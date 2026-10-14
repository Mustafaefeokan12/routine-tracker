import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { hashPin, verifyPin } from '../utils/crypto';
import { triggerHaptic } from '../utils/sound';

export default function PinLockScreen({
  isOpen = true,
  storedPinHash,
  mode = 'unlock', // 'unlock' | 'setup'
  onSuccess,
  onCancel,
  title,
  subtitle
}) {
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [setupStep, setSetupStep] = useState(1); // 1 = enter new, 2 = confirm
  const [isShaking, setIsShaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setFailedAttempts(0);
          setErrorMessage('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleKeyPress = useCallback((digit) => {
    if (lockoutSeconds > 0) return;
    triggerHaptic(15);
    setErrorMessage('');

    setPin((prev) => {
      if (prev.length >= 4) return prev;
      return prev + digit;
    });
  }, [lockoutSeconds]);

  const handleDelete = useCallback(() => {
    if (lockoutSeconds > 0) return;
    triggerHaptic(10);
    setPin((prev) => prev.slice(0, -1));
  }, [lockoutSeconds]);

  // Handle PIN verification when 4 digits are completed
  useEffect(() => {
    if (pin.length !== 4) return;

    const processPin = async () => {
      if (mode === 'unlock') {
        const isValid = await verifyPin(pin, storedPinHash);
        if (isValid) {
          triggerHaptic([20, 40, 20]);
          setFailedAttempts(0);
          setPin('');
          if (onSuccess) onSuccess();
        } else {
          // Trigger shake animation & failure lockout
          setIsShaking(true);
          triggerHaptic([40, 60, 40]);
          setTimeout(() => setIsShaking(false), 500);

          const nextAttempts = failedAttempts + 1;
          setFailedAttempts(nextAttempts);
          setPin('');

          if (nextAttempts >= 3) {
            setLockoutSeconds(30);
            setErrorMessage('Çok sayıda hatalı deneme. 30 saniye bekleyin.');
          } else {
            setErrorMessage(`Hatalı PIN (${nextAttempts}/3)`);
          }
        }
      } else if (mode === 'setup') {
        if (setupStep === 1) {
          setFirstPin(pin);
          setPin('');
          setSetupStep(2);
        } else if (setupStep === 2) {
          if (pin === firstPin) {
            triggerHaptic([20, 50, 20]);
            const newHash = await hashPin(pin);
            setPin('');
            setFirstPin('');
            setSetupStep(1);
            if (onSuccess) onSuccess(newHash);
          } else {
            setIsShaking(true);
            triggerHaptic([40, 60, 40]);
            setTimeout(() => setIsShaking(false), 500);
            setErrorMessage('PIN kodları eşleşmedi. Tekrar deneyin.');
            setPin('');
            setFirstPin('');
            setSetupStep(1);
          }
        }
      }
    };

    processPin();
  }, [pin, mode, storedPinHash, failedAttempts, setupStep, firstPin, onSuccess]);

  if (!isOpen) return null;

  const displayTitle = title || (
    mode === 'setup'
      ? (setupStep === 1 ? 'Yeni PIN Oluştur' : 'PIN Kodunu Onayla')
      : 'Güvenlik Kilidi'
  );

  const displaySubtitle = subtitle || (
    mode === 'setup'
      ? (setupStep === 1 ? '4 haneli güvenlik PIN kodunuzu girin' : 'Doğrulamak için 4 haneli PIN kodunuzu tekrar girin')
      : 'Uygulamaya erişmek için 4 haneli PIN kodunuzu girin'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0b0e]/95 backdrop-blur-3xl px-4 animate-fade-in select-none">
      <style>{`
        @keyframes pinShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-12px); }
          40%, 80% { transform: translateX(12px); }
        }
        .animate-pin-shake {
          animation: pinShake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>

      {/* Cancel button if applicable (in settings setup mode) */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="absolute top-6 right-6 p-2.5 rounded-full bg-[#17181d] border border-[#262832] text-neutral-400 hover:text-white spring-click"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="w-full max-w-xs flex flex-col items-center">
        {/* Icon & Heading */}
        <div className="w-14 h-14 rounded-2xl bg-[#17181d] border border-[#262832] flex items-center justify-center text-white mb-4 shadow-xl">
          {mode === 'setup' ? (
            setupStep === 1 ? <Lock className="w-6 h-6 text-emerald-400" /> : <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          ) : (
            <Lock className="w-6 h-6 text-neutral-200" />
          )}
        </div>

        <h2 className="text-lg font-bold text-white tracking-tight text-center">
          {displayTitle}
        </h2>
        <p className="text-xs text-neutral-400 text-center mt-1 max-w-[260px]">
          {displaySubtitle}
        </p>

        {/* 4-Dot Indicators */}
        <div className={`flex items-center justify-center gap-4 my-7 ${isShaking ? 'animate-pin-shake' : ''}`}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                  isFilled
                    ? 'bg-white border-white scale-110 shadow-sm shadow-white/40'
                    : 'border-neutral-600 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {/* Error or Lockout Message */}
        {lockoutSeconds > 0 ? (
          <div className="mb-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/50 border border-red-800/40 text-red-400 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Kilitlendi: {lockoutSeconds} sn sonra tekrar deneyin</span>
          </div>
        ) : errorMessage ? (
          <p className="text-xs font-semibold text-rose-400 mb-4 animate-fade-in text-center">
            {errorMessage}
          </p>
        ) : (
          <div className="h-6 mb-4" />
        )}

        {/* Apple Minimalist Numeric Keypad */}
        <div className={`grid grid-cols-3 gap-3.5 w-full max-w-[280px] ${lockoutSeconds > 0 ? 'opacity-40 pointer-events-none' : ''}`}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(String(digit))}
              className="w-18 h-18 rounded-full bg-[#181920] hover:bg-[#22242c] active:bg-[#2b2d38] border border-[#262832]/80 text-2xl font-light text-white flex items-center justify-center mx-auto transition-all spring-click shadow-md"
            >
              {digit}
            </button>
          ))}

          {/* Bottom Row: Cancel/Empty, 0, Delete */}
          <div className="w-18 h-18 flex items-center justify-center mx-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-xs font-medium text-neutral-400 hover:text-white spring-click"
              >
                Vazgeç
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="w-18 h-18 rounded-full bg-[#181920] hover:bg-[#22242c] active:bg-[#2b2d38] border border-[#262832]/80 text-2xl font-light text-white flex items-center justify-center mx-auto transition-all spring-click shadow-md"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            aria-label="Sil"
            className="w-18 h-18 rounded-full bg-[#181920]/60 hover:bg-[#22242c] active:bg-[#2b2d38] border border-[#262832]/80 text-neutral-300 hover:text-white flex items-center justify-center mx-auto transition-all spring-click"
          >
            <Delete className="w-6 h-6 stroke-[1.75]" />
          </button>
        </div>
      </div>
    </div>
  );
}
