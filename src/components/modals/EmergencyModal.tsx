/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PhoneCall, ShieldAlert, AlertTriangle, HeartPulse, X } from 'lucide-react';
import { EmergencyContact } from '../../types';
import { Modal } from '../common/Modal';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: EmergencyContact;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  contact,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Emergency Diabetes Protocol & Contacts"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Severe Hypoglycemia Warning Banner */}
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-700 dark:text-rose-300">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>Severe Hypoglycemia Protocol (Blood Sugar &lt; 54 mg/dL)</span>
          </div>
          <p className="text-xs leading-relaxed font-medium">
            If the person is <strong>confused, seizure-prone, or unconscious</strong>:
          </p>
          <ul className="text-xs space-y-1 list-disc pl-5">
            <li><strong>DO NOT</strong> give food, liquid, or insulin by mouth.</li>
            <li>Administer prescribed emergency glucagon injection / nasal powder immediately.</li>
            <li>Call emergency medical services (Ambulance) right away.</li>
            <li>Place person on their side (recovery position) to prevent choking.</li>
          </ul>
        </div>

        {/* Rule of 15 Summary for conscious lows */}
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100 space-y-1 text-xs">
          <span className="font-bold block text-amber-800 dark:text-amber-300">
            For Mild/Moderate Lows (Conscious, able to swallow):
          </span>
          <p>
            Take <strong>15 grams</strong> of fast-acting carbohydrate (1/2 cup orange juice, 4 glucose tablets, or 3 tsp sugar). Wait <strong>15 minutes</strong>, recheck blood glucose. Repeat if still under 70 mg/dL.
          </p>
        </div>

        {/* Direct Contacts */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Quick Emergency Contacts
          </h4>

          {contact?.clinicPhone && (
            <a
              href={`tel:${contact.clinicPhone.replace(/\s+/g, '')}`}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-rose-400 transition-colors"
            >
              <div>
                <span className="text-xs text-slate-400 block">Doctor / Clinic</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {contact.doctorName || 'Endocrinologist'}
                </span>
                <span className="text-xs font-mono text-slate-600 dark:text-slate-300 block">
                  {contact.clinicPhone}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center shrink-0">
                <PhoneCall className="w-4 h-4" />
              </div>
            </a>
          )}

          {contact?.personalEmergencyPhone && (
            <a
              href={`tel:${contact.personalEmergencyPhone.replace(/\s+/g, '')}`}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-sky-400 transition-colors"
            >
              <div>
                <span className="text-xs text-slate-400 block">Family Emergency Contact</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {contact.personalEmergencyName || 'Family Member'}
                </span>
                <span className="text-xs font-mono text-slate-600 dark:text-slate-300 block">
                  {contact.personalEmergencyPhone}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 flex items-center justify-center shrink-0">
                <PhoneCall className="w-4 h-4" />
              </div>
            </a>
          )}

          {contact?.specialInstructions && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold block text-slate-800 dark:text-slate-200">
                Care Instructions:
              </span>
              <span>{contact.specialInstructions}</span>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold min-h-[40px]"
          >
            Close Emergency Panel
          </button>
        </div>
      </div>
    </Modal>
  );
};
