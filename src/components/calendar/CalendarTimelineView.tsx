/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Syringe,
  Pill,
  Activity,
  CheckSquare,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import {
  GlucoseReading,
  MedicationLog,
  MedicationSchedule,
  TaskItem,
  UserProfile,
} from '../../types';
import {
  formatDateDisplay,
  formatTimeDisplay,
  getTodayString,
  getWeekdayShort,
  offsetDate,
} from '../../utils/date';
import { formatGlucoseValue, getContextLabel } from '../../utils/glucose';

interface CalendarTimelineViewProps {
  profile: UserProfile;
  schedules: MedicationSchedule[];
  logs: MedicationLog[];
  readings: GlucoseReading[];
  tasks: TaskItem[];
  onOpenLogInsulin: () => void;
  onOpenLogTablet: () => void;
  onOpenLogGlucose: () => void;
  onOpenAddTask: (defaultDate?: string) => void;
}

export const CalendarTimelineView: React.FC<CalendarTimelineViewProps> = ({
  profile,
  schedules,
  logs,
  readings,
  tasks,
  onOpenLogInsulin,
  onOpenLogTablet,
  onOpenLogGlucose,
  onOpenAddTask,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  // Quick 7-day strip centered on selected date
  const weekStrip = useMemo(() => {
    const dates: string[] = [];
    for (let i = -3; i <= 3; i++) {
      dates.push(offsetDate(selectedDate, i));
    }
    return dates;
  }, [selectedDate]);

  // Items for the selected date
  const selectedDateLogs = useMemo(() => {
    return logs.filter((l) => l.date === selectedDate);
  }, [logs, selectedDate]);

  const selectedDateReadings = useMemo(() => {
    return readings.filter((r) => r.date === selectedDate);
  }, [readings, selectedDate]);

  const selectedDateTasks = useMemo(() => {
    return tasks.filter((t) => t.date === selectedDate);
  }, [tasks, selectedDate]);

  // Combine into single chronological timeline
  const combinedTimeline = useMemo(() => {
    const items: Array<{
      id: string;
      timeStr: string;
      category: 'insulin' | 'tablet' | 'glucose' | 'task';
      title: string;
      details: string;
      badgeText: string;
      badgeColor: string;
    }> = [];

    // Medication logs
    for (const l of selectedDateLogs) {
      let time = '12:00';
      if (l.recordedAt) {
        const d = new Date(l.recordedAt);
        time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }

      items.push({
        id: `log-${l.id}`,
        timeStr: time,
        category: l.medicationType,
        title: l.medicationName,
        details: `${l.actualDose} ${l.unit}${l.injectionSite ? ` · ${l.injectionSite.replace('-', ' ')}` : ''}${
          l.notes ? ` · "${l.notes}"` : ''
        }`,
        badgeText: l.status === 'taken' ? 'Confirmed Taken' : l.status === 'skipped' ? 'Skipped' : 'Uncertain',
        badgeColor:
          l.status === 'taken'
            ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
            : l.status === 'skipped'
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
      });
    }

    // Glucose readings
    for (const r of selectedDateReadings) {
      const g = formatGlucoseValue(r.readingMgDl, profile.glucoseUnit);
      items.push({
        id: `glu-${r.id}`,
        timeStr: r.time,
        category: 'glucose',
        title: `Blood Glucose: ${g.value} ${g.unit}`,
        details: `${getContextLabel(r.context)}${r.notes ? ` · "${r.notes}"` : ''}`,
        badgeText: 'Glucose Check',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      });
    }

    // Tasks
    for (const t of selectedDateTasks) {
      items.push({
        id: `tsk-${t.id}`,
        timeStr: t.time || '12:00',
        category: 'task',
        title: t.title,
        details: `${t.category} (${t.priority} priority)${t.description ? ` · ${t.description}` : ''}`,
        badgeText: t.completed ? 'Completed' : 'Pending',
        badgeColor: t.completed
          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      });
    }

    // Sort ascending chronologically throughout the day
    return items.sort((a, b) => a.timeStr.localeCompare(b.timeStr));
  }, [selectedDateLogs, selectedDateReadings, selectedDateTasks, profile]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400">
              <CalendarIcon className="w-4 h-4" />
              <span>Historical Day Inspector</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              Calendar & Daily Timeline
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Review any date's insulin, tablets, glucose checks, and completed tasks in chronological order.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(getTodayString())}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors min-h-[40px]"
            >
              Today
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono tabular-nums text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[40px]"
            />
          </div>
        </div>

        {/* 7-Day Carousel Strip */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-7 gap-2">
          {weekStrip.map((dStr) => {
            const isSelected = dStr === selectedDate;
            const isToday = dStr === getTodayString();
            const [y, m, d] = dStr.split('-');
            const dayNum = parseInt(d, 10);
            const weekday = getWeekdayShort(dStr);

            return (
              <button
                key={dStr}
                onClick={() => setSelectedDate(dStr)}
                className={`py-2 px-1 rounded-xl text-center transition-all flex flex-col items-center justify-center min-h-[52px] ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span className="text-[10px] uppercase">{weekday}</span>
                <span className="text-sm sm:text-base font-mono tabular-nums font-bold">
                  {dayNum}
                </span>
                {isToday && (
                  <span
                    className={`w-1 h-1 rounded-full mt-0.5 ${
                      isSelected ? 'bg-sky-400 dark:bg-sky-600' : 'bg-sky-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            {formatDateDisplay(selectedDate)}
          </h2>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {selectedDateLogs.length} medication logs · {selectedDateReadings.length} glucose tests ·{' '}
            {selectedDateTasks.length} tasks
          </span>
        </div>

        <button
          onClick={() => onOpenAddTask(selectedDate)}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
        >
          + Add Task for this date
        </button>
      </div>

      {/* Chronological Timeline Stream */}
      {combinedTimeline.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No entries recorded for this date.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Historical medication changes preserve past days intact.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-4">
          {combinedTimeline.map((item) => {
            const icons = {
              insulin: <Syringe className="w-4 h-4 text-sky-600" />,
              tablet: <Pill className="w-4 h-4 text-teal-600" />,
              glucose: <Activity className="w-4 h-4 text-emerald-600" />,
              task: <CheckSquare className="w-4 h-4 text-indigo-600" />,
            };

            return (
              <div key={item.id} className="relative group">
                {/* Timeline node circle */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-400 dark:border-slate-500 group-hover:border-sky-500 transition-colors" />

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatTimeDisplay(item.timeStr, profile.timeFormat)}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        {icons[item.category]}
                        {item.title}
                      </h4>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${item.badgeColor}`}>
                      {item.badgeText}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 pl-1">
                    {item.details}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
