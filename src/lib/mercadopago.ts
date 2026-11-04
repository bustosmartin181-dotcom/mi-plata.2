import { ExpenseItem } from '../types';

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

export function getMercadoPagoActions(item: ExpenseItem) {
  if (item.mpLink && item.mpLink.trim().startsWith('http')) {
    return {
      url: item.mpLink.trim(),
      text: 'Abrir link de pago',
    };
  }

  const billNameLower = (item.n || '').toLowerCase();
  const matchedService = COMMON_SERVICES.find(s => 
    billNameLower.includes(s.code) || billNameLower.includes(s.name.toLowerCase())
  );

  if (matchedService) {
    return {
      url: matchedService.webUrl,
      text: `Pagar en portal de ${matchedService.name}`,
    };
  }

  // mercadopago:// es el comando directo para abrir la app instalada en Android
  return {
    url: 'mercadopago://',
    text: item.mpAlias ? 'Transferir en App de Mercado Pago' : 'Abrir App de Mercado Pago',
  };
}

export function launchMercadoPago(item: ExpenseItem, onSuccess?: () => void) {
  const actions = getMercadoPagoActions(item);

  // 1. Copia alias o código de barras
  if (item.mpAlias) {
    try {
      navigator.clipboard.writeText(item.mpAlias.trim());
    } catch (_) {}
  } else if (item.barcode) {
    try {
      navigator.clipboard.writeText(item.barcode.trim());
    } catch (_) {}
  }

  // 2. Orden nativa para APK / Capacitor: '_system' obliga a Android a salir y abrir la app
  try {
    window.open(actions.url, '_system');
  } catch (_) {
    window.location.href = actions.url;
  }

  if (onSuccess) {
    onSuccess();
  }
}
