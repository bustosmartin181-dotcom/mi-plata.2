import React, { useState } from 'react';
import { Smartphone, Check, Copy, Code, Layers, Sparkles, X } from 'lucide-react';

interface FlutterGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlutterGuideModal: React.FC<FlutterGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

  const flutterArchitectureCode = `// lib/models/mi_plata_state.dart
import 'package:flutter/foundation.dart';

class ExpenseItem {
  final String name;
  final double amount;
  final bool isPaid;
  final String? mpCategory;
  final String? barcode;
  final String? mpAlias;
  final String? mpLink;
  final String? dueDate;

  ExpenseItem({
    required this.name,
    required this.amount,
    required this.isPaid,
    this.mpCategory,
    this.barcode,
    this.mpAlias,
    this.mpLink,
    this.dueDate,
  });

  Map<String, dynamic> toMap() => {
    'name': name,
    'amount': amount,
    'isPaid': isPaid,
    'mpCategory': mpCategory,
    'barcode': barcode,
    'mpAlias': mpAlias,
    'mpLink': mpLink,
    'dueDate': dueDate,
  };
}

// Mercado Pago Deep Link Launcher in Flutter:
// url_launcher: ^6.3.0
// launchUrl(Uri.parse('mercadopago://services/pay'), mode: LaunchMode.externalApplication);
`;

  const copyCode = () => {
    navigator.clipboard.writeText(flutterArchitectureCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1A211D] p-5 shadow-2xl border border-[#E5DFD6] dark:border-[#2A332E] relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#6B756F] hover:bg-[#EDE8E0] dark:text-[#9AA59D] dark:hover:bg-[#1C221F] transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-bold">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-[#1A1F1C] dark:text-[#F0F2F0]">
              Soporte Multiplataforma
            </h2>
            <span className="text-[11px] text-[#6B756F] dark:text-[#9AA59D]">
              Android Puro • iOS Nativo • Web
            </span>
          </div>
        </div>

        <div className="space-y-3 text-xs text-[#6B756F] dark:text-[#9AA59D] leading-relaxed mb-4">
          <div className="p-3 rounded-2xl bg-[#E6F2EC] dark:bg-[#1E3328] text-[#1A1F1C] dark:text-[#F0F2F0]">
            <h4 className="font-bold text-[#1B6B4A] dark:text-[#3D9B6E] flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4" /> ¿Cómo funciona en tu teléfono hoy?
            </h4>
            <p className="text-[11px]">
              Esta aplicación está diseñada con <strong>arquitectura PWA de alta fidelidad</strong> (Progressive Web App) con el mismo comportamiento que una app de Flutter:
            </p>
            <ul className="list-disc pl-4 mt-1.5 space-y-1 text-[11px]">
              <li><strong>Android Puro:</strong> Se instala como WebAPK independiente en tu pantalla de inicio con ícono nativo, pantalla completa (standalone) y modo offline.</li>
              <li><strong>iOS (iPhone/iPad):</strong> Compatible con Apple Web App, barra de estado integrada y safe-area insets.</li>
              <li><strong>Mercado Pago:</strong> Deriva mediante deep links nativos a la app de Mercado Pago instalada en tu Android/iOS.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-[#1A1F1C] dark:text-[#F0F2F0] flex items-center gap-1">
                <Code className="w-3.5 h-3.5" /> Modelo Dart / Flutter
              </span>
              <button
                onClick={copyCode}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-[#E5DFD6] dark:border-[#2A332E] text-[11px]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado' : 'Copiar Dart'}</span>
              </button>
            </div>
            <pre className="p-2.5 rounded-xl bg-[#121614] text-emerald-400 font-mono text-[10px] overflow-x-auto max-h-36">
              {flutterArchitectureCode}
            </pre>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#1B6B4A] text-white font-semibold text-xs hover:bg-[#145238] transition"
        >
          ¡Excelente, continuar usando la app!
        </button>
      </div>
    </div>
  );
};
