/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MedicationType = 'insulin' | 'tablet';
export type InsulinSubType = 'premixed' | 'basal' | 'bolus' | 'rapid' | 'other';
export type DoseStatus = 'upcoming' | 'due' | 'taken' | 'skipped' | 'uncertain' | 'unconfirmed';

export type InjectionSite =
  | 'abdomen-left'
  | 'abdomen-right'
  | 'thigh-left'
  | 'thigh-right'
  | 'arm-left'
  | 'arm-right'
  | 'buttocks'
  | 'other';

export interface MedicationSchedule {
  id: string;
  type: MedicationType;
  name: string;
  subType?: InsulinSubType;
  prescribedDose: number;
  unit: string; // 'units' | 'mg' | 'tablets' | 'capsule'
  scheduledTime: string; // 'HH:mm'
  instructions: string; // 'Before breakfast', 'After breakfast', 'Before dinner', 'With food'
  repeat: 'daily' | 'weekdays' | 'custom';
  repeatDays?: number[]; // 0-6 (Sun-Sat)
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationLog {
  id: string;
  scheduleId?: string; // Links to schedule if based on a scheduled dose
  medicationName: string;
  medicationType: MedicationType;
  prescribedDose: number;
  actualDose: number;
  unit: string;
  status: 'taken' | 'skipped' | 'uncertain';
  scheduledTime?: string;
  recordedAt: string; // ISO string with exact timestamp
  date: string; // 'YYYY-MM-DD'
  injectionSite?: InjectionSite;
  notes?: string;
  skipReason?: string;
  verifiedByUser: boolean;
}

export type GlucoseContext =
  | 'fasting'
  | 'before_breakfast'
  | 'after_breakfast'
  | 'before_lunch'
  | 'after_lunch'
  | 'before_dinner'
  | 'after_dinner'
  | 'bedtime'
  | 'exercise'
  | 'night'
  | 'other';

export type GlucoseAlertLevel =
  | 'severe_low'
  | 'low'
  | 'in_range'
  | 'high'
  | 'severe_high';

export interface GlucoseReading {
  id: string;
  readingMgDl: number; // Canonical internal storage in mg/dL
  unitLogged: 'mg/dL' | 'mmol/L';
  timestamp: string; // ISO string
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  context: GlucoseContext;
  notes?: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskCategory =
  | 'Personal'
  | 'College'
  | 'Work'
  | 'Health'
  | 'Fitness'
  | 'Prayer'
  | 'Other';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  date: string; // 'YYYY-MM-DD'
  time?: string; // 'HH:mm'
  priority: TaskPriority;
  category: TaskCategory;
  completed: boolean;
  completedAt?: string;
  recurring: 'none' | 'daily' | 'weekdays' | 'weekly';
  createdAt: string;
}

export interface ReminderConfig {
  id: string;
  title: string;
  category:
    | 'morning_insulin'
    | 'other_morning_insulin'
    | 'morning_tablet'
    | 'evening_insulin'
    | 'glucose_check'
    | 'personal_task';
  time: string; // 'HH:mm'
  enabled: boolean;
  repeatDays: number[]; // 0-6
  notes?: string;
}

export interface GlucoseTargets {
  severeLow: number; // Default 54 mg/dL
  hypoWarning: number; // Default 70 mg/dL
  targetMin: number; // Default 80 mg/dL
  targetMax: number; // Default 140 mg/dL (fasting/pre-meal)
  postMealMax: number; // Default 180 mg/dL
  hyperWarning: number; // Default 250 mg/dL
}

export interface EmergencyContact {
  doctorName: string;
  clinicName: string;
  clinicPhone: string;
  personalEmergencyName: string;
  personalEmergencyPhone: string;
  hospitalAddress: string;
  specialInstructions: string;
}

export interface UserProfile {
  name: string;
  timezone: string;
  timeFormat: '12h' | '24h';
  glucoseUnit: 'mg/dL' | 'mmol/L';
  theme: 'light' | 'dark';
  glucoseTargets: GlucoseTargets;
  emergencyContact: EmergencyContact;
  browserNotificationsEnabled: boolean;
}

export interface DailyScheduleStatus {
  schedule: MedicationSchedule;
  log?: MedicationLog;
  computedStatus: DoseStatus;
}
