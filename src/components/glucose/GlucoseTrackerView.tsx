/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Activity,
  Plus,
  Clock,
  TrendingUp,
  AlertTriangle,
  Edit2,
  Trash2,
  Info,
  Calendar,
  Filter,
} from 'lucide-react';
import { GlucoseContext, GlucoseReading, UserProfile } from '../../types';
import { formatDateDisplay, formatTimeDisplay, getTodayString, offsetDate } from '../../utils/date';
import {
  evaluateGlucoseLevel,
  formatGlucoseValue,
  getContextLabel,
  mgDlToMmol,
} from '../../utils/glucose';
import { SafetyBanner } from '../common/SafetyBanner';

interface GlucoseTrackerViewProps {
  profile: UserProfile;
  readings: GlucoseReading[];
  onOpenLogGlucose: (readingToEdit?: GlucoseReading) => void;
  onDeleteReading: (id: string) => void;
}

type TimeframeOption = '7d' | '14d' | '30d' | 'all';

export const GlucoseTrackerView: React.FC<GlucoseTrackerViewProps> = ({
  profile,
  readings,
  onOpenLogGlucose,
  onDeleteReading,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('7d');
  const [contextFilter, setContextFilter] = useState<string>('all');

  const todayStr = getTodayString();

  // Filtered readings based on timeframe
  const filteredReadings = useMemo(() => {
    let cutoff = '';
    if (timeframe === '7d') cutoff = offsetDate(todayStr, -7);
    else if (timeframe === '14d') cutoff = offsetDate(todayStr, -14);
    else if (timeframe === '30d') cutoff = offsetDate(todayStr, -30);

    return readings.filter((r) => {
      const dateMatch = cutoff ? r.date >= cutoff : true;
      const contextMatch = contextFilter === 'all' ? true : r.context === contextFilter;
      return dateMatch && contextMatch;
    });
  }, [readings, timeframe, contextFilter, todayStr]);

  // Statistics
  const stats = useMemo(() => {
    if (filteredReadings.length === 0) {
      return { avg: 0, count: 0, inRangePct: 0, lowCount: 0, highCount: 0 };
    }
    const sum = filteredReadings.reduce((acc, curr) => acc + curr.readingMgDl, 0);
    const avg = Math.round(sum / filteredReadings.length);

    let inRangeCount = 0;
    let lowCount = 0;
    let highCount = 0;

    for (const r of filteredReadings) {
      const level = evaluateGlucoseLevel(r.readingMgDl, r.context, profile.glucoseTargets);
      if (level === 'in_range') inRangeCount++;
      else if (level === 'low' || level === 'severe_low') lowCount++;
      else highCount++;
    }

    const inRangePct = Math.round((inRangeCount / filteredReadings.length) * 100);

    return {
      avg,
      count: filteredReadings.length,
      inRangePct,
      lowCount,
      highCount,
    };
  }, [filteredReadings, profile.glucoseTargets]);

  const latestReading = readings.length > 0 ? readings[0] : undefined;

  // Chart coordinate calculation
  const chartData = useMemo(() => {
    // Need ascending chronological order for plotting
    const chronological = [...filteredReadings].reverse();
    if (chronological.length < 2) return null;

    const minMg = 40;
    const maxMg = 350;
    const width = 600;
    const height = 220;
    const padX = 40;
    const padY = 25;

    const points = chronological.map((r, idx) => {
      const x = padX + (idx / (chronological.length - 1)) * (width - 2 * padX);
      const clamped = Math.max(minMg, Math.min(maxMg, r.readingMgDl));
      const y = height - padY - ((clamped - minMg) / (maxMg - minMg)) * (height - 2 * padY);
      return { x, y, reading: r };
    });

    const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

    // Target Range Shaded Area
    const targetMinY = height - padY - ((profile.glucoseTargets.targetMin - minMg) / (maxMg - minMg)) * (height - 2 * padY);
    const targetMaxY = height - padY - ((profile.glucoseTargets.targetMax - minMg) / (maxMg - minMg)) * (height - 2 * padY);

    return { points, pathD, width, height, targetMinY, targetMaxY, padX, padY };
  }, [filteredReadings, profile.glucoseTargets]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Immediate Clinical Safety Guidance if latest is hypo/hyper */}
      <SafetyBanner
        latestReading={latestReading}
        targets={profile.glucoseTargets}
        emergencyContact={profile.emergencyContact}
      />

      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Activity className="w-4 h-4" />
              <span>Capillary & CGM Blood Glucose</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              Glucose Tracking & Trends
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Record readings, monitor time in target range, and review clinician-approved thresholds.
            </p>
          </div>

          <button
            onClick={() => onOpenLogGlucose()}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors min-h-[44px] flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            + Log Reading
          </button>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Latest Reading</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {latestReading
                ? formatGlucoseValue(latestReading.readingMgDl, profile.glucoseUnit).value
                : '--'}
            </span>
            <span className="text-xs text-slate-500">{profile.glucoseUnit}</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {latestReading ? getContextLabel(latestReading.context) : 'No data yet'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Average Glucose</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {stats.avg > 0
                ? formatGlucoseValue(stats.avg, profile.glucoseUnit).value
                : '--'}
            </span>
            <span className="text-xs text-slate-500">{profile.glucoseUnit}</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            Based on {stats.count} readings
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Time in Target Range</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400">
              {stats.count > 0 ? `${stats.inRangePct}%` : '--%'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1 font-mono tabular-nums">
            Target: {profile.glucoseTargets.targetMin}–{profile.glucoseTargets.targetMax} mg/dL
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Out of Range</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xs font-semibold text-amber-600 font-mono tabular-nums">
              {stats.lowCount} Low
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-xs font-semibold text-rose-600 font-mono tabular-nums">
              {stats.highCount} High
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            Alerts logged in period
          </span>
        </div>
      </div>

      {/* Interactive Trend Chart */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Glucose Trend ({profile.glucoseUnit})
            </h3>
            <p className="text-xs text-slate-500">
              Green shaded band highlights your clinician-approved target zone ({profile.glucoseTargets.targetMin}–{profile.glucoseTargets.targetMax} mg/dL).
            </p>
          </div>

          {/* Timeframe selector tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
            {(['7d', '14d', '30d', 'all'] as TimeframeOption[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  timeframe === tf
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {tf === '7d' ? '7 Days' : tf === '14d' ? '14 Days' : tf === '30d' ? '30 Days' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Chart Render */}
        {chartData ? (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[500px]">
              <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} className="w-full h-56">
                {/* Target Range Band */}
                <rect
                  x={chartData.padX}
                  y={chartData.targetMaxY}
                  width={chartData.width - 2 * chartData.padX}
                  height={Math.max(1, chartData.targetMinY - chartData.targetMaxY)}
                  className="fill-teal-500/10 dark:fill-teal-400/15"
                />

                {/* Target min & max guide lines */}
                <line
                  x1={chartData.padX}
                  y1={chartData.targetMaxY}
                  x2={chartData.width - chartData.padX}
                  y2={chartData.targetMaxY}
                  strokeDasharray="4 4"
                  className="stroke-teal-500/40"
                  strokeWidth="1"
                />
                <line
                  x1={chartData.padX}
                  y1={chartData.targetMinY}
                  x2={chartData.width - chartData.padX}
                  y2={chartData.targetMinY}
                  strokeDasharray="4 4"
                  className="stroke-teal-500/40"
                  strokeWidth="1"
                />

                {/* Trend line */}
                <path
                  d={chartData.pathD}
                  fill="none"
                  className="stroke-sky-600 dark:stroke-sky-400"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {chartData.points.map((pt, i) => {
                  const level = evaluateGlucoseLevel(
                    pt.reading.readingMgDl,
                    pt.reading.context,
                    profile.glucoseTargets
                  );
                  const isHypo = level === 'low' || level === 'severe_low';
                  const isHyper = level === 'high' || level === 'severe_high';

                  return (
                    <g key={pt.reading.id}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={4.5}
                        className={`transition-transform hover:scale-125 cursor-pointer ${
                          isHypo
                            ? 'fill-amber-500 stroke-white dark:stroke-slate-900'
                            : isHyper
                            ? 'fill-rose-500 stroke-white dark:stroke-slate-900'
                            : 'fill-teal-500 stroke-white dark:stroke-slate-900'
                        }`}
                        strokeWidth="2"
                      />
                      <title>
                        {formatGlucoseValue(pt.reading.readingMgDl, profile.glucoseUnit).value}{' '}
                        {profile.glucoseUnit} on {pt.reading.date} at {pt.reading.time} ({getContextLabel(pt.reading.context)})
                      </title>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            Log at least 2 readings in this timeframe to generate a visual trend line.
          </div>
        )}
      </div>

      {/* Chronological History Log */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Glucose Readings Log ({filteredReadings.length})
          </h2>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={contextFilter}
              onChange={(e) => setContextFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Contexts</option>
              <option value="fasting">Fasting</option>
              <option value="before_breakfast">Before Breakfast</option>
              <option value="after_breakfast">After Breakfast</option>
              <option value="before_lunch">Before Lunch</option>
              <option value="after_lunch">After Lunch</option>
              <option value="before_dinner">Before Dinner</option>
              <option value="after_dinner">After Dinner</option>
              <option value="bedtime">Bedtime</option>
            </select>
          </div>
        </div>

        {filteredReadings.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Activity className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">No glucose readings recorded matching filter.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredReadings.map((r) => {
              const level = evaluateGlucoseLevel(r.readingMgDl, r.context, profile.glucoseTargets);
              const displayVal = formatGlucoseValue(r.readingMgDl, profile.glucoseUnit);

              return (
                <div
                  key={r.id}
                  className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-mono tabular-nums font-bold shrink-0 ${
                        level === 'in_range'
                          ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                          : level === 'low' || level === 'severe_low'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      <span className="text-base sm:text-lg leading-tight">{displayVal.value}</span>
                      <span className="text-[9px] uppercase font-sans font-semibold">{displayVal.unit}</span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {getContextLabel(r.context)}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                            level === 'in_range'
                              ? 'bg-teal-100/70 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200'
                              : level === 'low' || level === 'severe_low'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {level === 'in_range' ? 'Target' : level === 'low' ? 'Low' : level === 'severe_low' ? 'Severe Low' : 'High'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                        <span>{formatDateDisplay(r.date)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatTimeDisplay(r.time, profile.timeFormat)}</span>
                      </div>

                      {r.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                          "{r.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onOpenLogGlucose(r)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Edit reading"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteReading(r.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Delete reading"
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
