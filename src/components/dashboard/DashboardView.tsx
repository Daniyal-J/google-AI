/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Syringe,
  Pill,
  Activity,
  CheckSquare,
  Plus,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import {
  GlucoseReading,
  MedicationLog,
  MedicationSchedule,
  TaskItem,
  UserProfile,
} from '../../types';
import {
  computeDoseStatus,
  formatDateDisplay,
  formatTimeDisplay,
  getCurrentTimeString,
  getGreeting,
  getTodayString,
} from '../../utils/date';
import { evaluateGlucoseLevel, formatGlucoseValue, getContextLabel } from '../../utils/glucose';
import { SafetyBanner } from '../common/SafetyBanner';

interface DashboardViewProps {
  profile: UserProfile;
  schedules: MedicationSchedule[];
  logs: MedicationLog[];
  readings: GlucoseReading[];
  tasks: TaskItem[];
  onOpenLogInsulin: (schedule?: MedicationSchedule) => void;
  onOpenLogTablet: (schedule?: MedicationSchedule) => void;
  onOpenLogGlucose: () => void;
  onOpenAddTask: () => void;
  onMarkDoseTaken: (schedule: MedicationSchedule) => void;
  onUndoDose: (logId: string) => void;
  onToggleTask: (taskId: string) => void;
  onQuickAddTask: (title: string) => void;
  onNavigateToTab: (tab: any) => void;
  onOpenDuplicateWarning: (schedule: MedicationSchedule, existingLog: MedicationLog) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  schedules,
  logs,
  readings,
  tasks,
  onOpenLogInsulin,
  onOpenLogTablet,
  onOpenLogGlucose,
  onOpenAddTask,
  onMarkDoseTaken,
  onUndoDose,
  onToggleTask,
  onQuickAddTask,
  onNavigateToTab,
  onOpenDuplicateWarning,
}) => {
  const [quickTaskInput, setQuickTaskInput] = useState('');
  const [undoConfirmLogId, setUndoConfirmLogId] = useState<string | null>(null);

  const todayStr = getTodayString();
  const greeting = getGreeting(profile.name);

  // Active schedules for today
  const activeSchedules = schedules
    .filter((s) => s.active)
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  // Today's logs
  const todayLogs = logs.filter((l) => l.date === todayStr);

  // Today's tasks
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const completedTasks = todayTasks.filter((t) => t.completed);

  // Map each schedule to its current log and status
  const scheduleItemsWithStatus = activeSchedules.map((schedule) => {
    // Look for matching log by exact scheduleId first
    // If a log has a scheduleId, it MUST match schedule.id.
    // Never fall back to name matching if the log belongs to a different schedule!
    const matchingLog = todayLogs.find((l) => {
      if (l.scheduleId) {
        return l.scheduleId === schedule.id;
      }
      // Only for unlinked legacy logs without scheduleId: require BOTH medication name AND scheduled time or prescribed dose
      return (
        l.medicationName.toLowerCase() === schedule.name.toLowerCase() &&
        (l.scheduledTime === schedule.scheduledTime || Math.abs(l.prescribedDose - schedule.prescribedDose) < 0.1)
      );
    });
    const computedStatus = computeDoseStatus(schedule.scheduledTime, matchingLog, todayStr);
    return {
      schedule,
      log: matchingLog,
      status: computedStatus,
    };
  });

  const totalDosesScheduled = activeSchedules.length;
  const dosesTaken = scheduleItemsWithStatus.filter((item) => item.status === 'taken').length;
  const dosesPending = totalDosesScheduled - dosesTaken;

  // Daily completion percentage
  const totalItemsCount = totalDosesScheduled + todayTasks.length;
  const totalCompletedCount = dosesTaken + completedTasks.length;
  const completionPercentage = totalItemsCount > 0 ? Math.round((totalCompletedCount / totalItemsCount) * 100) : 0;

  // Latest glucose reading
  const latestReading = readings.length > 0 ? readings[0] : undefined;

  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskInput.trim()) return;
    onQuickAddTask(quickTaskInput.trim());
    setQuickTaskInput('');
  };

  const handleMarkTakenClick = (item: (typeof scheduleItemsWithStatus)[0]) => {
    // Prevent accidental duplicate logging if already recorded!
    if (item.log && item.log.status === 'taken') {
      onOpenDuplicateWarning(item.schedule, item.log);
      return;
    }
    onMarkDoseTaken(item.schedule);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Hypoglycemia / Hyperglycemia urgent safety banner if needed */}
      <SafetyBanner
        latestReading={latestReading}
        targets={profile.glucoseTargets}
        emergencyContact={profile.emergencyContact}
      />

      {/* Greeting and Daily Progress Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400">
              <span>{formatDateDisplay(todayStr)}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              {greeting.greeting}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {greeting.subtext}
            </p>
          </div>

          {/* Daily completion ring / bar */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 shrink-0">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-slate-700 stroke-current"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-teal-600 stroke-current transition-all duration-500"
                  strokeDasharray={`${completionPercentage}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-mono tabular-nums text-xs font-bold text-slate-800 dark:text-slate-200">
                {completionPercentage}%
              </span>
            </div>
            <div className="text-left">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                Today's Adherence
              </span>
              <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                {dosesTaken}/{totalDosesScheduled} meds · {completedTasks.length}/{todayTasks.length} tasks
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onOpenLogInsulin()}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-500 shadow-2xs hover:shadow-xs transition-all text-left min-h-[56px] group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Syringe className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              + Log Insulin
            </span>
            <span className="text-[11px] text-slate-500">Record injection</span>
          </div>
        </button>

        <button
          onClick={() => onOpenLogTablet()}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 shadow-2xs hover:shadow-xs transition-all text-left min-h-[56px] group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              + Log Tablet
            </span>
            <span className="text-[11px] text-slate-500">Morning meds</span>
          </div>
        </button>

        <button
          onClick={() => onOpenLogGlucose()}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-2xs hover:shadow-xs transition-all text-left min-h-[56px] group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              + Log Glucose
            </span>
            <span className="text-[11px] text-slate-500">Fast or post-meal</span>
          </div>
        </button>

        <button
          onClick={() => onOpenAddTask()}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-2xs hover:shadow-xs transition-all text-left min-h-[56px] group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              + Add Task
            </span>
            <span className="text-[11px] text-slate-500">Daily planner</span>
          </div>
        </button>
      </div>

      {/* Split Grid: Today's Medication Routine & Today's Vital Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Medication Status Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Today's Medication Schedule
              </h2>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                ({dosesTaken} of {totalDosesScheduled} confirmed taken)
              </span>
            </div>
            <button
              onClick={() => onNavigateToTab('insulin')}
              className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              Manage Routine <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {scheduleItemsWithStatus.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500">No active medication schedules configured.</p>
                <button
                  onClick={() => onNavigateToTab('settings')}
                  className="mt-3 text-xs font-semibold text-sky-600 hover:underline"
                >
                  Configure schedules in settings
                </button>
              </div>
            ) : (
              scheduleItemsWithStatus.map((item) => {
                const { schedule, log, status } = item;
                const isTaken = status === 'taken';
                const isUncertain = status === 'uncertain';
                const isSkipped = status === 'skipped';
                const isDue = status === 'due';
                const isUnconfirmed = status === 'unconfirmed';

                return (
                  <div
                    key={schedule.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isTaken
                        ? 'bg-white dark:bg-slate-900 border-teal-200 dark:border-teal-900/60 shadow-2xs'
                        : isDue
                        ? 'bg-sky-50/50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800 shadow-xs'
                        : isUnconfirmed
                        ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left info */}
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            schedule.type === 'insulin'
                              ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                              : 'bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300'
                          }`}
                        >
                          {schedule.type === 'insulin' ? (
                            <Syringe className="w-5 h-5" />
                          ) : (
                            <Pill className="w-5 h-5" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                              {schedule.name}
                            </h3>
                            {/* Status label */}
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                isTaken
                                  ? 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-200'
                                  : isDue
                                  ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-200 animate-pulse'
                                  : isUncertain
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                                  : isSkipped
                                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200'
                                  : isUnconfirmed
                                  ? 'bg-amber-100/70 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {isTaken && '✓ Confirmed Taken'}
                              {isDue && 'Due Now'}
                              {isUncertain && 'Uncertain — Verify'}
                              {isSkipped && 'Skipped'}
                              {isUnconfirmed && 'Unconfirmed'}
                              {status === 'upcoming' && 'Upcoming'}
                            </span>
                          </div>

                          {/* Prescribed details */}
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                            <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                              {schedule.prescribedDose} {schedule.unit}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-1 font-mono tabular-nums">
                              <Clock className="w-3 h-3" />
                              {formatTimeDisplay(schedule.scheduledTime, profile.timeFormat)}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{schedule.instructions}</span>
                          </div>

                          {/* Recorded timestamp if taken */}
                          {isTaken && log && (
                            <p className="text-xs text-teal-700 dark:text-teal-300 font-medium">
                              Recorded: taken at{' '}
                              <span className="font-mono tabular-nums font-bold">
                                {formatTimeDisplay(log.recordedAt, profile.timeFormat)}
                              </span>{' '}
                              ({log.actualDose} {log.unit}
                              {log.injectionSite ? ` · ${log.injectionSite.replace('-', ' ')}` : ''})
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {isTaken && log ? (
                          <div className="flex items-center gap-2">
                            {undoConfirmLogId === log.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    onUndoDose(log.id);
                                    setUndoConfirmLogId(null);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors min-h-[44px]"
                                >
                                  Confirm Undo
                                </button>
                                <button
                                  onClick={() => setUndoConfirmLogId(null)}
                                  className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 min-h-[44px]"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setUndoConfirmLogId(log.id)}
                                className="px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors flex items-center gap-1.5 min-h-[44px]"
                                title="Undo or correct this entry"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Undo / Correct
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (schedule.type === 'insulin') {
                                  onOpenLogInsulin(schedule);
                                } else {
                                  onOpenLogTablet(schedule);
                                }
                              }}
                              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors min-h-[44px] flex items-center justify-center"
                            >
                              Edit / Unsure
                            </button>
                            <button
                              onClick={() => handleMarkTakenClick(item)}
                              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 min-h-[44px]"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Mark as Taken ✓
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Latest Blood Glucose & Today's Checklist */}
        <div className="space-y-6">
          {/* Latest Blood Glucose Tile */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Latest Blood Glucose
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTab('glucose')}
                className="text-xs text-sky-600 hover:underline font-medium"
              >
                View History
              </button>
            </div>

            {latestReading ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {formatGlucoseValue(latestReading.readingMgDl, profile.glucoseUnit).value}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {profile.glucoseUnit}
                  </span>
                  <span
                    className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      evaluateGlucoseLevel(latestReading.readingMgDl, latestReading.context, profile.glucoseTargets) === 'in_range'
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {getContextLabel(latestReading.context)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono tabular-nums">
                    {formatTimeDisplay(latestReading.time, profile.timeFormat)} on {formatDateDisplay(latestReading.date)}
                  </span>
                  {latestReading.notes && (
                    <span className="italic truncate max-w-[120px]" title={latestReading.notes}>
                      "{latestReading.notes}"
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500">
                <p>No glucose readings logged yet.</p>
                <button
                  onClick={onOpenLogGlucose}
                  className="mt-2 text-xs font-semibold text-sky-600 hover:underline"
                >
                  + Log Fasting / Post-meal
                </button>
              </div>
            )}
          </div>

          {/* Today's Tasks Quick Checklist */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Today's Tasks ({completedTasks.length}/{todayTasks.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTab('tasks')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Open Planner
              </button>
            </div>

            {/* Quick Add input */}
            <form onSubmit={handleQuickTaskSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Add task in 2 seconds..."
                value={quickTaskInput}
                onChange={(e) => setQuickTaskInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0 min-h-[38px] flex items-center justify-center"
                aria-label="Add quick task"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Tasks List preview */}
            <div className="space-y-2">
              {todayTasks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">
                  No tasks scheduled for today. Type above to add one.
                </p>
              ) : (
                todayTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => onToggleTask(task.id)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span
                        className={`text-xs truncate ${
                          task.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-200 font-medium'
                        }`}
                      >
                        {task.title}
                      </span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono tabular-nums shrink-0">
                      {task.category}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
