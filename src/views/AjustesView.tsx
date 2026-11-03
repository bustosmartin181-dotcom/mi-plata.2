import React, { useState } from 'react';
import { AppState, CalculationResult } from '../types';
import {
  datosExportar,
  xlsxExportar,
  pdfExportar,
  descargarArchivo,
  descargarTexto,
} from '../lib/export';
import { requestNotificationPermission, sendLocalNotification } from '../lib/notifications';
import {
  Moon,
  Sun,
  Shield,
  Lock,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Bell,
  RefreshCw,
  Sparkles,
  Smartphone,
  Save,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface AjustesViewProps {
  state: AppState;
  calculation: CalculationResult;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onOpenE2EE: () => void;
  onOpenFlutterInfo: () => void;
  onToggleDemo: () => void;
}

export const AjustesView: React.FC<AjustesViewProps> = ({
  state,
  calculation,
  onUpdateState,
  onOpenE2EE,
  onOpenFlutterInfo,
  onToggleDemo,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinMsg, setPinMsg] = useState<string | null>(null);

  const [jsonBackupText, setJsonBackupText] = useState('');
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);

  // Appearance Theme Handlers
  const handleSetTheme = (tema: 'auto' | 'claro' | 'oscuro') => {
    onUpdateState(s => ({ ...s, tema }));
  };

  const handleSetColor = (color: 'verde' | 'azul' | 'violeta' | 'naranja' | 'rojo') => {
    onUpdateState(s => ({ ...s, color }));
  };

  // PIN Handlers
  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(pinInput)) {
      setPinMsg('El PIN debe contener entre 4 y 8 números.');
      return;
    }
    if (pinInput !== pinConfirm) {
      setPinMsg('Los números de PIN no coinciden.');
      return;
    }

    onUpdateState(s => ({ ...s, pin: pinInput, pinApp: true }));
    setPinMsg('¡PIN guardado y activado!');
    setPinInput('');
    setPinConfirm('');
  };

  const handleRemovePin = () => {
    onUpdateState(s => {
      const copy = { ...s };
      delete copy.pin;
      delete copy.salt;
      return copy;
    });
    setPinMsg('PIN desactivado.');
  };

  // Notifications
  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        onUpdateState(s => ({ ...s, recOn: true, billRemindersOn: true }));
        sendLocalNotification(
          'Recordatorios activados',
          'Te avisaremos sobre tus gastos diarios y vencimientos importantes.'
        );
      } else {
        alert('Debes permitir las notificaciones en el navegador de tu teléfono.');
      }
    } else {
      onUpdateState(s => ({ ...s, recOn: false, billRemindersOn: false }));
    }
  };

  // Export handlers
  const handleExportXlsx = () => {
    try {
      const d = datosExportar(state, new Date().toISOString().slice(0, 10));
      const zipBytes = xlsxExportar(d);
      descargarArchivo(
        `mi-plata-${d.hoy}.xlsx`,
        zipBytes,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    } catch (e) {
      alert('Error al generar el archivo Excel.');
    }
  };

  const handleExportPdf = () => {
    try {
      const d = datosExportar(state, new Date().toISOString().slice(0, 10));
      const pdfBytes = pdfExportar(d);
      descargarArchivo(`mi-plata-${d.hoy}.pdf`, pdfBytes, 'application/pdf');
    } catch (e) {
      alert('Error al generar el archivo PDF.');
    }
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(state, null, 2);
    descargarTexto(`mi-plata-copia-${new Date().toISOString().slice(0, 10)}.json`, jsonStr);
  };

  const handleRestoreJson = () => {
    try {
      const parsed = JSON.parse(jsonBackupText);
      if (!parsed || !parsed.items) {
        throw new Error('Estructura de copia inválida');
      }
      onUpdateState(() => parsed);
      setRestoreMsg('¡Datos restaurados con éxito!');
      setJsonBackupText('');
    } catch (_) {
      setRestoreMsg('El texto pegado no es un JSON válido de Mi Plata.');
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Demo Mode Notice */}
      {state.demo && (
        <div className="rounded-3xl p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <div>
            <span className="font-bold block">🎬 Modo Demo Activo</span>
            <span>Estás viendo datos de prueba. Tus datos reales volverán al salir.</span>
          </div>
          <button
            onClick={onToggleDemo}
            className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold"
          >
            Salir de Demo
          </button>
        </div>
      )}

      {/* Appearance & Dark Mode */}
      <div className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm">
        <h3 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0] mb-3">
          🌙 Apariencia y Modo Oscuro
        </h3>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-[#6B756F] dark:text-[#9AA59D] block mb-1.5">
              Tema de la interfaz
            </label>
            <div className="flex rounded-2xl p-1 bg-[#EDE8E0] dark:bg-[#1C221F] border border-[#E5DFD6] dark:border-[#2A332E]">
              {(['auto', 'claro', 'oscuro'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => handleSetTheme(t)}
                  className={`flex-1 py-1.5 rounded-xl font-semibold capitalize transition ${
                    state.tema === t
                      ? 'bg-white dark:bg-[#1A211D] text-[#1A1F1C] dark:text-[#F0F2F0] shadow-sm'
                      : 'text-[#6B756F] dark:text-[#9AA59D]'
                  }`}
                >
                  {t === 'auto' ? 'Automático' : t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[#6B756F] dark:text-[#9AA59D] block mb-1.5">
              Color de acento
            </label>
            <div className="flex gap-2">
              {[
                { id: 'verde', bg: '#1B6B4A' },
                { id: 'azul', bg: '#0B5CAD' },
                { id: 'violeta', bg: '#6D3FC0' },
                { id: 'naranja', bg: '#C2570C' },
                { id: 'rojo', bg: '#B42318' },
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSetColor(c.id as any)}
                  className={`w-9 h-9 rounded-full transition-transform ${
                    state.color === c.id ? 'scale-110 ring-2 ring-offset-2 ring-[#1B6B4A]' : ''
                  }`}
                  style={{ backgroundColor: c.bg }}
                  title={c.id}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* End-to-End Encryption & PIN Security */}
      <div className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm">
        <h3 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0] mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          <span>Seguridad y Privacidad E2EE</span>
        </h3>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-2xl bg-[#E6F2EC] dark:bg-[#1E3328] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#1B6B4A] dark:text-[#3D9B6E] block">
                Encriptación Extremo a Extremo
              </span>
              <span className="text-[11px] text-[#6B756F] dark:text-[#9AA59D]">
                {state.e2eeEnabled
                  ? 'Activa: datos cifrados con AES-GCM 256'
                  : 'Desactivada: datos sincronizados en texto plano'}
              </span>
            </div>
            <button
              onClick={onOpenE2EE}
              className="px-3 py-1.5 rounded-xl bg-[#1B6B4A] text-white font-bold text-xs shadow-sm"
            >
              Configurar E2EE
            </button>
          </div>

          {/* PIN Setup */}
          <div className="pt-2 border-t border-[#E5DFD6]/60 dark:border-[#2A332E]/60">
            <span className="font-bold text-[#1A1F1C] dark:text-[#F0F2F0] block mb-1">
              PIN de Acceso
            </span>
            <p className="text-[#6B756F] dark:text-[#9AA59D] mb-2">
              Bloquea la pantalla al abrir la app o al volver de otra aplicación.
            </p>

            {state.pin ? (
              <div className="flex items-center justify-between">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ PIN configurado
                </span>
                <button
                  onClick={handleRemovePin}
                  className="px-3 py-1 rounded-xl border border-rose-300 text-rose-600 dark:text-rose-400 text-xs font-semibold"
                >
                  Desactivar PIN
                </button>
              </div>
            ) : (
              <form onSubmit={handleSavePin} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="PIN nuevo (4-8 dígitos)"
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value)}
                    className="w-1/2 p-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-xs font-mono text-center text-[#1A1F1C] dark:text-[#F0F2F0]"
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="Repetir PIN"
                    value={pinConfirm}
                    onChange={e => setPinConfirm(e.target.value)}
                    className="w-1/2 p-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-xs font-mono text-center text-[#1A1F1C] dark:text-[#F0F2F0]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-[#1B6B4A] text-white font-bold text-xs"
                >
                  Activar PIN
                </button>
              </form>
            )}
            {pinMsg && <p className="text-[11px] text-emerald-600 mt-1">{pinMsg}</p>}
          </div>
        </div>
      </div>

      {/* Mercado Pago Yield & Remunerated Account Simulator */}
      <div className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm">
        <h3 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0] mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#009EE3]" />
          <span>Rendimiento de Mercado Pago</span>
        </h3>

        <div className="space-y-3 text-xs">
          <p className="text-[#6B756F] dark:text-[#9AA59D] leading-relaxed">
            Tu dinero disponible suma automáticamente el interés diario que generaría en la cuenta remunerada de Mercado Pago (acreditación en días hábiles).
          </p>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!state.rendDispOn}
              onChange={e =>
                onUpdateState(s => ({
                  ...s,
                  rendDispOn: e.target.checked,
                  rendDispDesde: e.target.checked ? s.start : '',
                  rendTasa: s.rendTasa || 19,
                }))
              }
              className="w-4 h-4 accent-[#009EE3]"
            />
            <span className="font-semibold text-[#1A1F1C] dark:text-[#F0F2F0]">
              Sumar rendimiento estimado al dinero disponible
            </span>
          </label>

          {state.rendDispOn && (
            <div>
              <label className="text-[11px] text-[#6B756F] dark:text-[#9AA59D] block mb-1">
                Tasa Nominal Anual (TNA en %)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={state.rendTasa || 19}
                onChange={e => {
                  const val = parseFloat(e.target.value.replace(',', '.')) || 0;
                  onUpdateState(s => ({ ...s, rendTasa: val }));
                }}
                className="w-32 p-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-xs font-semibold text-[#1A1F1C] dark:text-[#F0F2F0]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Push Notifications & Bill Reminders */}
      <div className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm">
        <h3 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0] mb-3 flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-600" />
          <span>Recordatorios y Notificaciones Push</span>
        </h3>

        <div className="space-y-3 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!state.recOn}
              onChange={e => handleToggleNotifications(e.target.checked)}
              className="w-4 h-4 accent-[#1B6B4A]"
            />
            <span className="font-semibold text-[#1A1F1C] dark:text-[#F0F2F0]">
              Activar avisos de vencimientos de facturas y gastos
            </span>
          </label>

          <p className="text-[#6B756F] dark:text-[#9AA59D]">
            Te avisaremos automáticamente 2 días antes y el día del vencimiento de cada factura para que puedas derivarla a Mercado Pago a tiempo.
          </p>
        </div>
      </div>

      {/* Export & Backup */}
      <div className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm">
        <h3 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0] mb-3 flex items-center gap-2">
          <Download className="w-5 h-5 text-[#1B6B4A] dark:text-[#3D9B6E]" />
          <span>Exportar y Copias de Seguridad</span>
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex gap-2">
            <button
              onClick={handleExportXlsx}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel (.xlsx)</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center justify-center gap-1.5 transition"
            >
              <FileText className="w-4 h-4" />
              <span>PDF (.pdf)</span>
            </button>
          </div>

          <button
            onClick={handleExportJson}
            className="w-full py-2.5 rounded-2xl border border-[#E5DFD6] dark:border-[#2A332E] hover:bg-[#F5F1EB] dark:hover:bg-[#121614] font-semibold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Save className="w-4 h-4" />
            <span>Descargar Copia JSON completa</span>
          </button>

          {/* Restore JSON input */}
          <div className="pt-2">
            <textarea
              placeholder="Pega aquí el contenido de un respaldo JSON para restaurar..."
              rows={2}
              value={jsonBackupText}
              onChange={e => setJsonBackupText(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-[11px] font-mono text-[#1A1F1C] dark:text-[#F0F2F0]"
            />
            {jsonBackupText.trim() && (
              <button
                onClick={handleRestoreJson}
                className="mt-1.5 w-full py-2 rounded-xl bg-[#1B6B4A] text-white text-xs font-semibold"
              >
                Restaurar desde el texto
              </button>
            )}
            {restoreMsg && <p className="text-[11px] text-emerald-600 mt-1">{restoreMsg}</p>}
          </div>
        </div>
      </div>

      {/* Multiplatform APK & Install Info */}
      <div className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm">
        <h3 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0] mb-2 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[#1B6B4A] dark:text-[#3D9B6E]" />
          <span>Instalación y Creación del APK</span>
        </h3>
        <p className="text-xs text-[#6B756F] dark:text-[#9AA59D] mb-3">
          Instala la aplicación directamente en tu celular Android como WebAPK nativo, o consulta las instrucciones para compilar el APK con Bubblewrap, Capacitor o Flutter.
        </p>
        <button
          onClick={onOpenFlutterInfo}
          className="w-full py-2.5 rounded-2xl bg-[#1B6B4A] hover:bg-[#145238] text-white text-xs font-bold transition shadow-sm"
        >
          Ver métodos de instalación y comandos APK
        </button>
      </div>

      {/* Demo Switcher */}
      <div className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm text-center">
        <button
          onClick={onToggleDemo}
          className="text-xs font-semibold text-[#6B756F] dark:text-[#9AA59D] hover:underline"
        >
          {state.demo ? 'Salir del Modo Demo' : 'Activar Modo Demo con datos de ejemplo'}
        </button>
      </div>

      {/* Copyright Footer */}
      <div className="text-center text-xs text-[#6B756F] dark:text-[#9AA59D] pt-4 opacity-75">
        © 2026 Martín Enrique Bustos • Mi Plata Multiplataforma
      </div>
    </div>
  );
};
