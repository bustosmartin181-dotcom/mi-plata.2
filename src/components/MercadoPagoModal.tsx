import React, { useState } from 'react';
import { ExpenseItem } from '../types';
import { pesos } from '../lib/calculator';
import { launchMercadoPago, COMMON_SERVICES } from '../lib/mercadopago';
import { ExternalLink, Copy, Check, QrCode, ArrowRight, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MercadoPagoModalProps {
  bill: ExpenseItem | null;
  onClose: () => void;
  onUpdateBill: (updatedBill: ExpenseItem) => void;
  onMarkAsPaid: (bill: ExpenseItem) => void;
}

export const MercadoPagoModal: React.FC<MercadoPagoModalProps> = ({
  bill,
  onClose,
  onUpdateBill,
  onMarkAsPaid,
}) => {
  if (!bill) return null;

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(bill.n);
  const [amount, setAmount] = useState(bill.a.toString());
  const [barcode, setBarcode] = useState(bill.barcode || '');
  const [alias, setAlias] = useState(bill.mpAlias || '');
  const [link, setLink] = useState(bill.mpLink || '');
  const [category, setCategory] = useState(bill.mpCategory || 'Servicios');

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePay = () => {
    launchMercadoPago(bill, () => {
      // Optional callback after triggering Mercado Pago
    });
  };

  const handleConfirmPaid = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#009EE3', '#1B6B4A', '#25D366', '#FFD700'],
      });
    } catch (_) {}

    onMarkAsPaid(bill);
    onClose();
  };

  const handleSaveEdit = () => {
    const updated: ExpenseItem = {
      ...bill,
      n: name.trim() || 'Gasto',
      a: parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0,
      barcode: barcode.trim(),
      mpAlias: alias.trim(),
      mpLink: link.trim(),
      mpCategory: category,
    };
    onUpdateBill(updated);
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1A211D] p-5 shadow-2xl border border-[#E5DFD6] dark:border-[#2A332E] relative my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#6B756F] hover:bg-[#EDE8E0] dark:text-[#9AA59D] dark:hover:bg-[#1C221F] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Mercado Pago Brand Accent */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#009EE3]/15 flex items-center justify-center text-[#009EE3]">
            <img
              src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.5/mercadopago/favicon.svg"
              alt="Mercado Pago"
              className="w-7 h-7"
              onError={e => {
                // Fallback to stylized SVG
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-display font-extrabold text-xl text-[#009EE3]">MP</span>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#009EE3]">
              Mercado Pago Facturas
            </span>
            <h2 className="font-display font-bold text-xl text-[#1A1F1C] dark:text-[#F0F2F0] leading-tight">
              {bill.n || 'Gasto Importante'}
            </h2>
          </div>
        </div>

        {editing ? (
          /* Edit Form */
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs text-[#6B756F] dark:text-[#9AA59D] block mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-sm p-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-[#1A1F1C] dark:text-[#F0F2F0]"
              />
            </div>
            <div>
              <label className="text-xs text-[#6B756F] dark:text-[#9AA59D] block mb-1">Monto ($)</label>
              <input
                type="text"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full text-sm p-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-[#1A1F1C] dark:text-[#F0F2F0]"
              />
            </div>
            <div>
              <label className="text-xs text-[#6B756F] dark:text-[#9AA59D] block mb-1">Código de Barra / Factura</label>
              <input
                type="text"
                placeholder="Número de factura o código de barra"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                className="w-full text-sm p-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-[#1A1F1C] dark:text-[#F0F2F0]"
              />
            </div>
            <div>
              <label className="text-xs text-[#6B756F] dark:text-[#9AA59D] block mb-1">Alias / CVU / CBU para transferir</label>
              <input
                type="text"
                placeholder="ej: alquiler.departamento.mp"
                value={alias}
                onChange={e => setAlias(e.target.value)}
                className="w-full text-sm p-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-[#1A1F1C] dark:text-[#F0F2F0]"
              />
            </div>
            <div>
              <label className="text-xs text-[#6B756F] dark:text-[#9AA59D] block mb-1">Link de pago directo (opcional)</label>
              <input
                type="url"
                placeholder="https://mpago.la/..."
                value={link}
                onChange={e => setLink(e.target.value)}
                className="w-full text-sm p-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-[#1A1F1C] dark:text-[#F0F2F0]"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2 rounded-xl bg-[#1B6B4A] text-white text-xs font-semibold"
              >
                Guardar
              </button>
            </div>
          </div>
        ) : (
          /* View Details */
          <>
            {/* Amount Banner */}
            <div className="bg-[#E6F2EC] dark:bg-[#1E3328] rounded-2xl p-4 mb-4 text-center">
              <span className="text-xs text-[#1B6B4A] dark:text-[#3D9B6E] font-medium block">
                Total a pagar
              </span>
              <div className="font-display font-extrabold text-3xl text-[#1B6B4A] dark:text-[#3D9B6E] mt-0.5">
                {pesos(bill.a)}
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    bill.p
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {bill.p ? '✓ Ya pagado' : '⏳ Pendiente de pago'}
                </span>
                {bill.dueDate && (
                  <span className="text-[11px] text-[#6B756F] dark:text-[#9AA59D]">
                    Vence: {bill.dueDate}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Copy Items: Barcode or Alias */}
            {(bill.barcode || bill.mpAlias || bill.mpLink) && (
              <div className="space-y-2 mb-4 bg-[#F5F1EB] dark:bg-[#121614] p-3 rounded-2xl border border-[#E5DFD6] dark:border-[#2A332E]">
                {bill.barcode && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6B756F] dark:text-[#9AA59D] truncate max-w-[170px]">
                      Código: {bill.barcode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(bill.barcode!, 'barcode')}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-[#1A211D] text-[11px] font-semibold border border-[#E5DFD6] dark:border-[#2A332E]"
                    >
                      {copiedField === 'barcode' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copiar
                        </>
                      )}
                    </button>
                  </div>
                )}

                {bill.mpAlias && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6B756F] dark:text-[#9AA59D] truncate max-w-[170px]">
                      Alias: {bill.mpAlias}
                    </span>
                    <button
                      onClick={() => copyToClipboard(bill.mpAlias!, 'alias')}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-[#1A211D] text-[11px] font-semibold border border-[#E5DFD6] dark:border-[#2A332E]"
                    >
                      {copiedField === 'alias' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copiar
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Main Mercado Pago Action Button */}
            <div className="space-y-2 mb-4">
              <button
                onClick={handlePay}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#009EE3] hover:bg-[#0089C7] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#009EE3]/30 transition transform active:scale-95"
              >
                <span>Derivar a Mercado Pago</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                onClick={handleConfirmPaid}
                className={`w-full py-2.5 px-4 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  bill.p
                    ? 'border border-[#E5DFD6] dark:border-[#2A332E] text-[#6B756F] dark:text-[#9AA59D]'
                    : 'bg-[#1B6B4A] hover:bg-[#145238] text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{bill.p ? 'Marcar como pendiente' : 'Ya lo pagué (marcar como pagado)'}</span>
              </button>
            </div>

            {/* Footer with Edit Details */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E5DFD6] dark:border-[#2A332E] text-xs">
              <button
                onClick={() => setEditing(true)}
                className="text-[#1B6B4A] dark:text-[#3D9B6E] font-medium hover:underline"
              >
                Editar código de barra o alias
              </button>
              <span className="text-[11px] text-[#6B756F] dark:text-[#9AA59D] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Seguro
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
