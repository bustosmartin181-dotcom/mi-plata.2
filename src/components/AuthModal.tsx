import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { loginWithGoogle, loginWithApple, logoutFirebase } from '../lib/firebase';
import { LogOut, Cloud, ShieldCheck, AlertCircle, X, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError('No se pudo iniciar sesión con Google. Revisa tu conexión o ventana emergente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithApple();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError('Inicio de sesión con Apple disponible en producción.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutFirebase();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1A211D] p-5 shadow-2xl border border-[#E5DFD6] dark:border-[#2A332E] relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#6B756F] hover:bg-[#EDE8E0] dark:text-[#9AA59D] dark:hover:bg-[#1C221F] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {user ? (
          /* User Logged In Profile */
          <div>
            <div className="flex items-center gap-3 mb-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Usuario'}
                  className="w-12 h-12 rounded-full border-2 border-[#1B6B4A] object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#E6F2EC] dark:bg-[#1E3328] flex items-center justify-center text-[#1B6B4A] dark:text-[#3D9B6E] font-bold text-lg">
                  {user.displayName ? user.displayName[0] : 'U'}
                </div>
              )}
              <div>
                <h3 className="font-display font-bold text-base text-[#1A1F1C] dark:text-[#F0F2F0]">
                  {user.displayName || 'Usuario Mi Plata'}
                </h3>
                <p className="text-xs text-[#6B756F] dark:text-[#9AA59D]">{user.email}</p>
              </div>
            </div>

            <div className="p-3 mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sincronización en tiempo real activa
              </div>
              <p className="text-[#6B756F] dark:text-[#9AA59D]">
                Tus finanzas se sincronizan automáticamente con Firebase Firestore en todos tus dispositivos móviles y web.
              </p>
            </div>

            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-2.5 rounded-xl border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        ) : (
          /* Sign In Screen */
          <div>
            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#E6F2EC] dark:bg-[#1E3328] flex items-center justify-center text-[#1B6B4A] dark:text-[#3D9B6E] mb-2 font-display font-bold text-2xl">
                ☁️
              </div>
              <h2 className="font-display font-bold text-lg text-[#1A1F1C] dark:text-[#F0F2F0]">
                Acceso Multiplataforma
              </h2>
              <p className="text-xs text-[#6B756F] dark:text-[#9AA59D] mt-1">
                Inicia sesión para sincronizar tus finanzas en Android, iOS y la web con Firebase.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 mb-4 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2.5">
              {/* Google Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl border border-[#E5DFD6] dark:border-[#2A332E] bg-white dark:bg-[#1A211D] hover:bg-[#F5F1EB] dark:hover:bg-[#121614] text-xs font-bold text-[#1A1F1C] dark:text-[#F0F2F0] flex items-center justify-center gap-2.5 shadow-sm transition disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </button>

              {/* Apple Button */}
              <button
                onClick={handleAppleLogin}
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 text-xs font-bold flex items-center justify-center gap-2.5 shadow-sm transition disabled:opacity-50"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-5.74-8.8-10.28-18.77-13.62-29.91-3.34-11.14-5.01-21.72-5.01-31.74 0-14.36 3.53-26.24 10.59-35.63 7.06-9.39 15.93-14.19 26.63-14.42 4.91 0 10.5 1.25 16.78 3.75 6.28 2.5 10.15 3.75 11.61 3.75 1.23 0 5.4-1.36 12.51-4.08 7.11-2.72 13.06-3.88 17.85-3.48 13.29.98 23.47 5.76 30.55 14.34-11.87 7.18-17.69 16.96-17.47 29.35.22 9.68 3.97 17.78 11.25 24.3 7.28 6.52 16.03 10.16 26.25 10.92-2.18 6.52-4.95 13.43-8.32 20.73zM119.22 31.84c0-7.72 2.76-14.94 8.28-21.65 5.52-6.71 12.39-10.19 20.61-10.19.22 1.09.33 2.07.33 2.94 0 7.61-2.92 14.94-8.76 21.98-5.84 7.04-12.87 10.87-21.09 11.48.22-1.3.42-2.58.63-4.56z" />
                </svg>
                <span>Continuar con Apple</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 text-xs text-[#6B756F] dark:text-[#9AA59D] hover:underline"
              >
                Seguir en modo local sin iniciar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
