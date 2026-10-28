/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import { GlucoseContext, GlucoseReading, GlucoseTargets } from '../../types';
import { getCurrentTimeString, getTodayString } from '../../utils/date';
import { CONVERSION_FACTOR, evaluateGlucoseLevel, getContextLabel } from '../../utils/glucose';
import { Modal } from '../common/Modal';

interface LogGlucoseModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferredUnit: 'mg/dL' | 'mmol/L';
  targets: GlucoseTargets;
  existingReadingToEdit?: GlucoseReading | null;
  onSave: (reading: Omit<GlucoseReading, 'id'>, existingId?: string) => void;
}

const CONTEXTS: GlucoseContext[] = [
  'fasting',
  'before_breakfast',
  'after_breakfast',
  'before_lunch',
  'after_lunch',
  'before_dinner',
  'after_dinner',
  'bedtime',
  'exercise',
  'night',
  'other',
];

export const LogGlucoseModal: React.FC<LogGlucoseModalProps> = ({
  isOpen,
  onClose,
  preferredUnit,
  targets,
  existingReadingToEdit,
  onSave,
}) => {
  const [readingInput, setReadingInput] = useState<string>('');
  const [unit, setUnit] = useState<'mg/dL' | 'mmol/L'>(preferredUnit);
  const [date, setDate] = useState<string>(getTodayString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [context, setContext] = useState<GlucoseContext>('fasting');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    setUnit(preferredUnit);
    if (existingReadingToEdit) {
      if (preferredUnit === 'mmol/L') {
        setReadingInput((existingReadingToEdit.readingMgDl / CONVERSION_FACTOR).toFixed(1));
      } else {
        setReadingInput(Math.round(existingReadingToEdit.readingMgDl).toString());
      }
      setDate(existingReadingToEdit.date);
      setTime(existingReadingToEdit.time);
      setContext(existingReadingToEdit.context);
      setNotes(existingReadingToEdit.notes || '');
    } else {
      setReadingInput('');
      setDate(getTodayString());
      setTime(getCurrentTimeString());
      // Suggest context based on current hour
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 9) setContext('fasting');
      else if (hour >= 9 && hour < 12) setContext('after_breakfast');
      else if (hour >= 12 && hour < 14) setContext('before_lunch');
      else if (hour >= 14 && hour < 17) setContext('after_lunch');
      else if (hour >= 17 && hour < 20) setContext('before_dinner');
      else if (hour >= 20 && hour < 23) setContext('bedtime');
      else setContext('night');
      setNotes('');
    }
    setErrorMsg('');
  }, [isOpen, preferredUnit, existingReadingToEdit]);

  // Compute live mg/dL for clinical safety evaluation preview
  const numVal = parseFloat(readingInput);
  const canonicalMgDl = isNaN(numVal)
    ? 0
    : unit === 'mmol/L'
    ? Math.round(numVal * CONVERSION_FACTOR)
    : Math.round(numVal);

  const alertLevel = numVal > 0 ? evaluateGlucoseLevel(canonicalMgDl, context, targets) : 'in_range';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!readingInput || isNaN(numVal) || numVal <= 0) {
      setErrorMsg('Please enter a valid positive glucose reading.');
      return;
    }

    if (unit === 'mg/dL' && (numVal < 20 || numVal > 700)) {
      setErrorMsg('Reading appears outside standard clinical glucometer ranges (20 - 700 mg/dL). Please verify.');
      return;
    }
    if (unit === 'mmol/L' && (numVal < 1.1 || numVal > 38.8)) {
      setErrorMsg('Reading appears outside standard clinical glucometer ranges (1.1 - 38.8 mmol/L). Please verify.');
      return;
    }

    const [h, m] = time.split(':').map(Number);
    const ts = new Date(`${date}T00:00:00`);
    ts.setHours(h || 0, m || 0, 0, 0);

    onSave(
      {
        readingMgDl: canonicalMgDl,
        unitLogged: unit,
        timestamp: ts.toISOString(),
        date,
        time,
        context,
        notes: notes.trim() || undefined,
      },
      existingReadingToEdit?.id
    );

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingReadingToEdit ? 'Edit Glucose Reading' : 'Log Blood Glucose'}
      description="Record capillary blood glucose or CGM sensor reading."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Large Glucose Input & Unit Selector */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Blood Glucose Value
          </label>
          <div className="flex items-center justify-center gap-3">
            <input
              type="number"
              step={unit === 'mmol/L' ? '0.1' : '1'}
              min="0"
              placeholder={unit === 'mmol/L' ? '5.5' : '100'}
              value={readingInput}
              onChange={(e) => setReadingInput(e.target.value)}
              className="w-32 text-center text-4xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-inner"
              autoFocus
              required
            />
            {/* Unit Toggle Button */}
            <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  if (unit !== 'mg/dL') {
                    setUnit('mg/dL');
                    if (numVal > 0) setReadingInput(Math.round(numVal * CONVERSION_FACTOR).toString());
                  }
                }}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  unit === 'mg/dL'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                mg/dL
              </button>
              <button
                type="button"
                onClick={() => {
                  if (unit !== 'mmol/L') {
                    setUnit('mmol/L');
                    if (numVal > 0) setReadingInput((numVal / CONVERSION_FACTOR).toFixed(1));
                  }
                }}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  unit === 'mmol/L'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                mmol/L
              </button>
            </div>
          </div>

          {/* Real-time clinical feedback pill */}
          {canonicalMgDl > 0 && (
            <div className="pt-1 text-xs">
              {alertLevel === 'severe_low' && (
                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Severe Hypoglycemia (&lt;54 mg/dL) — Fast acting carbs required!
                </span>
              )}
              {alertLevel === 'low' && (
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center justify-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Low Glucose (&lt;70 mg/dL) — Follow Rule of 15
                </span>
              )}
              {alertLevel === 'in_range' && (
                <span className="text-teal-600 dark:text-teal-400 font-semibold">
                  ✓ Within Target Range ({targets.targetMin}–{targets.targetMax} mg/dL)
                </span>
              )}
              {alertLevel === 'high' && (
                <span className="text-orange-600 dark:text-orange-400 font-semibold">
                  Above Target Range (&gt;{targets.targetMax} mg/dL)
                </span>
              )}
              {alertLevel === 'severe_high' && (
                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> High Glucose (&gt;{targets.hyperWarning} mg/dL) — Hydrate & check ketones
                </span>
              )}
            </div>
          )}
        </div>

        {/* Reading Context */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Reading Context / Meal Timing
          </label>
          <select
            value={context}
            onChange={(e) => setContext(e.target.value as GlucoseContext)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {CONTEXTS.map((c) => (
              <option key={c} value={c}>
                {getContextLabel(c)}
              </option>
            ))}
          </select>
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
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Notes (Carbs, Exercise, Symptoms)
          </label>
          <input
            type="text"
            placeholder="e.g. 45g carbs, post-walk, mild shakiness"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Non-diagnostic disclaimer */}
        <p className="text-[11px] text-slate-500 italic leading-normal">
          Medical note: DiaCare does not automatically calculate insulin correction boluses. Always consult your diabetes educator or physician for dose adjustments.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
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
            <Activity className="w-4 h-4" />
            Save Glucose Reading
          </button>
        </div>
      </form>
    </Modal>
  );
};
