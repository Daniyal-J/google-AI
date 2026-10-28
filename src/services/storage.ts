/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GlucoseReading,
  MedicationLog,
  MedicationSchedule,
  ReminderConfig,
  TaskItem,
  UserProfile,
} from '../types';

const DB_NAME = 'MyDiaCareDB';
const DB_VERSION = 1;

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  timezone: 'Asia/Kolkata',
  timeFormat: '12h',
  glucoseUnit: 'mg/dL',
  theme: 'light',
  glucoseTargets: {
    severeLow: 54,
    hypoWarning: 70,
    targetMin: 80,
    targetMax: 140,
    postMealMax: 180,
    hyperWarning: 250,
  },
  emergencyContact: {
    doctorName: 'Dr. Diabetes Specialist',
    clinicName: 'Endocrinology & Diabetes Clinic',
    clinicPhone: '+91 98765 43210',
    personalEmergencyName: 'Family Contact',
    personalEmergencyPhone: '+91 98765 01234',
    hospitalAddress: 'Local General Hospital Emergency',
    specialInstructions: 'Type 1 Diabetes (Insulin Dependent). In case of severe hypoglycemia, administer Glucagon or call ambulance immediately.',
  },
  browserNotificationsEnabled: false,
};

const DEFAULT_SCHEDULES: MedicationSchedule[] = [
  {
    id: 'sched-1',
    type: 'insulin',
    subType: 'premixed',
    name: '30/70 Premixed Insulin',
    prescribedDose: 50,
    unit: 'units',
    scheduledTime: '07:30',
    instructions: 'Before breakfast',
    repeat: 'daily',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sched-2',
    type: 'insulin',
    subType: 'basal',
    name: 'Basaglar',
    prescribedDose: 28,
    unit: 'units',
    scheduledTime: '08:30',
    instructions: 'After breakfast',
    repeat: 'daily',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sched-3',
    type: 'insulin',
    subType: 'premixed',
    name: '30/70 Premixed Insulin',
    prescribedDose: 18,
    unit: 'units',
    scheduledTime: '19:30',
    instructions: 'Before dinner',
    repeat: 'daily',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sched-4',
    type: 'tablet',
    name: 'Morning tablet — configure medication name and dose',
    prescribedDose: 1,
    unit: 'tablet',
    scheduledTime: '08:30',
    instructions: 'With breakfast',
    repeat: 'daily',
    active: true,
    notes: 'Please tap edit to specify your exact tablet name, strength, and doctor instructions.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_REMINDERS: ReminderConfig[] = [
  {
    id: 'rem-1',
    title: 'Morning 30/70 Insulin',
    category: 'morning_insulin',
    time: '07:30',
    enabled: true,
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    notes: '50 units before breakfast',
  },
  {
    id: 'rem-2',
    title: 'Basaglar Long-acting Insulin',
    category: 'other_morning_insulin',
    time: '08:30',
    enabled: true,
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    notes: '28 units after breakfast',
  },
  {
    id: 'rem-3',
    title: 'Morning Prescribed Tablet',
    category: 'morning_tablet',
    time: '08:30',
    enabled: true,
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    notes: 'Take with morning food',
  },
  {
    id: 'rem-4',
    title: 'Evening 30/70 Insulin',
    category: 'evening_insulin',
    time: '19:30',
    enabled: true,
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    notes: '18 units before dinner',
  },
  {
    id: 'rem-5',
    title: 'Fasting Blood Glucose Check',
    category: 'glucose_check',
    time: '07:15',
    enabled: true,
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    notes: 'Check before morning insulin/meal',
  },
];

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('schedules')) {
          db.createObjectStore('schedules', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('medicationLogs')) {
          const store = db.createObjectStore('medicationLogs', { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('scheduleId', 'scheduleId', { unique: false });
        }
        if (!db.objectStoreNames.contains('glucoseReadings')) {
          const store = db.createObjectStore('glucoseReadings', { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains('tasks')) {
          const store = db.createObjectStore('tasks', { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('reminders')) {
          db.createObjectStore('reminders', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // --- Profile Methods ---
  async getProfile(): Promise<UserProfile> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('profile', 'readonly');
        const store = tx.objectStore('profile');
        const req = store.get('current');
        req.onsuccess = () => {
          if (req.result && req.result.data) {
            resolve({ ...DEFAULT_PROFILE, ...req.result.data });
          } else {
            const local = localStorage.getItem('diacare_profile');
            if (local) {
              try {
                const parsed = JSON.parse(local);
                resolve({ ...DEFAULT_PROFILE, ...parsed });
                return;
              } catch {
                // fall through
              }
            }
            resolve(DEFAULT_PROFILE);
          }
        };
        req.onerror = () => resolve(DEFAULT_PROFILE);
      });
    } catch {
      const local = localStorage.getItem('diacare_profile');
      if (local) {
        try {
          return { ...DEFAULT_PROFILE, ...JSON.parse(local) };
        } catch {
          // fall through
        }
      }
      return DEFAULT_PROFILE;
    }
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    localStorage.setItem('diacare_profile', JSON.stringify(profile));
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('profile', 'readwrite');
        const store = tx.objectStore('profile');
        const req = store.put({ key: 'current', data: profile });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Saved profile to localStorage fallback:', e);
    }
  }

  // --- Medication Schedules ---
  async getSchedules(): Promise<MedicationSchedule[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('schedules', 'readonly');
        const store = tx.objectStore('schedules');
        const req = store.getAll();
        req.onsuccess = () => {
          if (req.result && req.result.length > 0) {
            resolve(req.result);
          } else {
            const local = localStorage.getItem('diacare_schedules');
            if (local) {
              try {
                resolve(JSON.parse(local));
                return;
              } catch {
                // fall through
              }
            }
            // Seed defaults first time
            this.seedDefaultSchedules().then(() => resolve(DEFAULT_SCHEDULES));
          }
        };
        req.onerror = () => resolve(DEFAULT_SCHEDULES);
      });
    } catch {
      const local = localStorage.getItem('diacare_schedules');
      if (local) {
        try {
          return JSON.parse(local);
        } catch {
          // fall through
        }
      }
      return DEFAULT_SCHEDULES;
    }
  }

  private async seedDefaultSchedules(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction('schedules', 'readwrite');
      const store = tx.objectStore('schedules');
      for (const s of DEFAULT_SCHEDULES) {
        store.put(s);
      }
      localStorage.setItem('diacare_schedules', JSON.stringify(DEFAULT_SCHEDULES));
    } catch {
      localStorage.setItem('diacare_schedules', JSON.stringify(DEFAULT_SCHEDULES));
    }
  }

  async saveSchedule(schedule: MedicationSchedule): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('schedules', 'readwrite');
        const store = tx.objectStore('schedules');
        const req = store.put(schedule);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // LocalStorage fallback
    }
    const current = await this.getSchedules();
    const updated = current.filter((s) => s.id !== schedule.id).concat(schedule);
    localStorage.setItem('diacare_schedules', JSON.stringify(updated));
  }

  async deleteSchedule(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('schedules', 'readwrite');
        const store = tx.objectStore('schedules');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // fallback
    }
    const current = await this.getSchedules();
    const filtered = current.filter((s) => s.id !== id);
    localStorage.setItem('diacare_schedules', JSON.stringify(filtered));
  }

  // --- Medication Logs ---
  async getMedicationLogs(date?: string): Promise<MedicationLog[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('medicationLogs', 'readonly');
        const store = tx.objectStore('medicationLogs');
        let req: IDBRequest;
        if (date) {
          const index = store.index('date');
          req = index.getAll(date);
        } else {
          req = store.getAll();
        }
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      const local = localStorage.getItem('diacare_logs');
      if (local) {
        try {
          const all: MedicationLog[] = JSON.parse(local);
          return date ? all.filter((l) => l.date === date) : all;
        } catch {
          return [];
        }
      }
      return [];
    }
  }

  async saveMedicationLog(log: MedicationLog): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('medicationLogs', 'readwrite');
        const store = tx.objectStore('medicationLogs');
        const req = store.put(log);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // fallback
    }
    const all = await this.getMedicationLogs();
    const updated = all.filter((l) => l.id !== log.id).concat(log);
    localStorage.setItem('diacare_logs', JSON.stringify(updated));
  }

  async deleteMedicationLog(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('medicationLogs', 'readwrite');
        const store = tx.objectStore('medicationLogs');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // fallback
    }
    const all = await this.getMedicationLogs();
    const filtered = all.filter((l) => l.id !== id);
    localStorage.setItem('diacare_logs', JSON.stringify(filtered));
  }

  // --- Glucose Readings ---
  async getGlucoseReadings(startDate?: string, endDate?: string): Promise<GlucoseReading[]> {
    try {
      const db = await this.openDB();
      const all: GlucoseReading[] = await new Promise((resolve) => {
        const tx = db.transaction('glucoseReadings', 'readonly');
        const store = tx.objectStore('glucoseReadings');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      // Sort chronological descending
      let sorted = all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      if (startDate) {
        sorted = sorted.filter((r) => r.date >= startDate);
      }
      if (endDate) {
        sorted = sorted.filter((r) => r.date <= endDate);
      }
      return sorted;
    } catch {
      const local = localStorage.getItem('diacare_glucose');
      if (local) {
        try {
          let list: GlucoseReading[] = JSON.parse(local);
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          if (startDate) list = list.filter((r) => r.date >= startDate);
          if (endDate) list = list.filter((r) => r.date <= endDate);
          return list;
        } catch {
          return [];
        }
      }
      return [];
    }
  }

  async saveGlucoseReading(reading: GlucoseReading): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('glucoseReadings', 'readwrite');
        const store = tx.objectStore('glucoseReadings');
        const req = store.put(reading);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // fallback
    }
    const current = await this.getGlucoseReadings();
    const updated = current.filter((r) => r.id !== reading.id).concat(reading);
    localStorage.setItem('diacare_glucose', JSON.stringify(updated));
  }

  async deleteGlucoseReading(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('glucoseReadings', 'readwrite');
        const store = tx.objectStore('glucoseReadings');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // fallback
    }
    const current = await this.getGlucoseReadings();
    const filtered = current.filter((r) => r.id !== id);
    localStorage.setItem('diacare_glucose', JSON.stringify(filtered));
  }

  // --- Daily Tasks ---
  async getTasks(date?: string): Promise<TaskItem[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('tasks', 'readonly');
        const store = tx.objectStore('tasks');
        let req: IDBRequest;
        if (date) {
          const index = store.index('date');
          req = index.getAll(date);
        } else {
          req = store.getAll();
        }
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      const local = localStorage.getItem('diacare_tasks');
      if (local) {
        try {
          const all: TaskItem[] = JSON.parse(local);
          return date ? all.filter((t) => t.date === date) : all;
        } catch {
          return [];
        }
      }
      return [];
    }
  }

  async saveTask(task: TaskItem): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('tasks', 'readwrite');
        const store = tx.objectStore('tasks');
        const req = store.put(task);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // fallback
    }
    const current = await this.getTasks();
    const updated = current.filter((t) => t.id !== task.id).concat(task);
    localStorage.setItem('diacare_tasks', JSON.stringify(updated));
  }

  async deleteTask(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('tasks', 'readwrite');
        const store = tx.objectStore('tasks');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // fallback
    }
    const current = await this.getTasks();
    const filtered = current.filter((t) => t.id !== id);
    localStorage.setItem('diacare_tasks', JSON.stringify(filtered));
  }

  // --- Reminders ---
  async getReminders(): Promise<ReminderConfig[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('reminders', 'readonly');
        const store = tx.objectStore('reminders');
        const req = store.getAll();
        req.onsuccess = () => {
          if (req.result && req.result.length > 0) {
            resolve(req.result);
          } else {
            const local = localStorage.getItem('diacare_reminders');
            if (local) {
              try {
                resolve(JSON.parse(local));
                return;
              } catch {
                // fall through
              }
            }
            this.seedDefaultReminders().then(() => resolve(DEFAULT_REMINDERS));
          }
        };
        req.onerror = () => resolve(DEFAULT_REMINDERS);
      });
    } catch {
      const local = localStorage.getItem('diacare_reminders');
      if (local) {
        try {
          return JSON.parse(local);
        } catch {
          // fall through
        }
      }
      return DEFAULT_REMINDERS;
    }
  }

  private async seedDefaultReminders(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction('reminders', 'readwrite');
      const store = tx.objectStore('reminders');
      for (const r of DEFAULT_REMINDERS) {
        store.put(r);
      }
      localStorage.setItem('diacare_reminders', JSON.stringify(DEFAULT_REMINDERS));
    } catch {
      localStorage.setItem('diacare_reminders', JSON.stringify(DEFAULT_REMINDERS));
    }
  }

  async saveReminder(reminder: ReminderConfig): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('reminders', 'readwrite');
        const store = tx.objectStore('reminders');
        const req = store.put(reminder);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // fallback
    }
    const current = await this.getReminders();
    const updated = current.filter((r) => r.id !== reminder.id).concat(reminder);
    localStorage.setItem('diacare_reminders', JSON.stringify(updated));
  }

  async deleteReminder(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('reminders', 'readwrite');
        const store = tx.objectStore('reminders');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // fallback
    }
    const current = await this.getReminders();
    const filtered = current.filter((r) => r.id !== id);
    localStorage.setItem('diacare_reminders', JSON.stringify(filtered));
  }

  // --- Export and Backup ---
  async exportFullJSON(): Promise<string> {
    const [profile, schedules, logs, glucose, tasks, reminders] = await Promise.all([
      this.getProfile(),
      this.getSchedules(),
      this.getMedicationLogs(),
      this.getGlucoseReadings(),
      this.getTasks(),
      this.getReminders(),
    ]);

    const backup = {
      app: 'My DiaCare',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile,
      schedules,
      medicationLogs: logs,
      glucoseReadings: glucose,
      tasks,
      reminders,
    };

    return JSON.stringify(backup, null, 2);
  }

  async exportCSV(): Promise<{
    medicationsCsv: string;
    glucoseCsv: string;
    tasksCsv: string;
  }> {
    const [logs, glucose, tasks] = await Promise.all([
      this.getMedicationLogs(),
      this.getGlucoseReadings(),
      this.getTasks(),
    ]);

    // Medications CSV
    const medHeaders = ['ID', 'Date', 'Time Recorded', 'Medication Name', 'Type', 'Prescribed Dose', 'Actual Dose', 'Unit', 'Status', 'Injection Site', 'Notes'];
    const medRows = logs.map((l) => [
      l.id,
      l.date,
      l.recordedAt,
      `"${l.medicationName.replace(/"/g, '""')}"`,
      l.medicationType,
      l.prescribedDose,
      l.actualDose,
      l.unit,
      l.status,
      l.injectionSite || '',
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ]);
    const medicationsCsv = [medHeaders.join(','), ...medRows.map((r) => r.join(','))].join('\n');

    // Glucose CSV
    const glucHeaders = ['ID', 'Date', 'Time', 'Reading (mg/dL)', 'Reading (mmol/L)', 'Context', 'Notes'];
    const glucRows = glucose.map((g) => [
      g.id,
      g.date,
      g.time,
      g.readingMgDl,
      (g.readingMgDl / 18.018).toFixed(1),
      g.context,
      `"${(g.notes || '').replace(/"/g, '""')}"`,
    ]);
    const glucoseCsv = [glucHeaders.join(','), ...glucRows.map((r) => r.join(','))].join('\n');

    // Tasks CSV
    const taskHeaders = ['ID', 'Date', 'Time', 'Title', 'Category', 'Priority', 'Completed', 'Completed At'];
    const taskRows = tasks.map((t) => [
      t.id,
      t.date,
      t.time || '',
      `"${t.title.replace(/"/g, '""')}"`,
      t.category,
      t.priority,
      t.completed ? 'Yes' : 'No',
      t.completedAt || '',
    ]);
    const tasksCsv = [taskHeaders.join(','), ...taskRows.map((r) => r.join(','))].join('\n');

    return { medicationsCsv, glucoseCsv, tasksCsv };
  }

  async importFullJSON(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') return false;

      if (data.profile) await this.saveProfile(data.profile);
      if (Array.isArray(data.schedules)) {
        for (const s of data.schedules) await this.saveSchedule(s);
      }
      if (Array.isArray(data.medicationLogs)) {
        for (const l of data.medicationLogs) await this.saveMedicationLog(l);
      }
      if (Array.isArray(data.glucoseReadings)) {
        for (const g of data.glucoseReadings) await this.saveGlucoseReading(g);
      }
      if (Array.isArray(data.tasks)) {
        for (const t of data.tasks) await this.saveTask(t);
      }
      if (Array.isArray(data.reminders)) {
        for (const r of data.reminders) await this.saveReminder(r);
      }
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(
        ['medicationLogs', 'glucoseReadings', 'tasks'],
        'readwrite'
      );
      tx.objectStore('medicationLogs').clear();
      tx.objectStore('glucoseReadings').clear();
      tx.objectStore('tasks').clear();
    } catch {
      // fallback
    }
    localStorage.removeItem('diacare_logs');
    localStorage.removeItem('diacare_glucose');
    localStorage.removeItem('diacare_tasks');
  }
}

export const storage = new StorageService();
