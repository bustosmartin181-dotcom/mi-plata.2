import { ExpenseItem } from '../types';
import { numeroDeDia, hoyISO } from './calculator';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function sendLocalNotification(title: string, body: string, icon = '/icon.svg') {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon,
        badge: '/icon.svg',
      });
    } catch (_) {
      // Notification constructor might fail in certain mobile iframe contexts
    }
  }

  // Also trigger haptic feedback if available
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([150, 80, 150]);
    } catch (_) {}
  }
}

/**
 * Checks pending bills for upcoming due dates and alerts the user
 */
export function checkBillDueDates(items: ExpenseItem[]): { bill: ExpenseItem; daysLeft: number }[] {
  const todayNum = numeroDeDia(hoyISO());
  const dueBills: { bill: ExpenseItem; daysLeft: number }[] = [];

  for (const item of items) {
    if (item.p) continue; // Already paid
    if (!item.dueDate) continue;

    const dueNum = numeroDeDia(item.dueDate);
    const diff = dueNum - todayNum;

    if (diff >= 0 && diff <= 3) {
      dueBills.push({ bill: item, daysLeft: diff });
    }
  }

  return dueBills;
}

export function playAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (_) {}
}
