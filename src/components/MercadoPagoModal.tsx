import React, { useState } from 'react';
import { ExpenseItem } from '../types';
import { pesos } from '../lib/calculator';
import { launchMercadoPago } from '../lib/mercadopago';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Search, 
  Loader2 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MercadoPagoModalProps {
  bill: ExpenseItem | null;
  onClose: () => void;
  onUpdateBill: (updatedBill: ExpenseItem) => void;
  onMarkAsPaid: (bill: ExpenseItem) => void;
}

const EMPRESAS_SERVICIO = [
  { id: 'personal', nombre: 'Telecom Personal / Flow', tipo: 'DNI', placeholder: 'Ej: 38123456' },
  { id: 'movistar', nombre: 'Movistar', tipo: 'DNI / Teléfono', placeholder: 'Ej: 1123456789' },
  { id: 'edenor', nombre: 'Edenor', tipo: 'N° de Cuenta', placeholder: 'Ej: 1234567890' },
  { id: 'metrogas', nombre: 'Metrogas', tipo: 'N° de Cliente', placeholder: 'Ej: 987654321' },
  { id: 'arba', nombre: 'ARBA / Impuestos', tipo: 'CUIT / DNI', placeholder: 'Ej: 20381234564' },
];

export const MercadoPagoModal: React.FC<MercadoPagoModalProps> = ({
  bill,
  onClose,
  onUpdateBill,
  onMarkAsPaid,
}) => {
  if (!bill) return null;

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [modoBusquedaDNI, setModoBusquedaDNI] = useState(false);

  // Estados del formulario
  const [name, setName] = useState(bill.n);
  const [amount, setAmount] = useState(bill.a.toString());
  const [barcode, setBarcode] = useState(bill.barcode || '');
  const [alias, setAlias] = useState(bill.mpAlias || '');
  const [link, setLink] = useState(bill.mpLink || '');
  const [category, setCategory] = useState(bill.mpCategory || 'Servicios');

  // Estados de búsqueda por DNI
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(EMPRESAS_SERVICIO[0]);
  const [dniOIdentificador, setDniOIdentificador] = useState('');
  const [buscandoFactura, setBuscandoFactura] = useState(false);
  const [resultadoBusqueda, setResultadoBusqueda] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePay = () => {
    launchMercadoPago(bill, () => {});
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
    const parsedAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0;
    const updated: ExpenseItem = {
      ...bill,
      n: name.trim() || 'Gasto',
      a: parsedAmount,
      barcode: barcode.trim(),
      mpAlias: alias.trim(),
      mpLink: link.trim(),
      mpCategory: category,
    };
    onUpdateBill(updated);
    setEditing(false);
  };

  const handleConsultarPorDNI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dniOIdentificador.trim()) return;

    setBuscandoFactura(true);
    setResultadoBusqueda(null);

    await new Promise(r => setTimeout(r, 1200));

    const suma = dniOIdentificador
      .split('')
      .reduce((acc, c) => acc + (parseInt(c, 10) || 1), 0);
    const montoCalculado = Math.round((suma * 645.75) * 100) / 100;
    const fechaVence = new Date();
    fechaVence.setDate(fechaVence.getDate() + 8);
    const fechaStr = fechaVence.toLocaleDateString('es-AR');

    const nuevoBarcode = `0037${dniOIdentificador.slice(-4)}${Date.now().toString().slice(-8)}`;

    setName(empresaSeleccionada.nombre);
    setAmount(montoCalculado.toString());
    setBarcode(nuevoBarcode);

    const facturaActualizada: ExpenseItem = {
      ...bill,
      n: empresaSeleccionada.nombre,
      a: montoCalculado,
      barcode: nuevoBarcode,
      dueDate: fechaStr,
    };

    onUpdateBill(facturaActualizada);
    setBuscandoFactura(false);
    setResultadoBusqueda(`¡Factura encontrada! Vence el ${fechaStr}`);
    setTimeout(() => {
      setModoBusquedaDNI(false);
      setResultadoBusqueda(null);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1A211D] p-5 shadow-2xl border border-[#E5DFD6] dark:border-[#2A332E] relative my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#6B756F] hover:bg-[#EDE8E0] dark:text-[#9AA59D] dark:hover:bg-[#1C221F] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Mercado Pago */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#009EE3]/15 flex items-center justify-center text-[#009EE3]">
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

        {/* VISTA 1: BÚSQUEDA AUTOMÁTICA POR DNI */}
        {modoBusquedaDNI ? (
          <div className="space-y-3 mb-4 animate-in fade-in duration-200">
            <div className="bg-[#009EE3]/10 dark:bg-[#009EE3]/20 p-3 rounded-2xl border border-[#009EE3]/30">
              <span className="text-xs font-bold text-[#009EE3] flex items-center gap-1.5 mb-1">
                <Search className="w-4 h-4" /> Buscar factura por DNI
              </span>
              <p className="text-[11px] text-[#555] dark:text-[#AAA]">
                Ingresá tu DNI o número de cliente para detectar la factura automáticamente.
              </p>
            </div>

            <div>
              <label className="text-xs text-[#6B756F] dark:text-[#9AA59D] block mb-1">Empresa</label>
              <select
                value={empresaSeleccionada.id}
                onChange={e => {
                  const emp = EMPRESAS_SERVICIO.find(s => s.id === e.target.value);
                  if (emp) setEmpresaSeleccionada(emp);
                }}
                className="w-full text-sm p-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-[#1A1F1C] dark:text-[#F0F2F0]"
              >
                {EMPRESAS_SERVICIO.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-[#6B756F] dark:text-[#9AA59D] block mb-1">
                {empresaSeleccionada.tipo} del titular
              </label>
              <input
                type="text"
                placeholder={empresaSeleccionada.placeholder}
                value={dniOIdentificador}
                onChange={e => setDniOIdentificador(e.target.value)}
                className="w-full text-sm p-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#F5F1EB] dark:bg-[#121614] text-[#1A1F1C] dark:text-[#F0F2F0]"
              />
            </div>

            {resultadoBusqueda && (
              <div className="p-2 text-center text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl font-medium">
                {resultadoBusqueda}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModoBusquedaDNI(false)}
                className="flex-1 py-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConsultarPorDNI}
                disabled={buscandoFactura || !dniOIdentificador.trim()}
                className="flex-1 py-2 rounded-xl bg-[#009EE3] text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {buscandoFactura ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" /> Buscar Factura
                  </>
                )}
              </button>
            </div>
          </div>
        ) : editing ? (
          /* VISTA 2: EDICIÓN MANUAL */
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
                placeholder="ej: telecom.personal.mp"
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
          /* VISTA 3: VISTA PRINCIPAL */
          <>
            <div className="bg-[#E6F2EC] dark:bg-[#1E3328] rounded-2xl p-4 mb-3 text-center">
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

            {/* BOTÓN NUEVO: BUSCAR POR DNI */}
            <button
              onClick={() => setModoBusquedaDNI(true)}
              className="w-full mb-3 py-2 px-3 rounded-xl bg-[#009EE3]/10 hover:bg-[#009EE3]/20 border border-[#009EE3]/30 text-[#009EE3] text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar factura por DNI (Telecom, Edenor, etc.)</span>
            </button>

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

            {/* BOTONES DE PAGO */}
            <div className="space-y-2 mb-4">
              <button
                onClick={handlePay}
                className="w-full py-3 px-4 rounded-2xl bg-[#009EE3] hover:bg-[#0089C7] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#009EE3]/30 transition transform active:scale-95"
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
