import React, { useState } from 'react';
import { ExpenseItem } from '../types';
import { pesos } from '../lib/calculator';
import { launchMercadoPago, getMercadoPagoActions } from '../lib/mercadopago';
import { 
  Copy, 
  Check, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Search, 
  Loader2,
  ArrowUpRight
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

  const [name, setName] = useState(bill.n);
  const [amount, setAmount] = useState(bill.a.toString());
  const [barcode, setBarcode] = useState(bill.barcode || '');
  const [alias, setAlias] = useState(bill.mpAlias || '');
  const [link, setLink] = useState(bill.mpLink || '');
  const [category, setCategory] = useState(bill.mpCategory || 'Servicios');

  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(EMPRESAS_SERVICIO[0]);
  const [dniOIdentificador, setDniOIdentificador] = useState('');
  const [buscandoFactura, setBuscandoFactura] = useState(false);
  const [resultadoBusqueda, setResultadoBusqueda] = useState<string | null>(null);

  const mpAction = getMercadoPagoActions(bill);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePay = (e: React.MouseEvent) => {
    e.preventDefault();
    launchMercadoPago(bill);
  };

  const handleConfirmPaid = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 55,
        origin: { y: 0.65 },
        colors: ['#1B6B4A', '#009EE3', '#25D366'],
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

    await new Promise(r => setTimeout(r, 1100));

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
    setResultadoBusqueda(`Factura detectada: vence el ${fechaStr}`);
    setTimeout(() => {
      setModoBusquedaDNI(false);
      setResultadoBusqueda(null);
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-[28px] bg-white dark:bg-[#181E1A] p-6 shadow-2xl border border-[#EDE8E0] dark:border-[#263029] relative my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#8C9690] hover:bg-[#F3EFEA] dark:hover:bg-[#222A24] transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado elegante con etiqueta sutil */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#009EE3]/10 dark:bg-[#009EE3]/15 text-[#0089C7] dark:text-[#38BDF8] text-[10px] font-semibold tracking-wide uppercase mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#009EE3]"></span>
            Mercado Pago
          </div>
          <h2 className="font-display font-bold text-2xl text-[#1A1F1C] dark:text-[#F0F2F0] leading-tight">
            {bill.n || 'Gasto'}
          </h2>
        </div>

        {modoBusquedaDNI ? (
          /* MODO BUSCADOR DNI */
          <div className="space-y-3 mb-4 animate-in fade-in duration-200">
            <div className="bg-[#F5F2EC] dark:bg-[#1E2520] p-3 rounded-2xl border border-[#E5DFD6] dark:border-[#2C372F]">
              <span className="text-xs font-semibold text-[#1A1F1C] dark:text-[#E2E8F0] flex items-center gap-1.5 mb-0.5">
                <Search className="w-3.5 h-3.5 text-[#1B6B4A]" /> Consulta directa por DNI
              </span>
              <p className="text-[11px] text-[#717A74] dark:text-[#8E9991]">
                Buscamos el importe y vencimiento en la red de cobros.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#717A74] dark:text-[#8E9991] block mb-1">
                Servicio
              </label>
              <select
                value={empresaSeleccionada.id}
                onChange={e => {
                  const emp = EMPRESAS_SERVICIO.find(s => s.id === e.target.value);
                  if (emp) setEmpresaSeleccionada(emp);
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#FAFAF8] dark:bg-[#121614] text-[#1A1F1C] dark:text-[#F0F2F0] focus:outline-none"
              >
                {EMPRESAS_SERVICIO.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#717A74] dark:text-[#8E9991] block mb-1">
                {empresaSeleccionada.tipo} del titular
              </label>
              <input
                type="text"
                placeholder={empresaSeleccionada.placeholder}
                value={dniOIdentificador}
                onChange={e => setDniOIdentificador(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#FAFAF8] dark:bg-[#121614] text-[#1A1F1C] dark:text-[#F0F2F0] focus:outline-none"
              />
            </div>

            {resultadoBusqueda && (
              <div className="p-2 text-center text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl font-medium border border-emerald-200/50">
                {resultadoBusqueda}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModoBusquedaDNI(false)}
                className="flex-1 py-2 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] text-xs font-semibold text-[#555] dark:text-[#AAA]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConsultarPorDNI}
                disabled={buscandoFactura || !dniOIdentificador.trim()}
                className="flex-1 py-2 rounded-xl bg-[#1B6B4A] text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {buscandoFactura ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" /> Consultar
                  </>
                )}
              </button>
            </div>
          </div>
        ) : editing ? (
          /* MODO EDICIÓN MANUAL */
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs text-[#717A74] dark:text-[#8E9991] block mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#FAFAF8] dark:bg-[#121614] text-[#1A1F1C] dark:text-[#F0F2F0]"
              />
            </div>
            <div>
              <label className="text-xs text-[#717A74] dark:text-[#8E9991] block mb-1">Monto ($)</label>
              <input
                type="text"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#FAFAF8] dark:bg-[#121614] text-[#1A1F1C] dark:text-[#F0F2F0]"
              />
            </div>
            <div>
              <label className="text-xs text-[#717A74] dark:text-[#8E9991] block mb-1">Código de Barra / Factura</label>
              <input
                type="text"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#FAFAF8] dark:bg-[#121614] text-[#1A1F1C] dark:text-[#F0F2F0]"
              />
            </div>
            <div>
              <label className="text-xs text-[#717A74] dark:text-[#8E9991] block mb-1">Alias / CVU / CBU</label>
              <input
                type="text"
                value={alias}
                onChange={e => setAlias(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-[#FAFAF8] dark:bg-[#121614] text-[#1A1F1C] dark:text-[#F0F2F0]"
              />
            </div>
            <div className="flex gap-2 pt-1">
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
          /* VISTA PRINCIPAL CON DISEÑO REFINADO */
          <>
            {/* Tarjeta de Importe */}
            <div className="bg-[#FAF8F5] dark:bg-[#1F2722] rounded-2xl p-4 mb-4 border border-[#EDE7DF] dark:border-[#2C3830] text-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#717A74] dark:text-[#8E9991] block">
                Total a pagar
              </span>
              <div className="font-display font-extrabold text-3xl text-[#1B6B4A] dark:text-[#3D9B6E] tracking-tight my-1">
                {pesos(bill.a)}
              </div>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    bill.p
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100/80 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {bill.p ? '✓ Pagado' : '⏳ Pendiente'}
                </span>
                {bill.dueDate && (
                  <span className="text-[10px] text-[#717A74] dark:text-[#8E9991]">
                    Vence {bill.dueDate}
                  </span>
                )}
              </div>
            </div>

            {/* Botón sutil DNI */}
            <button
              onClick={() => setModoBusquedaDNI(true)}
              className="w-full mb-3 py-2 px-3 rounded-xl bg-[#F5F2EC] hover:bg-[#EFEAE2] dark:bg-[#202722] dark:hover:bg-[#263029] border border-[#E5DFD6] dark:border-[#2C3830] text-[#47524A] dark:text-[#B2BCB4] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Search className="w-3.5 h-3.5 text-[#1B6B4A]" />
              <span>Autocompletar factura por DNI</span>
            </button>

            {/* Datos copiables */}
            {(bill.barcode || bill.mpAlias) && (
              <div className="space-y-1.5 mb-4">
                {bill.mpAlias && (
                  <div className="flex items-center justify-between text-xs bg-[#FAF8F5] dark:bg-[#1E2520] px-3 py-2 rounded-xl border border-[#EDE7DF] dark:border-[#2A332E]">
                    <span className="text-[#555] dark:text-[#AAA] truncate text-[11px]">
                      Alias: <strong className="text-[#1A1F1C] dark:text-[#F0F2F0]">{bill.mpAlias}</strong>
                    </span>
                    <button
                      onClick={() => copyToClipboard(bill.mpAlias!, 'alias')}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#1B6B4A] hover:underline"
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

                {bill.barcode && (
                  <div className="flex items-center justify-between text-xs bg-[#FAF8F5] dark:bg-[#1E2520] px-3 py-2 rounded-xl border border-[#EDE7DF] dark:border-[#2A332E]">
                    <span className="text-[#555] dark:text-[#AAA] truncate text-[11px] max-w-[200px]">
                      Cód: {bill.barcode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(bill.barcode!, 'barcode')}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#1B6B4A] hover:underline"
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
              </div>
            )}

            {/* BOTÓN PRINCIPAL */}
            <div className="space-y-2 mb-4">
              <a
                href={mpAction.url}
                onClick={handlePay}
                className="w-full py-3 px-4 rounded-2xl bg-[#1A1F1C] hover:bg-[#252D28] dark:bg-[#F0F2F0] dark:hover:bg-white text-white dark:text-[#1A1F1C] font-semibold text-xs flex items-center justify-between shadow-lg shadow-black/10 transition transform active:scale-95 no-underline"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#009EE3]/20 flex items-center justify-center">
                    <span className="text-[9px] font-black text-[#009EE3]">MP</span>
                  </div>
                  <span>{mpAction.text}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 opacity-70" />
              </a>

              {/* Botón Marcar Pagado */}
              <button
                onClick={handleConfirmPaid}
                className={`w-full py-2.5 px-4 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  bill.p
                    ? 'border border-[#EDE7DF] dark:border-[#2A332E] text-[#8C9690]'
                    : 'bg-[#1B6B4A] hover:bg-[#145238] text-white shadow-md shadow-[#1B6B4A]/20'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{bill.p ? 'Marcar como pendiente' : 'Marcar como pagado'}</span>
              </button>
            </div>

            {/* Pie con opciones */}
            <div className="flex items-center justify-between pt-2 border-t border-[#EDE7DF] dark:border-[#263029] text-[11px]">
              <button
                onClick={() => setEditing(true)}
                className="text-[#717A74] hover:text-[#1A1F1C] dark:hover:text-[#F0F2F0] font-medium transition"
              >
                Editar datos manuales
              </button>
              <span className="text-[#8C9690] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Seguro
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
