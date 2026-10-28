/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { InjectionSite } from '../../types';

interface BodyMapSiteSelectorProps {
  value?: InjectionSite;
  onChange: (site: InjectionSite) => void;
}

const SITES: { id: InjectionSite; label: string; area: string }[] = [
  { id: 'abdomen-left', label: 'Abdomen (Left)', area: 'Abdomen' },
  { id: 'abdomen-right', label: 'Abdomen (Right)', area: 'Abdomen' },
  { id: 'thigh-left', label: 'Thigh (Left)', area: 'Thigh' },
  { id: 'thigh-right', label: 'Thigh (Right)', area: 'Thigh' },
  { id: 'arm-left', label: 'Upper Arm (Left)', area: 'Arm' },
  { id: 'arm-right', label: 'Upper Arm (Right)', area: 'Arm' },
  { id: 'buttocks', label: 'Buttocks / Hip', area: 'Hip' },
  { id: 'other', label: 'Other Site', area: 'Other' },
];

export const BodyMapSiteSelector: React.FC<BodyMapSiteSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <label className="font-medium text-slate-700 dark:text-slate-300">
          Injection Site Rotation
        </label>
        <span className="text-[11px] text-slate-400">Helps prevent lipodystrophy</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SITES.map((site) => {
          const isSelected = value === site.id;
          return (
            <button
              key={site.id}
              type="button"
              onClick={() => onChange(site.id)}
              className={`p-2.5 rounded-xl border text-left transition-all min-h-[48px] flex flex-col justify-center ${
                isSelected
                  ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200 font-semibold shadow-xs ring-1 ring-sky-500'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">
                {site.area}
              </span>
              <span className="text-xs truncate">{site.label.replace(`${site.area} `, '')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
