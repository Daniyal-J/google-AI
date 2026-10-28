/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title?: string;
  message: string;
  duration?: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-white dark:bg-slate-900 border-teal-200 dark:border-teal-800/60',
    warning: 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800/60',
    error: 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800/60',
    info: 'bg-white dark:bg-slate-900 border-sky-200 dark:border-sky-800/60',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl shadow-lg border ${bgStyles[toast.type]} transition-all animate-in fade-in slide-in-from-bottom-2 duration-200`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {icons[toast.type]}
        <div className="flex flex-col">
          {toast.title && (
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {toast.title}
            </span>
          )}
          <span className="text-xs text-slate-600 dark:text-slate-300">
            {toast.message}
          </span>
        </div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
