import React, { useState } from 'react';
import { AppState, CalculationResult, ExpenseItem, DailyExpense } from '../types';
import {
  pesos,
  pesosConCentavos,
  saludoSegunHora,
  fraseDelDia,
  hoyISO,
  CATEGORIAS_GASTO,
  semaforo,
  rachaEnVerde,
  diaYMes,
  aNumero,
} from '../lib/calculator';
import { Share2, Plus, ArrowRight, ShieldCheck, TrendingUp, Sparkles, AlertCircle, Edit2, Trash2 } from 'lucide-react';

interface HoyViewProps {
  state: AppState;
  calculation: CalculationResult;
  onAddExpense: (expense: Omit<DailyExpense, 'id'>) => void;
  onEditExpense: (expense: DailyExpense) => void;
  onDeleteExpense: (id: number) => void;
  onOpenShare: () => void;
  onUseFund: (amount: number, note: string, type: 'hoy' | 'cubre') => void;
  onPayBillMP: (bill: ExpenseItem) => void;
}

export const HoyView: React.FC<HoyViewProps> = ({
  state,
  calculation,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onOpenShare,
  onUseFund,
  onPayBillMP,
}) => {
  const hoy = hoyISO();
  const c = calculation;
  const [clase, mensajeSemaforo] = semaforo(c, state);

  // Expense form state
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(hoy);
  const [category, setCategory] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewAll, setViewAll] = useState(false);

  // Fund withdrawal dialog
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [fundNote, setFundNote] = useState('');
  const [fundPurpose, setFundPurpose] = useState<'hoy' | 'cubre'>('hoy');

  const presupuestoTotal = c.quedaHoy + c.gastoHoy;
  const porcentajeGastado = presupuestoTotal > 0 ? Math.min(100, (c.gastoHoy / presupuestoTotal) * 100) : 100;
  const porcentajeRestante = Math.max(0, Math.min(100, 100 - porcentajeGastado));

  // Stroke math for circular ring
  const circleRadius = 38;
  const circlePerimeter = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circlePerimeter - (circlePerimeter * porcentajeRestante) / 100;

  const racha = rachaEnVerde(state, hoy);

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const num = aNumero(amount);
    if (!num) return;

    if (editingId) {
      onEditExpense({
        id: editingId,
        amt: num,
        note: note.trim(),
        cat: category || undefined,
        date,
      });
      setEditingId(null);
    } else {
      onAddExpense({
        amt: num,
        note: note.trim(),
        cat: category || undefined,
        date,
      });
    }

    setAmount('');
    setNote('');
    setCategory('');
    setDate(hoy);
  };

  const handleStartEdit = (exp: DailyExpense) => {
    setEditingId(exp.id);
    setAmount(exp.amt.toString());
    setNote(exp.note || '');
    setCategory(exp.cat || '');
    setDate(exp.date);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setNote('');
    setCategory('');
    setDate(hoy);
  };

  const handleWithdrawFund = (e: React.FormEvent) => {
    e.preventDefault();
    const num = aNumero(fundAmount);
    if (!num) return;
    onUseFund(num, fundNote.trim() || 'Uso del fondo', fundPurpose);
    setFundAmount('');
    setFundNote('');
    setShowFundModal(false);
  };

  // Check pending bills with due dates close to today
  const pendingImportantBills = (state.items || []).filter(i => !i.p && (i.n || i.a));

  const sortedExpenses = [...(state.spent || [])].sort(
    (a, b) => b.date.localeCompare(a.date) || b.id - a.id
  );
  const visibleExpenses = viewAll ? sortedExpenses : sortedExpenses.slice(0, 5);

  return (
    <div className="space-y-4 pb-24">
      {/* Greeting and Quote */}
      <div className="px-1 pt-1 flex items-start justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-[#1A1F1C] dark:text-[#F0F2F0]">
            {saludoSegunHora(new Date().getHours())}
            {state.nombre ? `, ${state.nombre}` : ''}
          </h2>
          <p className="text-xs text-[#6B756F] dark:text-[#9AA59D] italic mt-0.5 max-w-xs">
            “{fraseDelDia(hoy)}”
          </p>
        </div>

        <button
          onClick={onOpenShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E5DFD6] dark:border-[#2A332E] text-xs font-semibold text-[#1B6B4A] dark:text-[#3D9B6E] hover:bg-[#E6F2EC] dark:hover:bg-[#1E3328] transition"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Compartir</span>
        </button>
      </div>

      {/* Main Budget Hero Card */}
      <div className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm">
        <div className="flex items-center justify-between text-xs text-[#6B756F] dark:text-[#9AA59D] font-medium mb-1">
          <span>Te queda para hoy</span>
          {state.rendDispOn && state.rendTasa && (
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Rinde {state.rendTasa}% en MP
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 my-2">
          <div>
            <div
              className={`font-display font-extrabold text-4xl tracking-tight leading-none ${
                clase === 'neg'
                  ? 'text-[#C23B3B]'
                  : clase === 'warn'
                  ? 'text-[#B86E1E]'
                  : 'text-[#1B6B4A] dark:text-[#3D9B6E]'
              }`}
            >
              {pesosConCentavos(c.quedaHoy)}
            </div>
            <p className="text-xs text-[#6B756F] dark:text-[#9AA59D] mt-2">
              Presupuesto: {pesos(presupuestoTotal)} • Gastaste: {pesos(c.gastoHoy)}
            </p>
          </div>

          {/* Progress Circular Ring */}
          <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={circleRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-[#E5DFD6] dark:text-[#2A332E]"
              />
              <circle
                cx="50"
                cy="50"
                r={circleRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circlePerimeter}
                strokeDashoffset={strokeDashoffset}
                className={
                  clase === 'neg'
                    ? 'text-[#C23B3B]'
                    : clase === 'warn'
                    ? 'text-[#B86E1E]'
                    : 'text-[#1B6B4A] dark:text-[#3D9B6E]'
                }
              />
            </svg>
            <span className="absolute font-bold text-xs font-display">
              {Math.round(porcentajeRestante)}%
            </span>
          </div>
        </div>

        {/* Tomorrow Projection Banner */}
        {c.manana !== null && (
          <div className="pt-3 mt-3 border-t border-[#E5DFD6]/60 dark:border-[#2A332E]/60 flex items-center justify-between text-xs">
            <span className="text-[#6B756F] dark:text-[#9AA59D]">Mañana tendrás:</span>
            <span
              className={`font-bold font-display ${
                c.manana < 0 ? 'text-[#C23B3B]' : 'text-[#1A1F1C] dark:text-[#F0F2F0]'
              }`}
            >
              {pesosConCentavos(c.manana)}
            </span>
          </div>
        )}

        {mensajeSemaforo && (
          <div
            className={`mt-2.5 p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
              clase === 'neg'
                ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
            }`}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{mensajeSemaforo}</span>
          </div>
        )}
      </div>

      {/* Quick Pending Bills alert with Mercado Pago Button */}
      {pendingImportantBills.length > 0 && (
        <div className="rounded-3xl p-4 bg-gradient-to-r from-[#009EE3]/10 to-transparent border border-[#009EE3]/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#009EE3] flex items-center gap-1">
              ⚡ Facturas y Gastos por Pagar ({pendingImportantBills.length})
            </span>
            <span className="text-[11px] text-[#6B756F] dark:text-[#9AA59D]">Mercado Pago</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-[#1A1F1C] dark:text-[#F0F2F0]">
                {pendingImportantBills[0].n}
              </div>
              <div className="text-xs text-[#6B756F] dark:text-[#9AA59D]">
                {pesos(pendingImportantBills[0].a)}
              </div>
            </div>
            <button
              onClick={() => onPayBillMP(pendingImportantBills[0])}
              className="px-3.5 py-1.5 rounded-xl bg-[#009EE3] hover:bg-[#0089C7] text-white text-xs font-bold shadow-sm transition"
            >
              Pagar en MP
            </button>
          </div>
        </div>
      )}

      {/* Expense Logging Form */}
      <div id="tarjeta-anotar" className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm">
        <h3 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0] mb-3">
          {editingId ? 'Editar gasto' : 'Anotar gasto de hoy'}
        </h3>

        <form onSubmit={handleSubmitExpense} className="space-y-3">
          <div className="flex gap-2">
            <input
              id="am"
              type="text"
              inputMode="decimal"
              placeholder="Monto ($)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-1/2 p-3 rounded-2xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-base font-semibold text-[#1A1F1C] dark:text-[#F0F2F0] outline-none focus:border-[#1B6B4A]"
              required
            />
            <input
              id="nt"
              type="text"
              placeholder="Detalle (ej: almuerzo)"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-1/2 p-3 rounded-2xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-sm text-[#1A1F1C] dark:text-[#F0F2F0] outline-none focus:border-[#1B6B4A]"
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIAS_GASTO.map(([emoji, catName]) => {
              const isSelected = category === catName;
              return (
                <button
                  type="button"
                  key={catName}
                  onClick={() => setCategory(isSelected ? '' : catName)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition ${
                    isSelected
                      ? 'bg-[#1B6B4A] text-white'
                      : 'bg-[#F5F1EB] dark:bg-[#121614] text-[#1A1F1C] dark:text-[#F0F2F0] border border-[#E5DFD6] dark:border-[#2A332E]'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{catName}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="p-2.5 rounded-2xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-xs text-[#1A1F1C] dark:text-[#F0F2F0] outline-none flex-1"
            />
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-[#1B6B4A] hover:bg-[#145238] text-white font-bold text-sm shadow-md transition"
            >
              {editingId ? 'Guardar cambios' : 'Anotar gasto'}
            </button>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="w-full py-2 rounded-xl text-xs font-semibold text-[#6B756F] dark:text-[#9AA59D]"
            >
              Cancelar edición
            </button>
          )}
        </form>
      </div>

      {/* Savings Fund (Modo Fondo) */}
      {c.fondo.activo && (
        <div className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6B756F] dark:text-[#9AA59D] mb-1">
            <span>Mi Fondo de Ahorro</span>
            {c.fondo.rendEnMP && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                En Mercado Pago
              </span>
            )}
          </div>
          <div className="font-display font-extrabold text-2xl text-[#1B6B4A] dark:text-[#3D9B6E]">
            {pesos(c.fondo.totalConRend || 0)}
          </div>
          <p className="text-xs text-[#6B756F] dark:text-[#9AA59D] mt-1">
            Este período: <strong>{pesos(c.fondo.ahorroPeriodo || 0)}</strong>
            {c.fondo.fondoPrev ? ` • De antes: ${pesos(c.fondo.fondoPrev)}` : ''}
          </p>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setShowFundModal(true)}
              className="px-3.5 py-1.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] text-xs font-semibold text-[#1B6B4A] dark:text-[#3D9B6E] hover:bg-[#E6F2EC] dark:hover:bg-[#1E3328]"
            >
              Retirar del fondo
            </button>
          </div>
        </div>
      )}

      {/* Green Streak Card */}
      {racha.ultimos.length > 0 && (
        <div className="rounded-3xl p-4 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-xs text-[#1A1F1C] dark:text-[#F0F2F0]">
              🔥 Racha en verde: {racha.racha} {racha.racha === 1 ? 'día' : 'días'}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            {racha.ultimos.map((ok, idx) => (
              <span
                key={idx}
                className={`w-5 h-5 rounded-full flex-shrink-0 ${
                  ok ? 'bg-[#1B6B4A]' : 'bg-[#C23B3B]'
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-[#6B756F] dark:text-[#9AA59D]">
            {racha.racha === 0
              ? 'Hoy podés empezar una racha: terminá el día dentro del presupuesto.'
              : racha.racha >= 7
              ? '¡Excelente! Una semana completa controlando tus gastos.'
              : 'Vas muy bien, seguí anotando día a día.'}
          </p>
        </div>
      )}

      {/* Recent Logged Expenses */}
      <div className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0]">
            Gastos anotados
          </h3>
          <span className="text-xs text-[#6B756F] dark:text-[#9AA59D]">
            Total: {pesos(c.gastoHoy)}
          </span>
        </div>

        {visibleExpenses.length === 0 ? (
          <p className="text-xs text-[#6B756F] dark:text-[#9AA59D] py-4 text-center">
            Todavía no anotaste gastos hoy. ¡Anota tu primer gasto arriba!
          </p>
        ) : (
          <div className="divide-y divide-[#E5DFD6]/60 dark:divide-[#2A332E]/60">
            {visibleExpenses.map(exp => (
              <div key={exp.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{exp.cat ? exp.cat.slice(0, 2) : '💸'}</span>
                  <div>
                    <div className="font-semibold text-[#1A1F1C] dark:text-[#F0F2F0]">
                      {exp.note || exp.cat || 'Gasto'}
                    </div>
                    <div className="text-[11px] text-[#6B756F] dark:text-[#9AA59D]">
                      {diaYMes(exp.date)} {exp.cat ? `• ${exp.cat}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-sm text-[#1A1F1C] dark:text-[#F0F2F0]">
                    {pesos(exp.amt)}
                  </span>
                  <button
                    onClick={() => handleStartEdit(exp)}
                    className="p-1 text-[#6B756F] hover:text-[#1B6B4A]"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteExpense(exp.id)}
                    className="p-1 text-[#6B756F] hover:text-[#C23B3B]"
                    title="Borrar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {sortedExpenses.length > 5 && (
          <button
            onClick={() => setViewAll(!viewAll)}
            className="w-full mt-3 py-2 text-xs font-semibold text-[#1B6B4A] dark:text-[#3D9B6E] border-t border-[#E5DFD6] dark:border-[#2A332E]"
          >
            {viewAll ? 'Ver solo los últimos 5' : `Ver todos (${sortedExpenses.length})`}
          </button>
        )}
      </div>

      {/* Fund Withdrawal Modal */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1A211D] p-5 shadow-2xl border border-[#E5DFD6] dark:border-[#2A332E]">
            <h3 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0] mb-3">
              Retirar de mi Fondo de Ahorro
            </h3>
            <form onSubmit={handleWithdrawFund} className="space-y-3">
              <div>
                <label className="text-xs text-[#6B756F] dark:text-[#9AA59D] block mb-1">Monto ($)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="ej: 15000"
                  value={fundAmount}
                  onChange={e => setFundAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-sm text-[#1A1F1C] dark:text-[#F0F2F0]"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-[#6B756F] dark:text-[#9AA59D] block mb-1">Motivo (opcional)</label>
                <input
                  type="text"
                  placeholder="ej: Imprevisto mecánico"
                  value={fundNote}
                  onChange={e => setFundNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-sm text-[#1A1F1C] dark:text-[#F0F2F0]"
                />
              </div>

              <div>
                <label className="text-xs text-[#6B756F] dark:text-[#9AA59D] block mb-1">Destino del dinero</label>
                <select
                  value={fundPurpose}
                  onChange={e => setFundPurpose(e.target.value as 'hoy' | 'cubre')}
                  className="w-full p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-xs text-[#1A1F1C] dark:text-[#F0F2F0]"
                >
                  <option value="hoy">Lo voy a gastar hoy (suma a mi límite de hoy)</option>
                  <option value="cubre">Cubre gastos ya hechos / cuadrar con banco (no suma a hoy)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFundModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#1B6B4A] text-white text-xs font-semibold"
                >
                  Confirmar retiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
