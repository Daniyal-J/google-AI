/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GlucoseAlertLevel, GlucoseContext, GlucoseTargets } from '../types';

export const CONVERSION_FACTOR = 18.018;

/**
 * Convert mg/dL to mmol/L (rounded to 1 decimal place)
 */
export function mgDlToMmol(mgDl: number): number {
  return Number((mgDl / CONVERSION_FACTOR).toFixed(1));
}

/**
 * Convert mmol/L to mg/dL (rounded to integer)
 */
export function mmolToMgDl(mmol: number): number {
  return Math.round(mmol * CONVERSION_FACTOR);
}

/**
 * Format glucose reading for display according to user preference
 */
export function formatGlucoseValue(
  readingMgDl: number,
  preferredUnit: 'mg/dL' | 'mmol/L'
): { value: string; unit: string } {
  if (preferredUnit === 'mmol/L') {
    return {
      value: mgDlToMmol(readingMgDl).toFixed(1),
      unit: 'mmol/L',
    };
  }
  return {
    value: Math.round(readingMgDl).toString(),
    unit: 'mg/dL',
  };
}

/**
 * Determine alert classification based on reading and user-configured targets
 */
export function evaluateGlucoseLevel(
  readingMgDl: number,
  context: GlucoseContext,
  targets: GlucoseTargets
): GlucoseAlertLevel {
  if (readingMgDl < targets.severeLow) {
    return 'severe_low';
  }
  if (readingMgDl < targets.hypoWarning) {
    return 'low';
  }

  // Upper threshold depends on context (e.g. post-meal has higher tolerance)
  const isPostMeal =
    context === 'after_breakfast' ||
    context === 'after_lunch' ||
    context === 'after_dinner';

  const threshold = isPostMeal ? targets.postMealMax : targets.targetMax;

  if (readingMgDl > targets.hyperWarning) {
    return 'severe_high';
  }
  if (readingMgDl > threshold) {
    return 'high';
  }
  return 'in_range';
}

/**
 * Human-readable contextual label
 */
export function getContextLabel(context: GlucoseContext): string {
  switch (context) {
    case 'fasting':
      return 'Fasting (Morning)';
    case 'before_breakfast':
      return 'Before Breakfast';
    case 'after_breakfast':
      return 'After Breakfast';
    case 'before_lunch':
      return 'Before Lunch';
    case 'after_lunch':
      return 'After Lunch';
    case 'before_dinner':
      return 'Before Dinner';
    case 'after_dinner':
      return 'After Dinner';
    case 'bedtime':
      return 'Bedtime';
    case 'exercise':
      return 'Exercise / Activity';
    case 'night':
      return 'Overnight Check';
    case 'other':
    default:
      return 'Other / Random';
  }
}

/**
 * Clinical safety guidance texts
 */
export interface SafetyGuidance {
  level: GlucoseAlertLevel;
  title: string;
  summary: string;
  actions: string[];
  isUrgent: boolean;
  badgeText: string;
}

export function getSafetyGuidance(
  readingMgDl: number,
  context: GlucoseContext,
  targets: GlucoseTargets
): SafetyGuidance | null {
  const level = evaluateGlucoseLevel(readingMgDl, context, targets);

  if (level === 'severe_low') {
    return {
      level,
      title: 'CRITICAL: Severe Hypoglycemia Alert',
      summary: `Blood glucose is severely low (${readingMgDl} mg/dL). Immediate fast-acting carbohydrate is required.`,
      actions: [
        'Consume 15–20g of fast-acting glucose immediately (e.g. 4 glucose tablets, 1/2 cup fruit juice, or 1 tbsp honey).',
        'Rest and stay seated. Do not drive or engage in physical exertion.',
        'Wait 15 minutes, then re-check your blood glucose (Rule of 15).',
        'If unable to swallow, confused, or unresponsive, a caregiver or emergency responder must administer prescribed glucagon and call emergency services immediately.',
      ],
      isUrgent: true,
      badgeText: 'Severe Low',
    };
  }

  if (level === 'low') {
    return {
      level,
      title: 'Hypoglycemia Warning (Low Blood Glucose)',
      summary: `Reading (${readingMgDl} mg/dL) is below your safe threshold of ${targets.hypoWarning} mg/dL.`,
      actions: [
        'Follow the Rule of 15: Take 15 grams of fast-acting carbohydrate (e.g. 1/2 cup orange juice, 3-4 glucose tablets).',
        'Wait 15 minutes and re-test your blood glucose.',
        'If still below 70 mg/dL, repeat with another 15g of fast carbs.',
        'Once back above 70 mg/dL, eat a planned snack or meal with complex carbs/protein if your next meal is more than an hour away.',
      ],
      isUrgent: true,
      badgeText: 'Low',
    };
  }

  if (level === 'severe_high') {
    return {
      level,
      title: 'High Glucose & Ketone Alert',
      summary: `Blood glucose is elevated (${readingMgDl} mg/dL) above ${targets.hyperWarning} mg/dL.`,
      actions: [
        'Drink plenty of water to prevent dehydration and assist renal glucose clearance.',
        'Check urine or blood ketones according to your doctor’s instructions.',
        'Follow your diabetes team’s personalized sick-day plan.',
        'NOTE: Never self-prescribe unauthorized extra insulin. Contact your care team if high glucose persists or ketones are present.',
      ],
      isUrgent: true,
      badgeText: 'Very High',
    };
  }

  if (level === 'high') {
    return {
      level,
      title: 'Above Target Range',
      summary: `Reading (${readingMgDl} mg/dL) is above your target (${targets.targetMax} mg/dL).`,
      actions: [
        'Drink a glass of water.',
        'Review recent carbohydrate intake, timing of insulin, or stress/illness.',
        'Do not take spontaneous correction doses without consulting your clinician’s guidelines.',
      ],
      isUrgent: false,
      badgeText: 'Elevated',
    };
  }

  return null;
}
