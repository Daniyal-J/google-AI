/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  Clock,
  Plus,
  ShieldAlert,
  Volume2,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ReminderConfig, UserProfile } from '../../types';
import { formatTimeDisplay } from '../../utils/date';
import { notifications } from '../../services/notifications';

interface RemindersViewProps {
  profile: UserProfile;
  reminders: ReminderConfig[];
  onToggleReminder: (id: string, enabled: boolean) => void;
  onSaveReminder: (reminder: ReminderConfig) => void;
  onDeleteReminder: (id: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const RemindersView: React.FC<RemindersViewProps> = ({
  profile,
  reminders,
  onToggleReminder,
  onSaveReminder,
  onDeleteReminder,
}) => {
  const [permissionState, setPermissionState] = useState(notifications.getPermission());
  const [editingReminder, setEditingReminder] = useState<ReminderConfig | null>(null);

  // Edit / Add modal state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReminderConfig['category']>('morning_insulin');
  const [time, setTime] = useState('08:00');
  const [repeatDays, setRepeatDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [notes, setNotes] = useState('');

  const requestPermission = async () => {
    const res = await notifications.requestPermission();
    setPermissionState(res);
    if (res === 'granted') {
      notifications.sendNotification(
        'My DiaCare: Notifications Enabled',
        'You will receive reminders when this tab is open in your browser.'
      );
    }
  };

  const handleTestSound = () => {
    notifications.playChime();
    notifications.sendNotification(
      'Test Reminder Chime',
      'This is how reminder alerts sound in My DiaCare.'
    );
  };

  const openEdit = (rem?: ReminderConfig) => {
    if (rem) {
      setEditingReminder(rem);
      setTitle(rem.title);
      setCategory(rem.category);
      setTime(rem.time);
      setRepeatDays(rem.repeatDays || [0, 1, 2, 3, 4, 5, 6]);
      setNotes(rem.notes || '');
    } else {
      setEditingReminder({
        id: `rem-${Date.now()}`,
        title: '',
        category: 'glucose_check',
        time: '12:00',
        enabled: true,
        repeatDays: [0, 1, 2, 3, 4, 5, 6],
      });
      setTitle('');
      setCategory('glucose_check');
      setTime('12:00');
      setRepeatDays([0, 1, 2, 3, 4, 5, 6]);
      setNotes('');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSaveReminder({
      id: editingReminder ? editingReminder.id : `rem-${Date.now()}`,
      title: title.trim(),
      category,
      time,
      enabled: editingReminder ? editingReminder.enabled : true,
      repeatDays,
      notes: notes.trim() || undefined,
    });

    setEditingReminder(null);
  };

  const toggleDay = (dayIndex: number) => {
    if (repeatDays.includes(dayIndex)) {
      if (repeatDays.length > 1) {
        setRepeatDays(repeatDays.filter((d) => d !== dayIndex));
      }
    } else {
      setRepeatDays([...repeatDays, dayIndex].sort());
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400">
              <Bell className="w-4 h-4" />
              <span>Smart Schedule Alerts</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              Medication & Task Reminders
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Set dedicated alerts for morning insulin, basal injections, tablets, and glucose checks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestSound}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors min-h-[44px] flex items-center gap-1.5"
              title="Test audio chime"
            >
              <Volume2 className="w-4 h-4" />
              Test Chime
            </button>
            <button
              onClick={() => openEdit()}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors min-h-[44px] flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              + Add Reminder
            </button>
          </div>
        </div>

        {/* Browser Permission & Delivery Reality Banner */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
              <BellRing className="w-4 h-4 text-sky-600" />
              <span>Browser Notification Status: {permissionState.toUpperCase()}</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
              Technical notice: Web notifications trigger when this browser tab is running. As a safety safeguard, dismissing a reminder alert will <strong>never</strong> automatically mark medication as taken.
            </p>
          </div>

          {permissionState !== 'granted' && permissionState !== 'unsupported' && (
            <button
              onClick={requestPermission}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold hover:bg-slate-800 transition-colors shrink-0 min-h-[40px]"
            >
              Enable Browser Alerts
            </button>
          )}
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          Active Reminders ({reminders.filter((r) => r.enabled).length} Enabled)
        </h2>

        <div className="space-y-2.5">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                rem.enabled
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                  : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onToggleReminder(rem.id, !rem.enabled)}
                  className={`w-6 h-6 mt-1 rounded-full border flex items-center justify-center transition-colors min-h-[24px] min-w-[24px] ${
                    rem.enabled
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'border-slate-300 dark:border-slate-600 hover:border-sky-500'
                  }`}
                  aria-label={rem.enabled ? 'Disable reminder' : 'Enable reminder'}
                >
                  {rem.enabled && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono tabular-nums text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {formatTimeDisplay(rem.time, profile.timeFormat)}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {rem.title}
                    </h3>
                  </div>

                  {rem.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {rem.notes}
                    </p>
                  )}

                  {/* Days indicator */}
                  <div className="flex items-center gap-1 pt-0.5">
                    {WEEKDAYS.map((w, idx) => (
                      <span
                        key={idx}
                        className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                          rem.repeatDays.includes(idx)
                            ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      >
                        {w[0]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => openEdit(rem)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                  title="Edit reminder"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteReminder(rem.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                  title="Delete reminder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit/Add Modal */}
      {editingReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Configure Reminder
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reminder Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Morning 30/70 Insulin, Post-meal check"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="morning_insulin">Morning Insulin</option>
                    <option value="other_morning_insulin">Other Morning Insulin</option>
                    <option value="morning_tablet">Morning Tablet</option>
                    <option value="evening_insulin">Evening Insulin</option>
                    <option value="glucose_check">Glucose Check</option>
                    <option value="personal_task">Personal Task</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reminder Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Repeat on Days
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAYS.map((w, idx) => {
                    const isSelected = repeatDays.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {w}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Injected before meal, drink water"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingReminder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 min-h-[40px]"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
