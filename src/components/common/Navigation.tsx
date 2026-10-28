/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Syringe,
  Pill,
  Activity,
  CheckSquare,
  History,
  Calendar,
  Bell,
  Settings,
  MoreHorizontal,
  X,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'insulin'
  | 'tablets'
  | 'glucose'
  | 'tasks'
  | 'history'
  | 'calendar'
  | 'reminders'
  | 'settings';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingDosesCount?: number;
  pendingTasksCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  pendingDosesCount = 0,
  pendingTasksCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'Today',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'insulin',
      label: 'Insulin',
      icon: <Syringe className="w-5 h-5" />,
      badge: pendingDosesCount > 0 ? pendingDosesCount : undefined,
    },
    {
      id: 'tablets',
      label: 'Tablets',
      icon: <Pill className="w-5 h-5" />,
    },
    {
      id: 'glucose',
      label: 'Glucose',
      icon: <Activity className="w-5 h-5" />,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: <CheckSquare className="w-5 h-5" />,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
    },
    {
      id: 'history',
      label: 'History',
      icon: <History className="w-5 h-5" />,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      id: 'reminders',
      label: 'Reminders',
      icon: <Bell className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  // Mobile primary tabs (4 main + More)
  const mobilePrimaryTabs: NavTab[] = ['dashboard', 'insulin', 'tablets', 'glucose', 'tasks'];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[calc(100vh-65px)] p-4">
        <div className="space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Daily Management
          </div>
          {navItems.slice(0, 5).map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-6 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Reports & Preferences
          </div>
          {navItems.slice(5).map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Safety Note in Desktop Sidebar */}
        <div className="mt-auto pt-6">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1 leading-relaxed">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">
              Personal Tracking Only
            </span>
            <span>
              Follow your doctor's care plan. Never take unconfirmed extra doses.
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-6 items-center h-16 max-w-lg mx-auto px-1">
          {mobilePrimaryTabs.map((tabId) => {
            const item = navItems.find((n) => n.id === tabId)!;
            const isActive = currentTab === tabId;
            return (
              <button
                key={tabId}
                onClick={() => onSelectTab(tabId)}
                className={`relative flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                  isActive
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-sky-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center font-mono">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 tracking-tight truncate ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              ['history', 'calendar', 'reminders', 'settings'].includes(currentTab)
                ? 'text-sky-600 dark:text-sky-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" Drawer / Modal */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-end justify-center"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-full bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Additional Tools & Reports
              </h3>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {navItems.slice(5).map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors min-h-[52px] ${
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 text-sky-800 dark:text-sky-200 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className={isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
