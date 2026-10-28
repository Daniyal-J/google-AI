/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DoseStatus, MedicationLog } from '../types';

/**
 * Returns current date in YYYY-MM-DD format
 */
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current time in HH:mm (24-hour format)
 */
export function getCurrentTimeString(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Converts HH:mm or ISO timestamp into user's 12h or 24h preference
 */
export function formatTimeDisplay(timeStr: string | undefined, format: '12h' | '24h' = '12h'): string {
  if (!timeStr) return '--:--';

  let hours = 0;
  let minutes = 0;

  if (timeStr.includes('T')) {
    const d = new Date(timeStr);
    hours = d.getHours();
    minutes = d.getMinutes();
  } else if (timeStr.includes(':')) {
    const parts = timeStr.split(':');
    hours = parseInt(parts[0], 10) || 0;
    minutes = parseInt(parts[1], 10) || 0;
  } else {
    return timeStr;
  }

  if (format === '24h') {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Format a YYYY-MM-DD string into friendly date (e.g. "Tuesday, Oct 27, 2026")
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a YYYY-MM-DD string into short form (e.g. "Oct 27")
 */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get weekday letter (e.g. 'M', 'T', 'W')
 */
export function getWeekdayShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'narrow' });
}

/**
 * Friendly greeting based on hour of day
 */
export function getGreeting(name?: string): { greeting: string; subtext: string } {
  const hour = new Date().getHours();
  const userName = name && name.trim() ? name.trim() : '';
  const nameSuffix = userName ? `, ${userName}` : '';

  if (hour >= 4 && hour < 12) {
    return {
      greeting: `Good morning${nameSuffix}!`,
      subtext: "Let's take care of you today.",
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: `Good afternoon${nameSuffix}!`,
      subtext: 'Stay hydrated and check in on your routine.',
    };
  } else if (hour >= 17 && hour < 22) {
    return {
      greeting: `Good evening${nameSuffix}!`,
      subtext: 'Time to wrap up evening doses and prepare for rest.',
    };
  } else {
    return {
      greeting: `Good night${nameSuffix}!`,
      subtext: 'Ensure bedtime check is done and rest well.',
    };
  }
}

/**
 * Compute the clinical status of a medication schedule on a specific date.
 * Strictly respects:
 * - Taken
 * - Skipped
 * - Uncertain
 * - Due (scheduled within ±60 mins)
 * - Upcoming (in the future today)
 * - Unconfirmed (past scheduled time, never confirmed — NOT labeled definitely missed)
 */
export function computeDoseStatus(
  scheduledTime: string,
  log?: MedicationLog,
  targetDateStr: string = getTodayString()
): DoseStatus {
  if (log) {
    if (log.status === 'taken') return 'taken';
    if (log.status === 'skipped') return 'skipped';
    if (log.status === 'uncertain') return 'uncertain';
  }

  const todayStr = getTodayString();
  if (targetDateStr > todayStr) {
    return 'upcoming';
  }

  if (targetDateStr < todayStr) {
    return 'unconfirmed';
  }

  // Target date is today
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [schedH, schedM] = scheduledTime.split(':').map(Number);
  const schedMinutes = (schedH || 0) * 60 + (schedM || 0);

  const diff = currentMinutes - schedMinutes;

  if (diff < -45) {
    return 'upcoming';
  } else if (diff >= -45 && diff <= 90) {
    return 'due';
  } else {
    return 'unconfirmed';
  }
}

/**
 * Add or subtract days to a YYYY-MM-DD string
 */
export function offsetDate(dateStr: string, offset: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayStr = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayStr}`;
}
