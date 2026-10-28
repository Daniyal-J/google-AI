/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Pill, Syringe, AlertCircle } from 'lucide-react';
import { MedicationSchedule, MedicationType, InsulinSubType } from '../../types';
import { getCurrentTimeString } from '../../utils/date';
import { Modal } from '../common/Modal';

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleToEdit?: MedicationSchedule | null;
  defaultType?: MedicationType;
  onSave: (schedule: MedicationSchedule) => void;
}

export const EditScheduleModal: React.FC<EditScheduleModalProps> = ({
  isOpen,
  onClose,
  scheduleToEdit,
  defaultType = 'insulin',
  onSave,
}) => {
  const [type, setType] = useState<MedicationType>(defaultType);
  const [name, setName] = useState('');
  const [subType, setSubType] = useState<InsulinSubType>('premixed');
  const [prescribedDose, setPrescribedDose] = useState<number>(10);
  const [unit, setUnit] = useState('units');
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [instructions, setInstructions] = useState('Before breakfast');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (scheduleToEdit) {
      setType(scheduleToEdit.type);
      setName(scheduleToEdit.name);
      setSubType(scheduleToEdit.subType || 'premixed');
      setPrescribedDose(scheduleToEdit.prescribedDose);
      setUnit(scheduleToEdit.unit);
      setScheduledTime(scheduleToEdit.scheduledTime);
      setInstructions(scheduleToEdit.instructions);
      setNotes(scheduleToEdit.notes || '');
      setActive(scheduleToEdit.active);
    } else {
      setType(defaultType);
      setName('');
      setSubType('premixed');
      setPrescribedDose(defaultType === 'insulin' ? 20 : 1);
      setUnit(defaultType === 'insulin' ? 'units' : 'tablet');
      setScheduledTime('08:00');
      setInstructions(defaultType === 'insulin' ? 'Before breakfast' : 'With breakfast');
      setNotes('');
      setActive(true);
    }
    setErrorMsg('');
  }, [isOpen, scheduleToEdit, defaultType]);

  const handleTypeChange = (newType: MedicationType) => {
    setType(newType);
    if (newType === 'insulin') {
      setUnit('units');
      setPrescribedDose(20);
    } else {
      setUnit('tablet');
      setPrescribedDose(1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please specify the medication name.');
      return;
    }
    if (prescribedDose <= 0) {
      setErrorMsg('Prescribed dose must be greater than zero.');
      return;
    }

    const schedule: MedicationSchedule = {
      id: scheduleToEdit ? scheduleToEdit.id : `sched-${Date.now()}`,
      type,
      name: name.trim(),
      subType: type === 'insulin' ? subType : undefined,
      prescribedDose: Number(prescribedDose),
      unit,
      scheduledTime,
      instructions: instructions.trim(),
      repeat: 'daily',
      active,
      notes: notes.trim() || undefined,
      createdAt: scheduleToEdit ? scheduleToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(schedule);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={scheduleToEdit ? 'Edit Medication Routine' : 'Add Medication Routine'}
      description="Configure your doctor-prescribed medication timing and dose."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Type toggle */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Medication Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('insulin')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors min-h-[44px] ${
                type === 'insulin'
                  ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-800 dark:text-sky-200 ring-1 ring-sky-500'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Syringe className="w-4 h-4" />
              Insulin Injection
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('tablet')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors min-h-[44px] ${
                type === 'tablet'
                  ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-800 dark:text-teal-200 ring-1 ring-teal-500'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Pill className="w-4 h-4" />
              Tablet / Pill
            </button>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Medication Name
          </label>
          <input
            type="text"
            placeholder={type === 'insulin' ? 'e.g. 30/70 Premixed, Basaglar, Novorapid' : 'e.g. Metformin, Morning multivitamin'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            required
          />
        </div>

        {/* Insulin subtype if insulin */}
        {type === 'insulin' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Insulin Type
            </label>
            <select
              value={subType}
              onChange={(e) => setSubType(e.target.value as InsulinSubType)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="premixed">Premixed (e.g. 30/70, 50/50)</option>
              <option value="basal">Long-acting Basal (e.g. Basaglar, Lantus, Tresiba)</option>
              <option value="bolus">Rapid-acting Bolus (e.g. Novorapid, Humalog, Fiasp)</option>
              <option value="other">Other Insulin</option>
            </select>
          </div>
        )}

        {/* Dose and Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Prescribed Dose
            </label>
            <input
              type="number"
              step="any"
              min="0.1"
              value={prescribedDose}
              onChange={(e) => setPrescribedDose(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Unit
            </label>
            {type === 'insulin' ? (
              <input
                type="text"
                value="units"
                readOnly
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300"
              />
            ) : (
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="tablet">tablet(s)</option>
                <option value="capsule">capsule(s)</option>
                <option value="mg">mg</option>
                <option value="ml">ml</option>
              </select>
            )}
          </div>
        </div>

        {/* Scheduled time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Scheduled Time
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Food Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Before breakfast, with meal"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Doctor Instructions / Personal Notes
          </label>
          <input
            type="text"
            placeholder="e.g. Prescribed by Dr. Smith on Oct 2026"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
          />
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="sched-active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
          />
          <label htmlFor="sched-active" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
            Active routine (appears in daily schedule)
          </label>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 min-h-[40px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs min-h-[40px]"
          >
            Save Routine
          </button>
        </div>
      </form>
    </Modal>
  );
};
