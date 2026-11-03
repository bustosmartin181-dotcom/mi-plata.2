import React from 'react';
import { User } from 'firebase/auth';
import { ShieldCheck, Cloud, CloudOff, Sun, Moon, Laptop, Smartphone, Download, User as UserIcon } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  user: User | null;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  e2eeActive: boolean;
  theme: 'auto' | 'claro' | 'oscuro';
  onToggleTheme: () => void;
  onOpenAuth: () => void;
  onOpenE2EE: () => void;
  onOpenFlutterInfo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  syncStatus,
  e2eeActive,
  theme,
  onToggleTheme,
  onOpenAuth,
  onOpenE2EE,
  onOpenFlutterInfo,
}) => {
  const { isInstallable, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 w-full bg-[#F5F1EB]/90 dark:bg-[#121614]/90 backdrop-blur-md border-b border-[#E5DFD6] dark:border-[#2A332E] px-4 py-2.5 transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* App Title & Badge */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1B6B4A] to-[#0F422D] flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-[#1B6B4A]/30">
            $
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-display font-extrabold text-lg tracking-tight text-[#1A1F1C] dark:text-[#F0F2F0] leading-none">
                Mi Plata
              </h1>
              <button
                onClick={onOpenFlutterInfo}
                className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#1B6B4A]/10 text-[#1B6B4A] dark:bg-[#3D9B6E]/20 dark:text-[#3D9B6E] hover:bg-[#1B6B4A]/20 transition flex items-center gap-1"
                title="Cómo instalar en el celular o generar el APK"
              >
                <span>Instalar / APK</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#6B756F] dark:text-[#9AA59D]">
              {/* Cloud Sync Status */}
              {syncStatus === 'synced' && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Cloud className="w-3 h-3" /> Nube activa
                </span>
              )}
              {syncStatus === 'syncing' && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium animate-pulse">
                  <Cloud className="w-3 h-3" /> Sincronizando...
                </span>
              )}
              {syncStatus === 'offline' && (
                <span className="flex items-center gap-1 text-[#6B756F] dark:text-[#9AA59D]">
                  <CloudOff className="w-3 h-3" /> Modo local
                </span>
              )}
              {e2eeActive && (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  • E2EE ✓
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {/* E2EE Lock Button */}
          <button
            onClick={onOpenE2EE}
            className={`p-1.5 rounded-full transition-colors ${
              e2eeActive
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'text-[#6B756F] hover:bg-[#EDE8E0] dark:text-[#9AA59D] dark:hover:bg-[#1C221F]'
            }`}
            title="Encriptación de Extremo a Extremo (E2EE)"
            aria-label="Seguridad E2EE"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-full text-[#6B756F] hover:bg-[#EDE8E0] dark:text-[#9AA59D] dark:hover:bg-[#1C221F] transition-colors"
            title={`Tema actual: ${theme}`}
            aria-label="Cambiar tema claro/oscuro"
          >
            {theme === 'claro' && <Sun className="w-4 h-4 text-amber-500" />}
            {theme === 'oscuro' && <Moon className="w-4 h-4 text-indigo-400" />}
            {theme === 'auto' && <Laptop className="w-4 h-4 text-[#1B6B4A] dark:text-[#3D9B6E]" />}
          </button>

          {/* PWA Install Button if available */}
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-[#1B6B4A] text-white hover:bg-[#145238] shadow-sm transition"
              title="Instalar App en el dispositivo"
            >
              <Download className="w-3 h-3" />
              <span>Instalar</span>
            </button>
          )}

          {isIOS && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-full border border-[#E5DFD6] dark:border-[#2A332E] text-[#1A1F1C] dark:text-[#F0F2F0] hover:bg-[#EDE8E0] dark:hover:bg-[#1C221F]"
              title="Instalar en iPhone"
            >
              <Smartphone className="w-3 h-3" />
              <span>iOS</span>
            </button>
          )}

          {/* User Account Avatar / Sign in */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded-full border border-[#E5DFD6] dark:border-[#2A332E] hover:bg-[#EDE8E0] dark:hover:bg-[#1C221F] transition"
            title={user ? `Conectado como ${user.email}` : 'Iniciar sesión con Google o Apple'}
          >
            {user && user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Avatar"
                className="w-6 h-6 rounded-full object-cover border border-[#1B6B4A]"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#E6F2EC] dark:bg-[#1E3328] flex items-center justify-center text-[#1B6B4A] dark:text-[#3D9B6E]">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="text-xs font-semibold max-w-[65px] truncate">
              {user ? (user.displayName ? user.displayName.split(' ')[0] : 'Cuenta') : 'Entrar'}
            </span>
          </button>
        </div>
      </div>

      {/* iOS Install Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1A211D] p-5 shadow-2xl border border-[#E5DFD6] dark:border-[#2A332E]">
            <h3 className="text-base font-bold text-[#1A1F1C] dark:text-[#F0F2F0] mb-2 font-display">
              Instalar Mi Plata en iPhone / iPad
            </h3>
            <p className="text-xs text-[#6B756F] dark:text-[#9AA59D] mb-4 leading-relaxed">
              1. En Safari, toca el botón de <strong>Compartir</strong> (ícono de caja con flecha arriba).<br />
              2. Desliza hacia abajo y selecciona <strong>«Agregar a Inicio»</strong>.<br />
              3. ¡Listo! La app funcionará en pantalla completa con modo oscuro y acceso instantáneo.
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#1B6B4A] text-white font-semibold text-sm hover:bg-[#145238] transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
