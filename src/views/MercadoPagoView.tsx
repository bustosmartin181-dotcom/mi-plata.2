import React, { useState } from 'react';
import { ExpenseItem, AppState } from '../types';
import { pesos } from '../lib/calculator';
import { launchMercadoPago, COMMON_SERVICES } from '../lib/mercadopago';
import { CreditCard, ExternalLink, Plus, CheckCircle, Clock, AlertTriangle, Copy, Check, Sparkles } from 'lucide-react';

interface MercadoPagoViewProps {
  state: AppState;
  onSelectBill: (bill: ExpenseItem) => void;
  onAddBill: (bill: ExpenseItem) => void;
  onTogglePaid: (index: number) => void;
}

export const MercadoPagoView: React.FC<MercadoPagoViewProps> = ({
  state,
  onSelectBill,
  onAddBill,
  onTogglePaid,
}) => {
  const [filter, setFilter] = useState<'todos' | 'pendientes' | 'pagados'>('pendientes');
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // New bill state
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('Servicios');
  const [newBarcode, setNewBarcode] = useState('');
  const [newAlias, setNewAlias] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const items = state.items || [];
  const bills = items.map((item, index) => ({ item, index })).filter(({ item }) => item.n || item.a);

  const pendingBills = bills.filter(({ item }) => !item.p);
  const paidBills = bills.filter(({ item }) => item.p);

  const totalPending = pendingBills.reduce((sum, { item }) => sum + item.a, 0);

  const filteredBills =
    filter === 'pendientes' ? pendingBills : filter === 'pagados' ? paidBills : bills;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newAmount.replace(/\./g, '').replace(',', '.')) || 0;
    if (!newName.trim() || !amt) return;

    const newBill: ExpenseItem = {
      n: newName.trim(),
      a: amt,
      p: false,
      f: true,
      mpCategory: newCategory,
      barcode: newBarcode.trim() || undefined,
      mpAlias: newAlias.trim() || undefined,
      dueDate: newDueDate || undefined,
    };

    onAddBill(newBill);
    setNewName('');
    setNewAmount('');
    setNewBarcode('');
    setNewAlias('');
    setNewDueDate('');
    setShowAddForm(false);
  };

  const selectPreset = (service: (typeof COMMON_SERVICES)[0]) => {
    setNewName(service.name);
    setNewCategory(service.category);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Mercado Pago Brand Banner */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-[#009EE3] to-[#0074A6] text-white shadow-lg shadow-[#009EE3]/25">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-sm">
              MP
            </div>
            <span className="font-display font-extrabold text-lg tracking-tight">
              Mercado Pago Facturas
            </span>
          </div>
          <button
            onClick={() =>
              window.open('https://www.mercadopago.com.ar/services', '_blank', 'noopener,noreferrer')
            }
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-xs font-semibold backdrop-blur-sm transition"
          >
            <span>Hub de Servicios</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <p className="text-xs text-white/90 leading-relaxed mb-3">
          Paga tus facturas de luz, gas, internet, alquiler o tarjetas directamente derivando a Mercado Pago con un solo toque.
        </p>

        <div className="pt-3 border-t border-white/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-white/80 block">Total pendiente este mes</span>
            <div className="font-display font-black text-2xl tracking-tight">
              {pesos(totalPending)}
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white text-[#009EE3] hover:bg-white/95 text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar factura</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex rounded-2xl p-1 bg-[#EDE8E0] dark:bg-[#1C221F] border border-[#E5DFD6] dark:border-[#2A332E]">
        <button
          onClick={() => setFilter('pendientes')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
            filter === 'pendientes'
              ? 'bg-white dark:bg-[#1A211D] text-[#1A1F1C] dark:text-[#F0F2F0] shadow-sm'
              : 'text-[#6B756F] dark:text-[#9AA59D]'
          }`}
        >
          Pendientes ({pendingBills.length})
        </button>
        <button
          onClick={() => setFilter('pagados')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
            filter === 'pagados'
              ? 'bg-white dark:bg-[#1A211D] text-[#1A1F1C] dark:text-[#F0F2F0] shadow-sm'
              : 'text-[#6B756F] dark:text-[#9AA59D]'
          }`}
        >
          Ya Pagados ({paidBills.length})
        </button>
        <button
          onClick={() => setFilter('todos')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
            filter === 'todos'
              ? 'bg-white dark:bg-[#1A211D] text-[#1A1F1C] dark:text-[#F0F2F0] shadow-sm'
              : 'text-[#6B756F] dark:text-[#9AA59D]'
          }`}
        >
          Todos ({bills.length})
        </button>
      </div>

      {/* Add New Bill Form */}
      {showAddForm && (
        <div className="rounded-3xl p-5 bg-white dark:bg-[#1A211D] border border-[#009EE3]/40 shadow-sm animate-in fade-in duration-150">
          <h3 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0] mb-2 flex items-center justify-between">
            <span>Nueva factura para Mercado Pago</span>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-xs text-[#6B756F] hover:text-[#C23B3B]"
            >
              Cerrar
            </button>
          </h3>

          {/* Quick presets */}
          <div className="mb-3">
            <span className="text-[11px] text-[#6B756F] dark:text-[#9AA59D] block mb-1">
              Sugerencias rápidas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SERVICES.slice(0, 6).map(svc => (
                <button
                  key={svc.name}
                  type="button"
                  onClick={() => selectPreset(svc)}
                  className="px-2 py-0.5 rounded-lg border border-[#E5DFD6] dark:border-[#2A332E] text-[11px] hover:bg-[#E6F2EC] dark:hover:bg-[#1E3328]"
                >
                  {svc.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateBill} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nombre (ej: Edenor)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-1/2 p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-xs text-[#1A1F1C] dark:text-[#F0F2F0]"
                required
              />
              <input
                type="text"
                inputMode="decimal"
                placeholder="Monto ($)"
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
                className="w-1/2 p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-xs font-semibold text-[#1A1F1C] dark:text-[#F0F2F0]"
                required
              />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Código de barra o factura"
                value={newBarcode}
                onChange={e => setNewBarcode(e.target.value)}
                className="w-1/2 p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-xs text-[#1A1F1C] dark:text-[#F0F2F0]"
              />
              <input
                type="text"
                placeholder="Alias o CBU para transferir"
                value={newAlias}
                onChange={e => setNewAlias(e.target.value)}
                className="w-1/2 p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-xs text-[#1A1F1C] dark:text-[#F0F2F0]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#6B756F] dark:text-[#9AA59D] block mb-1">
                Fecha de vencimiento (para recordatorios push)
              </label>
              <input
                type="date"
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-xs text-[#1A1F1C] dark:text-[#F0F2F0]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#009EE3] hover:bg-[#0089C7] text-white text-xs font-bold transition shadow-sm"
            >
              Guardar factura
            </button>
          </form>
        </div>
      )}

      {/* Bill List */}
      {filteredBills.length === 0 ? (
        <div className="rounded-3xl p-8 bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E] text-center">
          <CreditCard className="w-10 h-10 mx-auto text-[#6B756F] mb-2 opacity-50" />
          <h4 className="font-display font-bold text-sm text-[#1A1F1C] dark:text-[#F0F2F0]">
            No hay facturas en esta lista
          </h4>
          <p className="text-xs text-[#6B756F] dark:text-[#9AA59D] mt-1 max-w-xs mx-auto">
            {filter === 'pendientes'
              ? '¡Felicitaciones! No tienes facturas pendientes de pago en este momento.'
              : 'Agrega tus gastos importantes para tener acceso directo con Mercado Pago.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBills.map(({ item, index }) => (
            <div
              key={index}
              className={`rounded-3xl p-4 bg-white dark:bg-[#1A211D] border transition-all ${
                item.p
                  ? 'border-[#E5DFD6] dark:border-[#2A332E] opacity-75'
                  : 'border-[#009EE3]/40 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-[#1A1F1C] dark:text-[#F0F2F0]">
                      {item.n || 'Gasto'}
                    </span>
                    {item.dueDate && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-medium">
                        Vence: {item.dueDate}
                      </span>
                    )}
                  </div>
                  <div className="font-display font-extrabold text-xl text-[#1B6B4A] dark:text-[#3D9B6E] mt-0.5">
                    {pesos(item.a)}
                  </div>
                </div>

                {/* Status Badge */}
                <button
                  onClick={() => onTogglePaid(index)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                    item.p
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'border border-[#E5DFD6] dark:border-[#2A332E] text-[#6B756F] dark:text-[#9AA59D]'
                  }`}
                  title="Cambiar estado pagado / pendiente"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{item.p ? 'Pagado' : 'Pendiente'}</span>
                </button>
              </div>

              {/* Barcode / Alias Quick Copy if present */}
              {(item.barcode || item.mpAlias) && (
                <div className="flex items-center gap-2 mb-3 text-[11px] text-[#6B756F] dark:text-[#9AA59D]">
                  {item.barcode && (
                    <button
                      onClick={() => handleCopy(item.barcode!)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#F5F1EB] dark:bg-[#121614] border border-[#E5DFD6] dark:border-[#2A332E]"
                    >
                      {copiedText === item.barcode ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span className="truncate max-w-[130px]">Cód: {item.barcode}</span>
                    </button>
                  )}
                  {item.mpAlias && (
                    <button
                      onClick={() => handleCopy(item.mpAlias!)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#F5F1EB] dark:bg-[#121614] border border-[#E5DFD6] dark:border-[#2A332E]"
                    >
                      {copiedText === item.mpAlias ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span className="truncate max-w-[130px]">Alias: {item.mpAlias}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Action Buttons: Dedicated Mercado Pago Button */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#E5DFD6]/60 dark:border-[#2A332E]/60">
                <button
                  onClick={() => launchMercadoPago(item)}
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-[#009EE3] hover:bg-[#0089C7] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                >
                  <span>Pagar en Mercado Pago</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onSelectBill(item)}
                  className="py-2.5 px-3 rounded-2xl border border-[#E5DFD6] dark:border-[#2A332E] text-xs font-semibold hover:bg-[#F5F1EB] dark:hover:bg-[#121614] transition"
                  title="Ver detalles, QR y editar"
                >
                  Detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
