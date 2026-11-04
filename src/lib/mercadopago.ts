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
 * Detecta qué tipo de pago es (Transferencia por Alias, Factura de Servicio o Link)
 */
export function getMercadoPagoActions(item: ExpenseItem) {
  const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  // CASO 1: Si tiene un link directo de pago
  if (item.mpLink && item.mpLink.trim().startsWith('http')) {
    return {
      primaryActionText: 'Abrir link de pago',
      primaryUrl: item.mpLink.trim(),
      fallbackUrl: item.mpLink.trim(),
      type: 'custom_link',
      isApp: false,
    };
  }

  // CASO 2: Si es una TRANSFERENCIA POR ALIAS / CVU / CBU (ej: Préstamo Mariela)
  if (item.mpAlias && item.mpAlias.trim()) {
    // Intent directo de Android para abrir la app oficial de Mercado Pago
    const androidIntentTransfer = 'intent://money_transfer#Intent;scheme=mercadopago;package=com.mercadopago.wallet;end';
    const deepLinkTransfer = 'mercadopago://money_transfer';
    const webTransfer = 'https://www.mercadopago.com.ar/';

    return {
      primaryActionText: 'Transferir en Mercado Pago',
      primaryUrl: isAndroid ? androidIntentTransfer : (isMobile ? deepLinkTransfer : webTransfer),
      fallbackUrl: webTransfer,
      type: 'alias_transfer',
      isApp: isMobile,
    };
  }

  // CASO 3: Si es una empresa de servicios conocida (ej: Telecom Personal)
  const billNameLower = (item.n || '').toLowerCase();
  const matchedService = COMMON_SERVICES.find(s => 
    billNameLower.includes(s.code) || billNameLower.includes(s.name.toLowerCase())
  );

  if (matchedService) {
    return {
      primaryActionText: `Pagar en portal oficial de ${matchedService.name}`,
      primaryUrl: matchedService.webUrl,
      fallbackUrl: matchedService.webUrl,
      type: 'service_portal',
      isApp: false,
    };
  }

  // CASO 4: Fallback genérico a Mercado Pago (NUNCA a /services)
  const androidIntentGeneral = 'intent://home#Intent;scheme=mercadopago;package=com.mercadopago.wallet;end';
  const generalUrl = 'https://www.mercadopago.com.ar/';

  return {
    primaryActionText: isMobile ? 'Abrir Mercado Pago' : 'Ir a Mercado Pago',
    primaryUrl: isAndroid ? androidIntentGeneral : generalUrl,
    fallbackUrl: generalUrl,
    type: 'general',
    isApp: isMobile,
  };
}

/**
 * Ejecuta la apertura y copia automáticamente los datos necesarios
 */
export async function launchMercadoPago(item: ExpenseItem, onSuccess?: () => void) {
  const actions = getMercadoPagoActions(item);

  // Copia el Alias o Código de barras para que lo pegues apenas se abra Mercado Pago
  if (item.mpAlias) {
    try {
      await navigator.clipboard.writeText(item.mpAlias.trim());
    } catch (_) {}
  } else if (item.barcode) {
    try {
      await navigator.clipboard.writeText(item.barcode.trim());
    } catch (_) {}
  }

  // Abre la URL correcta
  if (actions.primaryUrl.startsWith('intent://')) {
    window.location.href = actions.primaryUrl;
  } else {
    window.open(actions.primaryUrl, '_blank', 'noopener,noreferrer');
  }

  if (onSuccess) {
    onSuccess();
  }
}
