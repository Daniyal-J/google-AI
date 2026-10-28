/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Pill, AlertCircle, HelpCircle, CheckCircle2 } from 'lucide-react';
import { MedicationLog, MedicationSchedule } from '../../types';
import { getCurrentTimeString, getTodayString } from '../../utils/date';
import { Modal } from '../common/Modal';

interface LogTabletModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: MedicationSchedule[];
  preselectedSchedule?: MedicationSchedule | null;
  existingLogToEdit?: MedicationLog | null;
  onSave: (log: Omit<MedicationLog, 'id'>, existingId?: string) => void;
}

export const LogTabletModal: React.FC<LogTabletModalProps> = ({
  isOpen,
  onClose,
  schedules,
  preselectedSchedule,
  existingLogToEdit,
  onSave,
}) => {
  const tabletSchedules = schedules.filter((s) => s.type === 'tablet');

  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [medicationName, setMedicationName] = useState<string>('');
  const [dose, setDose] = useState<number>(1);
  const [unit, setUnit] = useState<string>('tablet');
  const [instructions, setInstructions] = useState<string>('With breakfast');
  const [date, setDate] = useState<string>(getTodayString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [status, setStatus] = useState<'taken' | 'skipped' | 'uncertain'>('taken');
  const [skipReason, setSkipReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [confirmedByUser, setConfirmedByUser] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (existingLogToEdit) {
      setSelectedScheduleId(existingLogToEdit.scheduleId || '');
      setMedicationName(existingLogToEdit.medicationName);
      setDose(existingLogToEdit.actualDose);
      setUnit(existingLogToEdit.unit);
      setDate(existingLogToEdit.date);
      if (existingLogToEdit.recordedAt) {
        const d = new Date(existingLogToEdit.recordedAt);
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        setTime(`${h}:${m}`);
      }
      setStatus(existingLogToEdit.status);
      setSkipReason(existingLogToEdit.skipReason || '');
      setNotes(existingLogToEdit.notes || '');
      setConfirmedByUser(existingLogToEdit.verifiedByUser);
    } else if (preselectedSchedule) {
      setSelectedScheduleId(preselectedSchedule.id);
      setMedicationName(preselectedSchedule.name);
      setDose(preselectedSchedule.prescribedDose);
      setUnit(preselectedSchedule.unit);
      setInstructions(preselectedSchedule.instructions);
      setDate(getTodayString());
      setTime(getCurrentTimeString());
      setStatus('taken');
      setConfirmedByUser(false);
      setNotes('');
      setSkipReason('');
    } else if (tabletSchedules.length > 0) {
      const first = tabletSchedules[0];
      setSelectedScheduleId(first.id);
      setMedicationName(first.name);
      setDose(first.prescribedDose);
      setUnit(first.unit);
      setInstructions(first.instructions);
      setDate(getTodayString());
      setTime(getCurrentTimeString());
      setStatus('taken');
      setConfirmedByUser(false);
      setNotes('');
      setSkipReason('');
    } else {
      setSelectedScheduleId('custom');
      setMedicationName('');
      setDose(1);
      setUnit('tablet');
      setDate(getTodayString());
      setTime(getCurrentTimeString());
      setStatus('taken');
      setConfirmedByUser(false);
    }
    setErrorMsg('');
  }, [isOpen, preselectedSchedule, existingLogToEdit]);

  const handleScheduleChange = (id: string) => {
    setSelectedScheduleId(id);
    if (id === 'custom') {
      setMedicationName('');
      setDose(1);
      setUnit('tablet');
    } else {
      const found = tabletSchedules.find((s) => s.id === id);
      if (found) {
        setMedicationName(found.name);
        setDose(found.prescribedDose);
        setUnit(found.unit);
        setInstructions(found.instructions);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicationName.trim()) {
      setErrorMsg('Please specify the medication / tablet name.');
      return;
    }
    if (status === 'taken' && !confirmedByUser) {
      setErrorMsg('Please confirm that you have taken this tablet.');
      return;
    }

    const [h, m] = time.split(':').map(Number);
    const recordedDate = new Date(`${date}T00:00:00`);
    recordedDate.setHours(h || 0, m || 0, 0, 0);

    const selectedSched = tabletSchedules.find((s) => s.id === selectedScheduleId);
    const schedTime = selectedSched ? selectedSched.scheduledTime : time;

    onSave(
      {
        scheduleId: selectedScheduleId === 'custom' ? undefined : selectedScheduleId,
        medicationName: medicationName.trim(),
        medicationType: 'tablet',
        prescribedDose: dose,
        actualDose: dose,
        unit,
        status,
        scheduledTime: schedTime,
        recordedAt: recordedDate.toISOString(),
        date,
        skipReason: status === 'skipped' ? skipReason.trim() : undefined,
        notes: notes.trim() || undefined,
        verifiedByUser: status === 'taken',
      },
      existingLogToEdit?.id
    );

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingLogToEdit ? 'Edit Tablet Record' : 'Log Tablet / Medication'}
      description="Record oral medications and tablets with food instructions."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Schedule Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Prescribed Tablet Schedule
          </label>
          <select
            value={selectedScheduleId}
            onChange={(e) => handleScheduleChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {tabletSchedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.prescribedDose} {s.unit} at {s.scheduledTime})
              </option>
            ))}
            <option value="custom">+ Other / Unlisted Medication</option>
          </select>
        </div>

        {/* Medication Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tablet / Medication Name
          </label>
          <input
            type="text"
            placeholder="e.g. Metformin 500mg, Multivitamin, Thyroid"
            value={medicationName}
            onChange={(e) => setMedicationName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>

        {/* Dose & Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dose Amount
            </label>
            <input
              type="number"
              step="any"
              min="0.25"
              value={dose}
              onChange={(e) => setDose(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Unit
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="tablet">tablet(s)</option>
              <option value="capsule">capsule(s)</option>
              <option value="mg">mg</option>
              <option value="ml">ml</option>
            </select>
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Recorded Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Food instructions & notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Instructions / Food Timing
          </label>
          <input
            type="text"
            placeholder="e.g. Before breakfast, with full glass of water, after dinner"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Status selection segmented control */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Dose Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setStatus('taken')}
              className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors min-h-[44px] flex items-center justify-center gap-1.5 ${
                status === 'taken'
                  ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-800 dark:text-teal-200 font-semibold ring-1 ring-teal-500'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Taken
            </button>
            <button
              type="button"
              onClick={() => setStatus('skipped')}
              className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors min-h-[44px] flex items-center justify-center gap-1.5 ${
                status === 'skipped'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-800 dark:text-amber-200 font-semibold ring-1 ring-amber-500'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Skipped
            </button>
            <button
              type="button"
              onClick={() => setStatus('uncertain')}
              className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors min-h-[44px] flex items-center justify-center gap-1.5 ${
                status === 'uncertain'
                  ? 'bg-slate-100 dark:bg-slate-700 border-slate-500 text-slate-800 dark:text-slate-100 font-semibold ring-1 ring-slate-500'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Uncertain
            </button>
          </div>
        </div>

        {status === 'skipped' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Skipping
            </label>
            <input
              type="text"
              placeholder="e.g. Fasting for blood test, doctor advised temporary hold"
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        )}

        {status === 'taken' && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="confirm-tablet"
              checked={confirmedByUser}
              onChange={(e) => setConfirmedByUser(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded text-teal-600 focus:ring-teal-500"
            />
            <label
              htmlFor="confirm-tablet"
              className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <span className="font-semibold block text-slate-900 dark:text-slate-100">
                I confirm that I actually took this tablet
              </span>
              Never automatically marked taken without explicit user action.
            </label>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors min-h-[44px] flex items-center gap-2"
          >
            <Pill className="w-4 h-4" />
            Save Tablet Log
          </button>
        </div>
      </form>
    </Modal>
  );
};
