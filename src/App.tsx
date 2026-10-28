/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  GlucoseReading,
  MedicationLog,
  MedicationSchedule,
  ReminderConfig,
  TaskItem,
  UserProfile,
} from './types';
import { storage } from './services/storage';
import { notifications } from './services/notifications';
import { formatTimeDisplay, getCurrentTimeString, getTodayString } from './utils/date';
import { Header } from './components/common/Header';
import { Navigation, NavTab } from './components/common/Navigation';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { DuplicateWarningModal } from './components/common/DuplicateWarningModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { InsulinTrackerView } from './components/insulin/InsulinTrackerView';
import { TabletTrackerView } from './components/tablets/TabletTrackerView';
import { GlucoseTrackerView } from './components/glucose/GlucoseTrackerView';
import { TaskPlannerView } from './components/tasks/TaskPlannerView';
import { HistoryReportsView } from './components/history/HistoryReportsView';
import { CalendarTimelineView } from './components/calendar/CalendarTimelineView';
import { RemindersView } from './components/reminders/RemindersView';
import { SettingsView } from './components/settings/SettingsView';
import { LogInsulinModal } from './components/modals/LogInsulinModal';
import { LogTabletModal } from './components/modals/LogTabletModal';
import { LogGlucoseModal } from './components/modals/LogGlucoseModal';
import { AddTaskModal } from './components/modals/AddTaskModal';
import { EditScheduleModal } from './components/modals/EditScheduleModal';
import { EmergencyModal } from './components/modals/EmergencyModal';

export default function App() {
  // Global State
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [reminders, setReminders] = useState<ReminderConfig[]>([]);

  // Navigation
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [insulinModalOpen, setInsulinModalOpen] = useState(false);
  const [selectedInsulinSchedule, setSelectedInsulinSchedule] = useState<MedicationSchedule | null>(null);
  const [editingInsulinLog, setEditingInsulinLog] = useState<MedicationLog | null>(null);

  const [tabletModalOpen, setTabletModalOpen] = useState(false);
  const [selectedTabletSchedule, setSelectedTabletSchedule] = useState<MedicationSchedule | null>(null);
  const [editingTabletLog, setEditingTabletLog] = useState<MedicationLog | null>(null);

  const [glucoseModalOpen, setGlucoseModalOpen] = useState(false);
  const [editingGlucoseReading, setEditingGlucoseReading] = useState<GlucoseReading | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [taskDefaultDate, setTaskDefaultDate] = useState<string | undefined>();

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<MedicationSchedule | null>(null);
  const [defaultScheduleType, setDefaultScheduleType] = useState<'insulin' | 'tablet'>('insulin');

  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  // Duplicate dose warning modal
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [duplicateWarningData, setDuplicateWarningData] = useState<{
    schedule: MedicationSchedule;
    existingLog: MedicationLog;
  } | null>(null);

  const addToast = useCallback(
    (message: string, type: ToastMessage['type'] = 'success', title?: string) => {
      const newToast: ToastMessage = {
        id: `toast-${Date.now()}-${Math.random()}`,
        type,
        title,
        message,
      };
      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initialize and load database
  const loadData = useCallback(async () => {
    try {
      const [p, s, l, g, t, r] = await Promise.all([
        storage.getProfile(),
        storage.getSchedules(),
        storage.getMedicationLogs(),
        storage.getGlucoseReadings(),
        storage.getTasks(),
        storage.getReminders(),
      ]);

      setProfile(p);
      setSchedules(s);
      setLogs(l);
      setReadings(g);
      setTasks(t);
      setReminders(r);

      // Apply theme
      if (p.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Start periodic in-tab reminder watcher
  useEffect(() => {
    notifications.startWatcher(
      async () => storage.getReminders(),
      (dueReminder) => {
        addToast(
          `Reminder: ${dueReminder.title} is scheduled for now.`,
          'info',
          'Scheduled Reminder'
        );
      }
    );

    return () => {
      notifications.stopWatcher();
    };
  }, [addToast]);

  // Theme toggle
  const toggleTheme = async () => {
    if (!profile) return;
    const newTheme: 'light' | 'dark' = profile.theme === 'light' ? 'dark' : 'light';
    const updated: UserProfile = { ...profile, theme: newTheme };
    setProfile(updated);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    await storage.saveProfile(updated);
  };

  // Profile save
  const handleSaveProfile = async (updated: UserProfile) => {
    setProfile(updated);
    await storage.saveProfile(updated);
    addToast('Preferences saved successfully.', 'success');
  };

  // Mark a dose as taken immediately from card
  const handleMarkDoseTaken = async (schedule: MedicationSchedule) => {
    const today = getTodayString();
    const nowTime = getCurrentTimeString();
    const nowISO = new Date().toISOString();

    const newLog: MedicationLog = {
      id: `log-${Date.now()}`,
      scheduleId: schedule.id,
      medicationName: schedule.name,
      medicationType: schedule.type,
      prescribedDose: schedule.prescribedDose,
      actualDose: schedule.prescribedDose,
      unit: schedule.unit,
      status: 'taken',
      scheduledTime: schedule.scheduledTime,
      recordedAt: nowISO,
      date: today,
      injectionSite: schedule.type === 'insulin' ? 'abdomen-left' : undefined,
      notes: schedule.instructions,
      verifiedByUser: true,
    };

    await storage.saveMedicationLog(newLog);
    setLogs((prev) => [...prev.filter((l) => l.id !== newLog.id), newLog]);

    const formattedTime = formatTimeDisplay(nowISO, profile?.timeFormat || '12h');
    addToast(`Recorded: ${schedule.name} at ${formattedTime}.`, 'success');
  };

  // Undo / Correct dose
  const handleUndoDose = async (logId: string) => {
    const found = logs.find((l) => l.id === logId);
    await storage.deleteMedicationLog(logId);
    setLogs((prev) => prev.filter((l) => l.id !== logId));
    if (found) {
      addToast(`Undone: ${found.medicationName} record removed.`, 'info');
    }
  };

  // Save full insulin log (from modal)
  const handleSaveInsulinLog = async (
    logData: Omit<MedicationLog, 'id'>,
    existingId?: string
  ) => {
    const log: MedicationLog = {
      ...logData,
      id: existingId || `log-${Date.now()}`,
    };
    await storage.saveMedicationLog(log);
    setLogs((prev) => [...prev.filter((l) => l.id !== log.id), log]);
    const displayTime = formatTimeDisplay(log.recordedAt, profile?.timeFormat || '12h');
    addToast(
      log.status === 'uncertain'
        ? `Flagged as uncertain: ${log.medicationName}`
        : `Recorded: ${log.medicationName} at ${displayTime}.`,
      log.status === 'uncertain' ? 'warning' : 'success'
    );
  };

  // Save full tablet log (from modal)
  const handleSaveTabletLog = async (
    logData: Omit<MedicationLog, 'id'>,
    existingId?: string
  ) => {
    const log: MedicationLog = {
      ...logData,
      id: existingId || `log-${Date.now()}`,
    };
    await storage.saveMedicationLog(log);
    setLogs((prev) => [...prev.filter((l) => l.id !== log.id), log]);
    const displayTime = formatTimeDisplay(log.recordedAt, profile?.timeFormat || '12h');
    addToast(`Saved: ${log.medicationName} (${log.status}) at ${displayTime}.`, 'success');
  };

  // Delete medication log
  const handleDeleteLog = async (logId: string) => {
    await storage.deleteMedicationLog(logId);
    setLogs((prev) => prev.filter((l) => l.id !== logId));
    addToast('Medication log removed.', 'info');
  };

  // Save Glucose Reading
  const handleSaveGlucoseReading = async (
    readingData: Omit<GlucoseReading, 'id'>,
    existingId?: string
  ) => {
    const reading: GlucoseReading = {
      ...readingData,
      id: existingId || `gluc-${Date.now()}`,
    };
    await storage.saveGlucoseReading(reading);
    setReadings((prev) => [reading, ...prev.filter((r) => r.id !== reading.id)]);
    addToast(
      `Recorded blood glucose: ${
        profile?.glucoseUnit === 'mmol/L'
          ? (reading.readingMgDl / 18.018).toFixed(1) + ' mmol/L'
          : reading.readingMgDl + ' mg/dL'
      }.`,
      'success'
    );
  };

  // Delete Glucose Reading
  const handleDeleteGlucoseReading = async (id: string) => {
    await storage.deleteGlucoseReading(id);
    setReadings((prev) => prev.filter((r) => r.id !== id));
    addToast('Glucose reading removed.', 'info');
  };

  // Save Task
  const handleSaveTask = async (
    taskData: Omit<TaskItem, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    const task: TaskItem = {
      ...taskData,
      id: existingId || `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    await storage.saveTask(task);
    setTasks((prev) => [...prev.filter((t) => t.id !== task.id), task]);
    addToast(existingId ? 'Task updated.' : 'Task added to planner.', 'success');
  };

  // Toggle task completed
  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updated: TaskItem = {
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : undefined,
    };
    await storage.saveTask(updated);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    addToast(
      updated.completed ? `Completed: "${task.title}"` : `Marked pending: "${task.title}"`,
      'info'
    );
  };

  // Quick add task
  const handleQuickAddTask = async (title: string, category: any = 'Personal') => {
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title,
      date: getTodayString(),
      priority: 'medium',
      category,
      completed: false,
      recurring: 'none',
      createdAt: new Date().toISOString(),
    };
    await storage.saveTask(newTask);
    setTasks((prev) => [newTask, ...prev]);
    addToast(`Added: "${title}"`, 'success');
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    await storage.deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    addToast('Task deleted.', 'info');
  };

  // Schedule Management
  const handleSaveSchedule = async (schedule: MedicationSchedule) => {
    await storage.saveSchedule(schedule);
    setSchedules((prev) => [...prev.filter((s) => s.id !== schedule.id), schedule]);
    addToast(`Schedule saved: ${schedule.name}`, 'success');
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    await storage.deleteSchedule(scheduleId);
    setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    addToast('Schedule deleted.', 'info');
  };

  // Reminder Management
  const handleToggleReminder = async (id: string, enabled: boolean) => {
    const rem = reminders.find((r) => r.id === id);
    if (!rem) return;
    const updated: ReminderConfig = { ...rem, enabled };
    await storage.saveReminder(updated);
    setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));
    addToast(enabled ? `Reminder enabled: ${rem.title}` : `Reminder disabled: ${rem.title}`, 'info');
  };

  const handleSaveReminder = async (reminder: ReminderConfig) => {
    await storage.saveReminder(reminder);
    setReminders((prev) => [...prev.filter((r) => r.id !== reminder.id), reminder]);
    addToast('Reminder saved.', 'success');
  };

  const handleDeleteReminder = async (id: string) => {
    await storage.deleteReminder(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
    addToast('Reminder removed.', 'info');
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const { medicationsCsv, glucoseCsv, tasksCsv } = await storage.exportCSV();
      const combined = `=== MY DIACARE MEDICATIONS LOG ===\n${medicationsCsv}\n\n=== BLOOD GLUCOSE READINGS ===\n${glucoseCsv}\n\n=== TASKS LOG ===\n${tasksCsv}`;
      const blob = new Blob([combined], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mydiacare-report-${getTodayString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('CSV export downloaded.', 'success');
    } catch (e) {
      console.error('Export CSV error:', e);
      addToast('Failed to export CSV.', 'error');
    }
  };

  // Export JSON Full Backup
  const handleExportJSON = async () => {
    try {
      const jsonStr = await storage.exportFullJSON();
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mydiacare-backup-${getTodayString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('Full JSON backup downloaded.', 'success');
    } catch (e) {
      console.error('Export JSON error:', e);
      addToast('Failed to export JSON.', 'error');
    }
  };

  // Import JSON
  const handleImportJSON = async (jsonStr: string): Promise<boolean> => {
    const success = await storage.importFullJSON(jsonStr);
    if (success) {
      await loadData();
    }
    return success;
  };

  // Clear all data
  const handleClearAllData = async () => {
    await storage.clearAllData();
    await loadData();
    addToast('All local logs and tasks cleared.', 'info');
  };

  // Pending counts for navigation badges
  const todayStr = getTodayString();
  const todayActiveSchedules = schedules.filter((s) => s.active);
  const todayTakenCount = logs.filter((l) => l.date === todayStr && l.status === 'taken').length;
  const pendingDosesCount = Math.max(0, todayActiveSchedules.length - todayTakenCount);
  const pendingTasksCount = tasks.filter((t) => t.date === todayStr && !t.completed).length;

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wider uppercase">Loading My DiaCare...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Top Application Header */}
      <Header
        profile={profile}
        onToggleTheme={toggleTheme}
        onOpenEmergency={() => setEmergencyModalOpen(true)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Responsive Navigation: Desktop Sidebar + Mobile Bottom Bar */}
        <Navigation
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          pendingDosesCount={pendingDosesCount}
          pendingTasksCount={pendingTasksCount}
        />

        {/* Dynamic Viewport Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 pb-24 lg:pb-12 overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <DashboardView
              profile={profile}
              schedules={schedules}
              logs={logs}
              readings={readings}
              tasks={tasks}
              onOpenLogInsulin={(sched) => {
                setSelectedInsulinSchedule(sched || null);
                setEditingInsulinLog(null);
                setInsulinModalOpen(true);
              }}
              onOpenLogTablet={(sched) => {
                setSelectedTabletSchedule(sched || null);
                setEditingTabletLog(null);
                setTabletModalOpen(true);
              }}
              onOpenLogGlucose={() => {
                setEditingGlucoseReading(null);
                setGlucoseModalOpen(true);
              }}
              onOpenAddTask={() => {
                setEditingTask(null);
                setTaskDefaultDate(getTodayString());
                setTaskModalOpen(true);
              }}
              onMarkDoseTaken={handleMarkDoseTaken}
              onUndoDose={handleUndoDose}
              onToggleTask={handleToggleTask}
              onQuickAddTask={handleQuickAddTask}
              onNavigateToTab={(tab) => setCurrentTab(tab)}
              onOpenDuplicateWarning={(schedule, existingLog) => {
                setDuplicateWarningData({ schedule, existingLog });
                setDuplicateWarningOpen(true);
              }}
            />
          )}

          {currentTab === 'insulin' && (
            <InsulinTrackerView
              profile={profile}
              schedules={schedules}
              logs={logs}
              onOpenLogInsulin={(sched, logToEdit) => {
                setSelectedInsulinSchedule(sched || null);
                setEditingInsulinLog(logToEdit || null);
                setInsulinModalOpen(true);
              }}
              onOpenScheduleEdit={(sched) => {
                setScheduleToEdit(sched || null);
                setDefaultScheduleType('insulin');
                setScheduleModalOpen(true);
              }}
              onDeleteSchedule={handleDeleteSchedule}
              onDeleteLog={handleDeleteLog}
              onMarkScheduleTaken={handleMarkDoseTaken}
              onOpenDuplicateWarning={(schedule, existingLog) => {
                setDuplicateWarningData({ schedule, existingLog });
                setDuplicateWarningOpen(true);
              }}
            />
          )}

          {currentTab === 'tablets' && (
            <TabletTrackerView
              profile={profile}
              schedules={schedules}
              logs={logs}
              onOpenLogTablet={(sched, logToEdit) => {
                setSelectedTabletSchedule(sched || null);
                setEditingTabletLog(logToEdit || null);
                setTabletModalOpen(true);
              }}
              onOpenScheduleEdit={(sched) => {
                setScheduleToEdit(sched || null);
                setDefaultScheduleType('tablet');
                setScheduleModalOpen(true);
              }}
              onDeleteSchedule={handleDeleteSchedule}
              onDeleteLog={handleDeleteLog}
              onMarkScheduleTaken={handleMarkDoseTaken}
              onOpenDuplicateWarning={(schedule, existingLog) => {
                setDuplicateWarningData({ schedule, existingLog });
                setDuplicateWarningOpen(true);
              }}
            />
          )}

          {currentTab === 'glucose' && (
            <GlucoseTrackerView
              profile={profile}
              readings={readings}
              onOpenLogGlucose={(r) => {
                setEditingGlucoseReading(r || null);
                setGlucoseModalOpen(true);
              }}
              onDeleteReading={handleDeleteGlucoseReading}
            />
          )}

          {currentTab === 'tasks' && (
            <TaskPlannerView
              profile={profile}
              tasks={tasks}
              onOpenAddTask={(defaultDate, taskToEdit) => {
                setEditingTask(taskToEdit || null);
                setTaskDefaultDate(defaultDate);
                setTaskModalOpen(true);
              }}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onQuickAddTask={handleQuickAddTask}
            />
          )}

          {currentTab === 'history' && (
            <HistoryReportsView
              profile={profile}
              schedules={schedules}
              logs={logs}
              readings={readings}
              tasks={tasks}
              onExportCSV={handleExportCSV}
              onExportJSON={handleExportJSON}
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarTimelineView
              profile={profile}
              schedules={schedules}
              logs={logs}
              readings={readings}
              tasks={tasks}
              onOpenLogInsulin={() => {
                setSelectedInsulinSchedule(null);
                setEditingInsulinLog(null);
                setInsulinModalOpen(true);
              }}
              onOpenLogTablet={() => {
                setSelectedTabletSchedule(null);
                setEditingTabletLog(null);
                setTabletModalOpen(true);
              }}
              onOpenLogGlucose={() => {
                setEditingGlucoseReading(null);
                setGlucoseModalOpen(true);
              }}
              onOpenAddTask={(defaultDate) => {
                setEditingTask(null);
                setTaskDefaultDate(defaultDate);
                setTaskModalOpen(true);
              }}
            />
          )}

          {currentTab === 'reminders' && (
            <RemindersView
              profile={profile}
              reminders={reminders}
              onToggleReminder={handleToggleReminder}
              onSaveReminder={handleSaveReminder}
              onDeleteReminder={handleDeleteReminder}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              profile={profile}
              onSaveProfile={handleSaveProfile}
              onExportCSV={handleExportCSV}
              onExportJSON={handleExportJSON}
              onImportJSON={handleImportJSON}
              onClearAllData={handleClearAllData}
            />
          )}
        </main>
      </div>

      {/* Floating Action Feedback Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Duplicate Dose Warning Modal */}
      {duplicateWarningData && (
        <DuplicateWarningModal
          isOpen={duplicateWarningOpen}
          onClose={() => {
            setDuplicateWarningOpen(false);
            setDuplicateWarningData(null);
          }}
          existingLog={duplicateWarningData.existingLog}
          onConfirmExtraDose={() => {
            setDuplicateWarningOpen(false);
            // Open full modal for custom/extra injection with warning acknowledged
            if (duplicateWarningData.schedule.type === 'insulin') {
              setSelectedInsulinSchedule(duplicateWarningData.schedule);
              setInsulinModalOpen(true);
            } else {
              setSelectedTabletSchedule(duplicateWarningData.schedule);
              setTabletModalOpen(true);
            }
          }}
          onReviewExisting={() => {
            setDuplicateWarningOpen(false);
            if (duplicateWarningData.schedule.type === 'insulin') {
              setEditingInsulinLog(duplicateWarningData.existingLog);
              setInsulinModalOpen(true);
            } else {
              setEditingTabletLog(duplicateWarningData.existingLog);
              setTabletModalOpen(true);
            }
          }}
        />
      )}

      {/* Log Insulin Modal */}
      <LogInsulinModal
        isOpen={insulinModalOpen}
        onClose={() => {
          setInsulinModalOpen(false);
          setSelectedInsulinSchedule(null);
          setEditingInsulinLog(null);
        }}
        schedules={schedules}
        preselectedSchedule={selectedInsulinSchedule}
        existingLogToEdit={editingInsulinLog}
        onSave={handleSaveInsulinLog}
      />

      {/* Log Tablet Modal */}
      <LogTabletModal
        isOpen={tabletModalOpen}
        onClose={() => {
          setTabletModalOpen(false);
          setSelectedTabletSchedule(null);
          setEditingTabletLog(null);
        }}
        schedules={schedules}
        preselectedSchedule={selectedTabletSchedule}
        existingLogToEdit={editingTabletLog}
        onSave={handleSaveTabletLog}
      />

      {/* Log Glucose Modal */}
      <LogGlucoseModal
        isOpen={glucoseModalOpen}
        onClose={() => {
          setGlucoseModalOpen(false);
          setEditingGlucoseReading(null);
        }}
        preferredUnit={profile.glucoseUnit}
        targets={profile.glucoseTargets}
        existingReadingToEdit={editingGlucoseReading}
        onSave={handleSaveGlucoseReading}
      />

      {/* Add / Edit Task Modal */}
      <AddTaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        existingTaskToEdit={editingTask}
        defaultDate={taskDefaultDate}
        onSave={handleSaveTask}
      />

      {/* Edit Medication Schedule Modal */}
      <EditScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setScheduleToEdit(null);
        }}
        scheduleToEdit={scheduleToEdit}
        defaultType={defaultScheduleType}
        onSave={handleSaveSchedule}
      />

      {/* Emergency Protocol Modal */}
      <EmergencyModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        contact={profile.emergencyContact}
      />
    </div>
  );
}
