import { CircleCheck, TriangleAlert, Undo2, X } from 'lucide-react';
import { useEffect } from 'react';
import { usePlannerStore } from '../planner/store';

/** Success / undo toast. Ctrl/Cmd+Z also undoes the last change. */
export function Toasts() {
  const toast = usePlannerStore((s) => s.toast);
  const dismiss = usePlannerStore((s) => s.dismissToast);
  const undo = usePlannerStore((s) => s.undo);
  const canUndo = usePlannerStore((s) => s.past.length > 0);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(dismiss, toast.undoable ? 7000 : 3500);
    return () => window.clearTimeout(t);
  }, [toast, dismiss]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && canUndo) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, canUndo]);

  if (!toast) return null;
  const Icon = toast.tone === 'error' ? TriangleAlert : CircleCheck;
  return (
    <div className="toast" role="status" aria-live="polite" key={toast.id}>
      <Icon size={16} className={`toast__icon ${toast.tone === 'error' ? 'is-error' : ''}`} aria-hidden />
      <span className="toast__msg">{toast.message}</span>
      {toast.undoable && (
        <button className="toast__undo" onClick={undo}>
          <Undo2 size={14} /> Undo
        </button>
      )}
      <button className="iconbtn iconbtn--sm" onClick={dismiss} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
