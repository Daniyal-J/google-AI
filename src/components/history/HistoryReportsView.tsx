/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  History,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Activity,
  CheckSquare,
  Syringe,
  Pill,
  Calendar,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import {
  GlucoseReading,
  MedicationLog,
  MedicationSchedule,
  TaskItem,
  UserProfile,
} from '../../types';
import { formatDateDisplay, formatTimeDisplay, getTodayString, offsetDate } from '../../utils/date';
import { formatGlucoseValue, getContextLabel } from '../../utils/glucose';
import { storage } from '../../services/storage';

interface HistoryReportsViewProps {
  profile: UserProfile;
  schedules: MedicationSchedule[];
  logs: MedicationLog[];
  readings: GlucoseReading[];
  tasks: TaskItem[];
  onExportCSV: () => void;
  onExportJSON: () => void;
}

type RecordTypeFilter = 'all' | 'insulin' | 'tablets' | 'glucose' | 'tasks';
type StatusFilter = 'all' | 'taken' | 'skipped' | 'uncertain';

export const HistoryReportsView: React.FC<HistoryReportsViewProps> = ({
  profile,
  schedules,
  logs,
  readings,
  tasks,
  onExportCSV,
  onExportJSON,
}) => {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [typeFilter, setTypeFilter] = useState<RecordTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const todayStr = getTodayString();

  const startDate = useMemo(() => {
    if (dateRange === '7d') return offsetDate(todayStr, -7);
    if (dateRange === '30d') return offsetDate(todayStr, -30);
    return '2020-01-01';
  }, [dateRange, todayStr]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (l.date < startDate) return false;
      if (typeFilter === 'insulin' && l.medicationType !== 'insulin') return false;
      if (typeFilter === 'tablets' && l.medicationType !== 'tablet') return false;
      if (typeFilter === 'glucose' || typeFilter === 'tasks') return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      return true;
    });
  }, [logs, startDate, typeFilter, statusFilter]);

  // Filter glucose
  const filteredReadings = useMemo(() => {
    if (typeFilter === 'insulin' || typeFilter === 'tablets' || typeFilter === 'tasks') {
      return [];
    }
    return readings.filter((r) => r.date >= startDate);
  }, [readings, startDate, typeFilter]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (typeFilter === 'insulin' || typeFilter === 'tablets' || typeFilter === 'glucose') {
      return [];
    }
    return tasks.filter((t) => t.date >= startDate);
  }, [tasks, startDate, typeFilter]);

  // Weekly Adherence Calculation
  const weeklySummary = useMemo(() => {
    const sevenDaysAgo = offsetDate(todayStr, -7);
    const recentLogs = logs.filter((l) => l.date >= sevenDaysAgo);
    const takenCount = recentLogs.filter((l) => l.status === 'taken').length;
    const skippedCount = recentLogs.filter((l) => l.status === 'skipped').length;
    const uncertainCount = recentLogs.filter((l) => l.status === 'uncertain').length;

    // Active daily schedule count * 7 days
    const activeDailySchedules = schedules.filter((s) => s.active).length;
    const totalExpected = activeDailySchedules * 7;
    const adherenceRate = totalExpected > 0 ? Math.min(100, Math.round((takenCount / totalExpected) * 100)) : 0;

    const recentReadings = readings.filter((r) => r.date >= sevenDaysAgo);
    const recentTasks = tasks.filter((t) => t.date >= sevenDaysAgo && t.completed);

    return {
      takenCount,
      skippedCount,
      uncertainCount,
      adherenceRate,
      glucoseCount: recentReadings.length,
      completedTasksCount: recentTasks.length,
    };
  }, [logs, schedules, readings, tasks, todayStr]);

  // Combine items for unified chronological feed
  const unifiedHistory = useMemo(() => {
    const items: Array<{
      id: string;
      date: string;
      timestamp: string;
      type: 'insulin' | 'tablet' | 'glucose' | 'task';
      title: string;
      subtitle: string;
      badgeText: string;
      badgeColor: string;
    }> = [];

    // Add logs
    for (const l of filteredLogs) {
      items.push({
        id: `med-${l.id}`,
        date: l.date,
        timestamp: l.recordedAt,
        type: l.medicationType,
        title: `${l.medicationName} (${l.actualDose} ${l.unit})`,
        subtitle: `Recorded at ${formatTimeDisplay(l.recordedAt, profile.timeFormat)}${
          l.injectionSite ? ` · Site: ${l.injectionSite.replace('-', ' ')}` : ''
        }${l.skipReason ? ` · Reason: ${l.skipReason}` : ''}`,
        badgeText: l.status === 'taken' ? 'Taken' : l.status === 'skipped' ? 'Skipped' : 'Uncertain',
        badgeColor:
          l.status === 'taken'
            ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
            : l.status === 'skipped'
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
      });
    }

    // Add glucose
    for (const r of filteredReadings) {
      const gVal = formatGlucoseValue(r.readingMgDl, profile.glucoseUnit);
      items.push({
        id: `glu-${r.id}`,
        date: r.date,
        timestamp: r.timestamp,
        type: 'glucose',
        title: `Blood Glucose: ${gVal.value} ${gVal.unit}`,
        subtitle: `${getContextLabel(r.context)} at ${formatTimeDisplay(r.time, profile.timeFormat)}${
          r.notes ? ` · "${r.notes}"` : ''
        }`,
        badgeText: 'Reading',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      });
    }

    // Add tasks
    for (const t of filteredTasks) {
      items.push({
        id: `tsk-${t.id}`,
        date: t.date,
        timestamp: `${t.date}T${t.time || '12:00'}:00`,
        type: 'task',
        title: t.title,
        subtitle: `${t.category} (${t.priority} priority)${t.completedAt ? ` · Completed at ${formatTimeDisplay(t.completedAt, profile.timeFormat)}` : ''}`,
        badgeText: t.completed ? 'Completed' : 'Pending',
        badgeColor: t.completed
          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      });
    }

    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [filteredLogs, filteredReadings, filteredTasks, profile]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner & Export Actions */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400">
              <History className="w-4 h-4" />
              <span>Historical Records & Adherence</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              History & Reports
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Review confirmed events, skipped doses, glucose readings, and export records for your physician.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold shadow-xs transition-colors min-h-[40px] flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={onExportJSON}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors min-h-[40px] flex items-center gap-1.5"
            >
              <FileCode className="w-4 h-4" />
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* 7-Day Adherence & Health Insights Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          Past 7 Days Adherence Summary
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40">
            <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300 block">
              Doses Confirmed Taken
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-teal-900 dark:text-teal-100 mt-1 block">
              {weeklySummary.takenCount}
            </span>
            <span className="text-[10px] text-teal-700 dark:text-teal-400">
              {weeklySummary.adherenceRate}% adherence rate
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
              Uncertain & Skipped
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1 block">
              {weeklySummary.uncertainCount + weeklySummary.skippedCount}
            </span>
            <span className="text-[10px] text-slate-500">
              {weeklySummary.uncertainCount} uncertain · {weeklySummary.skippedCount} skipped
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">
              Glucose Logs
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-900 dark:text-emerald-100 mt-1 block">
              {weeklySummary.glucoseCount}
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
              Tests recorded
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
            <span className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-300 block">
              Completed Tasks
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-indigo-900 dark:text-indigo-100 mt-1 block">
              {weeklySummary.completedTasksCount}
            </span>
            <span className="text-[10px] text-indigo-700 dark:text-indigo-400">
              Daily goals finished
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500">Timeframe:</span>
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {(['7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  dateRange === range
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as RecordTypeFilter)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="insulin">Insulin Only</option>
            <option value="tablets">Tablets Only</option>
            <option value="glucose">Glucose Only</option>
            <option value="tasks">Tasks Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="taken">Confirmed Taken</option>
            <option value="skipped">Skipped</option>
            <option value="uncertain">Uncertain</option>
          </select>
        </div>
      </div>

      {/* Unified Chronological Feed */}
      <div className="space-y-2.5">
        {unifiedHistory.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <History className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">
              No historical records match the selected filters.
            </p>
          </div>
        ) : (
          unifiedHistory.map((item) => {
            const icons = {
              insulin: <Syringe className="w-4 h-4 text-sky-600" />,
              tablet: <Pill className="w-4 h-4 text-teal-600" />,
              glucose: <Activity className="w-4 h-4 text-emerald-600" />,
              task: <CheckSquare className="w-4 h-4 text-indigo-600" />,
            };

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {icons[item.type]}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${item.badgeColor}`}>
                        {item.badgeText}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300 block">
                    {formatDateDisplay(item.date)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
