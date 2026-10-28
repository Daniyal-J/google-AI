/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, ChevronDown, ChevronUp, PhoneCall, ShieldAlert, Sparkles, X } from 'lucide-react';
import { EmergencyContact, GlucoseReading, GlucoseTargets } from '../../types';
import { getSafetyGuidance } from '../../utils/glucose';

interface SafetyBannerProps {
  latestReading?: GlucoseReading;
  targets: GlucoseTargets;
  emergencyContact?: EmergencyContact;
}

export const SafetyBanner: React.FC<SafetyBannerProps> = ({
  latestReading,
  targets,
  emergencyContact,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  if (!latestReading) return null;
  if (dismissedId === latestReading.id) return null;

  const guidance = getSafetyGuidance(latestReading.readingMgDl, latestReading.context, targets);
  if (!guidance || !guidance.isUrgent) return null;

  const isSevere = guidance.level === 'severe_low' || guidance.level === 'severe_high';

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all mb-6 ${
        guidance.level === 'severe_low'
          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
          : guidance.level === 'low'
          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100'
          : 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 text-orange-950 dark:text-orange-100'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
              isSevere
                ? 'bg-rose-600 text-white'
                : 'bg-amber-600 text-white'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/70 dark:bg-black/30 border border-current/20">
                {guidance.badgeText}
              </span>
              <h3 className="text-sm sm:text-base font-bold">{guidance.title}</h3>
            </div>
            <p className="text-xs sm:text-sm mt-1 opacity-90 leading-relaxed font-medium">
              {guidance.summary}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={expanded ? 'Collapse advice' : 'Expand advice'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setDismissedId(latestReading.id)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center opacity-70 hover:opacity-100"
            aria-label="Acknowledge alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-current/15 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
            Immediate Recommended Action:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm">
            {guidance.actions.map((act, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="font-bold shrink-0 mt-0.5">{idx + 1}.</span>
                <span>{act}</span>
              </li>
            ))}
          </ul>

          {emergencyContact && emergencyContact.clinicPhone && (
            <div className="mt-3 pt-3 border-t border-current/10 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-medium">
                <PhoneCall className="w-4 h-4 shrink-0" />
                <span>
                  Emergency: {emergencyContact.doctorName} ({emergencyContact.clinicPhone})
                </span>
              </div>
              {emergencyContact.personalEmergencyPhone && (
                <span className="opacity-90">
                  Family: {emergencyContact.personalEmergencyName} ({emergencyContact.personalEmergencyPhone})
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
