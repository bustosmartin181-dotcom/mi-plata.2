import { ExpenseItem } from '../types';

/**
 * Mercado Pago deep link and bill payment router
 */

export interface MPPaymentOption {
  type: 'deep_link' | 'web' | 'alias' | 'barcode' | 'service';
  title: string;
  url: string;
  description: string;
}

export const COMMON_SERVICES = [
  { name: 'Edenor', category: 'Luz', code: 'edenor' },
  { name: 'Edesur', category: 'Luz', code: 'edesur' },
  { name: 'Metrogas', category: 'Gas', code: 'metrogas' },
  { name: 'Naturgy', category: 'Gas', code: 'naturgy' },
  { name: 'AySA', category: 'Agua', code: 'aysa' },
  { name: 'Telecom / Personal / Flow', category: 'Internet', code: 'personal' },
  { name: 'Claro', category: 'Telefonía', code: 'claro' },
  { name: 'Movistar', category: 'Telefonía', code: 'movistar' },
  { name: 'Telecentro', category: 'Internet', code: 'telecentro' },
  { name: 'ARBA / Rentas', category: 'Impuestos', code: 'arba' },
  { name: 'AFIP / Monotributo', category: 'Impuestos', code: 'afip' },
  { name: 'Expensas', category: 'Vivienda', code: 'expensas' },
];

/**
 * Creates optimal links for paying a bill in Mercado Pago
 */
export function getMercadoPagoActions(item: ExpenseItem) {
  const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  // 1. If explicit checkout/payment link exists
  if (item.mpLink && item.mpLink.trim().startsWith('http')) {
    return {
      primaryActionText: 'Abrir pago en Mercado Pago',
      primaryUrl: item.mpLink.trim(),
      type: 'custom_link',
      isApp: false,
    };
  }

  // 2. Mobile Deep Link vs Web Link
  // On mobile devices, attempts to launch Mercado Pago native app; fallbacks seamlessly to web
  const appDeepLink = 'mercadopago://services/pay';
  const webServicesUrl = 'https://www.mercadopago.com.ar/services';

  return {
    primaryActionText: isMobile ? 'Pagar en Mercado Pago App' : 'Abrir Mercado Pago',
    primaryUrl: isMobile ? appDeepLink : webServicesUrl,
    fallbackUrl: webServicesUrl,
    type: 'services_hub',
    isApp: isMobile,
  };
}

/**
 * Triggers payment redirection to Mercado Pago
 */
export async function launchMercadoPago(item: ExpenseItem, onSuccess?: () => void) {
  const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  const actions = getMercadoPagoActions(item);

  // If there's a barcode or alias, copy it first so the user can easily paste inside Mercado Pago
  if (item.barcode) {
    try {
      await navigator.clipboard.writeText(item.barcode);
    } catch (_) {}
  } else if (item.mpAlias) {
    try {
      await navigator.clipboard.writeText(item.mpAlias);
    } catch (_) {}
  }

  if (isMobile && actions.isApp) {
    // Attempt deep link launch
    const start = Date.now();
    window.location.href = actions.primaryUrl;

    // Fallback if app is not installed
    setTimeout(() => {
      if (Date.now() - start < 1500) {
        window.open(actions.fallbackUrl, '_blank', 'noopener,noreferrer');
      }
    }, 800);
  } else {
    window.open(actions.primaryUrl, '_blank', 'noopener,noreferrer');
  }

  if (onSuccess) {
    onSuccess();
  }
}
