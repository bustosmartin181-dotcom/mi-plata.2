import React, { useState } from 'react';
import { AppState, CalculationResult } from '../types';
import { pesos, fraseDelDia, hoyISO } from '../lib/calculator';
import { Share2, Copy, Check, X } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  calculation: CalculationResult;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  state,
  calculation,
}) => {
  if (!isOpen) return null;

  const hoy = hoyISO();
  const c = calculation;
  const fecha = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const generateText = () => {
    let t = `💰 Mi Plata • ${fecha}\n`;
    t += `Presupuesto de hoy: ${pesos(c.quedaHoy + c.gastoHoy)}\n`;
    t += `Gasté hoy: ${pesos(c.gastoHoy)}\n`;
    t += `Me queda para hoy: ${pesos(c.quedaHoy)}\n`;
    if (c.manana !== null) {
      t += `Mañana tendré: ${pesos(c.manana)}\n`;
    }
    if (c.fondo.activo) {
      t += `🏦 Mi fondo de ahorro: ${pesos(c.fondo.totalConRend || 0)}\n`;
    }
    t += `Días para el próximo cobro: ${c.faltan}\n\n`;
    t += `“${fraseDelDia(hoy)}”`;
    return t;
  };

  const [text, setText] = useState(generateText());
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1A211D] p-5 shadow-2xl border border-[#E5DFD6] dark:border-[#2A332E] relative animate-in fade-in duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#6B756F] hover:bg-[#EDE8E0] dark:text-[#9AA59D] dark:hover:bg-[#1C221F] transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0] mb-1">
          Resumen para compartir
        </h3>
        <p className="text-xs text-[#6B756F] dark:text-[#9AA59D] mb-3">
          Puedes editar el mensaje antes de enviarlo por WhatsApp.
        </p>

        <textarea
          rows={7}
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full p-3 rounded-2xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-xs font-mono text-[#1A1F1C] dark:text-[#F0F2F0] outline-none mb-3"
        />

        <div className="flex gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <span>WhatsApp</span>
          </a>

          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#F5F1EB] dark:hover:bg-[#121614] transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
