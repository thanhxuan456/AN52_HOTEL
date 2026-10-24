import { useEffect, type ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
  loading?: boolean;
  children?: ReactNode;
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = 'danger',
  loading = false,
  children,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const isDanger = variant === 'danger';
  const iconColor = isDanger
    ? 'bg-error-100 text-error-600 dark:bg-error-900/30 dark:text-error-400'
    : 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400';
  const confirmColor = isDanger
    ? 'bg-error-600 hover:bg-error-700 text-white shadow-md hover:shadow-lg'
    : 'bg-warning-600 hover:bg-warning-700 text-white shadow-md hover:shadow-lg';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={() => { if (!loading) onCancel(); }}
    >
      <div className="absolute inset-0 bg-secondary-950/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl border border-secondary-200/70 dark:border-secondary-700/80 overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${isDanger ? 'bg-gradient-to-r from-error-400 to-error-600' : 'bg-gradient-to-r from-warning-400 to-warning-600'}`} />

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 ${iconColor}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-bold text-secondary-900 dark:text-white">{title}</h3>
              <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1.5 leading-relaxed">{message}</p>
            </div>
          </div>

          {children && (
            <div className="mt-4 p-3 rounded-xl bg-secondary-50 dark:bg-secondary-700/40 border border-secondary-100 dark:border-secondary-700/50">
              {children}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-70 ${confirmColor}`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
