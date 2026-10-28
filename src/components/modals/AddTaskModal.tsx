/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CheckSquare, AlertCircle } from 'lucide-react';
import { TaskCategory, TaskItem, TaskPriority } from '../../types';
import { getCurrentTimeString, getTodayString } from '../../utils/date';
import { Modal } from '../common/Modal';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTaskToEdit?: TaskItem | null;
  defaultDate?: string;
  onSave: (task: Omit<TaskItem, 'id' | 'createdAt'>, existingId?: string) => void;
}

const CATEGORIES: TaskCategory[] = [
  'Personal',
  'College',
  'Work',
  'Health',
  'Fitness',
  'Prayer',
  'Other',
];

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  existingTaskToEdit,
  defaultDate,
  onSave,
}) => {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(defaultDate || getTodayString());
  const [time, setTime] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('Personal');
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekdays' | 'weekly'>('none');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (existingTaskToEdit) {
      setTitle(existingTaskToEdit.title);
      setDescription(existingTaskToEdit.description || '');
      setDate(existingTaskToEdit.date);
      setTime(existingTaskToEdit.time || '');
      setPriority(existingTaskToEdit.priority);
      setCategory(existingTaskToEdit.category);
      setRecurring(existingTaskToEdit.recurring);
    } else {
      setTitle('');
      setDescription('');
      setDate(defaultDate || getTodayString());
      setTime('');
      setPriority('medium');
      setCategory('Personal');
      setRecurring('none');
    }
    setErrorMsg('');
  }, [isOpen, existingTaskToEdit, defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a task title.');
      return;
    }

    onSave(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        time: time.trim() || undefined,
        priority,
        category,
        completed: existingTaskToEdit ? existingTaskToEdit.completed : false,
        completedAt: existingTaskToEdit?.completedAt,
        recurring,
      },
      existingTaskToEdit?.id
    );

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingTaskToEdit ? 'Edit Task' : 'Add Daily Task'}
      description="Organize your day alongside your diabetes routine."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Task Title
          </label>
          <input
            type="text"
            placeholder="e.g. Study biochemistry, 30 min evening walk, buy lancets"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Optional Description / Details
          </label>
          <textarea
            rows={2}
            placeholder="Additional notes or checklist details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Time (Optional)
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
        </div>

        {/* Repeat schedule */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Repeat Recurrence
          </label>
          <select
            value={recurring}
            onChange={(e) => setRecurring(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="none">Does not repeat</option>
            <option value="daily">Repeats Daily</option>
            <option value="weekdays">Every Weekday (Mon-Fri)</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors min-h-[44px] flex items-center gap-2"
          >
            <CheckSquare className="w-4 h-4" />
            {existingTaskToEdit ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
