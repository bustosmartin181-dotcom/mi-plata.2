import React, { useState } from 'react';
import { Smartphone, Download, Check, Copy, Terminal, ExternalLink, ShieldCheck, Layers, Sparkles, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ApkInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkInstallModal: React.FC<ApkInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'directo' | 'apk' | 'capacitor' | 'flutter'>('directo');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const bubblewrapCode = `# 1. Instalar la herramienta oficial de Google para crear APKs desde PWA
npm install -g @bubblewrap/cli

# 2. Inicializar el proyecto APK apuntando al manifest de Mi Plata
bubblewrap init --manifest https://ais-pre-n7o6yitbz25tb2tsvh4dxc-300994562804.us-west2.run.app/manifest.webmanifest

# 3. Compilar el archivo APK firmado para Android
bubblewrap build

# ¡Listo! Tendrás tu archivo app-release-signed.apk para instalar en cualquier teléfono Android.`;

  const capacitorCode = `# 1. Instalar Capacitor para Android en este proyecto
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Inicializar Capacitor
npx cap init "Mi Plata" "com.miplata.app" --web-dir dist

# 3. Compilar la app web y agregar la plataforma Android nativa
npm run build
npx cap add android

# 4. Abrir en Android Studio para generar el APK (Build > Build APK)
npx cap open android`;

  const flutterCode = `// lib/main.dart (Flutter Multiplataforma con WebView & Deep Link a Mercado Pago)
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

void main() => runApp(const MiPlataApp());

class MiPlataApp extends StatelessWidget {
  const MiPlataApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mi Plata',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(colorSchemeSeed: const Color(0xFF1B6B4A), useMaterial3: true),
      darkTheme: ThemeData.dark(useMaterial3: true),
      home: const MiPlataWebView(),
    );
  }
}

class MiPlataWebView extends StatefulWidget {
  const MiPlataWebView({super.key});
  @override
  State<MiPlataWebView> createState() => _MiPlataWebViewState();
}

class _MiPlataWebViewState extends State<MiPlataWebView> {
  late final WebViewController controller;

  @override
  void initState() {
    super.initState();
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: (request) {
          // Si el usuario toca pagar en Mercado Pago, abre la app nativa de MP
          if (request.url.startsWith('mercadopago://')) {
            launchUrl(Uri.parse(request.url), mode: LaunchMode.externalApplication);
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
      ))
      ..loadRequest(Uri.parse('https://ais-pre-n7o6yitbz25tb2tsvh4dxc-300994562804.us-west2.run.app'));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: WebViewWidget(controller: controller)),
    );
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1A211D] p-5 sm:p-6 shadow-2xl border border-[#E5DFD6] dark:border-[#2A332E] relative my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#6B756F] hover:bg-[#EDE8E0] dark:text-[#9AA59D] dark:hover:bg-[#1C221F] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-[#1B6B4A]/15 text-[#1B6B4A] dark:bg-[#3D9B6E]/20 dark:text-[#3D9B6E] flex items-center justify-center font-bold">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-[#1A1F1C] dark:text-[#F0F2F0] leading-tight">
              Instalación y Creación del APK
            </h2>
            <span className="text-xs text-[#6B756F] dark:text-[#9AA59D]">
              Opciones para Android Puro, iOS y compilación nativa
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-2xl p-1 bg-[#EDE8E0] dark:bg-[#1C221F] border border-[#E5DFD6] dark:border-[#2A332E] mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('directo')}
            className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
              activeTab === 'directo'
                ? 'bg-white dark:bg-[#1A211D] text-[#1A1F1C] dark:text-[#F0F2F0] shadow-sm'
                : 'text-[#6B756F] dark:text-[#9AA59D]'
            }`}
          >
            1. En Celular (WebAPK)
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
              activeTab === 'apk'
                ? 'bg-white dark:bg-[#1A211D] text-[#1A1F1C] dark:text-[#F0F2F0] shadow-sm'
                : 'text-[#6B756F] dark:text-[#9AA59D]'
            }`}
          >
            2. GitHub Actions (ZIP)
          </button>
          <button
            onClick={() => setActiveTab('capacitor')}
            className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
              activeTab === 'capacitor'
                ? 'bg-white dark:bg-[#1A211D] text-[#1A1F1C] dark:text-[#F0F2F0] shadow-sm'
                : 'text-[#6B756F] dark:text-[#9AA59D]'
            }`}
          >
            3. Bubblewrap / CLI
          </button>
          <button
            onClick={() => setActiveTab('flutter')}
            className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
              activeTab === 'flutter'
                ? 'bg-white dark:bg-[#1A211D] text-[#1A1F1C] dark:text-[#F0F2F0] shadow-sm'
                : 'text-[#6B756F] dark:text-[#9AA59D]'
            }`}
          >
            4. Flutter Nativo
          </button>
        </div>

        {/* Tab Contents */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-3 text-xs leading-relaxed text-[#6B756F] dark:text-[#9AA59D]">
          {/* TAB 1: Instalación Directa en el Celular */}
          {activeTab === 'directo' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[#1A1F1C] dark:text-[#F0F2F0]">
                <h4 className="font-bold text-sm text-[#1B6B4A] dark:text-[#3D9B6E] flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-4 h-4" /> La forma más rápida (Recomendada)
                </h4>
                <p className="text-xs text-[#6B756F] dark:text-[#9AA59D]">
                  Android genera automáticamente un <strong>WebAPK real</strong> en tu teléfono sin necesidad de descargar archivos sospechosos ni activar fuentes desconocidas:
                </p>

                {isInstalled ? (
                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>¡Mi Plata ya está instalada como app independiente en este dispositivo!</span>
                  </div>
                ) : isInstallable ? (
                  <button
                    onClick={install}
                    className="mt-3 w-full py-3 rounded-xl bg-[#1B6B4A] hover:bg-[#145238] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instalar Mi Plata ahora en mi teléfono</span>
                  </button>
                ) : null}
              </div>

              {/* Instructions steps */}
              <div className="space-y-2">
                <div className="p-3 rounded-2xl bg-[#F5F1EB] dark:bg-[#121614] border border-[#E5DFD6] dark:border-[#2A332E]">
                  <strong className="text-[#1A1F1C] dark:text-[#F0F2F0] block mb-1">
                    📱 En Android (Google Chrome / Brave / Samsung Internet):
                  </strong>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                    <li>Abre el link de la app en tu teléfono: <span className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">ais-pre-n7o6yitbz25tb2tsvh4dxc-300994562804.us-west2.run.app</span></li>
                    <li>Toca los tres puntos <strong>(⋮)</strong> de arriba a la derecha.</li>
                    <li>Selecciona <strong>«Instalar aplicación»</strong> o <strong>«Agregar a la pantalla principal»</strong>.</li>
                    <li>Aparecerá el ícono de <strong>Mi Plata</strong> en tu cajón de aplicaciones de Android puro. Al abrirla, corre en pantalla completa sin barra de navegación.</li>
                  </ol>
                </div>

                <div className="p-3 rounded-2xl bg-[#F5F1EB] dark:bg-[#121614] border border-[#E5DFD6] dark:border-[#2A332E]">
                  <strong className="text-[#1A1F1C] dark:text-[#F0F2F0] block mb-1">
                    🍎 En iPhone / iPad (Safari):
                  </strong>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                    <li>Abre el link en Safari.</li>
                    <li>Toca el botón <strong>Compartir</strong> (ícono cuadrado con flecha hacia arriba).</li>
                    <li>Toca <strong>«Agregar a inicio»</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GitHub Actions (Compilar APK en la nube sin Android Studio) */}
          {activeTab === 'apk' && (
            <div className="space-y-3">
              {/* Direct ZIP Download Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1B6B4A]/10 to-[#0F422D]/5 border border-[#1B6B4A]/30">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-[#1B6B4A] dark:text-[#3D9B6E] flex items-center gap-1.5">
                      <Download className="w-4 h-4" /> Proyecto ZIP Completo para GitHub Actions
                    </h4>
                    <p className="text-[11px] text-[#6B756F] dark:text-[#9AA59D] mt-0.5">
                      Incluye los 49 archivos de código fuente, la lógica financiera, el flujo de Mercado Pago y el workflow de compilación.
                    </p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/mi-plata-github-actions.zip');
                      if (!res.ok) throw new Error('Error al obtener ZIP');
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'mi-plata-github-actions.zip';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                    } catch (e) {
                      window.location.href = '/mi-plata-github-actions.zip';
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#1B6B4A] hover:bg-[#145238] active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivos del Proyecto (.zip)</span>
                </button>
              </div>

              {/* ¿Qué archivos necesita GitHub Actions? */}
              <div className="p-3.5 rounded-2xl bg-[#F5F1EB] dark:bg-[#121614] border border-[#E5DFD6] dark:border-[#2A332E] space-y-2 text-[11px]">
                <strong className="text-xs text-[#1A1F1C] dark:text-[#F0F2F0] block">
                  ⚠️ ¿Por qué se necesitan todos los archivos en GitHub?
                </strong>
                <p className="text-[#6B756F] dark:text-[#9AA59D]">
                  Para crear el APK, GitHub Actions ejecuta <code className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">npm run build</code>, por lo que necesita el código fuente para generar la interfaz:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[#1A1F1C] dark:text-[#F0F2F0]">
                  <li><span className="font-mono font-semibold">package.json</span> (define las librerías: React, Tailwind, Capacitor).</li>
                  <li><span className="font-mono font-semibold">src/</span> (todo el código de la app: vistas, botón de Mercado Pago, cifrado E2EE, cálculo de presupuesto).</li>
                  <li><span className="font-mono font-semibold">public/</span> (los íconos de la app para Android).</li>
                  <li><span className="font-mono font-semibold">index.html, vite.config.ts, tsconfig.json</span> (motor de compilación).</li>
                  <li><span className="font-mono font-semibold">capacitor.config.json & .github/...</span> (los que ya creaste).</li>
                </ul>
              </div>

              {/* Instructions Steps */}
              <div className="p-3.5 rounded-2xl bg-[#F5F1EB] dark:bg-[#121614] border border-[#E5DFD6] dark:border-[#2A332E] space-y-2 text-[11px]">
                <strong className="text-xs text-[#1A1F1C] dark:text-[#F0F2F0] block">
                  Cómo subir los archivos a GitHub sin consola:
                </strong>
                <ol className="list-decimal pl-4 space-y-1.5">
                  <li>
                    Descarga el <strong>ZIP</strong> con el botón verde de arriba y descomprímelo en tu computadora o celular.
                  </li>
                  <li>
                    En tu repositorio de GitHub, haz clic en el botón <strong>«Add file»</strong> &gt; <strong>«Upload files»</strong>.
                  </li>
                  <li>
                    Arrastra todos los archivos y carpetas extraídos (<code className="font-mono">src</code>, <code className="font-mono">public</code>, <code className="font-mono">package.json</code>, etc.) y haz clic en <strong>«Commit changes»</strong>.
                  </li>
                  <li>
                    Ve a la pestaña <strong>«Actions»</strong> arriba, selecciona <strong>«Compilar APK Android (Mi Plata)»</strong> y toca <strong>«Run workflow»</strong>.
                  </li>
                  <li>
                    En ~3 minutos, en la sección <strong>Artifacts</strong> tendrás tu archivo <code className="font-mono font-bold text-emerald-600">app-debug.apk</code> listo para instalar en tu teléfono.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: Capacitor / Android Studio */}
          {activeTab === 'capacitor' && (
            <div className="space-y-3">
              <p>
                Si quieres abrir el proyecto en <strong>Android Studio</strong> y compilar un APK nativo tradicional con Gradle:
              </p>

              <div className="relative">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#1A1F1C] dark:text-[#F0F2F0] mb-1">
                  <span className="flex items-center gap-1 font-mono">
                    <Terminal className="w-3.5 h-3.5" /> Pasos Capacitor
                  </span>
                  <button
                    onClick={() => copyToClipboard(capacitorCode, 'capacitor')}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-[#E5DFD6] dark:border-[#2A332E] hover:bg-[#EDE8E0] dark:hover:bg-[#1C221F]"
                  >
                    {copiedCode === 'capacitor' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === 'capacitor' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-2xl bg-[#121614] text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed border border-[#2A332E]">
                  {capacitorCode}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: Flutter Nativo */}
          {activeTab === 'flutter' && (
            <div className="space-y-3">
              <p>
                Si tienes instalado el <strong>Flutter SDK</strong> en tu computadora y deseas compilar el APK con <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono">flutter build apk</code>, puedes usar este wrapper que incluye el soporte nativo para los deep links de Mercado Pago:
              </p>

              <div className="relative">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#1A1F1C] dark:text-[#F0F2F0] mb-1">
                  <span className="flex items-center gap-1 font-mono">
                    <Terminal className="w-3.5 h-3.5" /> lib/main.dart
                  </span>
                  <button
                    onClick={() => copyToClipboard(flutterCode, 'flutter')}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-[#E5DFD6] dark:border-[#2A332E] hover:bg-[#EDE8E0] dark:hover:bg-[#1C221F]"
                  >
                    {copiedCode === 'flutter' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === 'flutter' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-2xl bg-[#121614] text-emerald-400 font-mono text-[10.5px] overflow-x-auto leading-relaxed border border-[#2A332E] max-h-52">
                  {flutterCode}
                </pre>
              </div>

              <div className="p-3 rounded-2xl bg-[#F5F1EB] dark:bg-[#121614] border border-[#E5DFD6] dark:border-[#2A332E] text-[11px]">
                Luego solo ejecutas: <code className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">flutter build apk --release</code> y obtendrás el APK en <code className="font-mono">build/app/outputs/flutter-apk/app-release.apk</code>.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-[#E5DFD6] dark:border-[#2A332E] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#1B6B4A] hover:bg-[#145238] text-white font-bold text-xs transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
