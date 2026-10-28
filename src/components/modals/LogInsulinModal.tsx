/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Syringe, Plus, Minus, CheckCircle, HelpCircle, AlertCircle } from 'lucide-react';
import { InjectionSite, MedicationLog, MedicationSchedule } from '../../types';
import { getCurrentTimeString, getTodayString } from '../../utils/date';
import { BodyMapSiteSelector } from '../insulin/BodyMapSiteSelector';
import { Modal } from '../common/Modal';

interface LogInsulinModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: MedicationSchedule[];
  preselectedSchedule?: MedicationSchedule | null;
  existingLogToEdit?: MedicationLog | null;
  onSave: (log: Omit<MedicationLog, 'id'>, existingId?: string) => void;
}

export const LogInsulinModal: React.FC<LogInsulinModalProps> = ({
  isOpen,
  onClose,
  schedules,
  preselectedSchedule,
  existingLogToEdit,
  onSave,
}) => {
  const insulinSchedules = schedules.filter((s) => s.type === 'insulin');

  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [medicationName, setMedicationName] = useState<string>('');
  const [prescribedDose, setPrescribedDose] = useState<number>(0);
  const [actualDose, setActualDose] = useState<number>(0);
  const [date, setDate] = useState<string>(getTodayString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [injectionSite, setInjectionSite] = useState<InjectionSite>('abdomen-left');
  const [notes, setNotes] = useState<string>('');
  const [isUncertain, setIsUncertain] = useState<boolean>(false);
  const [confirmedByUser, setConfirmedByUser] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (existingLogToEdit) {
      setSelectedScheduleId(existingLogToEdit.scheduleId || '');
      setMedicationName(existingLogToEdit.medicationName);
      setPrescribedDose(existingLogToEdit.prescribedDose);
      setActualDose(existingLogToEdit.actualDose);
      setDate(existingLogToEdit.date);
      if (existingLogToEdit.recordedAt) {
        const d = new Date(existingLogToEdit.recordedAt);
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        setTime(`${h}:${m}`);
      }
      setInjectionSite(existingLogToEdit.injectionSite || 'abdomen-left');
      setNotes(existingLogToEdit.notes || '');
      setIsUncertain(existingLogToEdit.status === 'uncertain');
      setConfirmedByUser(existingLogToEdit.verifiedByUser);
    } else if (preselectedSchedule) {
      setSelectedScheduleId(preselectedSchedule.id);
      setMedicationName(preselectedSchedule.name);
      setPrescribedDose(preselectedSchedule.prescribedDose);
      setActualDose(preselectedSchedule.prescribedDose);
      setDate(getTodayString());
      setTime(getCurrentTimeString());
      setInjectionSite('abdomen-left');
      setNotes('');
      setIsUncertain(false);
      setConfirmedByUser(false);
    } else if (insulinSchedules.length > 0) {
      const first = insulinSchedules[0];
      setSelectedScheduleId(first.id);
      setMedicationName(first.name);
      setPrescribedDose(first.prescribedDose);
      setActualDose(first.prescribedDose);
      setDate(getTodayString());
      setTime(getCurrentTimeString());
      setNotes('');
      setIsUncertain(false);
      setConfirmedByUser(false);
    } else {
      setSelectedScheduleId('custom');
      setMedicationName('');
      setPrescribedDose(0);
      setActualDose(0);
      setDate(getTodayString());
      setTime(getCurrentTimeString());
    }
    setErrorMsg('');
  }, [isOpen, preselectedSchedule, existingLogToEdit]);

  const handleScheduleChange = (id: string) => {
    setSelectedScheduleId(id);
    if (id === 'custom') {
      setMedicationName('');
      setPrescribedDose(0);
      setActualDose(0);
    } else {
      const found = insulinSchedules.find((s) => s.id === id);
      if (found) {
        setMedicationName(found.name);
        setPrescribedDose(found.prescribedDose);
        setActualDose(found.prescribedDose);
      }
    }
  };

  const adjustDose = (delta: number) => {
    setActualDose((prev) => Math.max(0, prev + delta));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicationName.trim()) {
      setErrorMsg('Please enter or select an insulin name.');
      return;
    }
    if (actualDose <= 0 && !isUncertain) {
      setErrorMsg('Dose must be greater than 0 units, or mark as uncertain.');
      return;
    }
    if (!confirmedByUser && !isUncertain) {
      setErrorMsg('Please check the confirmation box that you have taken this injection.');
      return;
    }

    // Construct full ISO recordedAt
    const [h, m] = time.split(':').map(Number);
    const recordedDate = new Date(`${date}T00:00:00`);
    recordedDate.setHours(h || 0, m || 0, 0, 0);

    const selectedSched = insulinSchedules.find((s) => s.id === selectedScheduleId);
    const schedTime = selectedSched ? selectedSched.scheduledTime : time;

    onSave(
      {
        scheduleId: selectedScheduleId === 'custom' ? undefined : selectedScheduleId,
        medicationName: medicationName.trim(),
        medicationType: 'insulin',
        prescribedDose: prescribedDose || actualDose,
        actualDose: Number(actualDose),
        unit: 'units',
        status: isUncertain ? 'uncertain' : 'taken',
        scheduledTime: schedTime,
        recordedAt: recordedDate.toISOString(),
        date,
        injectionSite,
        notes: notes.trim() || undefined,
        verifiedByUser: !isUncertain,
      },
      existingLogToEdit?.id
    );

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingLogToEdit ? 'Edit Insulin Injection' : 'Record Insulin Injection'}
      description="Record the exact time and dose of your insulin injection."
      maxWidth="lg"
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
            Prescribed Routine or Ad-hoc
          </label>
          <select
            value={selectedScheduleId}
            onChange={(e) => handleScheduleChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {insulinSchedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.prescribedDose} {s.unit} at {s.scheduledTime} - {s.instructions})
              </option>
            ))}
            <option value="custom">+ Other / Unscheduled Insulin</option>
          </select>
        </div>

        {/* Insulin Name if custom */}
        {selectedScheduleId === 'custom' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Insulin Name & Type
            </label>
            <input
              type="text"
              placeholder="e.g. Humalog, Novorapid, Lantus, 30/70"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
        )}

        {/* Dose counter */}
        <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Actual Dose Injected (Units)
            </span>
            {prescribedDose > 0 && (
              <span className="text-[11px] text-slate-500">
                Prescribed: <span className="font-mono tabular-nums font-semibold">{prescribedDose} units</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => adjustDose(-1)}
              className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
              aria-label="Decrease 1 unit"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="flex items-baseline gap-1">
              <input
                type="number"
                step="0.5"
                min="0"
                value={actualDose}
                onChange={(e) => setActualDose(parseFloat(e.target.value) || 0)}
                className="w-24 text-center text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 bg-transparent border-b-2 border-sky-500 focus:outline-none"
              />
              <span className="text-xs font-medium text-slate-500">units</span>
            </div>
            <button
              type="button"
              onClick={() => adjustDose(1)}
              className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
              aria-label="Increase 1 unit"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date and Time row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Exact Time Taken
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Injection Site Body Map Selector */}
        <BodyMapSiteSelector
          value={injectionSite}
          onChange={(s) => setInjectionSite(s)}
        />

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Optional Notes
          </label>
          <input
            type="text"
            placeholder="e.g. Injected 10 min before breakfast, new needle"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Uncertain vs Explicit Confirmation */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="confirm-injection"
              checked={confirmedByUser && !isUncertain}
              disabled={isUncertain}
              onChange={(e) => setConfirmedByUser(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded text-sky-600 focus:ring-sky-500"
            />
            <label
              htmlFor="confirm-injection"
              className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <span className="font-semibold block text-slate-900 dark:text-slate-100">
                I confirm that I actually took this injection
              </span>
              Required by safety protocol: doses are never marked taken automatically.
            </label>
          </div>

          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => {
                setIsUncertain(!isUncertain);
                if (!isUncertain) setConfirmedByUser(false);
              }}
              className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isUncertain
                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              {isUncertain ? 'Marked as Uncertain (Will not mark taken)' : 'Unsure if taken? Mark as "Uncertain — verify"'}
            </button>
          </div>
        </div>

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
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors min-h-[44px] flex items-center gap-2"
          >
            <Syringe className="w-4 h-4" />
            {isUncertain ? 'Save as Uncertain' : 'Record Injection'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
