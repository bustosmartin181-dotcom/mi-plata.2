import React, { useState } from 'react';
import { AppState, CalculationResult, ExpenseItem, GoalItem } from '../types';
import {
  pesos,
  totalIngresos,
  CATEGORIAS_INGRESO,
  resumenCuotas,
  aporteMensualSugerido,
  juntadoEnMeta,
  hoyISO,
  tieneCuotas,
} from '../lib/calculator';
import { launchMercadoPago } from '../lib/mercadopago';
import { Plus, Trash2, ExternalLink, Repeat, Edit3, Target, Calendar, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';

interface PlanViewProps {
  state: AppState;
  calculation: CalculationResult;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onSelectBillMP: (bill: ExpenseItem) => void;
}

export const PlanView: React.FC<PlanViewProps> = ({
  state,
  calculation,
  onUpdateState,
  onSelectBillMP,
}) => {
  const hoy = hoyISO();
  const c = calculation;
  const cuotas = resumenCuotas(state);

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection(prev => (prev === id ? null : id));
  };

  // Incomes Handlers
  const handleAddIncome = () => {
    onUpdateState(s => ({
      ...s,
      ingresos: [...(s.ingresos || []), { cat: CATEGORIAS_INGRESO[0], a: 0 }],
    }));
  };

  const handleRemoveIncome = (index: number) => {
    onUpdateState(s => ({
      ...s,
      ingresos: (s.ingresos || []).filter((_, i) => i !== index),
    }));
  };

  const handleUpdateIncome = (index: number, cat: string, a: number) => {
    onUpdateState(s => {
      const updated = [...(s.ingresos || [])];
      updated[index] = { cat, a };
      return { ...s, ingresos: updated };
    });
  };

  // Important Bills Handlers
  const handleAddBill = () => {
    onUpdateState(s => ({
      ...s,
      items: [
        ...(s.items || []),
        { n: '', a: 0, p: false, f: true, v: false, mpCategory: 'Servicios' },
      ],
    }));
  };

  const handleRemoveBill = (index: number) => {
    onUpdateState(s => ({
      ...s,
      items: (s.items || []).filter((_, i) => i !== index),
    }));
  };

  const handleUpdateBillField = (index: number, updates: Partial<ExpenseItem>) => {
    onUpdateState(s => {
      const updated = [...(s.items || [])];
      updated[index] = { ...updated[index], ...updates };
      return { ...s, items: updated };
    });
  };

  // Goals Handlers
  const handleAddGoal = () => {
    onUpdateState(s => ({
      ...s,
      metas: [...(s.metas || []), { id: Date.now(), n: 'Nueva meta', t: 0, g0: 0, f: '' }],
    }));
  };

  const handleRemoveGoal = (id: number) => {
    onUpdateState(s => ({
      ...s,
      metas: (s.metas || []).filter(m => m.id !== id),
    }));
  };

  const handleContributeToGoal = (metaId: number, amount: number) => {
    if (!amount) return;
    const meta = (state.metas || []).find(m => m.id === metaId);
    if (!meta) return;

    onUpdateState(s => ({
      ...s,
      spent: [
        ...(s.spent || []),
        { id: Date.now(), date: hoy, amt: amount, note: `🎯 ${meta.n}`, meta: meta.id },
      ],
    }));
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Overview Card */}
      <div className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm">
        <h2 className="font-display font-bold text-lg text-[#1A1F1C] dark:text-[#F0F2F0] mb-3">
          Resumen de tu Plan Mensual
        </h2>

        <div className="divide-y divide-[#E5DFD6]/60 dark:divide-[#2A332E]/60 text-xs">
          <div className="py-2 flex justify-between">
            <span className="text-[#6B756F] dark:text-[#9AA59D]">Total de Ingresos</span>
            <span className="font-bold text-[#1B6B4A] dark:text-[#3D9B6E]">
              {pesos(totalIngresos(state))}
            </span>
          </div>
          <div className="py-2 flex justify-between">
            <span className="text-[#6B756F] dark:text-[#9AA59D]">Gastos Importantes (Fijos / Facturas)</span>
            <span className="font-bold">{pesos(c.total)}</span>
          </div>
          <div className="py-2 flex justify-between">
            <span className="text-[#6B756F] dark:text-[#9AA59D]">Todavía pendientes de pago</span>
            <span className="font-bold text-amber-700 dark:text-amber-400">
              {pesos(c.porPagar)}
            </span>
          </div>
          <div className="py-2 flex justify-between">
            <span className="text-[#6B756F] dark:text-[#9AA59D]">Disponible para el día a día</span>
            <span className="font-display font-bold text-sm text-[#1B6B4A] dark:text-[#3D9B6E]">
              {pesos(c.disp)}
            </span>
          </div>
          <div className="py-2 flex justify-between">
            <span className="text-[#6B756F] dark:text-[#9AA59D]">Base por día ({c.dias} días)</span>
            <span className="font-display font-extrabold text-base text-[#1B6B4A] dark:text-[#3D9B6E]">
              {pesos(c.base)}
            </span>
          </div>
        </div>
      </div>

      {/* Incomes Section */}
      <div className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0]">
              💵 Ingresos Mensuales
            </h3>
            <span className="text-xs text-[#6B756F] dark:text-[#9AA59D]">
              De dónde viene tu dinero cada mes
            </span>
          </div>
          <button
            onClick={handleAddIncome}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1B6B4A] text-white text-xs font-semibold hover:bg-[#145238] transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </div>

        <div className="space-y-2">
          {(state.ingresos || []).map((inc, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={inc.cat}
                onChange={e => handleUpdateIncome(index, e.target.value, inc.a)}
                className="flex-1 p-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-xs font-medium text-[#1A1F1C] dark:text-[#F0F2F0]"
              >
                {CATEGORIAS_INGRESO.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <input
                type="text"
                inputMode="decimal"
                value={inc.a || ''}
                placeholder="Monto ($)"
                onChange={e => {
                  const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0;
                  handleUpdateIncome(index, inc.cat, val);
                }}
                className="w-28 p-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-xs font-semibold text-right text-[#1A1F1C] dark:text-[#F0F2F0]"
              />

              <button
                onClick={() => handleRemoveIncome(index)}
                className="p-2 text-[#6B756F] hover:text-[#C23B3B] transition"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Important Expenses / Bills (Pagar al cobrar) */}
      <div className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0]">
              🧾 Pagar al cobrar / Facturas
            </h3>
            <span className="text-xs text-[#6B756F] dark:text-[#9AA59D]">
              Alquiler, servicios, tarjetas con Mercado Pago
            </span>
          </div>
          <button
            onClick={handleAddBill}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1B6B4A] text-white text-xs font-semibold hover:bg-[#145238] transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </div>

        <div className="space-y-3">
          {(state.items || []).map((item, index) => (
            <div
              key={index}
              className="p-3.5 rounded-2xl bg-[#F5F1EB] dark:bg-[#121614] border border-[#E5DFD6] dark:border-[#2A332E] space-y-2"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Concepto (ej: Edenor)"
                  value={item.n}
                  onChange={e => handleUpdateBillField(index, { n: e.target.value })}
                  className="flex-1 p-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-white dark:bg-[#1A211D] text-xs font-semibold text-[#1A1F1C] dark:text-[#F0F2F0]"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Monto ($)"
                  value={item.a || ''}
                  onChange={e => {
                    const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0;
                    handleUpdateBillField(index, { a: val });
                  }}
                  className="w-24 p-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-white dark:bg-[#1A211D] text-xs font-bold text-right text-[#1A1F1C] dark:text-[#F0F2F0]"
                />
                <button
                  onClick={() => handleRemoveBill(index)}
                  className="p-1.5 text-[#6B756F] hover:text-[#C23B3B]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Status and Direct Mercado Pago Redirection Button */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  onClick={() => handleUpdateBillField(index, { p: !item.p })}
                  className={`px-3 py-1 rounded-full font-semibold transition ${
                    item.p
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {item.p ? '✓ Pagado' : '⏳ Pendiente'}
                </button>

                <div className="flex items-center gap-1.5">
                  {/* Mercado Pago Trigger Button */}
                  <button
                    onClick={() => onSelectBillMP(item)}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#009EE3] hover:bg-[#0089C7] text-white font-bold text-[11px] shadow-sm transition"
                  >
                    <span>Mercado Pago</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Installment Badge or Setting */}
              <div className="flex items-center gap-4 text-[11px] text-[#6B756F] dark:text-[#9AA59D] pt-1">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.f !== false}
                    onChange={e => handleUpdateBillField(index, { f: e.target.checked })}
                    className="w-3.5 h-3.5 accent-[#1B6B4A]"
                  />
                  <span>🔁 Repetir</span>
                </label>

                {tieneCuotas(item) ? (
                  <span className="font-semibold text-[#1B6B4A] dark:text-[#3D9B6E]">
                    Cuota {item.q!.actual} de {item.q!.total}
                  </span>
                ) : (
                  <button
                    onClick={() =>
                      handleUpdateBillField(index, { q: { actual: 1, total: 12 } })
                    }
                    className="hover:underline"
                  >
                    + Es en cuotas
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Installments Card */}
      {cuotas.length > 0 && (
        <div className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm">
          <h3 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0] mb-2">
            📆 Cuotas en curso
          </h3>
          <div className="space-y-2 text-xs divide-y divide-[#E5DFD6]/60 dark:divide-[#2A332E]/60">
            {cuotas.map((q, idx) => (
              <div key={idx} className="pt-2 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{q.n}</div>
                  <div className="text-[11px] text-[#6B756F] dark:text-[#9AA59D]">
                    Cuota {q.actual}/{q.total} • {pesos(q.monto)} c/u
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#1B6B4A] dark:text-[#3D9B6E]">
                    Faltan {q.restantes}
                  </span>
                  <div className="text-[10px] text-[#6B756F] dark:text-[#9AA59D]">
                    Resto: {pesos(q.restoTotal)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Savings Goals (Metas) */}
      <div className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0]">
              🎯 Metas de Ahorro
            </h3>
            <span className="text-xs text-[#6B756F] dark:text-[#9AA59D]">
              Juntá para tus objetivos paso a paso
            </span>
          </div>
          <button
            onClick={handleAddGoal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1B6B4A] text-white text-xs font-semibold hover:bg-[#145238] transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva meta</span>
          </button>
        </div>

        <div className="space-y-4">
          {(state.metas || []).map((meta, index) => {
            const juntado = juntadoEnMeta(state, meta);
            const porcentaje = meta.t > 0 ? Math.min(100, (juntado / meta.t) * 100) : 0;
            const sugerido = aporteMensualSugerido(state, meta, hoy);

            return (
              <div
                key={meta.id}
                className="p-4 rounded-2xl bg-[#F5F1EB] dark:bg-[#121614] border border-[#E5DFD6] dark:border-[#2A332E] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={meta.n}
                    onChange={e => {
                      const updated = [...(state.metas || [])];
                      updated[index].n = e.target.value;
                      onUpdateState(s => ({ ...s, metas: updated }));
                    }}
                    className="font-bold text-sm bg-transparent border-b border-[#E5DFD6] dark:border-[#2A332E] focus:border-[#1B6B4A] text-[#1A1F1C] dark:text-[#F0F2F0] outline-none"
                  />
                  <button
                    onClick={() => handleRemoveGoal(meta.id)}
                    className="text-[#6B756F] hover:text-[#C23B3B]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2.5 rounded-full bg-[#E5DFD6] dark:bg-[#2A332E] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#1B6B4A] dark:bg-[#3D9B6E] transition-all duration-300"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#6B756F] dark:text-[#9AA59D]">
                    <span>
                      Juntado: <strong>{pesos(juntado)}</strong>
                    </span>
                    <span>
                      Objetivo: <strong>{pesos(meta.t)}</strong> ({Math.round(porcentaje)}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Monto objetivo ($)"
                    value={meta.t || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0;
                      const updated = [...(state.metas || [])];
                      updated[index].t = val;
                      onUpdateState(s => ({ ...s, metas: updated }));
                    }}
                    className="w-1/2 p-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-white dark:bg-[#1A211D] text-xs font-semibold text-[#1A1F1C] dark:text-[#F0F2F0]"
                  />

                  <input
                    type="date"
                    value={meta.f || ''}
                    onChange={e => {
                      const updated = [...(state.metas || [])];
                      updated[index].f = e.target.value;
                      onUpdateState(s => ({ ...s, metas: updated }));
                    }}
                    className="w-1/2 p-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-white dark:bg-[#1A211D] text-xs text-[#1A1F1C] dark:text-[#F0F2F0]"
                  />
                </div>

                {sugerido > 0 && (
                  <p className="text-[11px] text-[#1B6B4A] dark:text-[#3D9B6E] font-medium">
                    Para llegar a la fecha objetivo, juntá aprox. <strong>{pesos(sugerido)}</strong> por mes.
                  </p>
                )}

                {/* Quick Contribute Button */}
                <div className="pt-1 flex gap-2">
                  <button
                    onClick={() => handleContributeToGoal(meta.id, sugerido || 10000)}
                    className="w-full py-2 rounded-xl bg-[#1B6B4A] text-white text-xs font-bold shadow-sm transition"
                  >
                    Aportar {pesos(sugerido || 10000)} a esta meta
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
