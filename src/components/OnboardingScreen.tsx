import React, { useState } from 'react';
import { AppState } from '../types';
import { pesos, totalIngresos, CATEGORIAS_INGRESO, hoyISO, mesSiguiente } from '../lib/calculator';
import { ArrowRight, Check, Sparkles, Smartphone, ShieldCheck } from 'lucide-react';

interface OnboardingScreenProps {
  onFinish: (initialState: Partial<AppState>) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const hoy = hoyISO();
  const [step, setStep] = useState(0);

  const [nombre, setNombre] = useState('');
  const [sueldo, setSueldo] = useState('620000');
  const [start, setStart] = useState(hoy);
  const [end, setEnd] = useState(mesSiguiente(hoy));
  const [rent, setRent] = useState('180000');
  const [services, setServices] = useState('45000');

  const sueldoNum = parseFloat(sueldo.replace(/\./g, '').replace(',', '.')) || 0;
  const rentNum = parseFloat(rent.replace(/\./g, '').replace(',', '.')) || 0;
  const servicesNum = parseFloat(services.replace(/\./g, '').replace(',', '.')) || 0;
  const totalBills = rentNum + servicesNum;
  const remaining = Math.max(0, sueldoNum - totalBills);
  const dailyEst = remaining / 30;

  const handleComplete = () => {
    onFinish({
      bienvenida: true,
      nombre: nombre.trim() || undefined,
      sueldo: sueldoNum,
      start,
      end,
      ingresos: [{ cat: 'Sueldo', a: sueldoNum }],
      items: [
        { n: 'Alquiler', a: rentNum, p: false, f: true, mpCategory: 'Alquiler' },
        { n: 'Luz y Servicios', a: servicesNum, p: false, f: true, v: true, mpCategory: 'Servicios' },
      ],
      spent: [],
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F1EB] dark:bg-[#121614] text-[#1A1F1C] dark:text-[#F0F2F0] flex flex-col justify-between p-6 max-w-md mx-auto">
      {/* Progress Dots */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                step === idx
                  ? 'w-7 bg-[#1B6B4A] dark:bg-[#3D9B6E]'
                  : step > idx
                  ? 'w-3.5 bg-[#1B6B4A]/40'
                  : 'w-3.5 bg-[#E5DFD6] dark:bg-[#2A332E]'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-[#6B756F] dark:text-[#9AA59D] font-medium">
          Paso {step + 1} de 4
        </span>
      </div>

      {/* Step Contents */}
      <div className="my-auto py-8">
        {step === 0 && (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#1B6B4A] to-[#0F422D] flex items-center justify-center text-white text-4xl shadow-xl shadow-[#1B6B4A]/25">
              💰
            </div>
            <h1 className="font-display font-extrabold text-3xl tracking-tight leading-tight">
              Bienvenido a <br />
              <span className="text-[#1B6B4A] dark:text-[#3D9B6E]">Mi Plata</span>
            </h1>
            <p className="text-sm text-[#6B756F] dark:text-[#9AA59D] max-w-xs mx-auto leading-relaxed">
              La app multiplataforma para ordenar tus finanzas personales y pagar tus facturas directamente con Mercado Pago.
            </p>

            <div className="pt-4 max-w-xs mx-auto">
              <label className="text-xs text-[#6B756F] dark:text-[#9AA59D] block mb-1.5 text-left font-medium">
                ¿Cómo te llamas? (opcional)
              </label>
              <input
                type="text"
                placeholder="ej: Martín"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="w-full p-3 rounded-2xl border border-[#E5DFD6] dark:border-[#2A332E] bg-white dark:bg-[#1A211D] text-sm text-[#1A1F1C] dark:text-[#F0F2F0] text-center font-semibold outline-none focus:border-[#1B6B4A]"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E6F2EC] dark:bg-[#1E3328] flex items-center justify-center text-[#1B6B4A] dark:text-[#3D9B6E] font-bold text-xl">
              1
            </div>
            <h2 className="font-display font-bold text-2xl tracking-tight">
              Así de simple funciona
            </h2>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E]">
                <strong className="text-[#1B6B4A] dark:text-[#3D9B6E] block mb-0.5">
                  1. Cobras tu sueldo o ingresos
                </strong>
                Ingresas cuánto ganas en el mes.
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E]">
                <strong className="text-[#1B6B4A] dark:text-[#3D9B6E] block mb-0.5">
                  2. Apartas tus facturas fijas
                </strong>
                Alquiler, luz, internet, tarjetas. Tienes un botón para pagar en Mercado Pago al instante.
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1A211D] border border-[#E5DFD6] dark:border-[#2A332E]">
                <strong className="text-[#1B6B4A] dark:text-[#3D9B6E] block mb-0.5">
                  3. Presupuesto diario inteligente
                </strong>
                Lo que sobra se reparte por día. Si ahorras hoy, ¡mañana tienes más!
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-2xl tracking-tight">
              Tus ingresos y fechas
            </h2>
            <p className="text-xs text-[#6B756F] dark:text-[#9AA59D]">
              Configura tu sueldo y el ciclo de cobro.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#6B756F] dark:text-[#9AA59D] block mb-1 font-medium">
                  ¿Cuánto cobras por mes? ($)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={sueldo}
                  onChange={e => setSueldo(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[#E5DFD6] dark:border-[#2A332E] bg-white dark:bg-[#1A211D] font-display font-bold text-lg text-[#1B6B4A] dark:text-[#3D9B6E] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-[#6B756F] dark:text-[#9AA59D] block mb-1">
                    Día que cobras (inicio)
                  </label>
                  <input
                    type="date"
                    value={start}
                    onChange={e => setStart(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-white dark:bg-[#1A211D] text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#6B756F] dark:text-[#9AA59D] block mb-1">
                    Próximo cobro (fin)
                  </label>
                  <input
                    type="date"
                    value={end}
                    onChange={e => setEnd(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-white dark:bg-[#1A211D] text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-2xl tracking-tight">
              Tus gastos importantes
            </h2>
            <p className="text-xs text-[#6B756F] dark:text-[#9AA59D]">
              Gastos fijos que pagarás con Mercado Pago.
            </p>

            <div className="space-y-2.5">
              <div>
                <label className="text-xs text-[#6B756F] dark:text-[#9AA59D] block mb-1">
                  Alquiler o Vivienda ($)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={rent}
                  onChange={e => setRent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-white dark:bg-[#1A211D] text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-xs text-[#6B756F] dark:text-[#9AA59D] block mb-1">
                  Servicios (Luz, Gas, Internet) ($)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={services}
                  onChange={e => setServices(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E5DFD6] dark:border-[#2A332E] bg-white dark:bg-[#1A211D] text-sm font-semibold"
                />
              </div>
            </div>

            {/* Projected Result */}
            <div className="p-4 rounded-2xl bg-[#E6F2EC] dark:bg-[#1E3328] text-center mt-3">
              <span className="text-xs text-[#1B6B4A] dark:text-[#3D9B6E] font-medium block">
                Podrás gastar aproximadamente
              </span>
              <div className="font-display font-extrabold text-3xl text-[#1B6B4A] dark:text-[#3D9B6E] mt-1">
                {pesos(dailyEst)}
              </div>
              <span className="text-xs text-[#6B756F] dark:text-[#9AA59D] block mt-0.5">
                por día para comida, salidas y día a día
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-2 pt-4 border-t border-[#E5DFD6] dark:border-[#2A332E]">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 py-3 rounded-2xl border border-[#E5DFD6] dark:border-[#2A332E] font-semibold text-xs text-[#1A1F1C] dark:text-[#F0F2F0] transition"
          >
            Atrás
          </button>
        )}
        <button
          onClick={() => {
            if (step < 3) {
              setStep(step + 1);
            } else {
              handleComplete();
            }
          }}
          className="flex-1 py-3 rounded-2xl bg-[#1B6B4A] hover:bg-[#145238] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
        >
          <span>{step === 3 ? 'Comenzar a usar la app' : 'Continuar'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
