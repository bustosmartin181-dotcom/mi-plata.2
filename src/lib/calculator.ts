import { AppState, CalculationResult, ExpenseItem, GoalItem } from '../types';

export const MS_DIA = 864e5;
export const NOMBRES_DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export const dosDigitos = (n: number) => String(n).padStart(2, '0');
export const suma = <T>(lista: T[], valor: (x: T) => number) => lista.reduce((total, x) => total + valor(x), 0);

/* Money formatters in Argentine Pesos */
export const pesos = (n: number) =>
  (Math.round(n) < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('es-AR');

export const pesosConCentavos = (n: number) =>
  (n < 0 ? '-' : '') + '$' +
  Math.abs(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const redondear2 = (n: number) => Math.round(n * 100) / 100;

export const aNumero = (v: string | number) =>
  +String(v).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '') || 0;

export const escapar = (s: string) => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));

/* Date conversions */
export function numeroDeDia(iso: string): number {
  if (!iso) return 0;
  const [a, m, d] = iso.split('-').map(Number);
  return Date.UTC(a, m - 1, d) / MS_DIA;
}

export const isoDeNumero = (n: number) => new Date(n * MS_DIA).toISOString().slice(0, 10);

export const esHabil = (n: number) => {
  const d = new Date(n * MS_DIA).getUTCDay();
  return d >= 1 && d <= 5;
};

export function hoyISO(): string {
  const d = new Date();
  return d.getFullYear() + '-' + dosDigitos(d.getMonth() + 1) + '-' + dosDigitos(d.getDate());
}

export function mesSiguiente(iso: string): string {
  if (!iso) return hoyISO();
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m, d)).toISOString().slice(0, 10);
}

export const diaYMes = (iso: string) => {
  if (!iso || iso.length < 10) return '';
  return iso.slice(8) + '/' + iso.slice(5, 7);
};

export const mananaISO = (hoy: string) => isoDeNumero(numeroDeDia(hoy) + 1);

export const montoDe = (item: ExpenseItem) => +item.a || 0;

export const CATEGORIAS_INGRESO = [
  'Sueldo',
  'Trabajo independiente',
  'Efectivo',
  'Changas o trabajo extra',
  'Alquileres',
  'Jubilación o pensión',
  'Ventas o negocio',
  'Ayuda familiar',
  'Otros',
];

export const totalIngresos = (S: AppState) => suma(S.ingresos || [], i => +i.a || 0);

export const tieneCuotas = (i: ExpenseItem) => !!(i.q && i.q.total > 1);
export const cuotasRestantes = (i: ExpenseItem) => tieneCuotas(i) ? Math.max(0, (i.q?.total || 0) - (i.q?.actual || 0)) : 0;

export const resumenCuotas = (S: AppState) =>
  (S.items || []).filter(tieneCuotas).map(i => ({
    n: i.n,
    actual: i.q!.actual,
    total: i.q!.total,
    monto: montoDe(i),
    restantes: cuotasRestantes(i),
    restoTotal: montoDe(i) * cuotasRestantes(i),
  }));

export function avanzarCuotas(S: AppState): string[] {
  const terminadas: string[] = [];
  S.items = (S.items || []).filter(i => {
    if (!tieneCuotas(i)) return true;
    if (i.q!.actual >= i.q!.total) {
      terminadas.push(i.n || 'Gasto en cuotas');
      return false;
    }
    i.q!.actual += 1;
    return true;
  });
  return terminadas;
}

export function estadoInicial(hoy: string): AppState {
  return {
    sueldo: 0,
    previo: 0,
    bienvenida: false,
    ingresos: [{ cat: 'Sueldo', a: 0 }],
    start: hoy,
    end: mesSiguiente(hoy),
    items: [
      { n: 'Alquiler', a: 0, p: false, f: true, mpCategory: 'Alquiler' },
      { n: 'Luz', a: 0, p: false, f: true, v: true, mpCategory: 'Servicios' },
      { n: 'Internet', a: 0, p: false, f: true, mpCategory: 'Servicios' },
    ],
    spent: [],
    recal: null,
    tema: 'auto',
    color: 'verde',
    aviso: 20,
    cuentas: [
      { n: 'Banco', m: 0 },
      { n: 'Mercado Pago', m: 0 },
      { n: 'Efectivo', m: 0 },
    ],
    metas: [{ id: 1, n: 'Ahorro / Vacaciones', t: 0, g0: 0, f: '' }],
  };
}

export function estadoDemo(real: AppState): AppState {
  const hoy = hoyISO(), n = numeroDeDia(hoy), start = isoDeNumero(n - 11);
  const D: AppState = {
    demo: true,
    bienvenida: true,
    nombre: 'Martín',
    sueldo: 620000,
    previo: 0,
    ingresos: [{ cat: 'Sueldo', a: 620000 }],
    start,
    end: mesSiguiente(start),
    items: [
      { n: 'Alquiler', a: 180000, p: true, f: true, mpCategory: 'Alquiler', mpAlias: 'alquiler.inmobiliaria.mp', dueDate: isoDeNumero(n - 3) },
      { n: 'Luz (Edenor)', a: 25000, p: true, f: true, v: true, mpCategory: 'Servicios', barcode: '037284918274910284719284', dueDate: isoDeNumero(n - 5) },
      { n: 'Internet (Telecom)', a: 20000, p: false, f: true, mpCategory: 'Servicios', barcode: '849102847192840372849182', dueDate: isoDeNumero(n + 2) },
      { n: 'Tarjeta Visa (Cuota)', a: 35000, p: false, f: true, q: { actual: 4, total: 6 }, mpCategory: 'Tarjeta', dueDate: isoDeNumero(n + 4) },
    ],
    spent: [],
    recal: null,
    metas: [{ id: 1, n: 'Vacaciones', t: 300000, g0: 60000, f: '' }],
    ultimaCopia: Date.now(),
    tema: real.tema || 'auto',
    color: real.color || 'verde',
    aviso: 20,
    cuentas: [
      { n: 'Banco Galicia', m: 180000 },
      { n: 'Mercado Pago', m: 95000 },
      { n: 'Efectivo', m: 25000 },
    ],
  };

  const gastos: [number, number, string, string][] = [
    [-11, 12500, 'Supermercado', 'Súper'],
    [-10, 13500, 'Cena con amigos', 'Salidas'],
    [-9, 2500, 'SUBE', 'Transporte'],
    [-9, 9300, 'Almuerzo', 'Comida'],
    [-8, 15200, 'Supermercado', 'Súper'],
    [-7, 8400, 'Delivery', 'Comida'],
    [-7, 3100, 'Kiosco', 'Otro'],
    [-6, 7100, 'Farmacia', 'Salud'],
    [-6, 6000, 'Nafta', 'Transporte'],
    [-5, 8800, 'Almuerzo', 'Comida'],
    [-5, 2900, 'Café', 'Comida'],
    [-4, 14400, 'Supermercado', 'Súper'],
    [-3, 3000, 'SUBE', 'Transporte'],
    [-3, 8900, 'Panadería y almuerzo', 'Comida'],
    [-2, 11200, 'Cine', 'Salidas'],
    [-1, 9400, 'Almuerzo y café', 'Comida'],
  ];

  gastos.forEach(([d, amt, note, cat], i) => {
    D.spent.push({ id: Date.now() + i, date: isoDeNumero(n + d), amt, note, cat });
  });

  return D;
}

/* Master financial core */
export function calcular(S: AppState, hoy: string): CalculationResult {
  const items = S.items || [];
  const spent = S.spent || [];
  const total = suma(items, montoDe);

  const aumentosDe = (i: ExpenseItem) => i.x || [];
  const montoBase = (i: ExpenseItem) => montoDe(i) - suma(aumentosDe(i), x => +x.amt || 0);
  const totalBase = suma(items.filter(i => !i.d), montoBase);
  const porPagar = suma(items.filter(i => !i.p), montoDe);

  const descuentos: { amt: number; desde?: string }[] = [];
  (S.ajustes || []).forEach(a => descuentos.push({ amt: a.amt, desde: a.desde }));
  items.filter(i => i.d).forEach(i => descuentos.push({ amt: -montoBase(i), desde: i.d }));
  items.forEach(i => {
    (aumentosDe(i) || []).forEach(x => descuentos.push({ amt: -(+x.amt || 0), desde: x.desde }));
  });

  const aportes = suma(spent.filter(e => e.meta), e => e.amt);
  const dispBase = (+S.sueldo || 0) + (+S.previo || 0) - totalBase - aportes;
  let disp = dispBase + suma(descuentos, x => x.amt);

  const dias = Math.max(1, numeroDeDia(S.end) - numeroDeDia(S.start));
  const hoyIdx = Math.min(Math.max(numeroDeDia(hoy) - numeroDeDia(S.start), 0), dias - 1);
  const base = dispBase / dias;
  const recal = (S.recal && S.recal.day <= hoyIdx) ? S.recal : null;
  const desde = recal ? recal.day : 0;

  const extra = (i: number) => suma(descuentos, x => {
    const d0 = x.desde ? Math.max(0, numeroDeDia(x.desde) - numeroDeDia(S.start)) : 0;
    return i >= d0 ? x.amt / Math.max(1, dias - d0) : 0;
  });

  const presupuestoDia = (i: number) => (recal && i >= recal.day) ? recal.base : base + extra(i);

  const idxDe = (e: { date: string }) => numeroDeDia(e.date) - numeroDeDia(S.start);
  const gastado = (a: number, b: number) =>
    suma(spent.filter(e => !e.meta && idxDe(e) >= a && idxDe(e) <= b), e => e.amt);
  const gastoHoy = gastado(hoyIdx, hoyIdx);

  // Mercado Pago Yield simulation
  const tasaD = Math.min(300, Math.max(0, +S.rendTasa! || 0));
  const rendDispActivo = !!S.rendDispOn && tasaD > 0 && !!S.rendDispDesde;
  const rD = tasaD / 100 / 365;
  const kD0 = rendDispActivo ? Math.max(0, numeroDeDia(S.rendDispDesde!) - numeroDeDia(S.start)) : 0;
  let rendDisp = 0, pendD = 0;

  const sumarRendDisp = (k: number, aportesPrevios: number, usosHasta: number) => {
    if (!rendDispActivo || k < kD0) return;
    const y = Math.max(0, disp - gastado(-1e9, k - 1) - aportesPrevios + usosHasta) * rD;
    pendD += y;
    if (esHabil(numeroDeDia(S.start) + k + 1)) {
      descuentos.push({ amt: pendD, desde: isoDeNumero(numeroDeDia(S.start) + k + 1) });
      disp += pendD;
      rendDisp += pendD;
      pendD = 0;
    }
  };

  if (!S.modoFondo) {
    for (let k = 0; k < hoyIdx; k++) sumarRendDisp(k, 0, 0);
  }

  let acumulado = 0;
  for (let i = desde; i <= hoyIdx; i++) acumulado += presupuestoDia(i);
  const quedaHoy = acumulado - gastado(desde, hoyIdx);
  const hayManana = hoyIdx < dias - 1;
  let saldoPeriodo = disp - suma(spent.filter(e => !e.meta), e => e.amt);

  // Modo Fondo (Savings Fund)
  const modoFondo = !!S.modoFondo;
  const regla: 'siguiente' | 'fondo' | 'aparte' = S.fondoExceso || 'siguiente';
  let filas: { i: number; presupuesto: number; gasto: number; sobra: number; aporte: number }[] | null = null;
  let fondo: CalculationResult['fondo'] = { activo: false };
  let quedaHoyF = quedaHoy;
  let mananaF: number | null = null;

  if (modoFondo) {
    const iniFondo = S.fondoDesde ? Math.min(Math.max(numeroDeDia(S.fondoDesde) - numeroDeDia(S.start), 0), dias - 1) : 0;
    const extraRetiro: Record<number, number> = {};
    (S.fondoUsos || []).forEach(x => {
      if (x.para === 'cubre') return;
      const k = Math.min(Math.max(numeroDeDia(x.date) - numeroDeDia(S.start), 0), dias - 1);
      extraRetiro[k] = (extraRetiro[k] || 0) + (+x.amt || 0);
    });

    const usosHastaDia = (i: number) => suma((S.fondoUsos || []).filter(x => x.para !== 'cubre' &&
      Math.min(Math.max(numeroDeDia(x.date) - numeroDeDia(S.start), 0), dias - 1) <= i), x => +x.amt || 0);

    filas = [];
    let arrastre = 0, aportesAcum = 0;
    for (let i = 0; i < dias; i++) {
      if (recal && i === recal.day) arrastre = 0;
      const sin = presupuestoDia(i) + (extraRetiro[i] || 0);
      const presupuesto = i <= hoyIdx + 1 ? sin + arrastre : sin;
      const gasto = gastado(i, i);
      const sobra = presupuesto - gasto;
      const previo = i < iniFondo;
      filas.push({ i, presupuesto, gasto, sobra, aporte: previo ? 0 : (regla === 'fondo' ? sobra : Math.max(0, sobra)) });
      arrastre = previo ? sobra : (regla === 'siguiente' ? Math.min(0, sobra) : 0);
      if (i < hoyIdx) sumarRendDisp(i, aportesAcum, usosHastaDia(i));
      aportesAcum += filas[i].aporte;
    }

    saldoPeriodo = disp - suma(spent.filter(e => !e.meta), e => e.amt);
    const cerrados = Math.min(dias, Math.max(0, numeroDeDia(hoy) - numeroDeDia(S.start)));
    const ahorroPeriodo = suma(filas.slice(0, cerrados), f => f.aporte);
    const usos = suma(S.fondoUsos || [], x => +x.amt || 0);
    const previo = +S.fondoPrev! || 0;
    const usosParaGastar = suma((S.fondoUsos || []).filter(x => x.para !== 'cubre'), x => +x.amt || 0);

    const tasaRend = Math.min(300, Math.max(0, +S.rendTasa! || 0));
    const rendActivo = !!S.rendOn && tasaRend > 0 && !!S.rendDesde;
    const rendPrev = rendActivo ? (+S.rendPrev! || 0) : 0;
    let rendPer = 0, rendPend = 0;

    if (rendActivo) {
      const r = tasaRend / 100 / 365;
      const k0 = Math.max(0, numeroDeDia(S.rendDesde!) - numeroDeDia(S.start));
      const idxUso = (x: { date: string }) => Math.min(Math.max(numeroDeDia(x.date) - numeroDeDia(S.start), 0), dias - 1);
      let acum = 0, pend = 0;
      for (let k = 0; k < cerrados; k++) {
        if (k > 0) acum += filas[k - 1].aporte;
        if (k < k0) continue;
        const usado = suma((S.fondoUsos || []).filter(x => idxUso(x) <= k), x => +x.amt || 0);
        pend += Math.max(0, previo + acum - usado + rendPrev + rendPer) * r;
        if (esHabil(numeroDeDia(S.start) + k + 1)) {
          rendPer += pend;
          pend = 0;
        }
      }
      rendPend = pend;
    }

    quedaHoyF = filas[hoyIdx].presupuesto - filas[hoyIdx].gasto;
    mananaF = hayManana ? presupuestoDia(hoyIdx + 1) + (regla === 'siguiente' ? Math.min(0, quedaHoyF) : 0) : null;

    fondo = {
      activo: true,
      regla,
      fondoPrev: previo,
      ahorroPeriodo,
      usos,
      total: previo + ahorroPeriodo - usos,
      rend: rendPrev + rendPer,
      rendPend,
      totalConRend: previo + ahorroPeriodo - usos + rendPrev + rendPer,
      rendEnMP: !!S.rendEnMP,
      acumulado: previo + (+S.fondoRetirado! || 0) + ahorroPeriodo,
      hoySuma: regla === 'fondo' ? quedaHoyF : Math.max(0, quedaHoyF),
      disponible: saldoPeriodo - ahorroPeriodo + usosParaGastar,
    };
  }

  return {
    total,
    porPagar,
    disp,
    dias,
    hoyIdx,
    base,
    recal,
    extra,
    presupuestoDia,
    rendDisp,
    baseHoy: presupuestoDia(hoyIdx),
    baseManana: hayManana ? presupuestoDia(hoyIdx + 1) : null,
    manana: modoFondo ? mananaF : (hayManana ? presupuestoDia(hoyIdx + 1) + quedaHoy : null),
    gastoHoy,
    quedaHoy: modoFondo ? quedaHoyF : quedaHoy,
    filas,
    fondo,
    faltan: dias - hoyIdx,
    saldo: disp - suma(spent.filter(e => !e.meta), e => e.amt),
    gastadoAntesDeHoy: gastado(-1e9, hoyIdx - 1),
  };
}

export function diasDelPeriodo(S: AppState, hoy: string) {
  const c = calcular(S, hoy);
  const spent = S.spent || [];
  if (c.fondo.activo && c.filas) {
    return c.filas.map(f => {
      const n = numeroDeDia(S.start) + f.i;
      return {
        i: f.i,
        iso: isoDeNumero(n),
        dia: NOMBRES_DIA[new Date(n * MS_DIA).getUTCDay()],
        presupuesto: f.presupuesto,
        gasto: f.gasto,
        sobra: f.sobra,
      };
    });
  }

  const salida: { i: number; iso: string; dia: string; presupuesto: number; gasto: number; sobra: number }[] = [];
  let arrastre = 0;
  for (let i = 0; i < c.dias; i++) {
    if (c.recal && i === c.recal.day) arrastre = 0;
    const sinArrastre = (c.recal && i >= c.recal.day) ? c.recal.base : c.base + c.extra(i);
    const presupuesto = i <= c.hoyIdx + 1 ? sinArrastre + arrastre : sinArrastre;
    const n = numeroDeDia(S.start) + i;
    const iso = isoDeNumero(n);
    const gasto = suma(spent.filter(e => e.date === iso && !e.meta), e => e.amt);
    const sobra = presupuesto - gasto;
    arrastre = sobra;
    salida.push({
      i,
      iso,
      dia: NOMBRES_DIA[new Date(n * MS_DIA).getUTCDay()],
      presupuesto,
      gasto,
      sobra,
    });
  }
  return salida;
}

export function semaforo(c: CalculationResult, S: AppState): [string, string] {
  const presupuesto = c.quedaHoy + c.gastoHoy;
  const umbral = (S.aviso ?? 20) / 100;
  if (c.quedaHoy < 0) return ['neg', 'Te pasaste del límite de hoy.'];
  if (presupuesto > 0 && c.quedaHoy <= presupuesto * umbral)
    return ['warn', 'Ya vas llegando al límite de hoy.'];
  return ['ok', ''];
}

export function conciliar(S: AppState, c: CalculationResult) {
  const cuentas = (S.cuentas || []).filter(x => !x.x);
  const total = suma(cuentas, x => +x.m || 0);
  const apartadoEnMetas = suma((S.spent || []).filter(e => e.meta), e => e.amt);
  return {
    hayCuentas: cuentas.some(x => (+x.m || 0) > 0),
    total,
    diferencia: total - c.saldo - apartadoEnMetas - (c.fondo.activo ? (c.fondo.fondoPrev || 0) - (c.fondo.usos || 0) + (c.fondo.rendEnMP ? (c.fondo.rend || 0) : 0) : 0),
  };
}

export const juntadoEnMeta = (S: AppState, m: GoalItem) =>
  (+m.g0 || 0) + suma((S.spent || []).filter(e => e.meta === m.id), e => e.amt);

export function aporteMensualSugerido(S: AppState, m: GoalItem, hoy: string) {
  const falta = Math.max(0, m.t - juntadoEnMeta(S, m));
  if (!(m.t > 0 && falta > 0 && m.f)) return 0;
  return Math.round(falta / Math.max(1, (numeroDeDia(m.f) - numeroDeDia(hoy)) / 30.4));
}

export function rachaEnVerde(S: AppState, hoy: string) {
  const dias = diasDelPeriodo(S, hoy);
  const hoyIdx = calcular(S, hoy).hoyIdx;
  let racha = 0;
  for (let i = hoyIdx - 1; i >= 0 && dias[i].sobra >= 0; i--) racha++;
  const ultimos: boolean[] = [];
  for (let i = Math.max(0, hoyIdx - 7); i < hoyIdx; i++) ultimos.push(dias[i].sobra >= 0);
  return { racha, ultimos };
}

export function objetivoDiario(S: AppState, hoy: string) {
  const obj = +S.objetivo! || 0;
  if (!(obj > 0)) return null;
  const c = calcular(S, hoy);
  const dias = diasDelPeriodo(S, hoy);
  const disponibleHoy = c.saldo + c.gastoHoy;
  const proyectadoCon = (o: number) => disponibleHoy - o * c.faltan;
  const desdeIdx = S.objetivoDesde ? Math.min(c.hoyIdx, Math.max(0, numeroDeDia(S.objetivoDesde) - numeroDeDia(S.start))) : c.hoyIdx;
  let ahorradoAntes = 0;
  for (let i = desdeIdx; i < c.hoyIdx; i++) ahorradoAntes += obj - dias[i].gasto;
  const paso = Math.max(500, Math.round(obj * 0.1 / 500) * 500);
  const escenarios = [-2, -1, 0, 1].map(k => obj + k * paso).filter(o => o > 0)
    .map(o => ({ o, sobra: proyectadoCon(o), actual: o === obj }));

  return {
    obj,
    faltan: c.faltan,
    gastoHoy: c.gastoHoy,
    disponibleHoy,
    promedio: disponibleHoy / c.faltan,
    proyectado: proyectadoCon(obj),
    ahorroHoy: obj - c.gastoHoy,
    ahorradoAntes,
    diasPrevios: c.hoyIdx - desdeIdx,
    escenarios,
  };
}

export const CATEGORIAS_GASTO: [string, string][] = [
  ['🍔', 'Comida'],
  ['🚌', 'Transporte'],
  ['🛒', 'Súper'],
  ['🎉', 'Salidas'],
  ['💊', 'Salud'],
  ['✨', 'Otro'],
];

export const FRASES = [
  'Cada peso anotado es un peso que controlás.',
  'Gastar con intención rinde más que gastar con culpa.',
  'Hoy un pequeño ahorro, mañana una gran tranquilidad.',
  'Lo que no se anota se escapa.',
  'Pagá primero lo importante y vivé con lo que sobra.',
  'Un día en verde es un buen día.',
  'No es cuánto ganás, es cuánto te queda.',
  'Ahorrar no es privarse, es elegir.',
  'Pasito a pasito se junta la meta.',
  'Revisar tus números es cuidarte.',
  'La constancia le gana a la urgencia.',
  'Una meta clara se junta más rápido.',
  'Antes de comprar, esperá un día.',
  'Tu yo del mes que viene te lo va a agradecer.',
  'Lo barato sale caro si no lo necesitás.',
  'Un imprevisto no arruina el mes, se reparte.',
  'Anotar toma diez segundos, ordenarse rinde todo el mes.',
  'Cuidá los pesos chicos, son los que más se escapan.',
  'Cada ahorro suma, aunque sea chico.',
  'Planificar es tener tranquilidad.',
  'Gastá en lo que te acerca a tus metas.',
  'El orden es la mitad del ahorro.',
  'Hoy es un buen día para anotar todo.',
  'La plata ordenada alcanza para más.',
  'Poco por día, mucho al final.',
  'Pensá en tu meta cada vez que dudes.',
  'Lo que juntás hoy es libertad mañana.',
  'Un presupuesto es una guía, no una cárcel.',
  'Respirá antes de comprar.',
  'Seguí así, vas mejor de lo que creés.',
];

export const fraseDelDia = (hoy: string) => FRASES[numeroDeDia(hoy) % FRASES.length];

export const saludoSegunHora = (h: number) =>
  h < 12 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
