/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Syringe,
  Plus,
  Clock,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Calendar,
  Edit2,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { MedicationLog, MedicationSchedule, UserProfile } from '../../types';
import { formatDateDisplay, formatTimeDisplay, getTodayString } from '../../utils/date';

interface InsulinTrackerViewProps {
  profile: UserProfile;
  schedules: MedicationSchedule[];
  logs: MedicationLog[];
  onOpenLogInsulin: (schedule?: MedicationSchedule, logToEdit?: MedicationLog) => void;
  onOpenScheduleEdit: (schedule?: MedicationSchedule) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onDeleteLog: (logId: string) => void;
  onMarkScheduleTaken: (schedule: MedicationSchedule) => void;
  onOpenDuplicateWarning: (schedule: MedicationSchedule, existingLog: MedicationLog) => void;
}

export const InsulinTrackerView: React.FC<InsulinTrackerViewProps> = ({
  profile,
  schedules,
  logs,
  onOpenLogInsulin,
  onOpenScheduleEdit,
  onDeleteSchedule,
  onDeleteLog,
  onMarkScheduleTaken,
  onOpenDuplicateWarning,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  const insulinSchedules = schedules.filter((s) => s.type === 'insulin');
  const insulinLogs = logs.filter((l) => l.medicationType === 'insulin');

  // Logs for the selected date
  const selectedDateLogs = insulinLogs
    .filter((l) => l.date === selectedDate)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  // Total insulin units logged on selected date
  const totalUnitsTaken = selectedDateLogs
    .filter((l) => l.status === 'taken')
    .reduce((acc, curr) => acc + curr.actualDose, 0);

  const handleMarkTakenDirectly = (sched: MedicationSchedule) => {
    // Check if duplicate exists for selected date for this exact schedule
    const existing = selectedDateLogs.find((l) => {
      if (l.scheduleId) {
        return l.scheduleId === sched.id;
      }
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
      {/* Top Banner & Safety Reminder */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400">
              <Syringe className="w-4 h-4" />
              <span>Insulin Injection Tracker</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              Daily Insulin Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Verify scheduled doses, record exact times, and track injection sites.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenLogInsulin()}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors min-h-[44px] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Log Injection
            </button>
            <button
              onClick={() => onOpenScheduleEdit()}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors min-h-[44px] flex items-center gap-1.5"
            >
              + New Routine
            </button>
          </div>
        </div>

        {/* Medical disclaimer note */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
          <ShieldAlert className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <span>
            Safety rule: DiaCare never recommends extra injections, calculates correction doses, or alters prescribed regimens. Always consult your endocrinologist.
          </span>
        </div>
      </div>

      {/* Configured Insulin Schedules */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Prescribed Insulin Schedules
          </h2>
          <span className="text-xs text-slate-500">
            {insulinSchedules.length} routines configured
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {insulinSchedules.map((schedule) => {
            const isLoggedToday = selectedDateLogs.some((l) => {
              if (l.status !== 'taken') return false;
              if (l.scheduleId) return l.scheduleId === schedule.id;
              return (
                l.medicationName.toLowerCase() === schedule.name.toLowerCase() &&
                (l.scheduledTime === schedule.scheduledTime || Math.abs(l.prescribedDose - schedule.prescribedDose) < 0.1)
              );
            });

            return (
              <div
                key={schedule.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-mono tabular-nums font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md">
                      {formatTimeDisplay(schedule.scheduledTime, profile.timeFormat)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenScheduleEdit(schedule)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
                        title="Edit schedule"
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

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {schedule.name}
                  </h3>
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p className="font-semibold text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                      {schedule.prescribedDose} {schedule.unit}
                    </p>
                    <p>{schedule.instructions}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {isLoggedToday ? (
                    <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Recorded Today
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMarkTakenDirectly(schedule)}
                      className="w-full py-2 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[40px]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark as Taken
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Filter & Insulin Injection Timeline */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Recorded Injections Timeline
            </h2>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              ({totalUnitsTaken} units logged on {formatDateDisplay(selectedDate)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono tabular-nums text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {selectedDate !== getTodayString() && (
              <button
                onClick={() => setSelectedDate(getTodayString())}
                className="text-xs text-sky-600 hover:underline font-medium"
              >
                Back to Today
              </button>
            )}
          </div>
        </div>

        {/* Timeline Entries */}
        {selectedDateLogs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Syringe className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">
              No insulin injections logged for {formatDateDisplay(selectedDate)}.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Tap "+ Log Injection" or "Mark as Taken" above to record doses.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedDateLogs.map((log) => {
              const isTaken = log.status === 'taken';
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
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {isTaken ? <CheckCircle2 className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
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
                              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200'
                          }`}
                        >
                          {isTaken ? 'Confirmed Taken' : 'Uncertain — Verify'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                          {log.actualDose} {log.unit}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          Taken at {formatTimeDisplay(log.recordedAt, profile.timeFormat)}
                        </span>
                        {log.injectionSite && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">Site: {log.injectionSite.replace('-', ' ')}</span>
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
                      onClick={() => onOpenLogInsulin(undefined, log)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Edit this entry"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Delete record"
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
