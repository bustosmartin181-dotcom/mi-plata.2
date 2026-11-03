import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import { AppState, ExpenseItem, DailyExpense } from './types';
import {
  estadoInicial,
  estadoDemo,
  calcular,
  hoyISO,
  mesSiguiente,
} from './lib/calculator';
import {
  subscribeToAuth,
  subscribeToFinancialProfile,
  saveProfileToFirestore,
  loadFinancialProfile,
} from './lib/firebase';
import { encryptData, decryptData, EncryptedPayload } from './lib/crypto';
import { checkBillDueDates, sendLocalNotification } from './lib/notifications';

import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { MercadoPagoModal } from './components/MercadoPagoModal';
import { E2EEModal } from './components/E2EEModal';
import { AuthModal } from './components/AuthModal';
import { ShareModal } from './components/ShareModal';
import { ApkInstallModal } from './components/ApkInstallModal';
import { PinLockScreen } from './components/PinLockScreen';
import { OnboardingScreen } from './components/OnboardingScreen';

import { HoyView } from './views/HoyView';
import { PlanView } from './views/PlanView';
import { MercadoPagoView } from './views/MercadoPagoView';
import { DiasView } from './views/DiasView';
import { AjustesView } from './views/AjustesView';
import { Plus } from 'lucide-react';

const STORAGE_KEY = 'miplata_v2';
const DEMO_BACKUP_KEY = 'miplata_real_antes_demo';

export default function App() {
  const hoy = hoyISO();

  // Load initial local state
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.items) return parsed;
      }
    } catch (_) {}
    return estadoInicial(hoy);
  });

  const [currentTab, setCurrentTab] = useState<TabType>('hoy');
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('offline');

  // Security / PIN Lock state
  const [isLocked, setIsLocked] = useState<boolean>(() => !!state.pin && state.pinApp !== false);
  const [e2eePassphrase, setE2eePassphrase] = useState<string>('');

  // Modals state
  const [selectedBillForMP, setSelectedBillForMP] = useState<ExpenseItem | null>(null);
  const [showE2EEModal, setShowE2EEModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFlutterModal, setShowFlutterModal] = useState(false);

  // Sync to local storage on state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }, [state]);

  // Apply visual theme (Auto / Light / Dark) and accent color
  useEffect(() => {
    const root = document.documentElement;
    const isDarkSystem = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark =
      state.tema === 'oscuro' || (state.tema === 'auto' && isDarkSystem) || (!state.tema && isDarkSystem);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const themeColors: Record<string, [string, string]> = {
      verde: ['#1B6B4A', '#3D9B6E'],
      azul: ['#0B5CAD', '#5AA7F5'],
      violeta: ['#6D3FC0', '#B794F6'],
      naranja: ['#C2570C', '#FB923C'],
      rojo: ['#B42318', '#F87171'],
    };

    const colorPair = themeColors[state.color || 'verde'] || themeColors.verde;
    root.style.setProperty('--ac', isDark ? colorPair[1] : colorPair[0]);
  }, [state.tema, state.color]);

  // Auth listener
  useEffect(() => {
    const unsubscribe = subscribeToAuth(currentUser => {
      setUser(currentUser);
      if (currentUser) {
        setSyncStatus('syncing');
      } else {
        setSyncStatus('offline');
      }
    });
    return () => unsubscribe();
  }, []);

  // Firebase Firestore Real-Time sync
  useEffect(() => {
    if (!user || state.demo) return;

    let isMounted = true;
    setSyncStatus('syncing');

    const unsubscribe = subscribeToFinancialProfile(
      user.uid,
      remoteState => {
        if (!isMounted) return;
        setSyncStatus('synced');

        // Check timestamps to avoid overwriting newer local edits
        if (remoteState && (!state.upd || (remoteState.upd || 0) > (state.upd || 0))) {
          setState(prev => ({
            ...remoteState,
            // Preserve local non-synced UI preferences if needed
            tema: prev.tema || remoteState.tema,
            color: prev.color || remoteState.color,
          }));
        }
      },
      () => {
        if (isMounted) setSyncStatus('error');
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user]);

  // Push state changes to Firebase when modified locally
  const pushToCloud = useCallback(
    async (newState: AppState) => {
      if (!user || state.demo) return;
      try {
        setSyncStatus('syncing');
        let stateToSave = { ...newState, upd: Date.now() };

        // If E2EE is enabled, encrypt financial data blob
        if (stateToSave.e2eeEnabled && e2eePassphrase) {
          const payload = await encryptData(JSON.stringify(stateToSave), e2eePassphrase);
          (stateToSave as any).encryptedBlob = payload;
        }

        await saveProfileToFirestore(user.uid, stateToSave);
        setSyncStatus('synced');
      } catch (err) {
        console.error('Error saving to cloud:', err);
        setSyncStatus('error');
      }
    },
    [user, state.demo, e2eePassphrase]
  );

  const updateState = useCallback(
    (updater: (prev: AppState) => AppState) => {
      setState(prev => {
        const next = updater(prev);
        pushToCloud(next);
        return next;
      });
    },
    [pushToCloud]
  );

  // Check upcoming bill due dates for notification reminders
  useEffect(() => {
    if (!state.recOn) return;
    const dueBills = checkBillDueDates(state.items || []);
    if (dueBills.length > 0) {
      const first = dueBills[0];
      const daysText = first.daysLeft === 0 ? '¡Vence hoy!' : `Vence en ${first.daysLeft} días`;
      sendLocalNotification(
        `Recordatorio de factura: ${first.bill.n}`,
        `${daysText} ($${first.bill.a.toLocaleString('es-AR')}). Toca para pagar en Mercado Pago.`
      );
    }
  }, [state.recOn]);

  // Financial calculations
  const calculation = useMemo(() => calcular(state, hoy), [state, hoy]);

  // Pending important bills count
  const pendingBillsCount = useMemo(() => {
    return (state.items || []).filter(i => !i.p && (i.n || i.a)).length;
  }, [state.items]);

  // Handlers
  const handleToggleTheme = () => {
    const nextTheme = state.tema === 'claro' ? 'oscuro' : state.tema === 'oscuro' ? 'auto' : 'claro';
    updateState(s => ({ ...s, tema: nextTheme }));
  };

  const handleAddExpense = (exp: Omit<DailyExpense, 'id'>) => {
    updateState(s => ({
      ...s,
      spent: [...(s.spent || []), { id: Date.now(), ...exp }],
    }));
  };

  const handleEditExpense = (exp: DailyExpense) => {
    updateState(s => ({
      ...s,
      spent: (s.spent || []).map(e => (e.id === exp.id ? exp : e)),
    }));
  };

  const handleDeleteExpense = (id: number) => {
    updateState(s => ({
      ...s,
      spent: (s.spent || []).filter(e => e.id !== id),
    }));
  };

  const handleUseFund = (amount: number, note: string, type: 'hoy' | 'cubre') => {
    updateState(s => ({
      ...s,
      fondoUsos: [
        ...(s.fondoUsos || []),
        { id: Date.now(), date: hoy, amt: amount, note, para: type },
      ],
    }));
  };

  const handleToggleDemo = () => {
    if (state.demo) {
      // Restore real data
      try {
        const real = localStorage.getItem(DEMO_BACKUP_KEY);
        if (real) {
          const parsed = JSON.parse(real);
          setState(parsed);
          localStorage.removeItem(DEMO_BACKUP_KEY);
          return;
        }
      } catch (_) {}
      setState(estadoInicial(hoy));
    } else {
      // Save current real data and switch to demo
      localStorage.setItem(DEMO_BACKUP_KEY, JSON.stringify(state));
      setState(estadoDemo(state));
    }
  };

  const handleUnlockPin = (entered: string): boolean => {
    if (entered === state.pin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const handleSaveE2EE = async (enabled: boolean, passphrase: string): Promise<boolean> => {
    setE2eePassphrase(passphrase);
    updateState(s => ({ ...s, e2eeEnabled: enabled }));
    return true;
  };

  const handleFinishOnboarding = (initialData: Partial<AppState>) => {
    updateState(s => ({
      ...s,
      ...initialData,
      bienvenida: true,
    }));
  };

  // If user is locked by PIN
  if (isLocked) {
    return <PinLockScreen onUnlock={handleUnlockPin} />;
  }

  // If first time opening the app (Onboarding)
  if (!state.bienvenida) {
    return <OnboardingScreen onFinish={handleFinishOnboarding} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F1EB] dark:bg-[#121614] text-[#1A1F1C] dark:text-[#F0F2F0] flex flex-col transition-colors selection:bg-[#1B6B4A]/20">
      {/* Top Header */}
      <Header
        user={user}
        syncStatus={syncStatus}
        e2eeActive={!!state.e2eeEnabled}
        theme={state.tema || 'auto'}
        onToggleTheme={handleToggleTheme}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenE2EE={() => setShowE2EEModal(true)}
        onOpenFlutterInfo={() => setShowFlutterModal(true)}
      />

      {/* Main Body Views */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 pt-3">
        {currentTab === 'hoy' && (
          <HoyView
            state={state}
            calculation={calculation}
            onAddExpense={handleAddExpense}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
            onOpenShare={() => setShowShareModal(true)}
            onUseFund={handleUseFund}
            onPayBillMP={bill => setSelectedBillForMP(bill)}
          />
        )}

        {currentTab === 'mercadopago' && (
          <MercadoPagoView
            state={state}
            onSelectBill={bill => setSelectedBillForMP(bill)}
            onAddBill={newBill =>
              updateState(s => ({ ...s, items: [...(s.items || []), newBill] }))
            }
            onTogglePaid={idx =>
              updateState(s => {
                const updated = [...(s.items || [])];
                updated[idx].p = !updated[idx].p;
                return { ...s, items: updated };
              })
            }
          />
        )}

        {currentTab === 'plan' && (
          <PlanView
            state={state}
            calculation={calculation}
            onUpdateState={updateState}
            onSelectBillMP={bill => setSelectedBillForMP(bill)}
          />
        )}

        {currentTab === 'dias' && (
          <DiasView
            state={state}
            calculation={calculation}
            onUpdateState={updateState}
          />
        )}

        {currentTab === 'ajustes' && (
          <AjustesView
            state={state}
            calculation={calculation}
            onUpdateState={updateState}
            onOpenE2EE={() => setShowE2EEModal(true)}
            onOpenFlutterInfo={() => setShowFlutterModal(true)}
            onToggleDemo={handleToggleDemo}
          />
        )}
      </main>

      {/* Floating Action Button "＋" to quickly jump to expense logger */}
      {currentTab !== 'hoy' && (
        <button
          onClick={() => {
            setCurrentTab('hoy');
            setTimeout(() => {
              const el = document.getElementById('am');
              if (el) el.focus();
            }, 100);
          }}
          className="fixed right-5 bottom-20 z-40 w-14 h-14 rounded-full bg-[#1B6B4A] hover:bg-[#145238] text-white flex items-center justify-center shadow-2xl shadow-[#1B6B4A]/50 transition transform active:scale-95"
          title="Anotar gasto rápido"
          aria-label="Anotar gasto"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Bottom Floating Navigation Dock */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        pendingBillsCount={pendingBillsCount}
      />

      {/* Modals */}
      <MercadoPagoModal
        bill={selectedBillForMP}
        onClose={() => setSelectedBillForMP(null)}
        onUpdateBill={updated => {
          updateState(s => ({
            ...s,
            items: (s.items || []).map(b => (b === selectedBillForMP ? updated : b)),
          }));
          setSelectedBillForMP(updated);
        }}
        onMarkAsPaid={bill => {
          updateState(s => ({
            ...s,
            items: (s.items || []).map(b => (b === bill ? { ...b, p: !b.p } : b)),
          }));
        }}
      />

      <E2EEModal
        isOpen={showE2EEModal}
        onClose={() => setShowE2EEModal(false)}
        e2eeEnabled={!!state.e2eeEnabled}
        onSaveE2EE={handleSaveE2EE}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        user={user}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        state={state}
        calculation={calculation}
      />

      <ApkInstallModal
        isOpen={showFlutterModal}
        onClose={() => setShowFlutterModal(false)}
      />
    </div>
  );
}
