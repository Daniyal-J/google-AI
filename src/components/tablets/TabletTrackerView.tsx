/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Pill,
  Plus,
  Clock,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  Utensils,
  XCircle,
} from 'lucide-react';
import { MedicationLog, MedicationSchedule, UserProfile } from '../../types';
import { formatDateDisplay, formatTimeDisplay, getTodayString } from '../../utils/date';

interface TabletTrackerViewProps {
  profile: UserProfile;
  schedules: MedicationSchedule[];
  logs: MedicationLog[];
  onOpenLogTablet: (schedule?: MedicationSchedule, logToEdit?: MedicationLog) => void;
  onOpenScheduleEdit: (schedule?: MedicationSchedule) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onDeleteLog: (logId: string) => void;
  onMarkScheduleTaken: (schedule: MedicationSchedule) => void;
  onOpenDuplicateWarning: (schedule: MedicationSchedule, existingLog: MedicationLog) => void;
}

export const TabletTrackerView: React.FC<TabletTrackerViewProps> = ({
  profile,
  schedules,
  logs,
  onOpenLogTablet,
  onOpenScheduleEdit,
  onDeleteSchedule,
  onDeleteLog,
  onMarkScheduleTaken,
  onOpenDuplicateWarning,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  const tabletSchedules = schedules.filter((s) => s.type === 'tablet');
  const tabletLogs = logs.filter((l) => l.medicationType === 'tablet');

  const selectedDateLogs = tabletLogs
    .filter((l) => l.date === selectedDate)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  const handleMarkTaken = (sched: MedicationSchedule) => {
    const existing = selectedDateLogs.find((l) => {
      if (l.scheduleId) return l.scheduleId === sched.id;
      return (
        l.medicationName.toLowerCase() === sched.name.toLowerCase() &&
        (l.scheduledTime === sched.scheduledTime || Math.abs(l.prescribedDose - sched.prescribedDose) < 0.1)
      );
    });
    if (existing && existing.status === 'taken') {
      onOpenDuplicateWarning(sched, existing);
      return;
    }
    onMarkScheduleTaken(sched);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400">
              <Pill className="w-4 h-4" />
              <span>Tablets & Prescribed Medications</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              Oral Medications Tracker
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Track morning & evening tablets with food instructions, skip reasons, and time logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenLogTablet()}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors min-h-[44px] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Log Tablet
            </button>
            <button
              onClick={() => onOpenScheduleEdit()}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors min-h-[44px] flex items-center gap-1.5"
            >
              + Add Tablet Schedule
            </button>
          </div>
        </div>

        {/* Safety banner for missed tablet */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Safety notice: Never double a tablet dose if you missed or delayed one. Always check with your physician or pharmacist.
          </span>
        </div>
      </div>

      {/* Configured Tablet Schedules */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Configured Tablet Routines
          </h2>
          <span className="text-xs text-slate-500">
            {tabletSchedules.length} prescribed medications
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tabletSchedules.map((schedule) => {
            const currentLog = selectedDateLogs.find((l) => {
              if (l.scheduleId) return l.scheduleId === schedule.id;
              return (
                l.medicationName.toLowerCase() === schedule.name.toLowerCase() &&
                (l.scheduledTime === schedule.scheduledTime || Math.abs(l.prescribedDose - schedule.prescribedDose) < 0.1)
              );
            });

            return (
              <div
                key={schedule.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-mono tabular-nums font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-md">
                      {formatTimeDisplay(schedule.scheduledTime, profile.timeFormat)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenScheduleEdit(schedule)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
                        title="Edit tablet schedule"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteSchedule(schedule.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                        title="Delete schedule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    {schedule.name}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                      {schedule.prescribedDose} {schedule.unit}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5" />
                      {schedule.instructions}
                    </span>
                  </div>

                  {schedule.notes && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                      "{schedule.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {currentLog ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 flex items-center gap-1.5 capitalize">
                        {currentLog.status === 'taken' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                        {currentLog.status === 'skipped' && <XCircle className="w-4 h-4 text-amber-600" />}
                        {currentLog.status === 'uncertain' && <HelpCircle className="w-4 h-4 text-slate-500" />}
                        {currentLog.status}: {formatTimeDisplay(currentLog.recordedAt, profile.timeFormat)}
                      </span>
                      <button
                        onClick={() => onOpenLogTablet(schedule, currentLog)}
                        className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={() => onOpenLogTablet(schedule)}
                        className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px] flex items-center justify-center"
                      >
                        Options
                      </button>
                      <button
                        onClick={() => handleMarkTaken(schedule)}
                        className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold min-h-[40px] flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Taken
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Filter & Tablet History Logs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Tablet Records for {formatDateDisplay(selectedDate)}
          </h2>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono tabular-nums text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {selectedDate !== getTodayString() && (
              <button
                onClick={() => setSelectedDate(getTodayString())}
                className="text-xs text-teal-600 hover:underline font-medium"
              >
                Back to Today
              </button>
            )}
          </div>
        </div>

        {selectedDateLogs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Pill className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">
              No tablet records saved for {formatDateDisplay(selectedDate)}.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedDateLogs.map((log) => {
              const isTaken = log.status === 'taken';
              const isSkipped = log.status === 'skipped';
              const isUncertain = log.status === 'uncertain';

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isTaken
                          ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                          : isSkipped
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {isTaken ? <CheckCircle2 className="w-5 h-5" /> : isSkipped ? <XCircle className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {log.medicationName}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            isTaken
                              ? 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-200'
                              : isSkipped
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {isTaken ? 'Confirmed Taken' : isSkipped ? 'Skipped' : 'Uncertain — Verify'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                          {log.actualDose} {log.unit}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatTimeDisplay(log.recordedAt, profile.timeFormat)}
                        </span>
                        {log.skipReason && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-700 dark:text-amber-400 font-medium">
                              Reason: {log.skipReason}
                            </span>
                          </>
                        )}
                      </div>

                      {log.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => onOpenLogTablet(undefined, log)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Edit log"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Delete log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
