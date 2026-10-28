/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Settings,
  User,
  Clock,
  Activity,
  PhoneCall,
  ShieldAlert,
  Database,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
} from 'lucide-react';
import { GlucoseTargets, UserProfile } from '../../types';
import { CONVERSION_FACTOR } from '../../utils/glucose';
import { Modal } from '../common/Modal';

interface SettingsViewProps {
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => Promise<boolean>;
  onClearAllData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onSaveProfile,
  onExportCSV,
  onExportJSON,
  onImportJSON,
  onClearAllData,
}) => {
  const [name, setName] = useState(profile.name);
  const [timezone, setTimezone] = useState(profile.timezone || 'Asia/Kolkata');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>(profile.timeFormat);
  const [glucoseUnit, setGlucoseUnit] = useState<'mg/dL' | 'mmol/L'>(profile.glucoseUnit);
  const [theme, setTheme] = useState<'light' | 'dark'>(profile.theme);

  // Targets
  const [targets, setTargets] = useState<GlucoseTargets>({ ...profile.glucoseTargets });

  // Emergency contact
  const [doctorName, setDoctorName] = useState(profile.emergencyContact?.doctorName || '');
  const [clinicName, setClinicName] = useState(profile.emergencyContact?.clinicName || '');
  const [clinicPhone, setClinicPhone] = useState(profile.emergencyContact?.clinicPhone || '');
  const [personalEmergencyName, setPersonalEmergencyName] = useState(profile.emergencyContact?.personalEmergencyName || '');
  const [personalEmergencyPhone, setPersonalEmergencyPhone] = useState(profile.emergencyContact?.personalEmergencyPhone || '');
  const [specialInstructions, setSpecialInstructions] = useState(profile.emergencyContact?.specialInstructions || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      name: name.trim(),
      timezone,
      timeFormat,
      glucoseUnit,
      theme,
      glucoseTargets: targets,
      emergencyContact: {
        doctorName: doctorName.trim(),
        clinicName: clinicName.trim(),
        clinicPhone: clinicPhone.trim(),
        personalEmergencyName: personalEmergencyName.trim(),
        personalEmergencyPhone: personalEmergencyPhone.trim(),
        hospitalAddress: profile.emergencyContact?.hospitalAddress || '',
        specialInstructions: specialInstructions.trim(),
      },
    };

    onSaveProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = await onImportJSON(content);
        if (ok) {
          alert('Data restored successfully! The app will refresh.');
          window.location.reload();
        } else {
          alert('Invalid backup file. Please verify the JSON format.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400">
          <Settings className="w-4 h-4" />
          <span>App Preferences & Safety Limits</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
          Settings & Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Customize display units, clinician-approved glucose targets, and emergency diabetes plan.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Personal & Display Settings */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <User className="w-4 h-4 text-sky-600" />
            <h3>Personal Profile & Display</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preferred Name
              </label>
              <input
                type="text"
                placeholder="e.g. Daniyal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Time Zone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Time Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTimeFormat('12h')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors min-h-[40px] ${
                    timeFormat === '12h'
                      ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-800 dark:text-sky-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  12-hour (AM/PM)
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFormat('24h')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors min-h-[40px] ${
                    timeFormat === '24h'
                      ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-800 dark:text-sky-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  24-hour (19:30)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Glucose Units
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGlucoseUnit('mg/dL')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors min-h-[40px] ${
                    glucoseUnit === 'mg/dL'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  mg/dL (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setGlucoseUnit('mmol/L')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors min-h-[40px] ${
                    glucoseUnit === 'mmol/L'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  mmol/L (UK/Canada)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Clinician-Approved Glucose Targets */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3>Clinician-Approved Glucose Targets (mg/dL)</h3>
          </div>
          <p className="text-xs text-slate-500">
            Configured in consultation with your diabetes team. These define in-range zones and immediate safety guidance.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Severe Low (Alert)
              </label>
              <input
                type="number"
                value={targets.severeLow}
                onChange={(e) => setTargets({ ...targets, severeLow: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono tabular-nums text-rose-600 font-bold focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Default &lt;54 mg/dL</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Hypo Warning (Rule of 15)
              </label>
              <input
                type="number"
                value={targets.hypoWarning}
                onChange={(e) => setTargets({ ...targets, hypoWarning: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono tabular-nums text-amber-600 font-bold focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Default &lt;70 mg/dL</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Target Min (Fasting)
              </label>
              <input
                type="number"
                value={targets.targetMin}
                onChange={(e) => setTargets({ ...targets, targetMin: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono tabular-nums text-teal-600 font-bold focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Default 80 mg/dL</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Target Max (Pre-Meal)
              </label>
              <input
                type="number"
                value={targets.targetMax}
                onChange={(e) => setTargets({ ...targets, targetMax: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono tabular-nums text-teal-600 font-bold focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Default 140 mg/dL</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Post-Meal Max
              </label>
              <input
                type="number"
                value={targets.postMealMax}
                onChange={(e) => setTargets({ ...targets, postMealMax: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono tabular-nums text-slate-800 dark:text-slate-200 font-bold focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Default 180 mg/dL</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Hyper Alert (Ketones)
              </label>
              <input
                type="number"
                value={targets.hyperWarning}
                onChange={(e) => setTargets({ ...targets, hyperWarning: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono tabular-nums text-rose-600 font-bold focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Default &gt;250 mg/dL</span>
            </div>
          </div>
        </div>

        {/* Emergency Diabetes Contacts */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <PhoneCall className="w-4 h-4 text-rose-600" />
            <h3>Emergency Contacts & Diabetes Care Team</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Endocrinologist / Doctor
              </label>
              <input
                type="text"
                placeholder="Dr. Specialist"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinic / Hospital Emergency Phone
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={clinicPhone}
                onChange={(e) => setClinicPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Family Emergency Contact Name
              </label>
              <input
                type="text"
                placeholder="Emergency Contact"
                value={personalEmergencyName}
                onChange={(e) => setPersonalEmergencyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Family Emergency Phone
              </label>
              <input
                type="tel"
                placeholder="+91 98765 01234"
                value={personalEmergencyPhone}
                onChange={(e) => setPersonalEmergencyPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Emergency Instructions for Bystanders
              </label>
              <input
                type="text"
                placeholder="Type 1 Diabetes (Insulin Dependent). If unconscious, administer glucagon, call ambulance."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors min-h-[44px]"
          >
            Save Profile & Targets
          </button>
        </div>
      </form>

      {/* Data Backup & Privacy Section */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <Database className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          <h3>Data Persistence, Backup & Privacy</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Your health data is stored strictly inside your local browser database (IndexedDB). It is never sent to third-party tracking or advertising servers. Because browser clearing may erase local data, we strongly recommend downloading periodic JSON backups.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onExportJSON}
            className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            Download Full Backup (.json)
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 min-h-[44px]"
          >
            <Upload className="w-4 h-4" />
            Restore Backup (.json)
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            Export Doctor Report (.csv)
          </button>

          <button
            type="button"
            onClick={() => setConfirmClearOpen(true)}
            className="ml-auto px-4 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors min-h-[44px] flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Clear Local Data
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Clearing Data */}
      <Modal
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        title="Clear All Health Records?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            This will permanently delete your recorded medication logs, glucose tests, and completed tasks from this device. Prescribed routines and targets will be preserved.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setConfirmClearOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 min-h-[40px]"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                await onClearAllData();
                setConfirmClearOpen(false);
                alert('Local data cleared.');
                window.location.reload();
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold min-h-[40px]"
            >
              Confirm Clear
            </button>
          </div>
        </div>
      </Modal>

      {/* Medical Safety & Compliance Notice */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/40 text-[11px] text-slate-500 space-y-1.5">
        <span className="font-bold text-slate-700 dark:text-slate-300 block">
          Medical Device & Software Statement:
        </span>
        <p>
          My DiaCare is a personal lifestyle and logbook reminder application intended solely for personal tracking. It does not replace licensed medical diagnosis, clinical judgment, or individualized therapy plans formulated by your diabetes healthcare professional. Never change your insulin doses or medication regimen based on calculations or inferences outside your doctor's explicit prescription.
        </p>
      </div>
    </div>
  );
};
