import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { hashVerification } from '../lib/crypto';

interface E2EEModalProps {
  isOpen: boolean;
  onClose: () => void;
  e2eeEnabled: boolean;
  onSaveE2EE: (enabled: boolean, passphrase: string) => Promise<boolean>;
}

export const E2EEModal: React.FC<E2EEModalProps> = ({
  isOpen,
  onClose,
  e2eeEnabled,
  onSaveE2EE,
}) => {
  if (!isOpen) return null;

  const [enabled, setEnabled] = useState(e2eeEnabled);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (enabled) {
      if (passphrase.length < 6) {
        setError('La contraseña maestra debe tener al menos 6 caracteres.');
        return;
      }
      if (passphrase !== confirmPassphrase) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    }

    setLoading(true);
    try {
      const ok = await onSaveE2EE(enabled, passphrase);
      if (ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1500);
      } else {
        setError('Error al configurar la encriptación. Intenta nuevamente.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1A211D] p-5 shadow-2xl border border-[#E5DFD6] dark:border-[#2A332E] relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#6B756F] hover:bg-[#EDE8E0] dark:text-[#9AA59D] dark:hover:bg-[#1C221F] transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-[#1A1F1C] dark:text-[#F0F2F0]">
              Encriptación Extremo a Extremo
            </h2>
            <span className="text-[11px] text-[#6B756F] dark:text-[#9AA59D]">
              Seguridad Zero-Knowledge (AES-GCM 256)
            </span>
          </div>
        </div>

        <p className="text-xs text-[#6B756F] dark:text-[#9AA59D] leading-relaxed mb-4">
          Al activar la encriptación de extremo a extremo, tus números, gastos y cuentas se cifran en tu dispositivo antes de viajar a la nube. Ni Google ni nadie puede leer tus finanzas sin tu contraseña.
        </p>

        {error && (
          <div className="flex items-center gap-2 p-2.5 mb-3 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-2.5 mb-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>¡Configuración guardada exitosamente!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] hover:bg-[#F5F1EB] dark:hover:bg-[#121614] transition">
            <input
              type="checkbox"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#1B6B4A]"
            />
            <span className="text-xs font-semibold text-[#1A1F1C] dark:text-[#F0F2F0]">
              Habilitar encriptación E2EE
            </span>
          </label>

          {enabled && (
            <>
              <div>
                <label className="text-[11px] text-[#6B756F] dark:text-[#9AA59D] block mb-1">
                  Contraseña Maestra / PIN
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={passphrase}
                  onChange={e => setPassphrase(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-[#1A1F1C] dark:text-[#F0F2F0]"
                  required={enabled}
                />
              </div>

              <div>
                <label className="text-[11px] text-[#6B756F] dark:text-[#9AA59D] block mb-1">
                  Repetir Contraseña Maestra
                </label>
                <input
                  type="password"
                  placeholder="Confirma la contraseña"
                  value={confirmPassphrase}
                  onChange={e => setConfirmPassphrase(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-[#1A1F1C] dark:text-[#F0F2F0]"
                  required={enabled}
                />
              </div>

              <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl">
                ⚠️ Importante: Si olvidas esta contraseña maestra, nadie podrá recuperar tus datos cifrados. Guárdala en un lugar seguro.
              </p>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] text-xs font-semibold hover:bg-[#EDE8E0] dark:hover:bg-[#1C221F] transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#1B6B4A] hover:bg-[#145238] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Aplicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
