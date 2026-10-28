/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { MedicationLog } from '../../types';
import { formatTimeDisplay } from '../../utils/date';
import { Modal } from './Modal';

interface DuplicateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingLog: MedicationLog;
  onConfirmExtraDose: () => void;
  onReviewExisting: () => void;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  isOpen,
  onClose,
  existingLog,
  onConfirmExtraDose,
  onReviewExisting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Duplicate Dose Warning"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Already recorded for today
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              To prevent accidental insulin or medication stacking, this dose has already been confirmed earlier today.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Medication</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {existingLog.medicationName}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Status</span>
            <span className="inline-flex items-center gap-1 font-semibold text-teal-700 dark:text-teal-400 capitalize">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {existingLog.status}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Recorded Time</span>
            <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {formatTimeDisplay(existingLog.recordedAt)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Dose Recorded</span>
            <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
              {existingLog.actualDose} {existingLog.unit}
            </span>
          </div>

          {existingLog.injectionSite && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Injection Site</span>
              <span className="capitalize text-slate-800 dark:text-slate-200">
                {existingLog.injectionSite.replace('-', ' ')}
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
          Safety reminder: Never double an insulin injection or tablet dose if you missed or delayed one without explicit instructions from your endocrinologist.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onReviewExisting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-medium text-xs hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors min-h-[44px] flex items-center justify-center shadow-xs"
          >
            Review Existing Entry
          </button>
          <button
            type="button"
            onClick={onConfirmExtraDose}
            className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] flex items-center justify-center"
          >
            Log Extra / Unscheduled Dose
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-3 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 text-xs min-h-[44px] flex items-center justify-center"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
