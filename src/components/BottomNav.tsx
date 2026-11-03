import React from 'react';
import { Home, Calendar, CreditCard, Clock, Settings } from 'lucide-react';

export type TabType = 'hoy' | 'plan' | 'mercadopago' | 'dias' | 'ajustes';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  pendingBillsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onChangeTab,
  pendingBillsCount,
}) => {
  const tabs = [
    { id: 'plan' as TabType, label: 'Plan', icon: Clock },
    { id: 'hoy' as TabType, label: 'Hoy', icon: Home },
    {
      id: 'mercadopago' as TabType,
      label: 'Facturas',
      icon: CreditCard,
      badge: pendingBillsCount > 0 ? pendingBillsCount : null,
      highlight: true,
    },
    { id: 'dias' as TabType, label: 'Días', icon: Calendar },
    { id: 'ajustes' as TabType, label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-3 left-3 right-3 max-w-[430px] mx-auto z-40">
      <div className="nav-glass rounded-3xl border border-[#E5DFD6]/80 dark:border-[#2A332E]/80 shadow-xl shadow-black/10 px-2 py-1.5 flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                  try { navigator.vibrate(15); } catch (_) {}
                }
                onChangeTab(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-[#E6F2EC] text-[#1B6B4A] dark:bg-[#1E3328] dark:text-[#3D9B6E] font-semibold scale-105'
                  : 'text-[#6B756F] dark:text-[#9AA59D] hover:text-[#1A1F1C] dark:hover:text-[#F0F2F0]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.badge !== null && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
