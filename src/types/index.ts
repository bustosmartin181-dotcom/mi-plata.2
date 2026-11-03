/**
 * Core types for Mi Plata - Finanzas Personales
 */

export interface ExpenseItem {
  id?: string;
  n: string; // name
  a: number; // amount
  p: boolean; // isPaid
  f?: boolean; // repeat next month
  v?: boolean; // variable amount
  d?: string; // discount from date
  x?: { amt: number; desde: string }[]; // incremental adjustments
  q?: { actual: number; total: number }; // installments (cuotas)
  prox?: number; // amount for next period
  // Mercado Pago bill payment properties
  mpCategory?: string; // e.g., 'Servicios', 'Alquiler', 'Tarjeta', 'Impuestos'
  mpLink?: string; // Direct payment URL
  mpAlias?: string; // CBU / CVU / Alias
  barcode?: string; // Código de barras
  dueDate?: string; // Fecha de vencimiento (AAAA-MM-DD)
}

export interface DailyExpense {
  id: number;
  date: string; // AAAA-MM-DD
  amt: number;
  note?: string;
  cat?: string;
  meta?: number; // savings goal id if it's an allocation
}

export interface IncomeItem {
  cat: string;
  a: number;
}

export interface AccountItem {
  n: string;
  m: number;
  x?: boolean; // excluded from tally
}

export interface GoalItem {
  id: number;
  n: string;
  t: number; // target amount
  g0: number; // already collected
  f?: string; // target date
}

export interface FundWithdrawal {
  id: number;
  date: string;
  amt: number;
  note: string;
  para: 'hoy' | 'cubre';
}

export interface RecompositionItem {
  id: number;
  date: string;
  desde: string;
  amt: number;
  note: string;
}

export interface HistoricalPeriod {
  start: string;
  end: string;
  sueldo: number;
  previo: number;
  importantes: number;
  gastado: number;
  quedo: number;
  ahorro?: number;
}

export interface AppState {
  demo?: boolean;
  bienvenida?: boolean;
  nombre?: string;
  sueldo: number;
  previo: number;
  start: string;
  end: string;
  ingresos: IncomeItem[];
  items: ExpenseItem[];
  spent: DailyExpense[];
  cuentas?: AccountItem[];
  metas?: GoalItem[];
  ajustes?: RecompositionItem[];
  hist?: HistoricalPeriod[];
  recal?: { day: number; base: number; obj?: boolean } | null;
  objetivo?: number;
  objetivoDesde?: string;
  aviso?: number; // warning percentage threshold (default 20%)
  
  // Savings fund (Modo fondo)
  modoFondo?: boolean;
  fondoDesde?: string;
  fondoExceso?: 'siguiente' | 'fondo' | 'aparte';
  fondoPrev?: number;
  fondoRetirado?: number;
  fondoUsos?: FundWithdrawal[];

  // Mercado Pago Yield simulation
  rendOn?: boolean;
  rendDispOn?: boolean;
  rendDesde?: string;
  rendDispDesde?: string;
  rendTasa?: number; // Annual rate TNA (e.g. 19%)
  rendPrev?: number;
  rendEnMP?: boolean;

  // Security, PIN & E2EE
  pin?: string;
  salt?: string;
  pinApp?: boolean;
  ocultar?: boolean;
  e2eeEnabled?: boolean;
  e2eeSalt?: string;
  e2eeKeyCheck?: string; // encrypted verification token

  // Appearance
  tema?: 'auto' | 'claro' | 'oscuro';
  color?: 'verde' | 'azul' | 'violeta' | 'naranja' | 'rojo';
  
  // Reminders
  recOn?: boolean;
  recHora?: string;
  billRemindersOn?: boolean;

  // Backup & sync
  ultimaCopia?: number;
  diasCopia?: number;
  posponerCopia?: number;
  copias?: { iso: string; json: string }[];
  cierres?: Record<string, { b: number; g: number; l: number }>;
  upd?: number;
  demoFrases?: boolean;
}

export interface CalculationResult {
  total: number;
  porPagar: number;
  disp: number;
  dias: number;
  hoyIdx: number;
  base: number;
  recal: { day: number; base: number; obj?: boolean } | null;
  extra: (i: number) => number;
  presupuestoDia: (i: number) => number;
  rendDisp: number;
  baseHoy: number;
  baseManana: number | null;
  manana: number | null;
  gastoHoy: number;
  quedaHoy: number;
  filas: { i: number; presupuesto: number; gasto: number; sobra: number; aporte: number }[] | null;
  fondo: {
    activo: boolean;
    regla?: string;
    fondoPrev?: number;
    ahorroPeriodo?: number;
    usos?: number;
    total?: number;
    rend?: number;
    rendPend?: number;
    totalConRend?: number;
    rendEnMP?: boolean;
    acumulado?: number;
    hoySuma?: number;
    disponible?: number;
  };
  faltan: number;
  saldo: number;
  gastadoAntesDeHoy: number;
}
