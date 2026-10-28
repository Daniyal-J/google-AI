/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReminderConfig } from '../types';

export class NotificationService {
  private static instance: NotificationService;
  private intervalId: number | null = null;
  private lastTriggeredMinute: string = '';

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const res = await Notification.requestPermission();
      return res;
    } catch {
      return 'denied';
    }
  }

  /**
   * Play a gentle medical audio chime using Web Audio API (no external audio files needed)
   */
  public playChime(): void {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Gentle two-tone chime (F#5 -> A#5)
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(739.99, now); // F#5
      osc1.frequency.exponentialRampToValueAtTime(932.33, now + 0.15); // A#5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(369.99, now); // F#4

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.85);
      osc2.stop(now + 0.85);
    } catch {
      // AudioContext could be blocked by autoplay policies
    }
  }

  /**
   * Dispatch a browser notification
   * Note: As required by safety rules, dismissing a notification NEVER marks medication taken.
   */
  public sendNotification(title: string, body: string, onAction?: () => void): void {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }

    try {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'diacare-reminder',
        requireInteraction: true,
      });

      this.playChime();

      notif.onclick = () => {
        window.focus();
        if (onAction) onAction();
        notif.close();
      };
    } catch (e) {
      console.warn('Could not fire notification:', e);
    }
  }

  /**
   * Start in-tab periodic ticker to check active reminders
   */
  public startWatcher(
    getReminders: () => Promise<ReminderConfig[]>,
    onReminderDue: (reminder: ReminderConfig) => void
  ): void {
    if (this.intervalId) return;

    this.intervalId = window.setInterval(async () => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentH = String(now.getHours()).padStart(2, '0');
      const currentM = String(now.getMinutes()).padStart(2, '0');
      const timeKey = `${now.toDateString()} ${currentH}:${currentM}`;

      if (this.lastTriggeredMinute === timeKey) return;

      const reminders = await getReminders();
      const dueNow = reminders.filter(
        (r) =>
          r.enabled &&
          r.time === `${currentH}:${currentM}` &&
          r.repeatDays.includes(currentDay)
      );

      if (dueNow.length > 0) {
        this.lastTriggeredMinute = timeKey;
        for (const rem of dueNow) {
          onReminderDue(rem);
          this.sendNotification(
            `My DiaCare Reminder: ${rem.title}`,
            rem.notes || 'Time for your scheduled dose or check.'
          );
        }
      }
    }, 15000); // Check every 15 seconds
  }

  public stopWatcher(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const notifications = NotificationService.getInstance();
