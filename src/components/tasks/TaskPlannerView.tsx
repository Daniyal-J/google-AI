/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  Calendar,
  AlertCircle,
  Tag,
  Edit2,
  Trash2,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { TaskCategory, TaskItem, TaskPriority, UserProfile } from '../../types';
import { formatDateDisplay, formatTimeDisplay, getTodayString } from '../../utils/date';

interface TaskPlannerViewProps {
  profile: UserProfile;
  tasks: TaskItem[];
  onOpenAddTask: (defaultDate?: string, taskToEdit?: TaskItem) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onQuickAddTask: (title: string, category?: TaskCategory) => void;
}

type TaskViewFilter = 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';

export const TaskPlannerView: React.FC<TaskPlannerViewProps> = ({
  profile,
  tasks,
  onOpenAddTask,
  onToggleTask,
  onDeleteTask,
  onQuickAddTask,
}) => {
  const [activeFilter, setActiveFilter] = useState<TaskViewFilter>('today');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [quickInput, setQuickInput] = useState('');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('Personal');

  const todayStr = getTodayString();

  // Classified tasks
  const { todayList, upcomingList, overdueList, completedList } = useMemo(() => {
    const today: TaskItem[] = [];
    const upcoming: TaskItem[] = [];
    const overdue: TaskItem[] = [];
    const completed: TaskItem[] = [];

    for (const t of tasks) {
      if (t.completed) {
        completed.push(t);
      } else if (t.date === todayStr) {
        today.push(t);
      } else if (t.date > todayStr) {
        upcoming.push(t);
      } else {
        overdue.push(t);
      }
    }

    return {
      todayList: today.sort((a, b) => (a.time || '').localeCompare(b.time || '')),
      upcomingList: upcoming.sort((a, b) => a.date.localeCompare(b.date)),
      overdueList: overdue.sort((a, b) => a.date.localeCompare(b.date)),
      completedList: completed.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || '')),
    };
  }, [tasks, todayStr]);

  const displayedTasks = useMemo(() => {
    let list: TaskItem[] = [];
    if (activeFilter === 'today') list = todayList;
    else if (activeFilter === 'upcoming') list = upcomingList;
    else if (activeFilter === 'overdue') list = overdueList;
    else if (activeFilter === 'completed') list = completedList;
    else list = tasks;

    if (categoryFilter !== 'all') {
      list = list.filter((t) => t.category === categoryFilter);
    }
    return list;
  }, [activeFilter, categoryFilter, todayList, upcomingList, overdueList, completedList, tasks]);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickAddTask(quickInput.trim(), quickCategory);
    setQuickInput('');
  };

  const priorityColors = {
    low: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
    medium: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60',
    high: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60',
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <CheckSquare className="w-4 h-4" />
              <span>Daily Life & Productivity</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              Personal Task Planner
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Keep personal, college, work, prayer, and health priorities organized in one place.
            </p>
          </div>

          <button
            onClick={() => onOpenAddTask()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors min-h-[44px] flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            + Add Full Task
          </button>
        </div>

        {/* Quick Add Form inside banner */}
        <form onSubmit={handleQuickSubmit} className="mt-5 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Quick add: Type task title and press Enter..."
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
          />
          <div className="flex items-center gap-2">
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value as TaskCategory)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none min-h-[42px]"
            >
              <option value="Personal">Personal</option>
              <option value="College">College</option>
              <option value="Work">Work</option>
              <option value="Health">Health</option>
              <option value="Fitness">Fitness</option>
              <option value="Prayer">Prayer</option>
              <option value="Other">Other</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors min-h-[42px] whitespace-nowrap"
            >
              Add
            </button>
          </div>
        </form>
      </div>

      {/* Filter Tabs & Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* View Filter segmented buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveFilter('today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === 'today'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Today ({todayList.length})
          </button>
          <button
            onClick={() => setActiveFilter('upcoming')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === 'upcoming'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Upcoming ({upcomingList.length})
          </button>
          <button
            onClick={() => setActiveFilter('overdue')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === 'overdue'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Overdue ({overdueList.length})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === 'completed'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Completed ({completedList.length})
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All
          </button>
        </div>

        {/* Category selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Personal">Personal</option>
            <option value="College">College</option>
            <option value="Work">Work</option>
            <option value="Health">Health</option>
            <option value="Fitness">Fitness</option>
            <option value="Prayer">Prayer</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {displayedTasks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <CheckSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">
              No tasks found in {activeFilter} view.
            </p>
          </div>
        ) : (
          displayedTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                task.completed
                  ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onToggleTask(task.id)}
                  className="w-5 h-5 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm font-semibold truncate ${
                        task.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Priority & Category tags */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                        priorityColors[task.priority]
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {task.category}
                    </span>
                    {task.recurring !== 'none' && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                        ↻ {task.recurring}
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono tabular-nums">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDateDisplay(task.date)}
                    </span>
                    {task.time && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeDisplay(task.time, profile.timeFormat)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onOpenAddTask(undefined, task)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                  title="Edit task"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
