import React, { useState } from 'react';
import { Lock, Delete } from 'lucide-react';

interface PinLockScreenProps {
  onUnlock: (enteredPin: string) => boolean;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length >= 8) return;
    const next = pin + digit;
    setPin(next);
    setError(false);
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleEnter = () => {
    const success = onUnlock(pin);
    if (!success) {
      setError(true);
      setPin('');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([200, 100, 200]); } catch (_) {}
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F5F1EB] dark:bg-[#121614] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-[#1B6B4A]/10 text-[#1B6B4A] dark:bg-[#3D9B6E]/20 dark:text-[#3D9B6E] flex items-center justify-center mb-4 shadow-sm">
        <Lock className="w-8 h-8" />
      </div>

      <h2 className="font-display font-extrabold text-2xl text-[#1A1F1C] dark:text-[#F0F2F0] mb-1">
        Mi Plata
      </h2>
      <p className="text-xs text-[#6B756F] dark:text-[#9AA59D] mb-6">
        Ingresa tu PIN de seguridad para acceder
      </p>

      {/* PIN Dots */}
      <div className="flex gap-3 mb-6">
        {[0, 1, 2, 3].map(idx => (
          <div
            key={idx}
            className={`w-3.5 h-3.5 rounded-full border transition-all ${
              pin.length > idx
                ? 'bg-[#1B6B4A] dark:bg-[#3D9B6E] border-[#1B6B4A]'
                : 'border-[#6B756F]/40'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-xs text-[#C23B3B] font-semibold mb-4 animate-shake">
          PIN incorrecto. Intenta de nuevo.
        </p>
      )}

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="w-full h-14 rounded-2xl bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] font-display font-bold text-xl text-[#1A1F1C] dark:text-[#F0F2F0] shadow-sm active:scale-95 transition"
          >
            {d}
          </button>
        ))}
        <button
          onClick={handleDelete}
          className="w-full h-14 rounded-2xl flex items-center justify-center text-[#6B756F] dark:text-[#9AA59D] active:scale-95 transition"
          title="Borrar dígito"
        >
          <Delete className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleDigit('0')}
          className="w-full h-14 rounded-2xl bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] font-display font-bold text-xl text-[#1A1F1C] dark:text-[#F0F2F0] shadow-sm active:scale-95 transition"
        >
          0
        </button>
        <button
          onClick={handleEnter}
          disabled={pin.length < 4}
          className="w-full h-14 rounded-2xl bg-[#1B6B4A] text-white font-bold text-sm disabled:opacity-40 shadow-sm active:scale-95 transition"
        >
          OK
        </button>
      </div>
    </div>
  );
};
