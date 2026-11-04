import { ExpenseItem } from '../types';

export interface MPPaymentOption {
  type: 'deep_link' | 'web' | 'alias' | 'barcode' | 'service';
  title: string;
  url: string;
  description: string;
}

export const COMMON_SERVICES = [
  { name: 'Telecom / Personal / Flow', code: 'personal', webUrl: 'https://www.personal.com.ar/pagar' },
  { name: 'Edenor', code: 'edenor', webUrl: 'https://pago.edenordigital.com/' },
  { name: 'Edesur', code: 'edesur', webUrl: 'https://www.edesur.com.ar/' },
  { name: 'Metrogas', code: 'metrogas', webUrl: 'https://pagos.metrogas.com.ar/' },
  { name: 'Naturgy', code: 'naturgy', webUrl: 'https://www.naturgy.com.ar/' },
  { name: 'AySA', code: 'aysa', webUrl: 'https://www.aysa.com.ar/' },
  { name: 'Claro', code: 'claro', webUrl: 'https://www.claro.com.ar/' },
  { name: 'Movistar', code: 'movistar', webUrl: 'https://www.movistar.com.ar/' },
  { name: 'Telecentro', code: 'telecentro', webUrl: 'https://telecentro.com.ar/' },
  { name: 'ARBA / Rentas', code: 'arba', webUrl: 'https://www.arba.gov.ar/' },
  { name: 'AFIP / Monotributo', code: 'afip', webUrl: 'https://www.afip.gob.ar/' },
];

/**
 * Genera el destino óptimo según el tipo de pago
 */
export function getMercadoPagoActions(item: ExpenseItem) {
  const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  // 1. Link de pago directo si existe
  if (item.mpLink && item.mpLink.trim().startsWith('http')) {
    return {
      primaryUrl: item.mpLink.trim(),
      isIntent: false,
    };
  }

  // 2. Si es una empresa de servicios pública (Telecom, Edenor, etc.)
  const billNameLower = (item.n || '').toLowerCase();
  const matchedService = COMMON_SERVICES.find(s => 
    billNameLower.includes(s.code) || billNameLower.includes(s.name.toLowerCase())
  );

  if (matchedService) {
    return {
      primaryUrl: matchedService.webUrl,
      isIntent: false,
    };
  }

  // 3. Si es Transferencia por Alias / CVU o Mercado Pago general
  // Usamos el Intent oficial de Android con fallback a la web si la app no está instalada
  if (isAndroid) {
    return {
      primaryUrl: 'intent://#Intent;package=com.mercadopago.wallet;scheme=mercadopago;S.browser_fallback_url=https%3A%2F%2Fwww.mercadopago.com.ar;end',
      isIntent: true,
    };
  }

  return {
    primaryUrl: isMobile ? 'mercadopago://' : 'https://www.mercadopago.com.ar/',
    isIntent: false,
  };
}

/**
 * Copia el dato y abre la app de forma instantánea sin bloqueos de navegador
 */
export function launchMercadoPago(item: ExpenseItem, onSuccess?: () => void) {
  // 1. Copiamos en segundo plano SIN bloquear la acción del usuario
  if (item.mpAlias) {
    try {
      navigator.clipboard.writeText(item.mpAlias.trim());
    } catch (_) {}
  } else if (item.barcode) {
    try {
      navigator.clipboard.writeText(item.barcode.trim());
    } catch (_) {}
  }

  // 2. Abrimos la aplicación inmediatamente en el hilo principal del clic
  const actions = getMercadoPagoActions(item);

  if (actions.isIntent) {
    window.location.href = actions.primaryUrl;
  } else {
    window.open(actions.primaryUrl, '_blank', 'noopener,noreferrer');
  }

  if (onSuccess) {
    onSuccess();
  }
}
