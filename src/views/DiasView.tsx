import React, { useState } from 'react';
import { AppState, CalculationResult } from '../types';
import {
  pesos,
  diasDelPeriodo,
  objetivoDiario,
  hoyISO,
  diaYMes,
  aNumero,
} from '../lib/calculator';
import { Target, Calendar as CalendarIcon, TrendingDown, ArrowUpRight, Check, X } from 'lucide-react';

interface DiasViewProps {
  state: AppState;
  calculation: CalculationResult;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
}

export const DiasView: React.FC<DiasViewProps> = ({ state, calculation, onUpdateState }) => {
  const hoy = hoyISO();
  const c = calculation;
  const dias = diasDelPeriodo(state, hoy);
  const o = objetivoDiario(state, hoy);

  const [targetInput, setTargetInput] = useState(state.objetivo?.toString() || '');
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);

  const handleApplyTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const num = aNumero(targetInput);
    onUpdateState(s => ({
      ...s,
      objetivo: num,
      objetivoDesde: num > 0 ? hoy : '',
      recal: num > 0 ? { day: c.hoyIdx, base: num, obj: true } : (s.recal?.obj ? null : s.recal),
    }));
  };

  // Clicked Day Expense Details
  const selectedDayExpenses = selectedDayIso
    ? (state.spent || []).filter(e => e.date === selectedDayIso)
    : [];

  const selectedDayData = selectedDayIso ? dias.find(d => d.iso === selectedDayIso) : null;

  return (
    <div className="space-y-4 pb-24">
      {/* Target Daily Goal Simulator */}
      <div className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-[#1B6B4A] dark:text-[#3D9B6E]" />
          <h2 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0]">
            🎯 Mi objetivo por día
          </h2>
        </div>

        <p className="text-xs text-[#6B756F] dark:text-[#9AA59D] mb-3 leading-relaxed">
          Define cuánto quieres gastar por día. La app calculará automáticamente cuánto dinero te sobrará al final del mes para ahorrar.
        </p>

        <form onSubmit={handleApplyTarget} className="flex gap-2 mb-3">
          <input
            type="text"
            inputMode="decimal"
            placeholder="ej: 12000"
            value={targetInput}
            onChange={e => setTargetInput(e.target.value)}
            className="flex-1 p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-xs font-semibold text-[#1A1F1C] dark:text-[#F0F2F0]"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#1B6B4A] hover:bg-[#145238] text-white text-xs font-bold transition shadow-sm"
          >
            Fijar objetivo
          </button>
        </form>

        {o && (
          <div className="p-3.5 rounded-2xl bg-[#E6F2EC] dark:bg-[#1E3328] border border-[#1B6B4A]/20 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#6B756F] dark:text-[#9AA59D]">Si gastas por día:</span>
              <span className="font-bold font-display text-sm text-[#1B6B4A] dark:text-[#3D9B6E]">
                {pesos(o.obj)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6B756F] dark:text-[#9AA59D]">Te sobrará a fin de mes:</span>
              <span
                className={`font-bold font-display text-base ${
                  o.proyectado >= 0 ? 'text-[#1B6B4A] dark:text-[#3D9B6E]' : 'text-[#C23B3B]'
                }`}
              >
                {pesos(o.proyectado)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-[#6B756F] dark:text-[#9AA59D] pt-1 border-t border-[#1B6B4A]/10">
              <span>Máximo parejo posible por día:</span>
              <span className="font-semibold">{pesos(o.promedio)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Day by Day Calendar Table */}
      <div className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#1B6B4A] dark:text-[#3D9B6E]" />
            <h3 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0]">
              Día por día
            </h3>
          </div>
          <span className="text-xs text-[#6B756F] dark:text-[#9AA59D]">
            Día {c.hoyIdx + 1} de {c.dias}
          </span>
        </div>

        <p className="text-xs text-[#6B756F] dark:text-[#9AA59D] mb-3">
          Toca cualquier día para ver el detalle de gastos registrados.
        </p>

        {/* Table Header */}
        <div className="grid grid-cols-4 gap-2 text-[11px] font-bold text-[#6B756F] dark:text-[#9AA59D] pb-2 border-b border-[#E5DFD6] dark:border-[#2A332E]">
          <span>Día</span>
          <span className="text-right">Límite</span>
          <span className="text-right">Gasto</span>
          <span className="text-right">Sobra</span>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-[#E5DFD6]/60 dark:divide-[#2A332E]/60 text-xs">
          {dias.map(d => {
            const isToday = d.iso === hoy;
            const isPast = d.i <= c.hoyIdx || d.gasto > 0;

            return (
              <div
                key={d.iso}
                onClick={() => setSelectedDayIso(d.iso)}
                className={`grid grid-cols-4 gap-2 py-2 cursor-pointer rounded-xl px-1 hover:bg-[#F5F1EB] dark:hover:bg-[#121614] transition ${
                  isToday
                    ? 'bg-[#E6F2EC] dark:bg-[#1E3328] font-bold text-[#1B6B4A] dark:text-[#3D9B6E]'
                    : ''
                }`}
              >
                <div className="truncate">
                  {d.dia.slice(0, 3)} {diaYMes(d.iso)}
                </div>
                <div className="text-right font-medium">{pesos(d.presupuesto)}</div>
                <div className="text-right font-medium">
                  {d.gasto > 0 ? pesos(d.gasto) : '-'}
                </div>
                <div
                  className={`text-right font-bold ${
                    isPast && d.sobra < 0
                      ? 'text-[#C23B3B]'
                      : isPast
                      ? 'text-[#1B6B4A] dark:text-[#3D9B6E]'
                      : 'text-[#6B756F] dark:text-[#9AA59D]'
                  }`}
                >
                  {isPast ? pesos(d.sobra) : '-'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Modal Details */}
      {selectedDayIso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1A211D] p-5 shadow-2xl border border-[#E5DFD6] dark:border-[#2A332E] relative animate-in fade-in duration-150">
            <button
              onClick={() => setSelectedDayIso(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#6B756F] hover:bg-[#EDE8E0] dark:text-[#9AA59D] dark:hover:bg-[#1C221F] transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0] mb-1">
              Detalle del {diaYMes(selectedDayIso)}
            </h3>
            {selectedDayData && (
              <p className="text-xs text-[#6B756F] dark:text-[#9AA59D] mb-4">
                Presupuesto asignado: <strong>{pesos(selectedDayData.presupuesto)}</strong>
              </p>
            )}

            {selectedDayExpenses.length === 0 ? (
              <p className="text-xs text-[#6B756F] dark:text-[#9AA59D] py-6 text-center">
                No hay gastos anotados en este día.
              </p>
            ) : (
              <div className="space-y-2 mb-4 divide-y divide-[#E5DFD6]/60 dark:divide-[#2A332E]/60">
                {selectedDayExpenses.map(exp => (
                  <div key={exp.id} className="pt-2 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-[#1A1F1C] dark:text-[#F0F2F0]">
                        {exp.note || exp.cat || 'Gasto'}
                      </div>
                      <div className="text-[11px] text-[#6B756F] dark:text-[#9AA59D]">
                        {exp.cat}
                      </div>
                    </div>
                    <span className="font-display font-bold text-sm text-[#1A1F1C] dark:text-[#F0F2F0]">
                      {pesos(exp.amt)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setSelectedDayIso(null)}
              className="w-full py-2.5 rounded-xl bg-[#1B6B4A] text-white text-xs font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
