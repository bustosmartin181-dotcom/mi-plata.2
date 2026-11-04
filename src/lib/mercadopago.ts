import { ExpenseItem } from '../types';

export interface MPPaymentOption {
  type: 'deep_link' | 'web' | 'alias' | 'barcode' | 'service';
  title: string;
  url: string;
  description: string;
}

export const COMMON_SERVICES = [
  { name: 'Edenor', category: 'Luz', code: 'edenor', webUrl: 'https://pago.edenordigital.com/' },
  { name: 'Edesur', category: 'Luz', code: 'edesur', webUrl: 'https://www.edesur.com.ar/' },
  { name: 'Metrogas', category: 'Gas', code: 'metrogas', webUrl: 'https://pagos.metrogas.com.ar/' },
  { name: 'Naturgy', category: 'Gas', code: 'naturgy', webUrl: 'https://www.naturgy.com.ar/' },
  { name: 'AySA', category: 'Agua', code: 'aysa', webUrl: 'https://www.aysa.com.ar/' },
  { name: 'Telecom / Personal / Flow', category: 'Internet', code: 'personal', webUrl: 'https://www.personal.com.ar/pagar' },
  { name: 'Claro', category: 'Telefonía', code: 'claro', webUrl: 'https://www.claro.com.ar/' },
  { name: 'Movistar', category: 'Telefonía', code: 'movistar', webUrl: 'https://www.movistar.com.ar/' },
  { name: 'Telecentro', category: 'Internet', code: 'telecentro', webUrl: 'https://telecentro.com.ar/' },
  { name: 'ARBA / Rentas', category: 'Impuestos', code: 'arba', webUrl: 'https://www.arba.gov.ar/' },
  { name: 'AFIP / Monotributo', category: 'Impuestos', code: 'afip', webUrl: 'https://www.afip.gob.ar/' },
  { name: 'Expensas', category: 'Vivienda', code: 'expensas', webUrl: 'https://www.mercadopago.com.ar/' },
];

/**
 * Genera enlaces óptimos evitando errores 404 en la web de Mercado Pago
 */
export function getMercadoPagoActions(item: ExpenseItem) {
  const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  // 1. Si tiene link de pago directo personalizado
  if (item.mpLink && item.mpLink.trim().startsWith('http')) {
    return {
      primaryActionText: 'Abrir enlace de pago',
      primaryUrl: item.mpLink.trim(),
      type: 'custom_link',
      isApp: false,
    };
  }

  // 2. Si coincide con alguna empresa conocida (ej: Telecom Personal)
  const billNameLower = (item.n || '').toLowerCase();
  const matchedService = COMMON_SERVICES.find(s => 
    billNameLower.includes(s.code) || billNameLower.includes(s.name.toLowerCase())
  );

  const appDeepLink = 'mercadopago://services/pay';
  const webServicesUrl = matchedService?.webUrl || 'https://www.mercadopago.com.ar/';

  return {
    primaryActionText: isMobile ? 'Pagar en Mercado Pago App' : 'Abrir portal de pago',
    primaryUrl: isMobile ? appDeepLink : webServicesUrl,
    fallbackUrl: webServicesUrl,
    type: 'services_hub',
    isApp: isMobile,
  };
}

/**
 * Dispara la redirección sin romper la navegación
 */
export async function launchMercadoPago(item: ExpenseItem, onSuccess?: () => void) {
  const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  const actions = getMercadoPagoActions(item);

  // Copia el código de barra o alias al portapapeles automáticamente
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
    const start = Date.now();
    window.location.href = actions.primaryUrl;

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
